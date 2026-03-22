/**
 * post.js — Single post renderer
 * Reads ?post=<id> URL param, fetches markdown, parses YAML frontmatter,
 * renders with marked.js + highlight.js, and builds a TOC.
 *
 * Image support: standard Markdown ![alt](path) syntax is fully supported.
 * Paths are relative to the post's markdown file location,
 * e.g. images stored in posts/images/ are referenced as images/screenshot.png
 */

const POSTS_INDEX = 'posts/index.json';

// ─── Wait for all deferred scripts to load ────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
    // Wait for marked + jsyaml + hljs to be available
    await waitForLibs();
    init();
});

function waitForLibs(timeout = 8000) {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        const check = () => {
            if (typeof marked !== 'undefined' && typeof jsyaml !== 'undefined' && typeof hljs !== 'undefined') {
                resolve();
            } else if (Date.now() - start > timeout) {
                reject(new Error('Libraries failed to load'));
            } else {
                setTimeout(check, 50);
            }
        };
        check();
    });
}

// ─── Init ─────────────────────────────────────────────────────────
async function init() {
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('post');

    if (!postId) {
        showError('No post specified. <a href="blog.html">Browse all posts</a>.');
        return;
    }

    try {
        // Find post metadata from index
        const indexRes = await fetch(POSTS_INDEX);
        if (!indexRes.ok) throw new Error('Could not load post index');
        const posts = await indexRes.json();

        const meta = posts.find(p => p.id === postId);
        if (!meta) throw new Error(`Post "${postId}" not found in index`);

        // Fetch the markdown file
        const mdRes = await fetch(meta.file);
        if (!mdRes.ok) throw new Error(`Could not fetch markdown: ${meta.file}`);
        const raw = await mdRes.text();

        // Parse frontmatter + content
        const { frontmatter, content } = parseFrontmatter(raw);

        // Update page title
        const title = frontmatter.title || meta.title || 'Untitled';
        document.title = `${title} — cray_gitbook`;

        // Render page
        renderPost(meta, frontmatter, content);
        
        // Render recent posts widget
        renderRecentPosts(posts, postId);

    } catch (err) {
        console.error(err);
        showError(err.message);
    }
}

// ─── YAML Frontmatter Parser ──────────────────────────────────────
function parseFrontmatter(raw) {
    // Matches --- ... --- at file start
    const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
    if (!match) {
        return { frontmatter: {}, content: raw };
    }
    try {
        const frontmatter = jsyaml.load(match[1]) || {};
        const content = match[2];
        return { frontmatter, content };
    } catch {
        return { frontmatter: {}, content: raw };
    }
}

// ─── Render post to DOM ───────────────────────────────────────────
function renderPost(meta, fm, content) {
    // Configure marked with syntax highlighting
    marked.setOptions({
        highlight: function (code, lang) {
            if (lang && hljs.getLanguage(lang)) {
                return hljs.highlight(code, { language: lang }).value;
            }
            return hljs.highlightAuto(code).value;
        },
        gfm: true,
        breaks: false,
    });

    // Resolve image paths relative to the post's directory.
    // Posts from Blogs-and-Writeups use attachment/foo.png — resolved via meta.imageBase.
    const postDir = (meta.file || '').replace(/\/[^/]+$/, '/'); // e.g. "content/Blogs/"
    const imageBase = meta.imageBase || postDir; // fallback for legacy posts

    // Custom renderer to fix image paths and add classes
    const renderer = new marked.Renderer();

    renderer.image = function (href, title, alt) {
        let resolvedSrc = href;
        if (!/^(https?:\/\/|data:|\/)/i.test(href)) {
            // attachment/ pattern → use the post's imageBase directory
            if (href.startsWith('attachment/')) {
                resolvedSrc = imageBase + href.replace(/^attachment\//, '');
            } else {
                resolvedSrc = postDir + href;
            }
        }
        const titleAttr = title ? ` title="${escHtml(title)}"` : '';
        return `<img src="${escHtml(resolvedSrc)}" alt="${escHtml(alt || '')}"${titleAttr} loading="lazy" style="max-width:100%;border-radius:8px;margin:1.25rem 0;box-shadow:var(--shadow-sm);" />`;
    };

    // Wrap tables for horizontal scroll
    renderer.table = function (header, body) {
        return `<div style="overflow-x:auto;"><table><thead>${header}</thead><tbody>${body}</tbody></table></div>`;
    };

    // Parse markdown
    const html = marked.parse(content, { renderer });

    // Fill in DOM elements
    const category = fm.category || meta.category || 'article';
    const badgeClass = category === 'ctf' ? 'badge-ctf' : 'badge-article';
    const badgeLabel = category === 'ctf' ? '🏴 CTF Writeup' : '📝 Article';
    const tags = (fm.tags || meta.tags || []).map(t => `<span class="tag">#${t}</span>`).join(' ');
    const date = fm.date || meta.date || '';

    document.getElementById('postMetaRow').innerHTML =
        `<span class="badge ${badgeClass}">${badgeLabel}</span>${tags}`;

    document.getElementById('postTitle').textContent = fm.title || meta.title || 'Untitled';

    document.getElementById('postMetaBottom').innerHTML =
        `<span class="post-date">${formatDate(date)}</span>` +
        (fm.author ? `<span style="color:var(--text-muted);font-size:0.82rem;">by ${escHtml(fm.author)}</span>` : '');

    const contentEl = document.getElementById('postContent');
    contentEl.innerHTML = html;

    // Apply hljs to any code blocks not already highlighted
    contentEl.querySelectorAll('pre code:not(.hljs)').forEach(block => hljs.highlightElement(block));

    // Show the layout, hide loading
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('postLayout').classList.remove('hidden');
}

// ─── Recent Posts Widget ──────────────────────────────────────────
function renderRecentPosts(allPosts, currentId) {
    const container = document.getElementById('recentPostsList');
    if (!container) return;

    let recent = allPosts.filter(p => p.id !== currentId);
    recent.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    recent = recent.slice(0, 3);

    if (recent.length === 0) {
        const widget = document.getElementById('sideWidget');
        if (widget) widget.style.display = 'none';
        return;
    }

    container.innerHTML = recent.map(p => {
        const url = `post.html?post=${encodeURIComponent(p.id)}`;
        return `
            <a href="${url}" class="recent-post-item">
                <div class="recent-post-meta">${formatDate(p.date)}</div>
                <div class="recent-post-title">${escHtml(p.title)}</div>
            </a>
        `;
    }).join('');
}

// ─── UI States ────────────────────────────────────────────────────
function showError(msg) {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('errorMsg').innerHTML = msg;
    document.getElementById('errorState').classList.remove('hidden');
}

// ─── Helpers ──────────────────────────────────────────────────────
function formatDate(dateVal) {
    if (!dateVal) return '';
    try {
        let d;
        // js-yaml parses bare YAML dates (2026-02-20) as JS Date objects
        if (dateVal instanceof Date) {
            d = dateVal;
        } else {
            // String: strip time portion and force noon to avoid timezone shifts
            const clean = String(dateVal).replace(/T.*$/, '');
            d = new Date(clean + 'T12:00:00');
        }
        if (isNaN(d.getTime())) return String(dateVal);
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return String(dateVal); }
}

function escHtml(str = '') {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

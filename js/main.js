/**
 * main.js — Home page + Blog listing logic
 * Loads posts/index.json and renders cards.
 */

const POSTS_INDEX = 'posts/index.json';

let allPosts = [];

// ─── Fetch post index ──────────────────────────────────────────────
async function loadPosts() {
  try {
    const res = await fetch(POSTS_INDEX);
    if (!res.ok) throw new Error('Failed to load posts');
    allPosts = await res.json();

    // Sort by date descending
    allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Render wherever needed
    if (document.getElementById('featuredPosts')) renderFeatured();
    if (document.getElementById('postsGrid')) renderAll();
    if (document.getElementById('heroStats')) updateStats();
  } catch (err) {
    console.error('Error loading posts:', err);
    const grid = document.getElementById('postsGrid') || document.getElementById('featuredPosts');
    if (grid) grid.innerHTML = `<div class="state-box"><div class="state-icon">⚠️</div><div class="state-msg">Could not load posts</div><div class="state-sub">${err.message}</div></div>`;
  }
}

// ─── Render featured (home page) ──────────────────────────────────
function renderFeatured() {
  const container = document.getElementById('featuredPosts');
  const posts = allPosts.slice(0, 3);
  container.innerHTML = posts.length
    ? posts.map(p => postCardHTML(p)).join('')
    : `<div class="state-box"><div class="state-icon">📝</div><div class="state-msg">No posts yet</div></div>`;
}

// ─── Render all (blog page) ────────────────────────────────────────
function renderAll(filtered = allPosts) {
  const container = document.getElementById('postsGrid');
  const countEl = document.getElementById('postCount');
  const emptyEl = document.getElementById('emptyState');

  if (filtered.length === 0) {
    container.innerHTML = '';
    emptyEl && emptyEl.classList.remove('hidden');
    countEl && (countEl.textContent = '0 posts');
    return;
  }

  emptyEl && emptyEl.classList.add('hidden');
  container.innerHTML = filtered.map(p => postCardHTML(p)).join('');
  countEl && (countEl.textContent = `${filtered.length} post${filtered.length === 1 ? '' : 's'}`);
}

// ─── Stats (home page) ────────────────────────────────────────────
function updateStats() {
  const ctf = allPosts.filter(p => p.category === 'ctf').length;
  const art = allPosts.filter(p => p.category === 'article').length;

  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('statPosts', allPosts.length);
  setEl('statCtf', ctf);
  setEl('statArticles', art);
}

// ─── Post card HTML template ──────────────────────────────────────
function postCardHTML(post) {
  const badgeClass = post.category === 'ctf' ? 'badge-ctf' : 'badge-article';
  const badgeLabel = post.category === 'ctf' ? '🏴 CTF' : '📝 Article';

  const tags = (post.tags || [])
    .map(t => `<span class="tag">#${t}</span>`)
    .join(' ');

  const date = formatDate(post.date);
  const url = `post.html?post=${encodeURIComponent(post.id)}`;

  return `
  <div class="post-card" onclick="location.href='${url}'" role="button" tabindex="0" onkeydown="if(event.key==='Enter')location.href='${url}'">
    <div class="post-card-meta">
      <span class="badge ${badgeClass}">${badgeLabel}</span>
      <span class="post-card-date">${date}</span>
    </div>
    <div class="post-card-title">${escHtml(post.title)}</div>
    ${post.description ? `<div class="post-card-desc">${escHtml(post.description)}</div>` : ''}
    <div class="post-card-tags">${tags}</div>
    <div class="post-card-footer">
      <span class="read-link">Read post →</span>
    </div>
  </div>`.trim();
}

// ─── Filtering (blog page) ────────────────────────────────────────
function applyFilters() {
  const query = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
  const activeTab = document.querySelector('.filter-tab.active')?.dataset.category || 'all';

  const filtered = allPosts.filter(post => {
    const matchCat = activeTab === 'all' || post.category === activeTab;
    const searchStr = [post.title, post.description, ...(post.tags || [])].join(' ').toLowerCase();
    const matchSearch = !query || searchStr.includes(query);
    return matchCat && matchSearch;
  });

  renderAll(filtered);
}

// Make applyFilters global (called from blog.html inline script)
window.applyFilters = applyFilters;

// ─── Helpers ──────────────────────────────────────────────────────
function formatDate(dateStr) {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return dateStr; }
}

function escHtml(str = '') {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── Init ─────────────────────────────────────────────────────────
loadPosts();

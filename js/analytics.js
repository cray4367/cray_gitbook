/**
 * analytics.js - GA4 pageviews + click tracking (+ optional Clarity heatmaps).
 * Include on every page: <script src="js/analytics.js"></script>
 *
 * Reports to look at in GA4:
 *  - Reports → Engagement → Events → post_click / outbound_click / internal_click
 *  - Explore → Path exploration (add these events as nodes to see click journeys)
 * For visual heatmaps ("where exactly people clicked"), set CLARITY_ID below.
 */

const GA_ID = 'G-8E0668ECTY';

// Paste your Microsoft Clarity project ID here to enable heatmaps + session
// replays (free at https://clarity.microsoft.com). Leave empty to skip.
const CLARITY_ID = '';

// ─── GA4 bootstrap (loads library + configures, exactly once) ──────────
(function initGA() {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    if (!document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
        const s = document.createElement('script');
        s.async = true;
        s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
        document.head.appendChild(s);
    }
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, { anonymize_ip: true });
})();

// ─── Microsoft Clarity (heatmaps + session replay), optional ───────────
(function initClarity() {
    if (!CLARITY_ID) return;
    (function (c, l, a, r, i, t, y) {
        c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
        t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
        y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', CLARITY_ID);
})();

// ─── Helper ────────────────────────────────────────────────────────────
function trackEvent(name, params) {
    try {
        if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
    } catch (e) { /* analytics must never break the site */ }
}

function sectionOf(el) {
    if (!el || !el.closest) return 'content';
    if (el.closest('#featuredPosts, #postsGrid, .post-card')) return 'post_listing';
    if (el.closest('nav')) return 'nav';
    if (el.closest('footer')) return 'footer';
    if (el.closest('.hero')) return 'hero';
    if (el.closest('.pf-hero, .pf-body')) return 'about';
    if (el.closest('.post-layout')) return 'post';
    if (el.closest('.search-area')) return 'search_filter';
    return 'content';
}

function linkText(el) {
    const t = (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ');
    return t.slice(0, 80);
}

// ─── Click tracking (delegated - covers current + future content) ──────
document.addEventListener('click', function (e) {
    // 1. Blog post cards (whole card is clickable)
    const card = e.target.closest ? e.target.closest('.post-card') : null;
    if (card) {
        const titleEl = card.querySelector('.post-card-title');
        trackEvent('post_click', {
            post_title: titleEl ? titleEl.textContent.trim().slice(0, 100) : '',
            section: sectionOf(card)
        });
        return;
    }

    const t = e.target.closest ? e.target.closest('a, button') : null;
    if (!t) return;

    // 2. Blog filter tabs
    if (t.classList && t.classList.contains('filter-tab')) {
        trackEvent('filter_posts', { category: t.dataset.category || 'all' });
        return;
    }

    // 3. Theme toggle
    if (t.id === 'themeToggle') {
        trackEvent('toggle_theme', {});
        return;
    }

    // 4. Links (skip nav-menu toggle which has no destination)
    if (t.tagName === 'A') {
        const href = t.getAttribute('href') || '';
        if (!href || href === '#') return;
        const text = linkText(t);
        const section = sectionOf(t);
        const isMail = href.startsWith('mailto:');
        let isOutbound = isMail;
        try {
            const url = new URL(t.href, window.location.href);
            isOutbound = isOutbound || (url.hostname !== window.location.hostname);
        } catch (err) { /* relative URL - internal */ }
        if (isOutbound) {
            trackEvent('outbound_click', { link_url: href.slice(0, 200), link_text: text, section: section });
        } else {
            trackEvent('internal_click', { link_url: href.slice(0, 200), link_text: text, section: section });
        }
    }
});

// ─── Blog search tracking (debounced) ──────────────────────────────────
(function initSearchTracking() {
    const input = document.getElementById('searchInput');
    if (!input) return;
    let timer = null;
    input.addEventListener('input', function () {
        clearTimeout(timer);
        const q = input.value.trim();
        if (q.length < 3) return;
        timer = setTimeout(function () {
            trackEvent('search_posts', { search_term: q.slice(0, 100) });
        }, 1500);
    });
})();

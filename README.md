# cray.blog — Personal Portfolio & Blog

A free, static GitHub Pages site for security writeups, articles, and portfolio showcase. No build tools, no server needed.

## 🚀 Quick Start

```bash
# Clone and serve locally
git clone https://github.com/yourusername/cray_blogs.git
cd cray_blogs
python3 -m http.server 8080
# Open http://localhost:8080
```

## 📝 Adding a New Post

1. **Create the Markdown file:**
   ```bash
   touch posts/my-new-post.md
   ```

2. **Add YAML frontmatter:**
   ```markdown
   ---
   title: My New Post Title
   date: 2026-02-24
   category: article        # or: ctf
   tags:
     - tag1
     - tag2
   author: Akshat
   ---

   # Post content here...
   ```

3. **Add images** (optional):
   - Put images in `posts/images/`
   - Reference them in Markdown: `![Caption](images/screenshot.png)`

4. **Register the post** in `posts/index.json`:
   ```json
   {
     "id": "my-new-post",
     "title": "My New Post Title",
     "date": "2026-02-24",
     "category": "article",
     "tags": ["tag1", "tag2"],
     "description": "Brief one-line description.",
     "file": "posts/my-new-post.md"
   }
   ```

5. **Commit and push:**
   ```bash
   git add .
   git commit -m "Add post: My New Post Title"
   git push
   ```

That's it — your post will appear on the site automatically.

## 🌐 Deploy to GitHub Pages

1. Push to GitHub
2. Go to **Settings → Pages**
3. Source: **Deploy from branch** → `main` / `root`
4. Your site will be live at `https://yourusername.github.io/cray_blogs/`

## 📁 Project Structure

```
cray_blogs/
├── index.html          # Home page
├── blog.html           # Blog listing
├── post.html           # Post reader
├── about.html          # Portfolio / about
├── css/style.css       # Design system
├── js/
│   ├── main.js         # Listing + filtering logic
│   └── post.js         # Markdown rendering
├── posts/
│   ├── index.json      # Post metadata registry
│   ├── images/         # Post images folder
│   └── *.md            # Markdown posts
└── .nojekyll           # Disables Jekyll on GitHub Pages
```

## ✏️ Customizing

- **Name / bio:** Edit `index.html` hero section and `about.html`
- **Social links:** Search for `https://github.com/` and replace throughout
- **Colors:** Edit CSS custom properties at top of `css/style.css`
- **Site title:** Change `cray.blog` in all HTML files

## 🛠 Tech Stack

| Technology | Purpose |
|------------|---------|
| HTML + CSS + JS | Core site (no framework) |
| marked.js | Markdown rendering |
| highlight.js | Syntax highlighting |
| js-yaml | YAML frontmatter parsing |
| Google Fonts | Typography |
| GitHub Pages | Free hosting |

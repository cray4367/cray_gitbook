# Obsidian → cray_gitbook Import Guide

This guide explains how to publish your Obsidian notes as blog posts on cray_gitbook.

---

## How It Works

Your Obsidian notes are standard Markdown files. The blog reads them directly —  
you just need to:
1. Add YAML frontmatter to the note
2. Copy the file into `posts/`
3. Copy any images into `posts/images/`
4. Register the post in `posts/index.json`

---

## Step 1 — Add Frontmatter to Your Note

Open the note in Obsidian and add this block at the **very top** of the file:

```yaml
---
title: Your Note Title
date: 2026-02-24
category: article        # use "ctf" for CTF writeups, "article" for everything else
tags:
  - tag-one
  - tag-two
author: Akshat
---
```

> **Tip:** In Obsidian you can use the *Templates* plugin to auto-insert this block.

---

## Step 2 — Handle Images

Obsidian uses its own image syntax: `![[image.png]]`  
This does **not** render in the blog. You need to convert to standard Markdown:

| Obsidian syntax | Blog syntax |
|-----------------|-------------|
| `![[screenshot.png]]` | `![Caption](images/screenshot.png)` |
| `![[subfolder/image.png]]` | `![Caption](images/image.png)` |

**Quick find & replace in VS Code / any editor:**
- Find: `!\[\[(.+?)\]\]`  (regex)
- Replace: `![Image](images/$1)`

Then copy all referenced images to `posts/images/`.

---

## Step 3 — Copy the Note

```bash
# Copy your note
cp ~/path/to/your/obsidian-vault/Note.md /home/akshat/Downloads/cray_blogs/posts/my-note.md

# Copy images (if any)
cp ~/path/to/your/obsidian-vault/attachments/screenshot.png \
   /home/akshat/Downloads/cray_blogs/posts/images/
```

Name the file with lowercase-and-hyphens only (no spaces):  
`my-note-title.md` → accessed as `?post=my-note-title`

---

## Step 4 — Register in index.json

Open `posts/index.json` and add an entry for your note:

```json
[
  {
    "id": "my-note-title",
    "title": "My Note Title",
    "date": "2026-02-24",
    "category": "article",
    "tags": ["tag-one", "tag-two"],
    "description": "One sentence summary shown on the blog listing.",
    "file": "posts/my-note-title.md"
  }
]
```

The `id` must match the filename (without `.md`).

---

## Step 5 — Preview Locally

```bash
cd /home/akshat/Downloads/cray_blogs
python3 -m http.server 8080
# Open http://localhost:8080/blog.html — your post should appear
```

---

## Step 6 — Publish

```bash
git add .
git commit -m "Add post: My Note Title"
git push
```

GitHub Pages will deploy in ~1 minute. Done!

---

## Obsidian Things That DON'T Work

| Feature | Status | Workaround |
|---------|--------|------------|
| `![[image.png]]` embeds | ❌ | Convert to `![](images/image.png)` |
| `[[WikiLinks]]` | ❌ | Convert to `[text](post.html?post=slug)` |
| `==highlight==` | ❌ | Use `**bold**` instead |
| Callouts (`> [!NOTE]`) | ⚠️ Partial | Renders as plaintext blockquote |
| Dataview queries | ❌ | Not supported (needs JS plugin) |
| Mermaid diagrams | ✅ Works | Supported by marked.js |
| Code blocks | ✅ Works | Full syntax highlighting |
| Tables | ✅ Works | Fully supported |
| Math (LaTeX) | ❌ | Add MathJax CDN to post.html if needed |

---

## Automation (Optional)

If you import notes often, you can create a shell script:

```bash
#!/bin/bash
# obsidian-to-blog.sh — quick import helper
# Usage: ./obsidian-to-blog.sh "My Note Title" /path/to/note.md

TITLE="$1"
SRC="$2"
SLUG=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/ /-/g' | sed 's/[^a-z0-9-]//g')
DATE=$(date +%Y-%m-%d)

cp "$SRC" "/home/akshat/Downloads/cray_blogs/posts/$SLUG.md"

echo "✅ Copied to posts/$SLUG.md"
echo ""
echo "Add this to posts/index.json:"
echo ""
echo "{"
echo "  \"id\": \"$SLUG\","
echo "  \"title\": \"$TITLE\","
echo "  \"date\": \"$DATE\","
echo "  \"category\": \"article\","
echo "  \"tags\": [],"
echo "  \"description\": \"TODO: add description\","
echo "  \"file\": \"posts/$SLUG.md\""
echo "}"
```

Save it as `obsidian-to-blog.sh` in your home directory and `chmod +x` it.

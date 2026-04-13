/**
 * Personal Blog — Main JavaScript
 *
 * Handles loading posts from data/posts.json (metadata) and
 * individual Markdown files from posts/ (full content).
 * Comments are managed via Giscus (GitHub Discussions).
 */

// ============================================================
// Markdown Renderer Configuration
// ============================================================

// Initialize Mermaid for graphs and diagrams
mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose",
});

// Configure Marked to use highlight.js for code blocks
marked.setOptions({
  highlight: function (code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value;
      } catch (err) {}
    }
    return hljs.highlightAuto(code).value;
  },
  langPrefix: "hljs language-",
  breaks: true,
  gfm: true,
});

// ============================================================
// Data Loading
// ============================================================

/**
 * Fetches all blog post metadata from the index file.
 * This file contains only front-matter (title, date, excerpt,
 * coverImage, slug) — not the full article content.
 * Returns a promise that resolves to an array of post objects.
 */
async function loadPosts() {
  const response = await fetch("data/posts.json");
  if (!response.ok) {
    throw new Error("Failed to load posts data");
  }
  const posts = await response.json();
  // Sort posts by date, newest first
  return posts.sort((a, b) => new Date(b.date) - new Date(a.date));
}

/**
 * Fetches a single post's Markdown file and parses it into
 * front-matter metadata and rendered HTML content.
 *
 * @param {string} slug - The post slug (e.g. "1-getting-started-with-web-development")
 * @returns {Promise<object>} { meta: frontmatter object, html: rendered HTML string }
 */
async function loadPostMarkdown(slug) {
  const response = await fetch(`posts/${slug}.md`);
  if (!response.ok) {
    throw new Error(`Failed to load post: posts/${slug}.md`);
  }
  const raw = await response.text();
  const { meta, body } = parseFrontmatter(raw);
  // Convert Markdown to HTML
  const html = marked.parse(body);
  return { meta, html };
}

/**
 * Parses YAML-like frontmatter from the top of a Markdown file.
 * Expected format:
 *   ---
 *   key: value
 *   key: "quoted value"
 *   ---
 *   body content...
 *
 * @param {string} text - Raw Markdown file content
 * @returns {{ meta: object, body: string }}
 */
function parseFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { meta: {}, body: text };
  }
  const meta = {};
  match[1].split("\n").forEach((line) => {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) return;
    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();
    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    meta[key] = value;
  });
  return { meta, body: match[2] };
}

// ============================================================
// Formatting Helpers
// ============================================================

/**
 * Formats an ISO date string (e.g. "2026-04-10") into a
 * human-readable string like "April 10, 2026".
 */
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Extracts the full month name from a date string, e.g. "April 2026".
 */
function formatMonth(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });
}

/**
 * Extracts just the year from a date string, e.g. "2026".
 */
function getYear(dateStr) {
  return new Date(dateStr).getFullYear().toString();
}

// ============================================================
// Page: Main (index.html) — Render post cards
// ============================================================

/**
 * Renders a list of post cards into the given container element.
 * Each card shows the cover image, date, title, excerpt, and a
 * "Read more" link pointing to the article page.
 *
 * @param {HTMLElement} container - The DOM element to render into
 * @param {Array} posts - Array of post objects to display
 */
function renderPostList(container, posts) {
  container.innerHTML = "";

  posts.forEach((post) => {
    // Create the card wrapper
    const card = document.createElement("article");
    card.className = "post-card";

    card.innerHTML = `
      <div class="post-card__image-wrapper">
        <img class="post-card__image" src="${post.coverImage}" alt="${post.title}" loading="lazy">
      </div>
      <div class="post-card__body">
        <div class="post-card__date">${formatDate(post.date)}</div>
        <h2 class="post-card__title">
          <a href="article.html?id=${post.id}">${post.title}</a>
        </h2>
        <p class="post-card__excerpt">${post.excerpt}</p>
        <a class="post-card__link" href="article.html?id=${post.id}">Read More</a>
      </div>
    `;

    container.appendChild(card);
  });
}

// ============================================================
// Page: Article (article.html) — Render single post
// ============================================================

/**
 * Finds a post by its ID, fetches its Markdown file, parses
 * the front-matter, renders the content to HTML, and
 * post-processes for math formulas (KaTeX) and graphs (Mermaid).
 * If no matching post is found, shows a "not found" message.
 *
 * @param {Array} posts - Array of all post metadata objects
 */
async function renderArticle(posts) {
  // Read the post ID from the URL query string (?id=1)
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get("id"), 10);

  // Find the matching post metadata
  const post = posts.find((p) => p.id === id);

  if (!post) {
    document.getElementById("article-container").innerHTML = `
      <div class="not-found">
        <a class="back-link" href="index.html">Back to home</a>
        <h1>Post Not Found</h1>
        <p>The article you're looking for doesn't exist.</p>
      </div>
    `;
    return;
  }

  try {
    // Fetch and parse the Markdown file
    const { meta, html } = await loadPostMarkdown(post.slug);

    // Use frontmatter from the .md file (falls back to index metadata)
    const title = meta.title || post.title;
    const date = meta.date || post.date;

    // Update the page title shown in the browser tab
    document.title = `${title} — My Blog`;

    // Render the article content
    const container = document.getElementById("article-container");
    container.innerHTML = `
      <a class="back-link" href="index.html">Back to home</a>
      <header class="article-header">
        <h1>${title}</h1>
        <div class="article-header__meta">${formatDate(date)}</div>
      </header>
      <img class="article-cover" src="${post.coverImage}" alt="${title}" loading="lazy">
      <div class="article-content">${html}</div>
    `;

    // Post-process: render math formulas with KaTeX
    renderMathInElement(container, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false },
      ],
      throwOnError: false,
    });

    // Post-process: render Mermaid graphs inside code blocks
    await renderMermaidGraphs(container);

    // Render the Giscus comments section for this post
    loadGiscus(id, title);
  } catch (error) {
    console.error("Error rendering article:", error);
    document.getElementById("article-container").innerHTML = `
      <div class="not-found">
        <a class="back-link" href="index.html">Back to home</a>
        <h1>Error Loading Article</h1>
        <p>${error.message}</p>
      </div>
    `;
  }
}

/**
 * Finds fenced code blocks with the "mermaid" language tag
 * and renders them as interactive diagrams.
 *
 * @param {HTMLElement} container - The article container element
 */
async function renderMermaidGraphs(container) {
  const codeBlocks = container.querySelectorAll("pre code.language-mermaid");
  if (codeBlocks.length === 0) return;

  for (const block of codeBlocks) {
    const graphDefinition = block.textContent;
    const wrapper = document.createElement("div");
    wrapper.className = "mermaid";
    wrapper.textContent = graphDefinition;
    block.parentElement.replaceWith(wrapper);
  }

  try {
    await mermaid.run({ nodes: container.querySelectorAll(".mermaid") });
  } catch (err) {
    console.warn("Mermaid rendering failed:", err);
  }
}

// ============================================================
// Page: Archive (archive.html) — Render chronological list
// ============================================================

/**
 * Renders all posts grouped by year and then by month,
 * with the newest posts appearing first.
 *
 * @param {HTMLElement} container - The DOM element to render into
 * @param {Array} posts - Array of all post objects (should be pre-sorted newest first)
 */
function renderArchive(container, posts) {
  container.innerHTML = "";

  // Group posts by year -> month
  const grouped = {};
  posts.forEach((post) => {
    const year = getYear(post.date);
    const month = formatMonth(post.date);

    if (!grouped[year]) {
      grouped[year] = {};
    }
    if (!grouped[year][month]) {
      grouped[year][month] = [];
    }
    grouped[year][month].push(post);
  });

  // Render each year group
  Object.keys(grouped).forEach((year) => {
    const yearDiv = document.createElement("div");
    yearDiv.className = "archive-year";

    const yearHeading = document.createElement("h2");
    yearHeading.className = "archive-year__heading";
    yearHeading.textContent = year;
    yearDiv.appendChild(yearHeading);

    // Render each month within this year
    Object.keys(grouped[year]).forEach((month) => {
      const monthDiv = document.createElement("div");
      monthDiv.className = "archive-month";

      const monthHeading = document.createElement("h3");
      monthHeading.className = "archive-month__heading";
      monthHeading.textContent = month;
      monthDiv.appendChild(monthHeading);

      // Render each post entry within this month
      grouped[year][month].forEach((post) => {
        const entry = document.createElement("div");
        entry.className = "archive-entry";
        entry.innerHTML = `
          <div class="archive-entry__date">${formatDate(post.date)}</div>
          <div class="archive-entry__title">
            <a href="article.html?id=${post.id}">${post.title}</a>
          </div>
        `;
        monthDiv.appendChild(entry);
      });

      yearDiv.appendChild(monthDiv);
    });

    container.appendChild(yearDiv);
  });
}

// ============================================================
// Page: Categories (categories.html) — Group posts by category
// ============================================================

/**
 * Renders all categories with their associated post titles listed under each.
 * Categories are sorted by post count (most posts first), then alphabetically.
 *
 * @param {Array} posts - Array of all post metadata objects
 */
function renderCategories(posts) {
  const container = document.getElementById("categories-list");
  if (!container) return;

  // Group posts by category
  const grouped = {};
  posts.forEach((post) => {
    const cats = post.categories || ["Uncategorized"];
    cats.forEach((cat) => {
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(post);
    });
  });

  // Sort categories: by post count descending, then alphabetically
  const sorted = Object.entries(grouped).sort((a, b) => {
    if (b[1].length !== a[1].length) return b[1].length - a[1].length;
    return a[0].localeCompare(b[0]);
  });

  container.innerHTML = "";
  sorted.forEach(([category, catPosts]) => {
    const section = document.createElement("div");
    section.className = "category-card";
    section.innerHTML = `
      <h3 class="category-card__title">${category} <span class="category-card__count">(${catPosts.length})</span></h3>
      <ul class="category-card__posts">
        ${catPosts
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .map(
            (post) =>
              `<li><a href="article.html?id=${post.id}">${post.title}</a> <span class="post-date">${formatDate(post.date)}</span></li>`
          )
          .join("")}
      </ul>
    `;
    container.appendChild(section);
  });
}

// ============================================================
// Page: Tags (tags.html) — Tag cloud with post counts
// ============================================================

/**
 * Renders a tag cloud where each tag's font size reflects
 * how many posts use it. Clicking a tag filters to show matching posts.
 *
 * @param {Array} posts - Array of all post metadata objects
 */
function renderTags(posts) {
  const container = document.getElementById("tags-cloud");
  if (!container) return;

  // Count posts per tag
  const counts = {};
  posts.forEach((post) => {
    (post.tags || []).forEach((tag) => {
      counts[tag] = (counts[tag] || 0) + 1;
    });
  });

  const sorted = Object.entries(counts).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0]);
  });

  const maxCount = sorted.length > 0 ? sorted[0][1] : 1;
  const minCount = sorted.length > 0 ? sorted[sorted.length - 1][1] : 1;

  container.innerHTML = "";

  const cloud = document.createElement("div");
  cloud.className = "tags-cloud";

  sorted.forEach(([tag, count]) => {
    const size = 0.85 + (0.6 * (count - minCount)) / (maxCount - minCount || 1);
    const a = document.createElement("a");
    a.href = `tags.html?tag=${encodeURIComponent(tag)}`;
    a.className = "tag-item";
    a.style.fontSize = `${size}rem`;
    a.style.setProperty("--tag-weight", Math.round((count / maxCount) * 500 + 400));
    a.textContent = tag;
    a.title = `${count} post${count > 1 ? "s" : ""}`;
    cloud.appendChild(a);
  });

  container.appendChild(cloud);

  // Check if we're filtering by a specific tag
  const params = new URLSearchParams(window.location.search);
  const filterTag = params.get("tag");
  if (filterTag) {
    renderFilteredTagPosts(filterTag, posts);
  }
}

/**
 * Shows a filtered list of posts that have a specific tag.
 * Inserted below the tag cloud.
 *
 * @param {string} tag - The tag to filter by
 * @param {Array} posts - Array of all post metadata objects
 */
function renderFilteredTagPosts(tag, posts) {
  const container = document.getElementById("tags-cloud");
  if (!container) return;

  const filtered = posts
    .filter((post) => (post.tags || []).includes(tag))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const section = document.createElement("div");
  section.className = "tag-filtered-results";
  section.innerHTML = `
    <h3 class="tag-filtered__heading">Posts tagged "${tag}" (${filtered.length})</h3>
    <div class="post-list">
      ${filtered
        .map(
          (post) => `
        <article class="post-card">
          <div class="post-card__image-wrapper">
            <img class="post-card__image" src="${post.coverImage}" alt="${post.title}" loading="lazy">
          </div>
          <div class="post-card__body">
            <div class="post-card__date">${formatDate(post.date)}</div>
            <h2 class="post-card__title">
              <a href="article.html?id=${post.id}">${post.title}</a>
            </h2>
            <p class="post-card__excerpt">${post.excerpt}</p>
            <a class="post-card__link" href="article.html?id=${post.id}">Read More</a>
          </div>
        </article>
      `
        )
        .join("")}
    </div>
    <a class="back-link" href="tags.html">Show all tags</a>
  `;
  container.appendChild(section);
}

// ============================================================
// Comments System — Giscus (GitHub Discussions)
// ============================================================

/**
 * Configuration — replace these values with your own from https://giscus.app
 *
 * 1. Make your repo public and enable Discussions
 * 2. Go to https://giscus.app and fill in your repo to get the data-* values
 * 3. Paste them below
 */
const GISCUS_CONFIG = {
  repo: "Phi-Tesla/Phi-Tesla.github.io", // e.g. "octocat/my-blog"
  repoId: "MDEwOlJlcG9zaXRvcnkxODA5NzMyNTk=",
  category: "Comments", // Discussion category name
  categoryId: "DIC_kwDOCsluy84C6utk",
  theme: "light", // or "dark", "transparent_dark", etc.
  lang: "en",
};

/**
 * Dynamically loads the Giscus script for a specific blog post.
 * Each post gets its own discussion thread in GitHub Discussions,
 * matched by the post title.
 *
 * @param {number|string} postId - Unique ID of the blog post
 * @param {string} postTitle - Title of the blog post (used as discussion title)
 */
function loadGiscus(postId, postTitle) {
  const container = document.getElementById("giscus-container");
  if (!container) return;

  const script = document.createElement("script");
  script.src = "https://giscus.app/client.js";
  script.setAttribute("data-repo", GISCUS_CONFIG.repo);
  script.setAttribute("data-repo-id", GISCUS_CONFIG.repoId);
  script.setAttribute("data-category", GISCUS_CONFIG.category);
  script.setAttribute("data-category-id", GISCUS_CONFIG.categoryId);
  script.setAttribute("data-mapping", "title"); // match discussions by page title
  script.setAttribute("data-term", String(postTitle)); // use post title as the key
  script.setAttribute("data-strict", "1"); // strict title matching
  script.setAttribute("data-reactions-enabled", "0");
  script.setAttribute("data-emit-metadata", "0");
  script.setAttribute("data-input-position", "top");
  script.setAttribute("data-theme", GISCUS_CONFIG.theme);
  script.setAttribute("data-lang", GISCUS_CONFIG.lang);
  script.setAttribute("crossorigin", "anonymous");
  script.async = true;

  container.appendChild(script);
}

// ============================================================
// UI Enhancements (Fluid theme style)
// ============================================================

/**
 * Sets up the navbar transparency-on-scroll effect.
 * When the page is scrolled down, the navbar becomes semi-transparent
 * with a backdrop blur, mimicking the Fluid theme behavior.
 */
function setupNavbarScroll() {
  const header = document.getElementById("site-header");
  if (!header) return;

  window.addEventListener("scroll", function () {
    if (window.scrollY > 50) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });
}

/**
 * Sets up the scroll-to-top button visibility.
 * Shows the button when the user scrolls down the page.
 */
function setupScrollTopButton() {
  const btn = document.getElementById("scroll-top");
  if (!btn) return;

  window.addEventListener("scroll", function () {
    if (window.scrollY > 400) {
      btn.classList.add("visible");
    } else {
      btn.classList.remove("visible");
    }
  });
}

// ============================================================
// Page Initialization — runs when the DOM is ready
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const posts = await loadPosts();

    // Determine which page we're on and render accordingly
    const mainPostsContainer = document.getElementById("latest-posts");
    const archiveContainer = document.getElementById("archive-list");
    const articleContainer = document.getElementById("article-container");
    const categoriesContainer = document.getElementById("categories-list");
    const tagsContainer = document.getElementById("tags-cloud");

    if (mainPostsContainer) {
      // We're on the main page — show the 3 most recent posts
      renderPostList(mainPostsContainer, posts.slice(0, 3));
    }

    if (archiveContainer) {
      // We're on the archive page — show all posts grouped by date
      renderArchive(archiveContainer, posts);
    }

    if (articleContainer) {
      // We're on the article page — render the single post
      renderArticle(posts);
    }

    if (categoriesContainer) {
      // We're on the categories page
      renderCategories(posts);
    }

    if (tagsContainer) {
      // We're on the tags page
      renderTags(posts);
    }
  } catch (error) {
    // If loading posts fails (e.g., file not found), show an error
    console.error("Error loading blog posts:", error);
    const container =
      document.getElementById("latest-posts") ||
      document.getElementById("archive-list") ||
      document.getElementById("article-container") ||
      document.getElementById("categories-list") ||
      document.getElementById("tags-cloud");
    if (container) {
      container.innerHTML = `<p style="color: red;">Error loading blog posts. Make sure you are serving the site from a web server (not opening the file directly), as fetch() requires HTTP.</p>`;
    }
  }

  // Initialize Fluid theme UI effects
  setupNavbarScroll();
  setupScrollTopButton();
});

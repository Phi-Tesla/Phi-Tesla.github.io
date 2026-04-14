/**
 * Personal Blog — Main JavaScript
 *
 * Handles loading posts from data/posts.json (metadata) and
 * individual Markdown files from posts/ (full content).
 * Supports bilingual display (English / Chinese).
 * Comments are managed via Giscus (GitHub Discussions).
 */

// ============================================================
// i18n Engine
// ============================================================

const i18n = {
  currentLang: "en",
  translations: null,
};

/**
 * Detects the user's preferred language from localStorage or browser,
 * and initializes the i18n system.
 */
async function initI18n() {
  const saved = localStorage.getItem("blog-lang");
  if (saved) {
    i18n.currentLang = saved;
  } else {
    const browserLang = navigator.language || navigator.languages?.[0] || "";
    if (browserLang.startsWith("zh")) {
      i18n.currentLang = "cn";
    }
  }

  const resp = await fetch("data/i18n.json");
  if (!resp.ok) throw new Error("Failed to load translations");
  i18n.translations = await resp.json();
}

/**
 * Looks up a translation key in the current language.
 * Falls back to English if the key is missing.
 */
function t(key) {
  return (
    (i18n.translations?.[i18n.currentLang]?.[key]) ||
    (i18n.translations?.en?.[key]) ||
    key
  );
}

/**
 * Applies translations to all elements with data-i18n attributes.
 */
function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    el.textContent = t(key);
  });
  // Update page <title> if it has a data-i18n attribute
  const titleEl = document.querySelector("title[data-i18n]");
  if (titleEl) {
    titleEl.textContent = t(titleEl.getAttribute("data-i18n"));
  }
}

/**
 * Switches the current language and re-renders the page.
 */
async function setLang(lang) {
  i18n.currentLang = lang;
  localStorage.setItem("blog-lang", lang);
  updateLangToggleText();
  // Re-render the current page with new language
  try {
    const posts = await loadPosts();
    const mainPostsContainer = document.getElementById("latest-posts");
    const archiveContainer = document.getElementById("archive-list");
    const articleContainer = document.getElementById("article-container");
    const categoriesContainer = document.getElementById("categories-list");
    const tagsContainer = document.getElementById("tags-cloud");

    if (mainPostsContainer) {
      renderPostList(mainPostsContainer, posts.slice(0, 3));
    }
    if (archiveContainer) {
      renderArchive(archiveContainer, posts);
    }
    if (articleContainer) {
      renderArticle(posts);
    }
    if (categoriesContainer) {
      renderCategories(posts);
    }
    if (tagsContainer) {
      renderTags(posts);
    }
  } catch (e) {
    console.error("Error re-rendering after lang switch:", e);
  }
  applyTranslations();
}

/**
 * Creates the language toggle button and injects it into the navbar.
 */
function createLangToggle() {
  const nav = document.querySelector(".site-nav");
  if (!nav) return;

  const btn = document.createElement("button");
  btn.className = "lang-toggle";
  btn.id = "lang-toggle";
  btn.addEventListener("click", () => {
    const newLang = i18n.currentLang === "en" ? "cn" : "en";
    setLang(newLang);
  });
  nav.appendChild(btn);
  updateLangToggleText();
}

/**
 * Updates the language toggle button text.
 */
function updateLangToggleText() {
  const btn = document.getElementById("lang-toggle");
  if (btn) {
    btn.textContent = i18n.currentLang === "en" ? "中文" : "EN";
  }
}

// ============================================================
// Markdown Renderer Configuration
// ============================================================

// Initialize Mermaid for graphs and diagrams (only when the library is loaded)
if (typeof mermaid !== "undefined") {
  mermaid.initialize({
    startOnLoad: false,
    theme: "default",
    securityLevel: "loose",
  });
}

// Configure Marked to use highlight.js for code blocks (only when the library is loaded)
if (typeof marked !== "undefined") {
  marked.setOptions({
    highlight: function (code, lang) {
      if (lang && typeof hljs !== "undefined" && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(code, { language: lang }).value;
        } catch (err) {}
      }
      if (typeof hljs !== "undefined") {
        return hljs.highlightAuto(code).value;
      }
      return code;
    },
    langPrefix: "hljs language-",
    breaks: true,
    gfm: true,
  });
}

// ============================================================
// Data Loading
// ============================================================

/**
 * Fetches all blog post metadata from the index file.
 * Returns a promise that resolves to an array of post objects
 * with language-aware fields (title, excerpt, categories, tags).
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
 * Resolves a post field to the correct language variant.
 * Falls back to the English field if the CN variant is missing.
 */
function postField(post, field, fallback) {
  const cnField = field + "Cn";
  if (i18n.currentLang === "cn" && post[cnField]) {
    return post[cnField];
  }
  return post[field] || fallback;
}

/**
 * Fetches a single post's Markdown file and parses it into
 * front-matter metadata and rendered HTML content.
 * Bilingual .md files use `<!-- cn -->` as the separator.
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

  // Split bilingual content if <!-- cn --> marker exists
  let content = body;
  if (body.includes("<!-- cn -->")) {
    const parts = body.split("<!-- cn -->");
    if (i18n.currentLang === "cn" && parts.length > 1) {
      content = parts[1];
    } else {
      content = parts[0];
    }
  }

  // Protect mermaid code blocks from Marked parser
  const mermaidBlocks = [];
  content = content.replace(/```mermaid\s*\n([\s\S]*?)```/g, (match, code) => {
    const placeholder = `%%MERMAID_BLOCK_${mermaidBlocks.length}%%`;
    mermaidBlocks.push(placeholder, code);
    return placeholder;
  });

  // Protect math blocks ($$...$$ and $...$) from Marked parser
  const mathBlocks = [];
  content = content.replace(/\$\$([\s\S]*?)\$\$/g, (match, math) => {
    const placeholder = `%%MATH_BLOCK_${mathBlocks.length}%%`;
    mathBlocks.push({ placeholder, math, display: true });
    return placeholder;
  });
  content = content.replace(/\$([^\$\n]+?)\$/g, (match, math) => {
    const placeholder = `%%MATH_BLOCK_${mathBlocks.length}%%`;
    mathBlocks.push({ placeholder, math, display: false });
    return placeholder;
  });

  // Convert Markdown to HTML
  let html = marked.parse(content);

  // Restore mermaid blocks as <div class="mermaid">
  for (let i = 0; i < mermaidBlocks.length; i += 2) {
    const placeholder = mermaidBlocks[i];
    const code = mermaidBlocks[i + 1];
    const escaped = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    html = html.replace(placeholder, `<div class="mermaid">${escaped}</div>`);
  }

  // Restore math blocks into the HTML
  mathBlocks.forEach(({ placeholder, math, display }) => {
    const rendered = katex.renderToString(math, {
      displayMode: display,
      throwOnError: false,
    });
    html = html.replace(placeholder, rendered);
  });

  return { meta, html };
}

/**
 * Parses YAML-like frontmatter from the top of a Markdown file.
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
 * Formats an ISO date string into a human-readable string.
 * Uses Chinese locale when current language is Chinese.
 */
function formatDate(dateStr) {
  const locale = i18n.currentLang === "cn" ? "zh-CN" : "en-US";
  return new Date(dateStr).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Extracts the full month name from a date string.
 */
function formatMonth(dateStr) {
  const locale = i18n.currentLang === "cn" ? "zh-CN" : "en-US";
  return new Date(dateStr).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
  });
}

/**
 * Extracts just the year from a date string.
 */
function getYear(dateStr) {
  return new Date(dateStr).getFullYear().toString();
}

// ============================================================
// Page: Main (index.html) — Render post cards
// ============================================================

/**
 * Renders a list of post cards. Uses language-aware post fields.
 */
function renderPostList(container, posts) {
  container.innerHTML = "";

  posts.forEach((post) => {
    const card = document.createElement("article");
    card.className = "post-card";

    const title = postField(post, "title", "");
    const excerpt = postField(post, "excerpt", "");

    card.innerHTML = `
      <div class="post-card__image-wrapper">
        <img class="post-card__image" src="${post.coverImage}" alt="${title}" loading="lazy">
      </div>
      <div class="post-card__body">
        <div class="post-card__date">${formatDate(post.date)}</div>
        <h2 class="post-card__title">
          <a href="article.html?id=${post.id}">${title}</a>
        </h2>
        <p class="post-card__excerpt">${excerpt}</p>
        <a class="post-card__link" href="article.html?id=${post.id}">${t("readMore")}</a>
      </div>
    `;

    container.appendChild(card);
  });
}

// ============================================================
// Page: Article (article.html) — Render single post
// ============================================================

async function renderArticle(posts) {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get("id"), 10);

  const post = posts.find((p) => p.id === id);

  if (!post) {
    document.getElementById("article-container").innerHTML = `
      <div class="not-found">
        <a class="back-link" href="index.html">${t("backLink")}</a>
        <h1>${t("postNotFound")}</h1>
        <p>${t("articleNotFoundDesc")}</p>
      </div>
    `;
    return;
  }

  try {
    const { meta, html } = await loadPostMarkdown(post.slug);

    const title = postField(post, "title", meta.title || post.title);
    const date = meta.date || post.date;

    // Update page title
    const siteTitle = t("siteTitle");
    document.title = `${title} — ${siteTitle}`;

    const container = document.getElementById("article-container");
    container.innerHTML = `
      <a class="back-link" href="index.html">${t("backLink")}</a>
      <header class="article-header">
        <h1>${title}</h1>
        <div class="article-header__meta">${formatDate(date)}</div>
      </header>
      <img class="article-cover" src="${post.coverImage}" alt="${title}" loading="lazy">
      <div class="article-content">${html}</div>
    `;

    // Post-process: Mermaid
    if (typeof mermaid !== "undefined") {
      await renderMermaidGraphs(container);
    }

    // Comments
    loadGiscus(id, title);
  } catch (error) {
    console.error("Error rendering article:", error);
    document.getElementById("article-container").innerHTML = `
      <div class="not-found">
        <a class="back-link" href="index.html">${t("backLink")}</a>
        <h1>${t("errorLoadingTitle")}</h1>
        <p>${error.message}</p>
      </div>
    `;
  }
}

async function renderMermaidGraphs(container) {
  const mermaidDivs = container.querySelectorAll(".mermaid");
  if (mermaidDivs.length === 0) return;

  try {
    await mermaid.run({ nodes: mermaidDivs });
  } catch (err) {
    console.warn("Mermaid rendering failed:", err);
  }
}

// ============================================================
// Page: Archive (archive.html) — Render chronological list
// ============================================================

function renderArchive(container, posts) {
  container.innerHTML = "";

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

  Object.keys(grouped).forEach((year) => {
    const yearDiv = document.createElement("div");
    yearDiv.className = "archive-year";

    const yearHeading = document.createElement("h2");
    yearHeading.className = "archive-year__heading";
    yearHeading.textContent = year;
    yearDiv.appendChild(yearHeading);

    Object.keys(grouped[year]).forEach((month) => {
      const monthDiv = document.createElement("div");
      monthDiv.className = "archive-month";

      const monthHeading = document.createElement("h3");
      monthHeading.className = "archive-month__heading";
      monthHeading.textContent = month;
      monthDiv.appendChild(monthHeading);

      grouped[year][month].forEach((post) => {
        const entry = document.createElement("div");
        entry.className = "archive-entry";
        const title = postField(post, "title", "");
        entry.innerHTML = `
          <div class="archive-entry__date">${formatDate(post.date)}</div>
          <div class="archive-entry__title">
            <a href="article.html?id=${post.id}">${title}</a>
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

function renderCategories(posts) {
  const container = document.getElementById("categories-list");
  if (!container) return;

  const grouped = {};
  posts.forEach((post) => {
    const cats = postField(post, "categories", ["Uncategorized"]);
    cats.forEach((cat) => {
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(post);
    });
  });

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
          .map((post) => {
            const title = postField(post, "title", "");
            return `<li><a href="article.html?id=${post.id}">${title}</a> <span class="post-date">${formatDate(post.date)}</span></li>`;
          })
          .join("")}
      </ul>
    `;
    container.appendChild(section);
  });
}

// ============================================================
// Page: Tags (tags.html) — Tag cloud with post counts
// ============================================================

function renderTags(posts) {
  const container = document.getElementById("tags-cloud");
  if (!container) return;

  const counts = {};
  posts.forEach((post) => {
    (postField(post, "tags", [])).forEach((tag) => {
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
    a.title = `${count} ${t("postsCount")}`;
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

function renderFilteredTagPosts(tag, posts) {
  const container = document.getElementById("tags-cloud");
  if (!container) return;

  const filtered = posts
    .filter((post) => (postField(post, "tags", [])).includes(tag))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const section = document.createElement("div");
  section.className = "tag-filtered-results";

  const postsListHtml = filtered
    .map((post) => {
      const title = postField(post, "title", "");
      const excerpt = postField(post, "excerpt", "");
      return `
        <article class="post-card">
          <div class="post-card__image-wrapper">
            <img class="post-card__image" src="${post.coverImage}" alt="${title}" loading="lazy">
          </div>
          <div class="post-card__body">
            <div class="post-card__date">${formatDate(post.date)}</div>
            <h2 class="post-card__title">
              <a href="article.html?id=${post.id}">${title}</a>
            </h2>
            <p class="post-card__excerpt">${excerpt}</p>
            <a class="post-card__link" href="article.html?id=${post.id}">${t("readMore")}</a>
          </div>
        </article>
      `;
    })
    .join("");

  section.innerHTML = `
    <h3 class="tag-filtered__heading">${t("postsTagged")} "${tag}" (${filtered.length})</h3>
    <div class="post-list">${postsListHtml}</div>
    <a class="back-link" href="tags.html">${t("showAllTags")}</a>
  `;
  container.appendChild(section);
}

// ============================================================
// Comments System — Giscus (GitHub Discussions)
// ============================================================

const GISCUS_CONFIG = {
  repo: "Phi-Tesla/Phi-Tesla.github.io",
  repoId: "MDEwOlJlcG9zaXRvcnkxODA5NzMyNTk=",
  category: "Comments",
  categoryId: "DIC_kwDOCsluy84C6utk",
  theme: "light",
  lang: "en",
};

function loadGiscus(postId, postTitle) {
  const container = document.getElementById("giscus-container");
  if (!container) return;

  const script = document.createElement("script");
  script.src = "https://giscus.app/client.js";
  script.setAttribute("data-repo", GISCUS_CONFIG.repo);
  script.setAttribute("data-repo-id", GISCUS_CONFIG.repoId);
  script.setAttribute("data-category", GISCUS_CONFIG.category);
  script.setAttribute("data-category-id", GISCUS_CONFIG.categoryId);
  script.setAttribute("data-mapping", "title");
  script.setAttribute("data-term", String(postTitle));
  script.setAttribute("data-strict", "1");
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
    // Initialize i18n first
    await initI18n();

    // Create language toggle in navbar
    createLangToggle();

    // Apply translations to static HTML elements
    applyTranslations();

    const posts = await loadPosts();

    const mainPostsContainer = document.getElementById("latest-posts");
    const archiveContainer = document.getElementById("archive-list");
    const articleContainer = document.getElementById("article-container");
    const categoriesContainer = document.getElementById("categories-list");
    const tagsContainer = document.getElementById("tags-cloud");

    if (mainPostsContainer) {
      renderPostList(mainPostsContainer, posts.slice(0, 3));
    }

    if (archiveContainer) {
      renderArchive(archiveContainer, posts);
    }

    if (articleContainer) {
      renderArticle(posts);
    }

    if (categoriesContainer) {
      renderCategories(posts);
    }

    if (tagsContainer) {
      renderTags(posts);
    }
  } catch (error) {
    console.error("Error loading blog posts:", error);
    const container =
      document.getElementById("latest-posts") ||
      document.getElementById("archive-list") ||
      document.getElementById("article-container") ||
      document.getElementById("categories-list") ||
      document.getElementById("tags-cloud");
    if (container) {
      container.innerHTML = `<p style="color: red;">${t("errorLoadingPosts")}</p>`;
    }
  }

  setupNavbarScroll();
  setupScrollTopButton();
});

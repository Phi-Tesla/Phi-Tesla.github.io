const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ===== JSON file-based comment storage =====

const dataDir = path.join(__dirname, "data");
const commentsFile = path.join(dataDir, "comments.json");

// Initialize comments file if it doesn't exist
if (!fs.existsSync(commentsFile)) {
  fs.writeFileSync(commentsFile, "{}", "utf8");
}

function readComments() {
  const raw = fs.readFileSync(commentsFile, "utf8");
  return JSON.parse(raw);
}

function writeComments(data) {
  fs.writeFileSync(commentsFile, JSON.stringify(data, null, 2), "utf8");
}

// ===== API Routes =====

// GET /api/comments/:postId — get all comments for a post
app.get("/api/comments/:postId", (req, res) => {
  const postId = parseInt(req.params.postId, 10);
  if (isNaN(postId)) {
    return res.status(400).json({ error: "Invalid post ID" });
  }
  const all = readComments();
  const comments = all[postId] || [];
  res.json(comments);
});

// POST /api/comments/:postId — create a new comment
app.post("/api/comments/:postId", (req, res) => {
  const postId = parseInt(req.params.postId, 10);
  if (isNaN(postId)) {
    return res.status(400).json({ error: "Invalid post ID" });
  }

  const { name, text } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Name is required" });
  }
  if (!text || !text.trim()) {
    return res.status(400).json({ error: "Comment text is required" });
  }

  const all = readComments();
  if (!all[postId]) {
    all[postId] = [];
  }

  const comment = {
    name: name.trim(),
    text: text.trim(),
    date: new Date().toISOString(),
  };

  all[postId].push(comment);
  writeComments(all);

  res.status(201).json(comment);
});

// Start server
app.listen(PORT, () => {
  console.log(`Blog server running at http://localhost:${PORT}`);
});

const express = require("express");
const router = express.Router();
const path = require("path");

// Home page
router.get("^/$|index(.html)?", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "views", "index.html"));
});

// Basic page
router.get("/new-page(.html)?", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "views", "new-page.html"));
});

// Redirect from old page to new page
// Add the required status code as the first argument
router.get("/old-page(.html)?", (req, res) => {
  res.redirect(301, "/new-page.html"); // 302 by default
});

module.exports = router;

const express = require("express");
const app = express();
const path = require("path");
const cors = require("cors");
const { logger } = require("./middleware/logEvents");
const PORT = process.env.PORT || 3500;

// Middleware >>>>>>>>>>>>>>>>>>>>>>>>>>>>

// Custom middleware for logging
app.use(logger);

// Third party middleware - CORS - cross origin resource sharing
// Remove dev origin domains from whitelist before shipping
const whitelist = [
  "https://www.google.com",
  // "http://127.0.0.1:5500",
  // "http://localhost:3500",
];
const corsOptions = {
  origin: (origin, callback) => {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Built-in middleware to handle urlencoded data (form data)
// content-type: application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }));

// built-in middleware for json
app.use(express.json());

// serve static files ex: /public/css/styles.css (automatically serves all files within public)
app.use(express.static(path.join(__dirname, "/public")));

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

// Home page
app.get("^/$|index(.html)?", (req, res) => {
  // res.sendFile("./views/index.html", { root: __dirname });
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

// Basic page
app.get("/new-page(.html)?", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "new-page.html"));
});

// Redirect from old page to new page
// Add the required status code as the first argument
app.get("/old-page(.html)?", (req, res) => {
  res.redirect(301, "/new-page.html"); // 302 by default
});

// Catch all
app.get("/*", (req, res) => {
  res.status(404).sendFile(path.join(__dirname, "views", "404.html"));
});

// Route handlers
app.get(
  "/hello(.html)?",
  (req, res, next) => {
    console.log("attempted to load hello.html");
    next();
  },
  (req, res) => {
    res.send("Hello World!");
  }
);

// chaining route handlers
const one = (req, res, next) => {
  console.log("one");
  next();
};

const two = (req, res, next) => {
  console.log("two");
  next();
};

const three = (req, res) => {
  console.log("three");
  res.send("Finished!");
};

app.get("/chain(.html)?", [one, two, three]);

// Initialise server
app.listen(PORT, () => console.log(`Server running on port: ${PORT}`));

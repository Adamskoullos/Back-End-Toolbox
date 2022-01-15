```js
const express = require("express");
const cors = require("cors");
const app = express();
const path = require("path");
const errorHandler = require("./middleware/errorHandler");
const corsOptions = require("./config/corsOptions");

const { logger } = require("./middleware/logEvents");
const PORT = process.env.PORT || 3500;

// Middleware >>>>>>>>>>>>>>>>>>>>>>>>>>>>

// Custom middleware for logging
app.use(logger);

// Third party middleware - CORS - cross origin resource sharing
// Remove dev origin domains from whitelist before shipping
app.use(cors(corsOptions));

// Built-in middleware to handle urlencoded data (form data)
// content-type: application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }));

// built-in middleware for json
app.use(express.json());

// serve static files ex: /public/css/styles.css (automatically serves all files within public)
app.use("/", express.static(path.join(__dirname, "/public"))); // Any page top level
app.use("/subdir", express.static(path.join(__dirname, "/public"))); // any page in subdir folder

// Routing & Serving files >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

// Top level routes
app.use("/", require("./routes/root"));

// Subdir routes
app.use("/subdir", require("./routes/subdir"));

// Routing for API >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

app.use("/employees", require("./routes/api/employees"));

// Catch all methods and routes
app.all("*", (req, res) => {
  res.status(404).sendFile(path.join(__dirname, "views", "404.html"));
});

// Server Error handling
app.use(errorHandler);

// Initialise server
app.listen(PORT, () => console.log(`Server running on port: ${PORT}`));
```

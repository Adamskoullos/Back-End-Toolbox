require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const path = require("path");
const errorHandler = require("./middleware/errorHandler");
const corsOptions = require("./config/corsOptions");
const { logger } = require("./middleware/logEvents");
const verifyJWT = require("./middleware/verifyJWT");
const cookieParser = require("cookie-parser");
const credentials = require("./middleware/credentials");
const mongoose = require("mongoose");
const connectDB = require("./config/dbConnection");

const PORT = process.env.PORT || 3500;

// Connect to db
connectDB();

// Middleware >>>>>>>>>>>>>>>>>>>>>>>>>>>>

// Custom middleware for logging
app.use(logger);

// Handle options credentials check before cors and fetch cookies credentials requirement
app.use(credentials);

// Third party middleware - CORS - cross origin resource sharing
// Remove dev origin domains from whitelist before shipping
app.use(cors(corsOptions));

// Built-in middleware to handle urlencoded data (form data)
// content-type: application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }));

// built-in middleware for json
app.use(express.json());

// middleware for cookies
app.use(cookieParser());

// serve static files ex: /public/css/styles.css (automatically serves all files within public)
app.use("/", express.static(path.join(__dirname, "/public"))); // Any page top level

// Routing >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

// Top level routes to serve static files (index & 404)
app.use("/", require("./routes/root"));

// Routing for headless backend >>>>>>>>>>>>>>>>>>
app.use("/register", require("./routes/register"));
app.use("/auth", require("./routes/auth"));
app.use("/logout", require("./routes/logout"));

// Check jwt refresh token and re-issue access token
app.use("/refresh", require("./routes/refresh"));

// Auth Guard >>>>>>>>>
app.use(verifyJWT);

// All auth guarded api routes
app.use("/employees", require("./routes/api/employees"));

// Catch all methods and routes
app.all("*", (req, res) => {
  res.status(404).sendFile(path.join(__dirname, "views", "404.html"));
});

// Server Error handling
app.use(errorHandler);

// Initialize server
mongoose.connection.once("open", () => {
  console.log("Connected to Mongo >>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
  app.listen(PORT, () => console.log(`Server running on port: ${PORT}`));
});

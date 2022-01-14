# Express Middleware

Using the pattern `app.use(middleware)` at the top of the logic within the server file allows the middleware to be executed on every request:

```js
const express = require("express");
const cors = require("cors");
const app = express();
const path = require("path");

const { logger } = require("./middleware/logEvents");
const PORT = process.env.PORT || 3500;
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// Custom middleware for logging
app.use(logger);
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
```

- [Built In Middleware]()
- [Custom Middleware]()
- [Third Party Middleware]()
- [Error Handling Middleware]()
- [Router Middleware]()
- [Complete Pattern]()

---

## Built in Middleware

```js
// Built-in middleware to handle urlencoded data (form data)
// content-type: application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }));

// built-in middleware for json
app.use(express.json());

// serve static files ex: /public/css/styles.css (automatically serves all files within public)
app.use(express.static(path.join(__dirname, "/public")));
```

---

## Custom Middleware

The below example shows the middleware executing custom application code in this instance a `logger` function each time a request is made:

```js
const { logger } = require("./middleware/logEvents");

// Custom middleware for logging
app.use(logger);
```

```js
const { format } = require("date-fns");
const { v4: uuid } = require("uuid");

const fs = require("fs");
const fsPromises = require("fs").promises;
const path = require("path");

const logEvents = async (message, fileName) => {
  const dateTime = `${format(new Date(), "yyyyMMdd\tHH:mm:ss")}`;
  const logItem = `${dateTime}\t${uuid()}\t${message}\n`;

  try {
    if (!fs.existsSync(path.join(__dirname, "..", "logs"))) {
      await fsPromises.mkdir(path.join(__dirname, "..", "logs"));
    }
    await fsPromises.appendFile(
      path.join(__dirname, "..", "logs", fileName),
      logItem
    );
    console.log("Event Logged >>>>>!");
  } catch (err) {
    console.log(err);
  }
};

const logger = (req, res, next) => {
  logEvents(`${req.method}\t${req.headers.origin}\t${req.url}`, "reqLogs.txt");
  console.log(`${req.method} ${req.path}`);
  next();
};

module.exports = { logger, logEvents };
```

---

## Third Party Middleware

`CORS` is a good example of third party code that can be added to the application and run on each request.
The below example is using a whitelist array for allowed origins and the within the `corsOption`, origin is a function.
The if statement has an `|| !origin` which excludes server to server when there is no origin, this is helpful during development but should be removed for production!

```
npm i cors
```

```js
const express = require("express");
const cors = require("cors");
const app = express();
```

```js
const whitelist = [
  "https://www.production-domain.com",
  "http://127.0.0.1:5000", // dev front-end
  "http://localhost:3500", // dev beck-end
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
```

---

## Error Handling Middleware

At the bottom of the server, after all requests and before the listen we can add an error catch. This takes in four arguments:

1. error
2. request
3. response
4. next

```js
// Server Error handling
app.use(function (err, req, res, next) {
  console.error(err.message);
  res.status(500).send(err.message);
});

// Initialise server
app.listen(PORT, () => console.log(`Server running on port: ${PORT}`));
```

This can be extracted away into its own file:

```js
// /middleware/errorHandler.js
const { logEvents } = require("./logEvents");

const errorHandler = (err, req, res, next) => {
  logEvents(`${err.name}: ${err.message}`, "errorLog.txt");
  res.status(500).send(err.message);
};

module.exports = errorHandler;
```

Then imported into the server:

```js
const errorHandler = require("./middleware/errorHandler");
```

And then used:

```js
// Server Error handling
app.use(errorHandler);

// Initialise server
app.listen(PORT, () => console.log(`Server running on port: ${PORT}`));
```

## Route Middleware

```js
// Catch all methods and routes
app.all("*", (req, res) => {
  res.status(404).sendFile(path.join(__dirname, "views", "404.html"));
});
```

---

## Complete Pattern

```js
const express = require("express");
const cors = require("cors");
const app = express();
const path = require("path");

const { logger } = require("./middleware/logEvents");
const PORT = process.env.PORT || 3500;

// Middleware >>>>>>>>>>>>>>>>>>>>>>>>>>>>

// Custom middleware for logging
app.use(logger);

// Third party middleware - CORS - cross origin resource sharing
// Remove dev origin domains from whitelist before shipping
const whitelist = [
  "https://www.google.com",
  "http://127.0.0.1:3500",
  "http://localhost:3500",
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
```

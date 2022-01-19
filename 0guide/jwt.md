```
npm i dotenv jsonwebtoken cookie-parser
```

Create secret access and refresh token keys in `.env` file:

```
ACCESS_TOKEN_SECRET=
REFRESH_TOKEN_SECRET=
```

In the terminal get in to Node:

```js
node;
```

then create the random tokens:

```js
require("crypto").randomBytes(64).toString("hex");
```

Then add the `.env` file to the `.gitignore` file:

```
node_modules
.env
```

Now this is in place we can add auth tokens to the application:

```js
/// authController
const userDB = {
  users: require("../model/users.json"),
  setUsers: function (data) {
    this.users = data;
  },
};

const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");
require("dotenv").config();
const fsPromises = require("fs").promises; // Only used while we are using a file as a proxy db
const path = require("path");
```

Then within the logic as the user is to be logged in:

```js
const handleLogin = async (req, res) => {
  const { user, pwd } = req.body;
  if (!user || !pwd) {
    return res
      .staus(400) // bad request
      .json({ message: "Username and Password are required." });
  }
  // See if user exists
  const foundUser = userDB.users.find((person) => person.username === user);
  if (!foundUser) return res.sendStatus(401); // Unauthorised
  // Check password
  const match = await bcrypt.compare(pwd, foundUser.password);
  if (!match) return res.sendStatus(401);
  // Create JWTs >>>>>>>>>>>>>>>>>>>>>>>>>
  // Access token
  const accessToken = jwt.sign(
    { username: foundUser.username },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "100s" }
  );
  // Refresh token
  const refreshToken = jwt.sign(
    { username: foundUser.username },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "1d" }
  );
  // Save refresh token within the DB
  const otherUsers = userDB.users.filter(
    (person) => person.username !== foundUser.username
  );
  const currentUser = { ...foundUser, refreshToken };
  // Update users array
  userDB.setUsers([...otherUsers, currentUser]);
  // Write to file
  await fsPromises.writeFile(
    path.join(__dirname, "..", "model", "users.json"),
    JSON.stringify(userDB.users)
  );
  // Send refresh token to front-end, must be http cookie only and not stored in local storage
  res.cookie("jwt", refreshToken, {
    sameSite: "None",
    secure: true,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
  }); // 1 day
  // send access token to be crossed referenced on every request
  res.json({ accessToken });
};

module.exports = { handleLogin };
```

Now on to the middleware to create a `verifyJWT.js` file:

```js
const jwt = require("jsonwebtoken");
require("dotenv").config();

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.sendStatus(401); // Unauthorised
  console.log("Auth Header: ", authHeader); // Bearer token
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decodedUser) => {
    if (err) return res.sendStatus(403); // Invalid token
    req.user = decodedUser.username;
    next();
  });
};

module.exports = verifyJWT;
```

Now we have the middleware, we can use it within any route we want to guard.
The below example shows how to use the middleware to guard the `GET / employees` route:

```JS
const express = require("express");
const router = express.Router();
const verifyJWT = require('../../middleware/verifyJWT');

const {
  getAllEmployees,
  postNewEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployee,
} = require("../../controllers/employeesController");

router
  .route("/")
  .get(verifyJWT ,getAllEmployees)
  .post(postNewEmployee)
  .put(updateEmployee)
  .delete(deleteEmployee);

router.route("/:id").get(getEmployee);

module.exports = router;
```

As well as guarding specific routes as above we can also guard a group of routes from within the `server.js` file.
From a `waterfall` perspective the below example shows the `/register` and `/auth` routes are accessible by non logged in users, then we have the `auth guard` and then all routes below the auth guard are protected, in this example: `/employees`. All routes within the `/employees` endpoint (GET, PUT, POST, DELETE) are now protected:

```js
// Routing for headless backend >>>>>>>>>>>>>>>>>>
app.use("/register", require("./routes/register"));
app.use("/auth", require("./routes/auth"));

// Auth Guard >>>>>>>>>
app.use(verifyJWT);

// All auth guarded api routes
app.use("/employees", require("./routes/api/employees"));
```

## Add cookie-parser middleware and handle getting access tokens using the refresh token

```js
const cookieParser = require("cookie-parser");

const PORT = process.env.PORT || 3500;

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
```

Once the middleware is in place we can create the `refreshTokenController`:

```js
const usersDB = {
  users: require("../model/users.json"),
  setUsers: function (data) {
    this.users = data;
  },
};
const jwt = require("jsonwebtoken");
require("dotenv").config();

const handleRefreshToken = (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(401);
  const refreshToken = cookies.jwt;

  const foundUser = usersDB.users.find(
    (person) => person.refreshToken === refreshToken
  );
  if (!foundUser) return res.sendStatus(403); //Forbidden
  // evaluate jwt
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
    if (err || foundUser.username !== decoded.username)
      return res.sendStatus(403);
    const accessToken = jwt.sign(
      { username: decoded.username },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "30s" }
    );
    console.log("Access token: ", accessToken);
    res.json({ accessToken });
  });
};

module.exports = { handleRefreshToken };
```

Create the route:

```js
const express = require("express");
const router = express.Router();

const { handleRefreshToken } = require("../controllers/refreshTokenController");

router.get("/", handleRefreshToken);

module.exports = router;
```

Add the route to`server.js`:

```js
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
```

## Logout workflow

First lets create the controller:

```js
const usersDB = {
  users: require("../model/users.json"),
  setUsers: function (data) {
    this.users = data;
  },
};
const fsPromises = require("fs").promises;
const path = require("path");

const handleLogout = async (req, res) => {
  // On client also delete the access token
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); // No content to send back
  const refreshToken = cookies.jwt;
  // Is refresh token in DB
  const foundUser = usersDB.users.find(
    (person) => person.refreshToken === refreshToken
  );
  if (!foundUser) {
    // At this point we have a cookie but no user so we just clear the cookie
    res.clearCookie("jwt", {
      sameSite: "None",
      secure: true,
      httpOnly: true,
    });
    return res.sendStatus(204);
  }
  // At this point we have a user that has a matching refresh token that needs to be logged out
  const otherUsers = usersDB.users.filter(
    (person) => person.refreshToken !== foundUser.refreshToken
  );
  // remove cookie from user
  const currentUser = { ...foundUser, refreshToken: "" };
  // Add user back and update the db
  usersDB.setUsers([...otherUsers, currentUser]);
  await fsPromises.writeFile(
    path.join(__dirname, "..", "model", "users.json"),
    JSON.stringify(usersDB.users)
  );
  // Clear the cookie
  res.clearCookie("jwt", {
    sameSite: "None",
    secure: true,
    httpOnly: true,
  });
  res.sendStatus(204);
};

module.exports = { handleLogout };
```

Then create the route file:

```js
const express = require("express");
const router = express.Router();

const { handleLogout } = require("../controllers/logoutController");

router.get("/", handleLogout);

module.exports = router;
```

Then add the rout to `server.js`:

```js
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

const PORT = process.env.PORT || 3500;

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

// Initialise server
app.listen(PORT, () => console.log(`Server running on port: ${PORT}`));
```

## Note when using fetch on the front-end

`credentials` need to be included in the object:

```js
const handleLogin = async () => {
  const user = document.getElementById("user").value;
  const pwd = document.getElementById("pwd").value;
  try {
    const res = await fetch("http://localhost:3500/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ user, pwd }),
    });
    if (!res.ok) {
      if (res.status === 401) {
        return await sendRefreshToken();
      }
      throw new Error(`${res.status} ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.log(err.stack);
    // manage error
  }
};
```

Then we need to make sure that `Access-Control-Allow-Credentials` is set to true within the header. To do this we can extract the `cors` whitelist out of the `/config/corsOptions` file and into its own `/config/whitelist.js` file so we can use it in multiple places. Then we can add a `/middleware/credentials.js` file that uses the whitelist and has a function`credentials` that adds the `Access-Control-Allow-Credentials: true` to the header:

`/config/whitelist.js`:

```js
const whitelist = [
  "https://www.google.com",
  "http://127.0.0.1:3500",
  "http://localhost:3500",
];

module.exports = whitelist;
```

`/middleware/credentials.js`:

```js
const whitelist = require("../config/corsWhitelist");

const credentials = (req, res, next) => {
  const origin = req.headers.origin;
  if (whitelist.includes(origin)) {
    res.header("Access-Control-Allow-Credentials", true);
  }
  next();
};

module.exports = credentials;
```

Then within `server.js` add the middleware:

```js
const credentials = require("./middleware/credentials");

// Custom middleware for logging
app.use(logger);

// Handle options credentials check before cors and fetch cookies credentials requirement
app.use(credentials);

// Third party middleware - CORS - cross origin resource sharing
// Remove dev origin domains from whitelist before shipping
app.use(cors(corsOptions));
```

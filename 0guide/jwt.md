# Authentication

- [Auth Set Up and Login](#Auth-Set-Up)
- [Refresh Tokens](#Refresh-Tokens)
- [Logout](#Logout-workflow)

---

# Auth Set Up

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

Now this is in place we can add auth tokens to the application and handle the login logic:

```js
const User = require("../model/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const handleLogin = async (req, res) => {
  const { user, pwd } = req.body;
  if (!user || !pwd) {
    return res
      .staus(400) // bad request
      .json({ message: "Username and Password are required." });
  }
  // See if user exists
  const foundUser = await User.findOne({ username: user }).exec();
  if (!foundUser) return res.sendStatus(401); // Unauthorised
  // Check password
  const match = await bcrypt.compare(pwd, foundUser.password);
  if (!match) return res.sendStatus(401);
  // Grab the roles for the foundUser
  const roles = Object.values(foundUser.roles);
  // Create JWTs >>>>>>>>>>>>>>>>>>>>>>>>>
  // Access token
  const accessToken = jwt.sign(
    {
      UserInfo: {
        username: foundUser.username,
        roles: roles,
      },
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "100s" }
  );
  // Refresh token
  const refreshToken = jwt.sign(
    { username: foundUser.username },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "1d" }
  );
  // Update the user to include the refreshToken and save updated user within the DB
  foundUser.refreshToken = refreshToken;
  const result = await foundUser.save();
  console.log("Logged in user: ", result);
  // Send refresh token to front-end, must be http cookie only and not stored in local storage
  res.cookie("jwt", refreshToken, {
    sameSite: "None",
    // secure: true,
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

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  // if there is no auth header or if the auth header does not start with Bearer just return
  if (!authHeader?.startsWith("Bearer ")) return res.sendStatus(401); // Unauthorised
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decodedUser) => {
    if (err) return res.sendStatus(403); // Invalid token
    req.user = decodedUser.UserInfo.username;
    req.roles = decodedUser.UserInfo.roles;
    next();
  });
};

module.exports = verifyJWT;
```

Now we have the middleware, we can use it within any specific route or directly in `server.js`. In the example below we are using the route guard to protect all routes below where the middleware is used. This makes it simple allow non logged in users to access some routes and all others to be protected with a single guard:

```JS
// Auth Guard >>>>>>>>>
app.use(verifyJWT);

// All auth guarded api routes
app.use("/employees", require("./routes/api/employees"));
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

# Refresh Tokens

#### Add cookie-parser middleware and handle getting access tokens using the refresh token

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
const User = require("../model/User");
const jwt = require("jsonwebtoken");

const handleRefreshToken = async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(401);
  const refreshToken = cookies.jwt;

  const foundUser = await User.findOne({ refreshToken }).exec();
  if (!foundUser) return res.sendStatus(403); //Forbidden
  // evaluate jwt
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
    if (err || foundUser.username !== decoded.username)
      return res.sendStatus(403);
    // create roles object
    const roles = Object.values(foundUser.roles);
    const accessToken = jwt.sign(
      {
        UserInfo: {
          username: decoded.username,
          roles: roles,
        },
      },
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
const User = require("../model/User");

const handleLogout = async (req, res) => {
  // On client also delete the access token
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); // No content to send back
  const refreshToken = cookies.jwt;
  // Is refresh token in DB
  const foundUser = await User.findOne({ refreshToken }).exec();
  if (!foundUser) {
    // At this point we have a cookie but no user so we just clear the cookie
    res.clearCookie("jwt", {
      sameSite: "None",
      secure: true,
      httpOnly: true,
    });
    return res.sendStatus(204);
  }
  // Delete refresh token from user and update in the db
  foundUser.refreshToken = "";
  const result = await foundUser.save();
  console.log("Logged out user: ", result);
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

Then add the route to `server.js`:

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

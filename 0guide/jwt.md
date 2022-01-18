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
const jwt = require("jsonwebtoken");
require("dotenv").config();
const fsPromises = require("fs").promises; // Only used while we are using a file as a proxy db
const path = require("path");
```

Then within the logic as the user is to be logged in:

```js
// Create JWTs >>>>>>>>>>>>>>>>>>>>>>>>>
// Access token
const accessToken = jwt.sign(
  { username: foundUser.username },
  process.env.ACCESS_TOKEN_SECRET,
  { expiresIn: "30s" }
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
  httpOnly: true,
  maxAge: 24 * 60 * 60 * 1000,
}); // 1 day
// send access token to be crossed referenced on every request
res.json({ accessToken });
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
      { expiresIn: "30s" } // 5 - 15 minutes in normal use
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
// Check jwt refresh token and get access token
app.use("/refresh", require("./routes/refresh"));

// Auth Guard >>>>>>>>>
app.use(verifyJWT); // verify access token

// All auth guarded api routes
app.use("/employees", require("./routes/api/employees"));
```

## Logout workflow

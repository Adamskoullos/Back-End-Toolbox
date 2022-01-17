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
The below example shows how to use the middleware to guard the `GET / EMPLOYEES` ROUTE:

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

# User Roles and Permissions

create `/config/roles_list.js`:

```js
const ROLES_LIST = {
  Admin: 5150,
  Editor: 1984,
  User: 2001,
};

module.exports = ROLES_LIST;
```

Here is an example of the `users` collection:

```js
[
  {
    username: "dave1",
    roles: { User: 2001 },
    password: "$2b$10$oEbHZlazDHE1YnnJ4XdpGuGh9a/JZOO7Xe6WZtRRsSMgprxMXnKza",
    refreshToken:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImRhdmUxIiwiaWF0IjoxNjMzOTkyMjkwLCJleHAiOjE2MzQwNzg2OTB9.U85HVX_gcDZkHHSRWeo7AHfIe7q9i03dGW2ed3fHqAk",
  },
  {
    username: "walt2",
    roles: { User: 2001, Editor: 1984 },
    password: "$2b$10$cvfmz./teMWDccIMChAxZ.HqgL3eoQGYTm1z9lGy5iRf8D7NNargC",
    refreshToken:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IndhbHQyIiwiaWF0IjoxNjMzOTkyNDU2LCJleHAiOjE2MzQwNzg4NTZ9.wRVJbN7_67JyTW9PALMWWEsO4BMkehyy5kXq6WilvWc",
  },
  {
    username: "walt1",
    roles: { User: 2001, Editor: 1984, Admin: 5150 },
    password: "$2b$10$33Q9jtAoaXC4aUX9Bjihxum2BHG.ENB6JyoCvPjnuXpITtUd8x8/y",
    refreshToken:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IndhbHQxIiwiaWF0IjoxNjMzOTkyNTY0LCJleHAiOjE2MzQwNzg5NjR9.gE2CgbtEuqE42LeJ4dP6APmqyGTNBh53WXVyDdP47yM",
  },
];
```

Once a user is logged in we can control which users have access to which routes by using different role access.

Create `/middleware/verifyRoles.js`:

```js
const verifyRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req?.roles) return res.sendStatus(401); // unauthorized
    const rolesArray = [...allowedRoles];
    console.log("RoleArr: ", rolesArray);
    console.log("req.roles: ", req.roles);
    // create array of roles the user has, then find the first role that is true and assign true as the value of `result`
    const result = req.roles
      .map((role) => rolesArray.includes(role))
      .find((val) => val === true);
    if (!result) return res.sendStatus(401); // the user does not have role authorization
    next();
  };
};

module.exports = verifyRoles;
```

Then use the middleware within specific routes to manage role access. In the below example we are pulling in the `roles` object and the `verifyRoles` middleware, the we are then adding the `verifyRoles()` function into the routes as the first argument passing in any roles we want to allow access to. We are access each role via dot notation:

`/routes/api/employees.js`:

```js
const express = require("express");
const router = express.Router();
const ROLES_LIST = require("../../config/roles");
const verifyRoles = require("../../middleware/verifyRoles");

const {
  getAllEmployees,
  postNewEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployee,
} = require("../../controllers/employeesController");

router
  .route("/")
  .get(getAllEmployees)
  .post(verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Editor), postNewEmployee)
  .put(verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Editor), updateEmployee)
  .delete(verifyRoles(ROLES_LIST.Admin), deleteEmployee);

router.route("/:id").get(getEmployee);

module.exports = router;
```

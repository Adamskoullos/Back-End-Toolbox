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

Here is `/model/users.js`, whoing how to structure the roles within the user object:

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

Amend the `registerController.js` to include roles as a new user is created:

```js
// Store new user
const newUser = {
  username: user,
  roles: { user: 2001 },
  password: hashedPwd,
};
```

Then include the authorisation roles within the login workflow `authController.js`:

1. Create an object `roles` of the role values for the user
2. Add a `UserInfo` object to the `accessToken` which includes the `username` and `roles`

```js
// See if user exists
const foundUser = userDB.users.find((person) => person.username === user);
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
```

Then alter the `refreshTokenController.js` to also include roles within the `accessToken`:

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

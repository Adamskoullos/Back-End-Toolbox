# Mongoose Schemas and Models

> Each `Schema` maps to a MongoDB `collection` and defines the structure of the `documents` within that `collection`

1. Create `Employee` and `User` Schemas and models:

**`model/Employee.js`**:

The Schema below is used to create an `Employee` model which automatically maps to an `employees` collection.

```js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const employeeSchema = new Schema({
  firstname: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Employee", employeeSchema);
```

**`/model/User.js`**:

```js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
  },
  roles: {
    User: {
      type: Number,
      default: 2001,
    },
    Editor: Number,
    Admin: Number,
  },
  password: {
    type: String,
    required: true,
  },
  refreshToken: String,
});

module.exports = mongoose.model("User", userSchema);
```

2. Use the `models` within `controllers` to interface with MongoDB:

`/controllers/registerController.js`:

The user being created only needs a username and password as the `_id` is created automatically and the Schema has a default role of `User` if not set.

The `await User.create()` method allows the user object to be passed in, created and stored within the db all within the same method.

```js
const User = require("../model/User");
const bcrypt = require("bcrypt");

const handleNewUser = async (req, res) => {
  const { user, pwd } = req.body;
  if (!user || !pwd) {
    return res
      .status(400) // bad request
      .json({ message: "Username and Password are required." });
  }
  // Check for duplicate usernames in MongoDB using the mongoose model and method
  const duplicate = await User.findOne({ username: user }).exec();
  if (duplicate) {
    return res
      .status(409) // conflict
      .json({ message: "Username already exists." });
  }
  try {
    // Encrypt password
    const hashedPwd = await bcrypt.hash(pwd, 10);
    // create and store new user object
    const result = await User.create({
      username: user,
      password: hashedPwd,
    });

    console.log("New User: ", result);

    res.status(201).json({ success: `New user ${user} created` });
  } catch (err) {
    res.status(500).json({ message: err.message }); // server error
  }
};

module.exports = { handleNewUser };
```

**Result returned from MongoDB**:

```
New User:  {
  username: 'BarryBalls',
  roles: { User: 2001 },
  password: '$2b$10$ruP1VLNOxQnk804bhlsq5OMBjV/y1HokEN6I7g2TRFA7mYg2ckYLS',
  _id: new ObjectId("61ebe3820c8d7ce53e4c22ec"),
  __v: 0
}
```

`/controllers/refreshTokenController.js`:

To find and grab the `foundUser` below we use the `User.findOne({ refreshToken })` method again passing in the `refreshToken`, as the value name is the same as the key name we only need to pass in the value and as we are using async/await we need to use `exec()` at the end.

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

`/controllers/authController.js` > Login:

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
    secure: true,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
  }); // 1 day
  // send access token to be crossed referenced on every request
  res.json({ accessToken });
};

module.exports = { handleLogin };
```

`/controllers/logoutController.js`:

Below we pull in the `User` model then we use `await User.findOne({ refreshToken })` to grab the user, then once we have cleared the jwt cookie and updated the user, we then save the updated user back to Mongo using `await foundUser.save()`.

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
  // At this point we have a user with a refresh token that needs to be logged out
  // Delete refresh token from user and save updated user in the db
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

Response from Mongo:

```
Logged out user:  {
  roles: { User: 2001 },
  _id: new ObjectId("61ed0f628eef409e49b72518"),
  username: 'DangerDave',
  password: '$2b$10$47LGpD6pOML1a2/O3OMZU.cFVbAu/4nMgT8cg.4TgRv2ob90QqDS6',
  __v: 0,
  refreshToken: ''
}

```

---

`/controllers/employeesController.js`:

Pull in the `Employee` model:

```js
const Employee = require("../model/Employee");

const getAllEmployees = async (req, res) => {
  const employees = await Employee.find();
  if (!employees)
    return res.status(204).json({ message: "No employees found." });
  res.json(employees);
};

const postNewEmployee = async (req, res) => {
  if (!req?.body?.firstname || !req?.body?.lastname) {
    return res
      .status(400)
      .json({ message: "First and last names are required." });
  }
  try {
    // create new employee and save to Mongo
    const result = await Employee.create({
      firstname: req.body.firstname,
      lastname: req.body.lastname,
    });
    res.status(201).json(result); // created
  } catch (err) {
    console.log(err);
  }
};

const updateEmployee = async (req, res) => {
  if (!req?.params?.id)
    return res.status(400).json({ message: "ID parameter is required" });
  // Find and grab employee
  const employee = await Employee.findOne({ _id: req.params.id }).exec();
  // If not found let user know
  if (!employee) {
    return res
      .status(204) // does not exist
      .json({ message: `Employee ID ${req.params.id} not found` });
  }
  // Update relevant fields
  if (req.body?.firstname) employee.firstname = req.body.firstname;
  if (req.body?.lastname) employee.lastname = req.body.lastname;
  // save updated employee to Mongo
  const result = await employee.save();
  // Send updated employee
  res.json(result);
};

const deleteEmployee = async (req, res) => {
  if (!req?.params?.id)
    return res.status(400).json({ message: "ID parameter is required" });
  const employee = await Employee.findOne({ _id: req.params.id }).exec();
  if (!employee) {
    return res
      .status(204) // does not exist
      .json({ message: `Employee ID ${req.params.id} not found` });
  }
  const result = await employee.deleteOne({ _id: req.params.id });
  res.json(result);
};

const getEmployee = async (req, res) => {
  if (!req?.params?.id)
    return res.status(400).json({ message: "ID parameter is required" });
  const employee = await Employee.findOne({ _id: req.params.id }).exec();
  if (!employee) {
    return res
      .status(204) // does not exist
      .json({ message: `Employee ID ${req.params.id} not found` });
  }
  res.status(200).json(employee);
};

module.exports = {
  getAllEmployees,
  postNewEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployee,
};
```

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

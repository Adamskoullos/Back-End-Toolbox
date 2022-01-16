const userDB = {
  users: require("../model/users.json"),
  setUsers: function (data) {
    this.users = data;
  },
};

const fsPromises = require("fs").promises;
const path = require("path");
const bcrypt = require("bcrypt");

const handleNewUser = async (req, res) => {
  const { user, pwd } = req.body;
  if (!user || !pwd) {
    return res
      .staus(400) // bad request
      .json({ message: "Username and Password are required." });
  }
  // Check for duplicate usernames in db
  const duplicate = userDB.users.find(
    (person) => person.username === user.username
  );
  if (duplicate) {
    return res
      .staus(409) // conflict
      .json({ message: "Username already exists." });
  }
  try {
    // Encrypt password
    const hashedPwd = await bcrypt.hash(pwd, 10);
    // Store new user
    const newUser = { username: user, password: hashedPwd };
    // Set data
    userDB.setUsers([...userDB.users, newUser]);
    // write to db
    await fsPromises.writeFile(
      path.join(__dirname, "..", "model", "users.json"),
      JSON.stringify(userDB.users)
    );
    console.log("Users: ", userDB.users);
    res.status(201).json({ success: `New user ${user} created` });
  } catch (err) {
    res.status(500).json({ message: err.message }); // server error
  }
};

module.exports = { handleNewUser };

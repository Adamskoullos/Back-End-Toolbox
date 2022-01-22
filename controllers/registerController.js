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

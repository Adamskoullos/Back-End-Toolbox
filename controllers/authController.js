const userDB = {
  users: require("../model/users.json"),
  setUsers: function (data) {
    this.users = data;
  },
};

const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");
const fsPromises = require("fs").promises; // Only used while we are using a file as a proxy db
const path = require("path");

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

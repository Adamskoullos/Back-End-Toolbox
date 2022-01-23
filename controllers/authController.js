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

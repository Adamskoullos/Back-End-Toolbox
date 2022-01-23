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
  // Delete refresh token from user and update in the db
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

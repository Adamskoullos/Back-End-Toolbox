const usersDB = {
  users: require("../model/users.json"),
  setUsers: function (data) {
    this.users = data;
  },
};
const fsPromises = require("fs").promises;
const path = require("path");

const handleLogout = async (req, res) => {
  // On client also delete the access token
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); // No content to send back
  const refreshToken = cookies.jwt;
  // Is refresh token in DB
  const foundUser = usersDB.users.find(
    (person) => person.refreshToken === refreshToken
  );
  if (!foundUser) {
    // At this point we have a cookie but no user so we just clear the cookie
    res.clearCookie("jwt", {
      sameSite: "None",
      secure: true,
      httpOnly: true,
    });
    return res.sendStatus(204);
  }
  // At this point we have a user that has a matching refresh token that needs to be logged out
  const otherUsers = usersDB.users.filter(
    (person) => person.refreshToken !== foundUser.refreshToken
  );
  // remove cookie from user
  const currentUser = { ...foundUser, refreshToken: "" };
  // Add user back and update the db
  usersDB.setUsers([...otherUsers, currentUser]);
  await fsPromises.writeFile(
    path.join(__dirname, "..", "model", "users.json"),
    JSON.stringify(usersDB.users)
  );
  // Clear the cookie
  res.clearCookie("jwt", {
    sameSite: "None",
    secure: true,
    httpOnly: true,
  });
  res.sendStatus(204);
};

module.exports = { handleLogout };

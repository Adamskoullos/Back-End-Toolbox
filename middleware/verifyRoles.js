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

# Core MVC Pattern

**`server.js`**:

A user hits the `/employees` endpoint and the thread hits the below code within `server.js` and enters the `employees` route.

```js
app.use("/employees", require("./routes/api/employees"));
```

**`/routes/api/employees.js`**:

`employees.js` pulls in the logic for each route from the controller and also the verification middleware to be used on specific routes for user authorization.

```js
const express = require("express");
const router = express.Router();
const ROLES_LIST = require("../../config/roles");
const verifyRoles = require("../../middleware/verifyRoles");

const {
  getAllEmployees,
  postNewEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployee,
} = require("../../controllers/employeesController");

router
  .route("/")
  .get(getAllEmployees)
  .post(verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Editor), postNewEmployee)
  .put(verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Editor), updateEmployee)
  .delete(verifyRoles(ROLES_LIST.Admin), deleteEmployee);

router.route("/:id").get(getEmployee);

module.exports = router;
```

**`/controllers/employeesController.js`**:

The controller pulls in the `Employee` model which gives us access to interface with Mongo via the Mongoose methods which are available on the model.

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
  if (!req?.body?.id)
    return res.status(400).json({ message: "ID parameter is required" });
  // Find and grab employee
  const employee = await Employee.findOne({ _id: req.body.id }).exec();
  // If not found let user know
  if (!employee) {
    return res
      .status(204) // does not exist
      .json({ message: `Employee ID ${req.body.id} not found` });
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
  if (!req?.body?.id)
    return res.status(400).json({ message: "ID parameter is required" });
  const employee = await Employee.findOne({ _id: req.body.id }).exec();
  if (!employee) {
    return res
      .status(204) // does not exist
      .json({ message: `Employee ID ${req.body.id} not found` });
  }
  const result = await employee.deleteOne({ _id: req.body.id });
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

**`/model/Employee.js`**:

Below is the basic pattern used when using Mongoose to create Schemas and models.

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

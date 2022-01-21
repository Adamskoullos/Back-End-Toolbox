const data = {
  employees: require("../model/employees.json"),
  setEmployees: function (data) {
    this.employees = data;
  },
};

const getAllEmployees = (req, res) => {
  res.json(data.employees);
};

const postNewEmployee = (req, res) => {
  if (!req.body.firstname || !req.body.lastname) {
    return res
      .status(400)
      .json({ message: "First and last names are required." });
  }
  const newEmployee = {
    id: data.employees?.length
      ? data.employees[data.employees.length - 1].id + 1
      : 1,
    firstname: req.body.firstname,
    lastname: req.body.lastname,
  };
  data.setEmployees([...data.employees, newEmployee]);
  res.status(201).json(data.employees);
};

const updateEmployee = (req, res) => {
  const employee = data.employees.find((e) => e.id === req.body.id);
  if (!employee) {
    return res
      .status(400)
      .json({ message: `Employee ID ${req.body.id} not found` });
  }
  if (req.body.firstname) employee.firstname = req.body.firstname;
  if (req.body.lastname) employee.lastname = req.body.lastname;
  const newArr = data.employees.map((e) => {
    if (e.id === employee.id) return employee;
    else return e;
  });
  data.setEmployees(newArr);
  res.json(data.employees);
};

const deleteEmployee = (req, res) => {
  const employee = data.employees.find((e) => e.id === req.body.id);
  if (!employee) {
    return res
      .status(400)
      .json({ message: `Employee ID ${req.body.id} not found` });
  }
  const newData = data.employees.filter((e) => e.id !== employee.id);
  data.setEmployees(newData);
  res.json(data.employees);
};

const getEmployee = (req, res) => {
  const employee = data.employees.find((e) => e.id === req.body.id);
  if (!employee) {
    return res
      .status(400)
      .json({ message: `Employee ID ${req.body.id} not found` });
  }
  res.json(employee);
};

module.exports = {
  getAllEmployees,
  postNewEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployee,
};

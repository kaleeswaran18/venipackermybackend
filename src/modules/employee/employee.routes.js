const express = require("express");

const router = express.Router();

const {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} = require("./employee.controller");

const authMiddleware = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const validationMiddleware = require("../../middleware/validation.middleware");

const {
  createEmployeeSchema,
  updateEmployeeSchema,
} = require("./employee.validation");


// =========================
// CREATE EMPLOYEE
// Admin Only
// =========================

router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  validationMiddleware(createEmployeeSchema),
  createEmployee
);


// =========================
// GET ALL EMPLOYEES
// Admin + Owner
// =========================

router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getAllEmployees
);


// =========================
// GET EMPLOYEE BY ID
// Admin + Owner
// =========================

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getEmployeeById
);


// =========================
// UPDATE EMPLOYEE
// Admin Only
// =========================

router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  validationMiddleware(updateEmployeeSchema),
  updateEmployee
);


// =========================
// DELETE EMPLOYEE
// Admin Only
// =========================

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteEmployee
);


module.exports = router;
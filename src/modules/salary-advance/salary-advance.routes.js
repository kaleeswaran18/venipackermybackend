const express = require("express");

const router = express.Router();

const {
  createSalaryAdvance,
  getAllSalaryAdvances,
  getSalaryAdvanceById,
  updateSalaryAdvance,
  deleteSalaryAdvance,
} = require("./salary-advance.controller");

const authMiddleware = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const validationMiddleware = require("../../middleware/validation.middleware");

const {
  createSalaryAdvanceSchema,
  updateSalaryAdvanceSchema,
} = require("./salary-advance.validation");

// Create salary advance
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  validationMiddleware(createSalaryAdvanceSchema),
  createSalaryAdvance
);

// Get all salary advances
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getAllSalaryAdvances
);

// Get salary advance by ID
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getSalaryAdvanceById
);

// Update salary advance
router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  validationMiddleware(updateSalaryAdvanceSchema),
  updateSalaryAdvance
);

// Delete salary advance
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteSalaryAdvance
);

module.exports = router;
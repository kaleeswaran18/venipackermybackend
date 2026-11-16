const express = require("express");

const router = express.Router();

const {
  createCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
} = require("./company.controller");

const authMiddleware = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const validationMiddleware = require("../../middleware/validation.middleware");

const {
  createCompanySchema,
  updateCompanySchema,
} = require("./company.validation");


// =========================
// CREATE COMPANY
// Admin Only
// =========================

router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  validationMiddleware(createCompanySchema),
  createCompany
);


// =========================
// GET ALL COMPANIES
// Admin + Owner
// =========================

router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getAllCompanies
);


// =========================
// GET COMPANY BY ID
// Admin + Owner
// =========================

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getCompanyById
);


// =========================
// UPDATE COMPANY
// Admin Only
// =========================

router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  validationMiddleware(updateCompanySchema),
  updateCompany
);


// =========================
// DELETE COMPANY
// Admin Only
// =========================

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteCompany
);


module.exports = router;
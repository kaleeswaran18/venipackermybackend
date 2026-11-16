const express = require("express");

const router = express.Router();

const {
  createEnquiry,
  getAllEnquiries,
  getEnquiryById,
  updateEnquiry,
  deleteEnquiry,
} = require("./enquiry.controller");

const authMiddleware = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const validationMiddleware = require("../../middleware/validation.middleware");

const {
  createEnquirySchema,
  updateEnquirySchema,
} = require("./enquiry.validation");

// =========================
// CREATE ENQUIRY
// =========================

router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  validationMiddleware(createEnquirySchema),
  createEnquiry
);

// =========================
// GET ALL ENQUIRIES
// =========================

router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getAllEnquiries
);

// =========================
// GET ENQUIRY BY ID
// =========================

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getEnquiryById
);

// =========================
// UPDATE ENQUIRY
// =========================

router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  validationMiddleware(updateEnquirySchema),
  updateEnquiry
);

// =========================
// DELETE ENQUIRY
// =========================

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteEnquiry
);

module.exports = router;
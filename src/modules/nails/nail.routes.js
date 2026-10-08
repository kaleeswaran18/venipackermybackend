const express = require("express");

const router = express.Router();

const {
  createNail,
  getAllNails,
  getNailById,
  updateNail,
  deleteNail,
} = require("./nail.controller");

const authMiddleware = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const validationMiddleware = require("../../middleware/validation.middleware");

const {
  createNailSchema,
  updateNailSchema,
} = require("./nail.validation");


// =========================
// CREATE NAIL
// Admin Only
// =========================

router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  validationMiddleware(createNailSchema),
  createNail
);


// =========================
// GET ALL NAILS
// Admin + Owner
// =========================

router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getAllNails
);


// =========================
// GET NAIL BY ID
// Admin + Owner
// =========================

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getNailById
);


// =========================
// UPDATE NAIL
// Admin Only
// =========================

router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  validationMiddleware(updateNailSchema),
  updateNail
);


// =========================
// DELETE NAIL
// Admin Only
// =========================

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteNail
);


module.exports = router;
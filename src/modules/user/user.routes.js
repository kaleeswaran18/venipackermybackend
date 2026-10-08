const express = require("express");

const router = express.Router();

const {
  getAllUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  deleteUser,
} = require("./user.controller");

const authMiddleware = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const validationMiddleware = require("../../middleware/validation.middleware");

const {
  updateUserSchema,
  updateStatusSchema,
} = require("./user.validation");


// =========================
// GET ALL USERS
// Admin + Owner
// =========================

router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getAllUsers
);


// =========================
// GET USER BY ID
// Admin + Owner
// =========================

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getUserById
);


// =========================
// UPDATE USER
// Admin Only
// =========================

router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  validationMiddleware(updateUserSchema),
  updateUser
);


// =========================
// UPDATE USER STATUS
// Admin Only
// =========================

router.patch(
  "/:id/status",
  authMiddleware,
  roleMiddleware("admin"),
  validationMiddleware(updateStatusSchema),
  updateUserStatus
);


// =========================
// DELETE USER
// Admin Only
// =========================

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteUser
);


module.exports = router;
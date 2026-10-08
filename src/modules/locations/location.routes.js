const express = require("express");

const router = express.Router();

const {
  createLocation,
  getAllLocations,
  getLocationById,
  updateLocation,
  deleteLocation,
} = require("./location.controller");

const authMiddleware = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const validationMiddleware = require("../../middleware/validation.middleware");

const {
  createLocationSchema,
  updateLocationSchema,
} = require("./location.validation");


// =========================
// CREATE LOCATION
// Admin Only
// =========================

router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  validationMiddleware(createLocationSchema),
  createLocation
);


// =========================
// GET ALL LOCATIONS
// Admin + Owner
// =========================

router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getAllLocations
);


// =========================
// GET LOCATION BY ID
// Admin + Owner
// =========================

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getLocationById
);


// =========================
// UPDATE LOCATION
// Admin Only
// =========================

router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  validationMiddleware(updateLocationSchema),
  updateLocation
);


// =========================
// DELETE LOCATION
// Admin Only
// =========================

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteLocation
);


module.exports = router;
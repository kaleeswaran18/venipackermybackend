const express = require("express");

const router = express.Router();

const {
  createFinishedMaterial,
  getAllFinishedMaterials,
  getFinishedMaterialById,
  updateFinishedMaterial,
  deleteFinishedMaterial,
} = require("./finishedMaterial.controller");

const authMiddleware = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const validationMiddleware = require("../../middleware/validation.middleware");

const {
  createFinishedMaterialSchema,
  updateFinishedMaterialSchema,
} = require("./finishedMaterial.validation");

// CREATE FINISHED MATERIAL
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  validationMiddleware(createFinishedMaterialSchema),
  createFinishedMaterial
);

// GET ALL FINISHED MATERIALS
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getAllFinishedMaterials
);

// GET FINISHED MATERIAL BY ID
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getFinishedMaterialById
);

// UPDATE FINISHED MATERIAL
router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  validationMiddleware(updateFinishedMaterialSchema),
  updateFinishedMaterial
);

// DELETE FINISHED MATERIAL
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteFinishedMaterial
);

module.exports = router;
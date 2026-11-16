const express = require("express");

const router = express.Router();

const {
  createDailyProgram,
  getAllDailyPrograms,
  getDailyProgramById,
  updateDailyProgram,
  deleteDailyProgram,
} = require("./dailyProgram.controller");

const authMiddleware = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const validationMiddleware = require("../../middleware/validation.middleware");

const {
  createDailyProgramSchema,
  updateDailyProgramSchema,
} = require("./dailyProgram.validation");

// =========================
// CREATE DAILY PROGRAM
// =========================

router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  validationMiddleware(createDailyProgramSchema),
  createDailyProgram
);

// =========================
// GET ALL DAILY PROGRAMS
// =========================

router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getAllDailyPrograms
);

// =========================
// GET DAILY PROGRAM BY ID
// =========================

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getDailyProgramById
);

// =========================
// UPDATE DAILY PROGRAM
// =========================

router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  validationMiddleware(updateDailyProgramSchema),
  updateDailyProgram
);

// =========================
// DELETE DAILY PROGRAM
// =========================

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteDailyProgram
);

module.exports = router;
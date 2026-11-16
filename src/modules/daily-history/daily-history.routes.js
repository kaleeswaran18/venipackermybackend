const express = require("express");
const router = express.Router();

const {
  createDailyHistory,
  getTodayDailyHistory,
  getDailyHistories,
  updateDailyHistory,
  deleteDailyHistory,
} = require("./daily-history.controller");

const authMiddleware = require("../../middleware/auth.middleware");
const roleMiddleware = require("../../middleware/role.middleware");
const validate = require("../../middleware/validation.middleware");

const {
  createDailyHistorySchema,
  updateDailyHistorySchema,
} = require("./daily-history.validation");


// --------------------------------
// DAILY HISTORY API
// --------------------------------

// Create
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  validate(createDailyHistorySchema),
  createDailyHistory
);

// Get Today
router.get(
  "/today",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getTodayDailyHistory
);

// Get All
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  getDailyHistories
);

// Update
router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  // validate(updateDailyHistorySchema),
  updateDailyHistory
);

// Delete
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "owner"),
  deleteDailyHistory
);

module.exports = router;
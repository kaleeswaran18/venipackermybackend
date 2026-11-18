
const express = require("express");
const router = express.Router();

const dailyLogController = require("./daily-log.controller");

// Create Daily Log
router.post("/", dailyLogController.createDailyLog);

// Get All Daily Logs
router.get("/", dailyLogController.getAllDailyLogs);

// Get Daily Log By ID
router.get("/:id", dailyLogController.getDailyLogById);

// Update Daily Log
router.patch("/:id", dailyLogController.updateDailyLog);

// Delete Daily Log
router.delete("/:id", dailyLogController.deleteDailyLog);

module.exports = router;

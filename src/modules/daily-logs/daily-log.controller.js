
const dailyLogService = require("./daily-log.service");

// Create
const createDailyLog = async (req, res, next) => {
  try {
    const data = await dailyLogService.createDailyLog(req.body);

    res.status(201).json({
      success: true,
      message: "Daily log created successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

// Get All
const getAllDailyLogs = async (req, res, next) => {
  try {
    const data = await dailyLogService.getAllDailyLogs(req.query);

    res.status(200).json({
      success: true,
      message: "Daily logs fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

// Get By ID
const getDailyLogById = async (req, res, next) => {
  try {
    const data = await dailyLogService.getDailyLogById(req.params.id);

    res.status(200).json({
      success: true,
      message: "Daily log fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

// Update
const updateDailyLog = async (req, res, next) => {
  try {
    const data = await dailyLogService.updateDailyLog(
      req.params.id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Daily log updated successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

// Delete
const deleteDailyLog = async (req, res, next) => {
  try {
    await dailyLogService.deleteDailyLog(req.params.id);

    res.status(200).json({
      success: true,
      message: "Daily log deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDailyLog,
  getAllDailyLogs,
  getDailyLogById,
  updateDailyLog,
  deleteDailyLog,
};

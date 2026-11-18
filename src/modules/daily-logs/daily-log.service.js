
const DailyLog = require("./daily-log.model");

// Create Daily Log
const createDailyLog = async (payload) => {
  const dailyLog = await DailyLog.create(payload);

  return await DailyLog.findById(dailyLog._id)
    .populate("location", "name");
};

// Get All Daily Logs
const getAllDailyLogs = async (filters = {}) => {
  const query = {};

  if (filters.type) {
    query.type = filters.type;
  }

  if (filters.location) {
    query.location = filters.location;
  }

  if (filters.date) {
    const startDate = new Date(filters.date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(filters.date);
    endDate.setHours(23, 59, 59, 999);

    query.date = {
      $gte: startDate,
      $lte: endDate,
    };
  }

  return await DailyLog.find(query)
    .populate("location", "name")
    .sort({ date: -1, createdAt: -1 });
};

// Get Daily Log By ID
const getDailyLogById = async (id) => {
  const dailyLog = await DailyLog.findById(id)
    .populate("location", "name");

  if (!dailyLog) {
    throw new Error("Daily log not found");
  }

  return dailyLog;
};

// Update Daily Log
const updateDailyLog = async (id, payload) => {
  const dailyLog = await DailyLog.findByIdAndUpdate(
    id,
    payload,
    {
      new: true,
      runValidators: true,
    }
  ).populate("location", "name");

  if (!dailyLog) {
    throw new Error("Daily log not found");
  }

  return dailyLog;
};

// Delete Daily Log
const deleteDailyLog = async (id) => {
  const dailyLog = await DailyLog.findByIdAndDelete(id);

  if (!dailyLog) {
    throw new Error("Daily log not found");
  }

  return dailyLog;
};

module.exports = {
  createDailyLog,
  getAllDailyLogs,
  getDailyLogById,
  updateDailyLog,
  deleteDailyLog,
};

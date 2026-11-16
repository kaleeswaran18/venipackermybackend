const UpdateHistory = require("./update-history.model");

const createUpdateHistory = async (data) => {
  return await UpdateHistory.create(data);
};

const getUpdateHistoriesByDailyHistory = async (dailyHistoryId) => {
  return await UpdateHistory.find({
    dailyHistoryId,
  })
    .populate("updatedBy", "name email")
    .populate("locationId", "name")
    .sort({ updatedAt: -1 });
};

const getUpdateHistoryById = async (id) => {
  const history = await UpdateHistory.findById(id)
    .populate("updatedBy", "name email")
    .populate("locationId", "name");

  if (!history) {
    const error = new Error("Update history not found");

    error.statusCode = 404;

    throw error;
  }

  return history;
};

module.exports = {
  createUpdateHistory,
  getUpdateHistoriesByDailyHistory,
  getUpdateHistoryById,
};
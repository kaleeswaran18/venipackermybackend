const dailyHistoryService = require("./daily-history.service");

// --------------------------------
// CREATE
// --------------------------------

const createDailyHistory = async (req, res, next) => {
  try {
    const dailyHistory =
      await dailyHistoryService.createDailyHistory();

    res.status(201).json({
      success: true,
      message: "Daily history created successfully",
      data: dailyHistory,
    });
  } catch (error) {
    next(error);
  }
};


// --------------------------------
// GET TODAY
// --------------------------------

const getTodayDailyHistory = async (req, res, next) => {
  try {
    const dailyHistory =
      await dailyHistoryService.getTodayDailyHistory();

    res.status(200).json({
      success: true,
      data: dailyHistory,
    });
  } catch (error) {
    next(error);
  }
};


// --------------------------------
// GET ALL
// --------------------------------

const getDailyHistories = async (req, res, next) => {
  try {
    const dailyHistories =
      await dailyHistoryService.getDailyHistories();

    res.status(200).json({
      success: true,
      data: dailyHistories,
    });
  } catch (error) {
    next(error);
  }
};


// --------------------------------
// UPDATE
// --------------------------------

const updateDailyHistory = async (req, res, next) => {
  try {
    const dailyHistory =
      await dailyHistoryService.updateDailyHistory(
        req.params.id,
        req.body,
        req.user.userId
      );

    res.status(200).json({
      success: true,
      message: "Daily activity updated successfully",
      data: dailyHistory,
    });
  } catch (error) {
    next(error);
  }
};


// --------------------------------
// DELETE
// --------------------------------

const deleteDailyHistory = async (req, res, next) => {
  try {
    const result =
      await dailyHistoryService.deleteDailyHistory(
        req.params.id
      );

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  createDailyHistory,
  getTodayDailyHistory,
  getDailyHistories,
  updateDailyHistory,
  deleteDailyHistory,
};
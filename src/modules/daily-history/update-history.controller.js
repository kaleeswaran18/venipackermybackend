const {
  createUpdateHistory,
  getUpdateHistoriesByDailyHistory,
  getUpdateHistoryById,
} = require("./update-history.service");

const createUpdateHistoryController = async (req, res, next) => {
  try {
    const history = await createUpdateHistory(req.body);

    res.status(201).json({
      success: true,
      message: "Update history created successfully",
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

const getUpdateHistoriesByDailyHistoryController = async (
  req,
  res,
  next
) => {
  try {
    const histories =
      await getUpdateHistoriesByDailyHistory(
        req.params.dailyHistoryId
      );

    res.status(200).json({
      success: true,
      data: histories,
    });
  } catch (error) {
    next(error);
  }
};

const getUpdateHistoryByIdController = async (
  req,
  res,
  next
) => {
  try {
    const history = await getUpdateHistoryById(
      req.params.id
    );

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createUpdateHistoryController,
  getUpdateHistoriesByDailyHistoryController,
  getUpdateHistoryByIdController,
};
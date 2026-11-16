const dailyProgramService = require("./dailyProgram.service");

// =========================
// CREATE DAILY PROGRAM
// =========================

const createDailyProgram = async (req, res, next) => {
  try {
    const dailyProgram =
      await dailyProgramService.createDailyProgram(
        req.body
      );

    res.status(201).json({
      success: true,
      message: "Daily program created successfully",
      data: dailyProgram,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// GET ALL DAILY PROGRAMS
// =========================

const getAllDailyPrograms = async (req, res, next) => {
  try {
    const dailyPrograms =
      await dailyProgramService.getAllDailyPrograms();

    res.status(200).json({
      success: true,
      message: "Daily programs fetched successfully",
      data: dailyPrograms,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// GET DAILY PROGRAM BY ID
// =========================

const getDailyProgramById = async (req, res, next) => {
  try {
    const dailyProgram =
      await dailyProgramService.getDailyProgramById(
        req.params.id
      );

    res.status(200).json({
      success: true,
      message: "Daily program fetched successfully",
      data: dailyProgram,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// UPDATE DAILY PROGRAM
// =========================

const updateDailyProgram = async (req, res, next) => {
  try {
    const dailyProgram =
      await dailyProgramService.updateDailyProgram(
        req.params.id,
        req.body
      );

    res.status(200).json({
      success: true,
      message: "Daily program updated successfully",
      data: dailyProgram,
    });
  } catch (error) {
    next(error);
  }
};

// =========================
// DELETE DAILY PROGRAM
// =========================

const deleteDailyProgram = async (req, res, next) => {
  try {
    const result =
      await dailyProgramService.deleteDailyProgram(
        req.params.id
      );

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        id: result.id,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDailyProgram,
  getAllDailyPrograms,
  getDailyProgramById,
  updateDailyProgram,
  deleteDailyProgram,
};
const DailyProgram = require("./dailyProgram.model");

// =========================
// GENERATE PROGRAM NUMBER
// =========================

const generateProgramNo = async () => {
  const lastProgram = await DailyProgram.findOne()
    .sort({ createdAt: -1 })
    .select("programNo");

  if (!lastProgram) {
    return "DP001";
  }

  const lastCode = lastProgram.programNo;

  const number = parseInt(
    lastCode.replace("DP", ""),
    10
  );

  const nextNumber = number + 1;

  return `DP${String(nextNumber).padStart(3, "0")}`;
};

// =========================
// CREATE DAILY PROGRAM
// =========================

const createDailyProgram = async (data) => {
  const {
    date,
    time,
    customerName,
    contactPerson,
    location,
    purpose,
    status,
    remarks,
  } = data;

  const programNo = await generateProgramNo();

  const dailyProgram = await DailyProgram.create({
    programNo,
    date,
    time,
    customerName,
    contactPerson,
    location,
    purpose,
    status,
    remarks,
  });

  return dailyProgram;
};

// =========================
// GET ALL DAILY PROGRAMS
// =========================

const getAllDailyPrograms = async () => {
  return await DailyProgram.find().sort({
    date: -1,
    time: 1,
    createdAt: -1,
  });
};

// =========================
// GET DAILY PROGRAM BY ID
// =========================

const getDailyProgramById = async (programId) => {
  const dailyProgram =
    await DailyProgram.findById(programId);

  if (!dailyProgram) {
    throw new Error("Daily program not found");
  }

  return dailyProgram;
};

// =========================
// UPDATE DAILY PROGRAM
// =========================

const updateDailyProgram = async (
  programId,
  data
) => {
  const dailyProgram =
    await DailyProgram.findById(programId);

  if (!dailyProgram) {
    throw new Error("Daily program not found");
  }

  if (data.date !== undefined) {
    dailyProgram.date = data.date;
  }

  if (data.time !== undefined) {
    dailyProgram.time = data.time;
  }

  if (data.customerName !== undefined) {
    dailyProgram.customerName =
      data.customerName;
  }

  if (data.contactPerson !== undefined) {
    dailyProgram.contactPerson =
      data.contactPerson;
  }

  if (data.location !== undefined) {
    dailyProgram.location =
      data.location;
  }

  if (data.purpose !== undefined) {
    dailyProgram.purpose =
      data.purpose;
  }

  if (data.status !== undefined) {
    dailyProgram.status =
      data.status;
  }

  if (data.remarks !== undefined) {
    dailyProgram.remarks =
      data.remarks;
  }

  await dailyProgram.save();

  return dailyProgram;
};

// =========================
// DELETE DAILY PROGRAM
// =========================

const deleteDailyProgram = async (
  programId
) => {
  const dailyProgram =
    await DailyProgram.findById(programId);

  if (!dailyProgram) {
    throw new Error("Daily program not found");
  }

  await DailyProgram.findByIdAndDelete(
    programId
  );

  return {
    id: dailyProgram._id,
    message: "Daily program deleted successfully",
  };
};

module.exports = {
  createDailyProgram,
  getAllDailyPrograms,
  getDailyProgramById,
  updateDailyProgram,
  deleteDailyProgram,
};
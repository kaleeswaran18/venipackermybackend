
const mongoose = require("mongoose");
const EmployeeAttendance = require("./employee-attendance.model");
const Employee = require("../employee/employee.model");
const Location = require("../locations/location.model");
const FinanceCategory = require("../finance-category/finance-category.model");

const FinanceTransaction = require(
  "../finance-transaction/finance-transaction.model"
);

const {
  createTransaction,
  updateTransaction,
} = require("../finance-transaction/finance-transaction.service");

const {
  processEmployeeWeeklySalary,
} = require("../weekly-salary/weekly-salary.service");

// =========================
// GET WEEK START / END
// Sunday → Saturday
// =========================

const getWeekRange = (date) => {
  const currentDate = new Date(date);

  const day = currentDate.getDay();

  const weekStartDate = new Date(currentDate);
  weekStartDate.setDate(
    currentDate.getDate() - day
  );
  weekStartDate.setHours(0, 0, 0, 0);

  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(
    weekStartDate.getDate() + 6
  );
  weekEndDate.setHours(23, 59, 59, 999);

  return {
    weekStartDate,
    weekEndDate,
  };
};

// =========================
// CHECK WHETHER DATE IS WEEK END
// Sunday → Saturday
// =========================

const isWeekEndDate = (date, weekEndDate) => {
  const attendanceDate = new Date(date);
  const endDate = new Date(weekEndDate);

  return (
    attendanceDate.getFullYear() ===
      endDate.getFullYear() &&
    attendanceDate.getMonth() ===
      endDate.getMonth() &&
    attendanceDate.getDate() ===
      endDate.getDate()
  );
};

// =========================
// CREATE / ADD ATTENDANCE
// =========================

const createEmployeeAttendance = async (data, userId) => {
  const session = await mongoose.startSession();
  let result;

  try {
    await session.withTransaction(async () => {

    const {
      date,
      locations,
    } = data;

    if (!date) {
      throw new Error("Attendance date is required");
    }

    if (!locations || !Array.isArray(locations)) {
      throw new Error("Locations are required");
    }

    const {
      weekStartDate,
      weekEndDate,
    } = getWeekRange(date);

    // Find existing weekly attendance
    let attendance =
      await EmployeeAttendance.findOne({
        weekStartDate,
        weekEndDate,
      }).session(session);

    // If weekly document doesn't exist, create it
    if (!attendance) {
      attendance =
        (await EmployeeAttendance.create(
          [{
            weekStartDate,
            weekEndDate,
            locations: [],
          }],
          { session }
        ))[0];
    }

    // Employees whose Saturday attendance is completed
    const salaryProcessingEmployees = [];

    // =========================
    // PROCESS LOCATIONS
    // =========================

    for (const locationData of locations) {
      const {
        locationId,
        employees,
      } = locationData;

      // Check location
      const location =
        await Location.findById(locationId).session(session);

      if (!location) {
        throw new Error(
          "Location not found"
        );
      }

      if (
        !employees ||
        !Array.isArray(employees)
      ) {
        continue;
      }

      // Find location inside weekly document
      let locationEntry =
        attendance.locations.find(
          (item) =>
            item.locationId.toString() ===
            locationId.toString()
        );

      // Create location if not exists
      if (!locationEntry) {
        attendance.locations.push({
          locationId,
          employees: [],
        });

        locationEntry =
          attendance.locations[
            attendance.locations.length - 1
          ];
      }

      // =========================
      // PROCESS EMPLOYEES
      // =========================

      for (const employeeData of employees) {
        const {
          employeeId,
          name,
          day,
        } = employeeData;

        // Check employee
        const employee =
          await Employee.findById(employeeId).session(session);

        if (!employee) {
          throw new Error(
            `Employee not found: ${employeeId}`
          );
        }

        // Find employee inside location
        let employeeEntry =
          locationEntry.employees.find(
            (item) =>
              item.employeeId.toString() ===
              employeeId.toString()
          );

        // Create employee if not exists
        if (!employeeEntry) {
          locationEntry.employees.push({
            employeeId,
            name:
              name || employee.name,
            days: [],
          });

          employeeEntry =
            locationEntry.employees[
              locationEntry.employees.length - 1
            ];
        }

        // =========================
        // CHECK DUPLICATE DAY
        // =========================

        const existingDay =
          employeeEntry.days.find(
            (item) =>
              new Date(item.date)
                .toDateString() ===
              new Date(day.date)
                .toDateString()
          );

        if (existingDay) {
          throw new Error(
            `Attendance already exists for ${employee.name} on this date`
          );
        }

        // =========================
        // ADD DAILY ATTENDANCE
        // =========================

        employeeEntry.days.push({
          date: day.date,

          status: day.status,

          workCategory:
            day.workCategory || null,

          permanentLocationId:
            day.permanentLocationId ||
            employee.permanentLocationId,

          workLocationId:
            day.workLocationId ||
            locationId,

          temporaryRelocation:
            day.temporaryRelocation || false,

          toLocationId:
            day.toLocationId || null,

          punchIn:
            day.punchIn || null,

          punchOut:
            day.punchOut || null,

          workingHours:
            day.workingHours || 0,

          otApplicable:
            day.otApplicable || false,

          otHours:
            day.otHours || 0,

          advance: {
            amount:
              day.advance?.amount || 0,

            remark:
              day.advance?.remark || null,
          },

          remark:
            day.remark || null,
        });

        // =========================
        // GET CREATED DAY
        // =========================

        const createdDay =
          employeeEntry.days[
            employeeEntry.days.length - 1
          ];

        // =========================
        // QUEUE WEEKLY SALARY
        // SATURDAY LEAVE OR PUNCH OUT
        // =========================

        if (
          isWeekEndDate(
            createdDay.date,
            attendance.weekEndDate
          ) &&
          (
            createdDay.status === "Leave" ||
            (
              createdDay.status !== "Leave" &&
              Boolean(createdDay.punchOut)
            )
          )
        ) {
          salaryProcessingEmployees.push({
            employeeId: employee._id,
            weekStartDate: attendance.weekStartDate,
            weekEndDate: attendance.weekEndDate,
          });
        }

        // =========================
        // CREATE FINANCE TRANSACTION
        // EXISTING LOGIC
        // =========================

        if (Number(createdDay.advance.amount) > 0) {
          const advanceCategory = await FinanceCategory.findOne({
            name: "employeeadvancesalary",
            type: "expense",
          }).session(session);

          if (!advanceCategory) {
            throw new Error(
              "Employee advance salary expense category not found"
            );
          }

          const transaction = await createTransaction(
            {
              entryMode: "automatic",
              type: "expense",
              categoryId: advanceCategory._id,
              locationId: createdDay.workLocationId,
              amount: Number(createdDay.advance.amount),
              transactionDate: createdDay.date,
              paymentMethod: "cash",
              description: `Employee Advance - ${employee.name}`,
              sourceModule: "employeeadvancesalary",
              sourceId: createdDay.advance.sourceId,
              sourceType: "daily-advance",
            },
            userId,
            {
              sourceModule: "employeeadvancesalary",
              session,
            }
          );

          createdDay.advance.transactionId = transaction._id;
        }
      }
    }

    // Save attendance first
    await attendance.save({ session });

    // =========================
    // PROCESS WEEKLY SALARY
    // AFTER ATTENDANCE SAVE
    // =========================

    for (const salaryData of salaryProcessingEmployees) {
      await processEmployeeWeeklySalary({ ...salaryData, session });
    }

    result = attendance;
    });

    return result;
  } finally {
    await session.endSession();
  }
};
// =========================
// GET ALL ATTENDANCE
// =========================

const getAllEmployeeAttendance = async () => {
  const attendance =
    await EmployeeAttendance.find()
      .populate(
        "locations.locationId",
        "_id name"
      )
      .populate(
        "locations.employees.employeeId",
        "_id employeeCode name phone"
      )
      .populate(
        "locations.employees.days.permanentLocationId",
        "_id name"
      )
      .populate(
        "locations.employees.days.workLocationId",
        "_id name"
      )
      .populate(
        "locations.employees.days.toLocationId",
        "_id name"
      )
      .sort({
        weekStartDate: -1,
      });

  return attendance;
};

// =========================
// GET ATTENDANCE BY ID
// =========================

const getEmployeeAttendanceById = async (
  attendanceId
) => {
  const attendance =
    await EmployeeAttendance.findById(
      attendanceId
    )
      .populate(
        "locations.locationId",
        "_id name"
      )
      .populate(
        "locations.employees.employeeId",
        "_id employeeCode name phone"
      )
      .populate(
        "locations.employees.days.permanentLocationId",
        "_id name"
      )
      .populate(
        "locations.employees.days.workLocationId",
        "_id name"
      )
      .populate(
        "locations.employees.days.toLocationId",
        "_id name"
      );

  if (!attendance) {
    throw new Error(
      "Employee attendance not found"
    );
  }

  return attendance;
};

// =========================
// UPDATE ATTENDANCE
// =========================

const updateEmployeeAttendance = async (
  attendanceId,
  data,
  userId
) => {
  const session = await mongoose.startSession();
  let result;

  try {
    await session.withTransaction(async () => {


    const attendance =
      await EmployeeAttendance.findById(
        attendanceId
      ).session(session);

    if (!attendance) {
      throw new Error(
        "Employee attendance not found"
      );
    }

    /*
     * Update is expected in this format:
     *
     * {
     *   locationId,
     *   employeeId,
     *   date,
     *   day: {
     *     punchOut,
     *     workingHours,
     *     otApplicable,
     *     otHours,
     *     advance,
     *     remark
     *   }
     * }
     */

    const {
      locationId,
      employeeId,
      date,
      day,
    } = data;

    const locationEntry =
      attendance.locations.find(
        (item) =>
          item.locationId.toString() ===
          locationId.toString()
      );

    if (!locationEntry) {
      throw new Error(
        "Location attendance not found"
      );
    }

    const employeeEntry =
      locationEntry.employees.find(
        (item) =>
          item.employeeId.toString() ===
          employeeId.toString()
      );

    if (!employeeEntry) {
      throw new Error(
        "Employee attendance not found"
      );
    }

    const dailyAttendance =
      employeeEntry.days.find(
        (item) =>
          new Date(item.date)
            .toDateString() ===
          new Date(date)
            .toDateString()
      );

    if (!dailyAttendance) {
      throw new Error(
        "Daily attendance not found"
      );
    }

    // =========================
    // UPDATE DAILY DATA
    // =========================

    if (day.status !== undefined) {
      dailyAttendance.status =
        day.status;
    }

    if (day.workCategory !== undefined) {
      dailyAttendance.workCategory =
        day.workCategory;
    }

    if (day.workLocationId !== undefined) {
      const location =
        await Location.findById(
          day.workLocationId
        );

      if (!location) {
        throw new Error(
          "Work location not found"
        );
      }

      dailyAttendance.workLocationId =
        day.workLocationId;
    }

    if (
      day.temporaryRelocation !==
      undefined
    ) {
      dailyAttendance.temporaryRelocation =
        day.temporaryRelocation;

      if (
        day.temporaryRelocation &&
        day.toLocationId
      ) {
        const location =
          await Location.findById(
            day.toLocationId
          ).session(session);

        if (!location) {
          throw new Error(
            "Temporary relocation location not found"
          );
        }

        dailyAttendance.toLocationId =
          day.toLocationId;
      }

      if (!day.temporaryRelocation) {
        dailyAttendance.toLocationId =
          null;
      }
    }

    // Punch In
    if (day.punchIn !== undefined) {
      dailyAttendance.punchIn =
        day.punchIn;
    }

    // Punch Out
    if (day.punchOut !== undefined) {
      dailyAttendance.punchOut =
        day.punchOut;
    }

    // Working Hours
    if (day.workingHours !== undefined) {
      dailyAttendance.workingHours =
        day.workingHours;
    }

    // OT
    if (day.otApplicable !== undefined) {
      dailyAttendance.otApplicable =
        day.otApplicable;
    }

    if (day.otHours !== undefined) {
      dailyAttendance.otHours =
        day.otHours;
    }

    // =========================
    // ADVANCE UPDATE
    // =========================

    if (day.advance !== undefined) {
      const oldAdvanceAmount = Number(
        dailyAttendance.advance?.amount || 0
      );

      const newAdvanceAmount =
        day.advance.amount !== undefined
          ? Number(day.advance.amount || 0)
          : oldAdvanceAmount;

      const advanceSourceId =
        dailyAttendance.advance.sourceId;

      // =========================
      // 0 -> Greater than 0
      // CREATE TRANSACTION
      // =========================

      if (oldAdvanceAmount <= 0 && newAdvanceAmount > 0) {
        const advanceCategory = await FinanceCategory.findOne({
          name: "employeeadvancesalary",
          type: "expense",
        }).session(session);

        if (!advanceCategory) {
          throw new Error(
            "Employee advance salary expense category not found"
          );
        }

        const transaction = await createTransaction(
          {
            entryMode: "automatic",
            type: "expense",
            categoryId: advanceCategory._id,
            locationId: dailyAttendance.workLocationId,
            amount: newAdvanceAmount,
            transactionDate: new Date(),
            paymentMethod: "cash",
            description: `Employee Advance - ${employeeEntry.name}`,
            sourceModule: "employeeadvancesalary",
            sourceId: advanceSourceId,
            sourceType: "daily-advance",
          },
          userId,
          {
            sourceModule: "employeeadvancesalary",
            session,
          }
        );

        dailyAttendance.advance.transactionId = transaction._id;
      }

      // =========================
      // Greater than 0 -> Greater than 0
      // UPDATE TRANSACTION
      // =========================

      if (oldAdvanceAmount > 0 && newAdvanceAmount > 0) {
        const advanceCategory = await FinanceCategory.findOne({
          name: "employeeadvancesalary",
          type: "expense",
        }).session(session);

        if (!advanceCategory) {
          throw new Error(
            "Employee advance salary expense category not found"
          );
        }

        // Find existing transaction using transactionId first.
        // Attendance sourceId may differ from FinanceTransaction sourceId.

        let existingTransaction = null;

        if (dailyAttendance.advance?.transactionId) {
          existingTransaction = await FinanceTransaction.findOne({
            _id: dailyAttendance.advance.transactionId,
            sourceModule: "employeeadvancesalary",
            isDeleted: false,
          }).session(session);
        }

        // Fallback for older records without transactionId.

        if (!existingTransaction && advanceSourceId) {
          existingTransaction = await FinanceTransaction.findOne({
            sourceModule: "employeeadvancesalary",
            sourceId: advanceSourceId,
            sourcePaymentId: null,
            sourceType: "daily-advance",
            isDeleted: false,
          }).session(session);
        }

        if (!existingTransaction) {
          throw new Error(
            "Existing employee advance finance transaction not found"
          );
        }

        // Use actual FinanceTransaction sourceId for update.

        const transaction = await updateTransaction(
          {
            sourceId: existingTransaction.sourceId,
            sourcePaymentId: existingTransaction.sourcePaymentId || null,
            sourceType: existingTransaction.sourceType,
          },
          {
            type: "expense",
            categoryId: advanceCategory._id,
            locationId: dailyAttendance.workLocationId,
            amount: newAdvanceAmount,
            transactionDate: new Date(),
            paymentMethod: "cash",
            description: `Employee Advance - ${employeeEntry.name}`,
          },
          userId,
          {
            sourceModule: "employeeadvancesalary",
            session,
          }
        );

        dailyAttendance.advance.transactionId = transaction._id;
      }

      // =========================
      // UPDATE ADVANCE AMOUNT
      // =========================

      // New amount is 0:
      // Keep existing Finance Transaction unchanged.

      dailyAttendance.advance.amount = newAdvanceAmount;

      if (day.advance.remark !== undefined) {
        dailyAttendance.advance.remark =
          day.advance.remark || null;
      }
    }

    // Remark
    if (day.remark !== undefined) {
      dailyAttendance.remark =
        day.remark;
    }

    // Save attendance first
    await attendance.save({ session });

    // =========================
    // WEEKLY SALARY TRIGGER
    // SATURDAY LEAVE OR PUNCH OUT
    // =========================

    if (
      isWeekEndDate(
        dailyAttendance.date,
        attendance.weekEndDate
      ) &&
      (
        dailyAttendance.status === "Leave" ||
        (
          dailyAttendance.status !== "Leave" &&
          Boolean(dailyAttendance.punchOut)
        )
      )
    ) {
      await processEmployeeWeeklySalary({
        employeeId,
        weekStartDate: attendance.weekStartDate,
        weekEndDate: attendance.weekEndDate,
        session,
      });
    }

    result = attendance;
    });

    return result;
  } finally {
    await session.endSession();
  }
};
// =========================
// DELETE WEEKLY ATTENDANCE
// =========================

const deleteEmployeeAttendance = async (
  attendanceId
) => {
  const attendance =
    await EmployeeAttendance.findById(
      attendanceId
    );

  if (!attendance) {
    throw new Error(
      "Employee attendance not found"
    );
  }

  await EmployeeAttendance.findByIdAndDelete(
    attendanceId
  );

  return {
    id: attendance._id,
    message:
      "Employee weekly attendance deleted successfully",
  };
};

// ========================================
// GET TODAY LOCATION-WISE ATTENDANCE SUMMARY
// ========================================

const getTodayLocationAttendanceSummary = async (date = new Date()) => {
  const {
    weekStartDate,
    weekEndDate,
  } = getWeekRange(date);

  // Get all locations dynamically
  const locations = await Location.find()
    .select("_id name")
    .lean();

  // Initialize every location with zero count
  const locationMap = new Map();

  locations.forEach((location) => {
    locationMap.set(location._id.toString(), {
      locationId: location._id,
      locationName: location.name,
      attendanceCount: 0,
      employeeIds: new Set(),
    });
  });

  // Find current week's attendance document
  const attendance = await EmployeeAttendance.findOne({
    weekStartDate,
    weekEndDate,
  }).lean();

  if (!attendance) {
    return {
      date,
      locations: Array.from(locationMap.values()).map(
        ({ employeeIds, ...location }) => location
      ),
    };
  }

  // Scan all employee attendance records
  for (const locationEntry of attendance.locations || []) {
    for (const employeeEntry of locationEntry.employees || []) {
      const todayRecord = (employeeEntry.days || []).find(
        (day) =>
          new Date(day.date).toDateString() ===
          new Date(date).toDateString()
      );

      if (!todayRecord) continue;

      // Count only employees who are present/working
      const presentStatuses = [
        "Working",
        "Half Day",
        "Permission",
      ];

      if (!presentStatuses.includes(todayRecord.status)) {
        continue;
      }

      // Actual working location — not permanent location
      const workLocationId =
        todayRecord.workLocationId?.toString();

      if (!workLocationId) continue;

      const targetLocation = locationMap.get(workLocationId);

      if (!targetLocation) continue;

      // Prevent duplicate employee counting
      const employeeId =
        employeeEntry.employeeId.toString();

      targetLocation.employeeIds.add(employeeId);
    }
  }

  // Convert Set size into attendance count
  const result = Array.from(locationMap.values()).map(
    ({ employeeIds, ...location }) => ({
      ...location,
      attendanceCount: employeeIds.size,
    })
  );

  return {
    date,
    locations: result,
  };
};


module.exports = {
  createEmployeeAttendance,
  getAllEmployeeAttendance,
  getEmployeeAttendanceById,
  updateEmployeeAttendance,
  deleteEmployeeAttendance,
  getTodayLocationAttendanceSummary,
};

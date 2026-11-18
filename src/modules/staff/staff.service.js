
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Staff = require("./staff.model");
const User = require("../auth/auth.model");
const FinanceCategory = require("../finance-category/finance-category.model");

const FinanceTransaction = require(
  "../finance-transaction/finance-transaction.model"
);

const {
  createTransaction,
  updateTransaction,
} = require("../finance-transaction/finance-transaction.service");
const loginRoles = [
  "systemadmin",
  "owner",
  "business_executive",
  "supervisor",
];

// ==========================================
// MONGODB TRANSACTION HELPER
// ==========================================

const withTransaction = async (callback) => {
  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      result = await callback(session);
    });

    return result;
  } finally {
    await session.endSession();
  }
};

// ==========================================
// DATE HELPERS
// ==========================================

// Convert date to YYYY-MM-DD using UTC
const getDateKey = (date) => {
  const value = new Date(date);

  return [
    value.getUTCFullYear(),
    String(value.getUTCMonth() + 1).padStart(2, "0"),
    String(value.getUTCDate()).padStart(2, "0"),
  ].join("-");
};

// Validate and parse YYYY-MM-DD
const parseDateKey = (value) => {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    throw new Error("Invalid attendance date. Use YYYY-MM-DD");
  }

  const [year, month, day] = value.split("-").map(Number);

  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    throw new Error("Invalid attendance date");
  }

  return date;
};

// Get today's date based on India timezone
const getTodayKey = () => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
};

// ==========================================
// CREATE EMPTY DAILY ATTENDANCE
// ==========================================

const createEmptyDailyAttendance = (date) => ({
  date,
  punchIn: null,
  punchOut: null,
  workingHours: 0,
  dayInWork: null,

  otType: null,
  otDays: 0,
  otHours: 0,
  otStartTime: null,
  otEndTime: null,

  advances: [],
});

// ==========================================
// CREATE MONTHLY ATTENDANCE RECORD
// ==========================================

const createMonthlyAttendanceRecord = (month, year) => {
  const daysInMonth = new Date(
    Date.UTC(year, month, 0)
  ).getUTCDate();

  const attendance = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(
      Date.UTC(year, month - 1, day)
    );

    attendance.push(
      createEmptyDailyAttendance(date)
    );
  }

  return {
    month,
    year,
    attendance,
  };
};

// ==========================================
// ENSURE MONTHLY ATTENDANCE EXISTS
// ==========================================

const ensureMonthlyAttendance = (staff, month, year) => {
  let monthlyRecord = staff.monthlyRecords.find(
    (record) =>
      Number(record.month) === month &&
      Number(record.year) === year
  );

  let monthlyRecordCreated = false;

  // Create complete month if it does not exist
  if (!monthlyRecord) {
    staff.monthlyRecords.push(
      createMonthlyAttendanceRecord(month, year)
    );

    monthlyRecord = staff.monthlyRecords.find(
      (record) =>
        Number(record.month) === month &&
        Number(record.year) === year
    );

    monthlyRecordCreated = true;
  } else {
    // Existing month: add only missing dates
    const existingDates = new Set(
      monthlyRecord.attendance.map((item) =>
        getDateKey(item.date)
      )
    );

    const daysInMonth = new Date(
      Date.UTC(year, month, 0)
    ).getUTCDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        Date.UTC(year, month - 1, day)
      );

      const dateKey = getDateKey(date);

      if (!existingDates.has(dateKey)) {
        monthlyRecord.attendance.push(
          createEmptyDailyAttendance(date)
        );
      }
    }

    // Sort dates
    monthlyRecord.attendance.sort(
      (a, b) =>
        new Date(a.date).getTime() -
        new Date(b.date).getTime()
    );
  }

  return {
    monthlyRecord,
    monthlyRecordCreated,
  };
};

// ==========================================
// CREATE STAFF
// ==========================================

const createStaff = async (data) => withTransaction(async (session) => {
  const {
    staffName,
    phoneNumber,
    monthlySalary,
    address,
    staffType,
    email,
    password,
  } = data;

  const normalizedStaffType = staffType.toLowerCase();

  const shouldCreateUser =
    loginRoles.includes(normalizedStaffType);

  // Check duplicate phone number
  const existingStaff = await Staff.findOne({
    phoneNumber,
  }).session(session);

  if (existingStaff) {
    throw new Error("Phone number already exists");
  }

  // Login roles require email and password
  if (shouldCreateUser) {
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    }).session(session);

    if (existingUser) {
      throw new Error("Email already exists");
    }
  }

  // Create Staff
  const staff = new Staff({
    staffName,
    phoneNumber,
    monthlySalary,
    address,
    staffType: normalizedStaffType,
    loginAccess: shouldCreateUser,
    email: shouldCreateUser
      ? email.toLowerCase()
      : undefined,
    userId: null,
  });

  await staff.save({ session });

  // Create User only for login roles
  if (shouldCreateUser) {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name: staffName,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: normalizedStaffType,
      staffId: staff._id,
    });

    await user.save({ session });

    // Link User with Staff
    staff.userId = user._id;

    await staff.save({ session });
  }

  return staff;
});

// ==========================================
// GET ALL STAFF
// ==========================================

const getAllStaff = async (query = {}) => {
  const filter = {};

  if (query.status) {
    filter.status = query.status;
  }

  if (query.staffType) {
    filter.staffType = query.staffType.toLowerCase();
  }

  const staffList = await Staff.find(filter)
    .populate("userId", "name email role isActive")
    .sort({ createdAt: -1 });

  return staffList;
};

// ==========================================
// GET STAFF BY ID
// ==========================================

const getStaffById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid Staff ID");
  }

  const staff = await Staff.findById(id).populate(
    "userId",
    "name email role isActive"
  );

  if (!staff) {
    throw new Error("Staff not found");
  }

  return staff;
};

// ==========================================
// UPDATE STAFF
// ==========================================

const updateStaff = async (id, data) => withTransaction(async (session) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid Staff ID");
  }

  const staff = await Staff.findById(id).session(session);

  if (!staff) {
    throw new Error("Staff not found");
  }

  // Check duplicate phone number
  if (
    data.phoneNumber &&
    data.phoneNumber !== staff.phoneNumber
  ) {
    const existingStaff = await Staff.findOne({
      phoneNumber: data.phoneNumber,
      _id: { $ne: id },
    }).session(session);

    if (existingStaff) {
      throw new Error("Phone number already exists");
    }
  }

  const allowedFields = [
    "staffName",
    "phoneNumber",
    "monthlySalary",
    "address",
    "staffType",
    "status",
  ];

  allowedFields.forEach((field) => {
    if (data[field] !== undefined) {
      staff[field] =
        field === "staffType"
          ? data[field].toLowerCase()
          : data[field];
    }
  });

  // Update linked User name
  if (staff.userId && data.staffName) {
    await User.findByIdAndUpdate(
      staff.userId,
      { name: data.staffName },
      { session }
    );
  }

  await staff.save({ session });

  return staff;
});

// ==========================================
// DELETE STAFF (SOFT DELETE)
// ==========================================

const deleteStaff = async (id) => withTransaction(async (session) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid Staff ID");
  }

  const staff = await Staff.findById(id).session(session);

  if (!staff) {
    throw new Error("Staff not found");
  }

  // Deactivate linked User
  if (staff.userId) {
    await User.findByIdAndUpdate(
      staff.userId,
      { isActive: false },
      { session }
    );
  }

  staff.status = "Inactive";

  await staff.save({ session });

  return staff;
});

// ==========================================
// GENERATE MONTHLY ATTENDANCE
// ==========================================


const generateMonthlyAttendance = async (month, year) => withTransaction(async (session) => {
  if (
    !Number.isInteger(Number(month)) ||
    !Number.isInteger(Number(year)) ||
    Number(month) < 1 ||
    Number(month) > 12 ||
    Number(year) < 1900
  ) {
    throw new Error("Invalid month or year");
  }

  const monthNumber = Number(month);
  const yearNumber = Number(year);

  const activeStaff = await Staff.find({
    status: "Active",
  }).session(session);

  let createdCount = 0;
  let skippedCount = 0;
  let updatedCount = 0;

  const createdRecords = [];

  for (const staff of activeStaff) {
    const {
      monthlyRecordCreated,
      monthlyRecord,
    } = ensureMonthlyAttendance(
      staff,
      monthNumber,
      yearNumber
    );

    // Initialize Salary Payment Fields
    if (!monthlyRecord.paymentStatus) {
      monthlyRecord.paymentStatus = "Unpaid";
    }

    if (monthlyRecord.paidAt === undefined) {
      monthlyRecord.paidAt = null;
    }

    if (monthlyRecordCreated) {
      createdCount++;
      createdRecords.push(staff._id);
    } else {
      skippedCount++;
      updatedCount++;
    }

    await staff.save({ session });
  }

  return {
    month: monthNumber,
    year: yearNumber,
    totalStaff: activeStaff.length,
    createdCount,
    skippedCount,
    updatedCount,
    totalDays: monthlyRecord?.attendance.length || 0,
    createdRecords,
  };
});
// ==========================================
// UPDATE MONTHLY SALARY PAYMENT
// ==========================================
const existingPaymentHistoryAction = (
  previousPaymentStatus,
  previousPaidAmount
) => {
  if (
    previousPaymentStatus === "Paid" ||
    previousPaidAmount > 0
  ) {
    return "UPDATED";
  }

  return "CREATED";
};
const updateMonthlyPayment = async (staffId, data, userId) => withTransaction(async (session) => {
  if (!mongoose.Types.ObjectId.isValid(staffId)) {
    throw new Error("Invalid Staff ID");
  }

  const month = Number(data.month);
  const year = Number(data.year);

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("Invalid month");
  }

  if (!Number.isInteger(year) || year < 1900) {
    throw new Error("Invalid year");
  }

  // Validate Payment Status
  if (
    data.paymentStatus !== undefined &&
    !["Paid", "Unpaid"].includes(data.paymentStatus)
  ) {
    throw new Error("Invalid payment status");
  }

  // Validate Paid Amount
  if (data.paidAmount !== undefined) {
    const amount = Number(data.paidAmount);

    if (!Number.isFinite(amount) || amount < 0) {
      throw new Error("Invalid paid amount");
    }
  }

  // Validate Paid At
  let paidAt = data.paidAt;

  if (paidAt !== undefined && paidAt !== null && paidAt !== "") {
    paidAt = new Date(paidAt);

    if (Number.isNaN(paidAt.getTime())) {
      throw new Error("Invalid payment date");
    }
  } else if (paidAt === "" || paidAt === null) {
    paidAt = null;
  }

  const staff = await Staff.findById(staffId).session(session);

  if (!staff) {
    throw new Error("Staff not found");
  }

  // Find selected month record
  let monthlyRecord = staff.monthlyRecords.find(
    (record) =>
      Number(record.month) === month &&
      Number(record.year) === year
  );

  // Create monthly record if not exists
  if (!monthlyRecord) {
    const result = ensureMonthlyAttendance(
      staff,
      month,
      year
    );

    monthlyRecord = result.monthlyRecord;
  }

  // Store previous payment details for history
  const previousPaymentStatus = monthlyRecord.paymentStatus;
  const previousPaidAmount = monthlyRecord.paidAmount;
  const previousPaidAt = monthlyRecord.paidAt;

  // Update only provided payment fields
  if (data.paymentStatus !== undefined) {
    monthlyRecord.paymentStatus = data.paymentStatus;
  }

  if (data.paidAmount !== undefined) {
    monthlyRecord.paidAmount = Number(data.paidAmount);
  }

  if (data.paidAt !== undefined) {
    monthlyRecord.paidAt = paidAt;
  }

  // =====================================
  // FINANCE TRANSACTION INTEGRATION
  // =====================================

  let financeTransactionId =
    monthlyRecord.financeTransactionId || null;

  if (
    monthlyRecord.paymentStatus === "Paid" &&
    monthlyRecord.paidAmount > 0
  ) {
    // Find Staff Salary Expense Category
    const staffSalaryCategory = await FinanceCategory.findOne({
      name: "staffsalary",
      type: "expense",
    }).session(session);

    if (!staffSalaryCategory) {
      throw new Error(
        "Staff Salary expense category not found."
      );
    }

    const SOURCE_MODULE = "staffsalary";

    // Unique source type for each staff month
    const SOURCE_TYPE = `monthly_salary_${year}_${month}`;

    // Find existing Finance Transaction
    const existingTransaction =
      await FinanceTransaction.findOne({
        sourceModule: SOURCE_MODULE,
        sourceId: staff._id,
        sourceType: SOURCE_TYPE,
        isDeleted: false,
      }).session(session);

    const transactionDate =
      monthlyRecord.paidAt || new Date();

    const transactionData = {
      entryMode: "automatic",
      type: "expense",
      categoryId: staffSalaryCategory._id,
      amount: monthlyRecord.paidAmount,
      transactionDate,
      paymentMethod: data.paymentMethod || "cash",
      paymentReference: data.paymentReference || "",
      description: `${staff.staffName} - Salary - ${month}/${year}`,
      sourceModule: SOURCE_MODULE,
      sourceId: staff._id,
      sourceType: SOURCE_TYPE,
    };

    if (existingTransaction) {
      // UPDATE EXISTING FINANCE TRANSACTION
      await updateTransaction(
        {
          sourceModule: SOURCE_MODULE,
          sourceId: staff._id,
          sourceType: SOURCE_TYPE,
        },
        {
          categoryId: staffSalaryCategory._id,
          amount: monthlyRecord.paidAmount,
          transactionDate,
          paymentMethod: data.paymentMethod || "cash",
          paymentReference: data.paymentReference || "",
          description: `${staff.staffName} - Salary - ${month}/${year}`,
        },
        userId,
        {
          sourceModule: SOURCE_MODULE,
          session,
        }
      );

      financeTransactionId = existingTransaction._id;
    } else {
      // CREATE NEW FINANCE TRANSACTION
      await createTransaction(
        transactionData,
        userId,
        {
          sourceModule: SOURCE_MODULE,
          session,
        }
      );

      // Fetch created transaction ID
      const createdTransaction =
        await FinanceTransaction.findOne({
          sourceModule: SOURCE_MODULE,
          sourceId: staff._id,
          sourceType: SOURCE_TYPE,
          isDeleted: false,
        }).session(session);

      if (!createdTransaction) {
        throw new Error(
          "Staff salary finance transaction creation failed."
        );
      }

      financeTransactionId = createdTransaction._id;
    }

    // Save Finance Transaction Reference
    monthlyRecord.financeTransactionId =
      financeTransactionId;
  }

  // =====================================
  // PAYMENT HISTORY
  // =====================================

  monthlyRecord.paymentHistory.push({
    action: financeTransactionId ? (
      existingPaymentHistoryAction(
        previousPaymentStatus,
        previousPaidAmount
      )
    ) : "CREATED",

    previousPaymentStatus,
    previousPaidAmount,
    previousPaidAt,

    paymentStatus: monthlyRecord.paymentStatus,
    paidAmount: monthlyRecord.paidAmount,
    paidAt: monthlyRecord.paidAt,

    financeTransactionId,
    changedBy: userId || null,
    changedAt: new Date(),
  });

  await staff.save({ session });

  return {
    staffId: staff._id,
    staffName: staff.staffName,
    month: monthlyRecord.month,
    year: monthlyRecord.year,
    paymentStatus: monthlyRecord.paymentStatus,
    paidAmount: monthlyRecord.paidAmount,
    paidAt: monthlyRecord.paidAt,
    financeTransactionId: monthlyRecord.financeTransactionId,
    paymentHistory: monthlyRecord.paymentHistory,
  };
});

// ==========================================
// UPDATE DAILY ATTENDANCE
// ==========================================




const updateAttendance = async (staffId, data, userId) => withTransaction(async (session) => {
  console.log("SERVICE DATA:", data.advances);

  if (!mongoose.Types.ObjectId.isValid(staffId)) {
    throw new Error("Invalid Staff ID");
  }

  const staff = await Staff.findById(staffId).session(session);

  if (!staff) {
    throw new Error("Staff not found");
  }

  if (staff.status !== "Active") {
    throw new Error(
      "Inactive staff attendance cannot be updated"
    );
  }

  // Validate date
  const attendanceDate = parseDateKey(data.date);
  const attendanceDateKey = getDateKey(attendanceDate);

  // Only today's attendance can be updated
  const todayKey = getTodayKey();

  if (attendanceDateKey > todayKey) {
    throw new Error(
      "Upcoming date attendance cannot be updated"
    );
  }

  if (attendanceDateKey < todayKey) {
    throw new Error(
      "Past date attendance cannot be updated"
    );
  }

  const month = attendanceDate.getUTCMonth() + 1;
  const year = attendanceDate.getUTCFullYear();

  // Create monthly record and all days if missing.
  const {
    monthlyRecord,
    monthlyRecordCreated,
  } = ensureMonthlyAttendance(staff, month, year);

  // Find selected date
  let attendanceRecord = monthlyRecord.attendance.find(
    (item) => getDateKey(item.date) === attendanceDateKey
  );

  // Fallback: create date if missing
  if (!attendanceRecord) {
    monthlyRecord.attendance.push(
      createEmptyDailyAttendance(attendanceDate)
    );

    attendanceRecord = monthlyRecord.attendance.find(
      (item) => getDateKey(item.date) === attendanceDateKey
    );
  }

  // ==========================================
  // HISTORY HELPER
  // ==========================================

  const addChangeHistory = (
    historyArray,
    field,
    oldValue,
    newValue
  ) => {
    const previousValue = oldValue ?? null;
    const currentValue = newValue ?? null;

    if (previousValue === currentValue) {
      return;
    }

    historyArray.push({
      field,
      oldValue: previousValue,
      newValue: currentValue,
      updatedBy: userId || null,
      updatedAt: new Date(),
    });
  };

  // ==========================================
  // TAKE PREVIOUS ATTENDANCE VALUES
  // ==========================================

  const trackedFields = [
    "punchIn",
    "punchOut",
    "workingHours",
    "dayInWork",
    "otType",
    "otDays",
    "otHours",
    "otStartTime",
    "otEndTime",
  ];

  const previousAttendanceValues = {};

  trackedFields.forEach((field) => {
    previousAttendanceValues[field] =
      attendanceRecord[field] ?? null;
  });

  if (!Array.isArray(attendanceRecord.changeHistory)) {
    attendanceRecord.changeHistory = [];
  }

  // ==========================================
  // UPDATE NORMAL ATTENDANCE FIELDS
  // ==========================================

  const allowedFields = [
    "punchIn",
    "punchOut",
    "workingHours",
    "dayInWork",
  ];

  allowedFields.forEach((field) => {
    if (data[field] !== undefined) {
      attendanceRecord[field] = data[field];
    }
  });

  // ==========================================
  // ADVANCE FINANCE TRANSACTION
  // ==========================================

  if (data.advances !== undefined) {
    if (!Array.isArray(data.advances)) {
      throw new Error("Advances must be an array");
    }

    const staffAdvanceCategory = await FinanceCategory.findOne({
      name: "staffadvancesalary",
      type: "expense",
    }).session(session);

    if (!staffAdvanceCategory) {
      throw new Error(
        "Staff Advance Salary expense category not found"
      );
    }

    const previousAdvances = attendanceRecord.advances || [];

    const SOURCE_MODULE = "staffadvancesalary";

    const paymentMethodMap = {
      cash: "cash",
      upi: "upi",
      "bank transfer": "bank_transfer",
      bank_transfer: "bank_transfer",
      cheque: "cheque",
    };

    const updatedAdvances = [];

    for (const advanceData of data.advances) {

      // ======================================
      // ADVANCE ID
      // ======================================

      const advanceId = advanceData._id
        ? new mongoose.Types.ObjectId(advanceData._id)
        : new mongoose.Types.ObjectId();

      const existingAdvance = previousAdvances.find(
        (item) =>
          item._id &&
          item._id.toString() === advanceId.toString()
      );

      // ======================================
      // VALIDATE PAYMENT MODE
      // ======================================

      const paymentModeKey = String(
        advanceData.paymentMode || ""
      )
        .trim()
        .toLowerCase();

      const paymentMethod = paymentMethodMap[paymentModeKey];

      if (!paymentMethod) {
        throw new Error(
          `Invalid advance payment mode: ${advanceData.paymentMode}`
        );
      }

      // ======================================
      // VALIDATE AMOUNT
      // ======================================

      const amount = Number(advanceData.amount);

      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error(
          "Advance amount must be greater than 0"
        );
      }

      // ======================================
      // ADVANCE HISTORY
      // ======================================

      const amountHistory = (
        existingAdvance?.amountHistory || []
      ).map((history) =>
        typeof history.toObject === "function"
          ? history.toObject()
          : { ...history }
      );

      const advanceChangeHistory = (
        existingAdvance?.changeHistory || []
      ).map((history) =>
        typeof history.toObject === "function"
          ? history.toObject()
          : { ...history }
      );

      if (existingAdvance) {

        // Track Amount Change
        const oldAmount = Number(existingAdvance.amount);

        if (oldAmount !== amount) {
          amountHistory.push({
            oldAmount,
            newAmount: amount,
            updatedBy: userId || null,
            updatedAt: new Date(),
          });
        }

        // Track Payment Mode Change
        const oldPaymentMode =
          existingAdvance.paymentMode ?? "";

        const newPaymentMode =
          advanceData.paymentMode ?? "";

        addChangeHistory(
          advanceChangeHistory,
          "paymentMode",
          oldPaymentMode,
          newPaymentMode
        );

        // Track Reference Number Change
        const oldReferenceNumber =
          existingAdvance.referenceNumber ?? "";

        const newReferenceNumber =
          advanceData.referenceNumber || "";

        addChangeHistory(
          advanceChangeHistory,
          "referenceNumber",
          oldReferenceNumber,
          newReferenceNumber
        );

        // Track Remarks Change
        const oldRemarks =
          existingAdvance.remarks ?? "";

        const newRemarks =
          advanceData.remarks || "";

        addChangeHistory(
          advanceChangeHistory,
          "remarks",
          oldRemarks,
          newRemarks
        );
      }

      // ======================================
      // UNIQUE TRANSACTION SOURCE
      // ======================================

      const sourceType =
        `attendance_advance_${attendanceDateKey}_${advanceId}`;

      // ======================================
      // FIND EXISTING FINANCE TRANSACTION
      // ======================================

      let existingTransaction = null;

      // Priority 1: Frontend financeTransactionId
      // Priority 2: Existing Advance financeTransactionId

      const financeTransactionId =
        advanceData.financeTransactionId ||
        existingAdvance?.financeTransactionId;

      if (
        financeTransactionId &&
        mongoose.Types.ObjectId.isValid(financeTransactionId)
      ) {
        existingTransaction = await FinanceTransaction.findOne({
          _id: financeTransactionId,
          isDeleted: false,
        }).session(session);
      }

      // Priority 3: Find using source identifiers
      // Do not include sourceType because old transactions
      // may have a different or missing sourceType.

      if (!existingTransaction) {
        existingTransaction = await FinanceTransaction.findOne({
          sourceModule: SOURCE_MODULE,
          sourceId: staff._id,
          sourcePaymentId: advanceId,
          isDeleted: false,
        }).session(session);
      }

      // ======================================
      // TRANSACTION DATE & TIME
      // ======================================

      const advanceDateTime = existingTransaction
        ? existingTransaction.transactionDate
        : new Date();

      // ======================================
      // TRANSACTION DATA
      // ======================================

      const transactionData = {
        entryMode: "automatic",
        type: "expense",
        categoryId: staffAdvanceCategory._id,
        amount,

        description:
          `${staff.staffName} - Salary Advance - ${attendanceDateKey}`,

        transactionDate: advanceDateTime,

        paymentMethod,
        paymentReference: advanceData.referenceNumber || "",

        sourceModule: SOURCE_MODULE,
        sourceId: staff._id,
        sourcePaymentId: advanceId,
        sourceType,
      };

      // ======================================
      // UPDATE OR CREATE TRANSACTION
      // ======================================

      console.log("ADVANCE ID:", advanceId.toString());

      console.log(
        "PREVIOUS ADVANCES:",
        previousAdvances.map((item) => ({
          _id: item._id?.toString(),
          financeTransactionId:
            item.financeTransactionId?.toString(),
        }))
      );

      console.log(
        "EXISTING ADVANCE:",
        existingAdvance
      );

      console.log(
        "FRONTEND FINANCE TRANSACTION ID:",
        financeTransactionId
      );

      console.log(
        "EXISTING TRANSACTION FOUND:",
        existingTransaction?._id?.toString() || null
      );

      if (existingTransaction) {

        // UPDATE EXISTING TRANSACTION

        await updateTransaction(
          {
            sourceModule: SOURCE_MODULE,
            sourceId: staff._id,
            sourcePaymentId: advanceId,
            sourceType,
          },
          {
            categoryId: staffAdvanceCategory._id,
            amount,
            description: transactionData.description,
            transactionDate: advanceDateTime,
            paymentMethod,
            paymentReference: advanceData.referenceNumber || "",
            sourceModule: SOURCE_MODULE,
            sourceId: staff._id,
            sourcePaymentId: advanceId,
            sourceType,
          },
          userId,
          {
            sourceModule: SOURCE_MODULE,
            session,
          }
        );

        existingTransaction = await FinanceTransaction.findOne({
          _id: existingTransaction._id,
          isDeleted: false,
        }).session(session);

      } else {

        // CREATE NEW TRANSACTION ONLY FOR NEW ADVANCE

        await createTransaction(
          transactionData,
          userId,
          {
            sourceModule: SOURCE_MODULE,
            session,
          }
        );

        existingTransaction = await FinanceTransaction.findOne({
          sourceModule: SOURCE_MODULE,
          sourceId: staff._id,
          sourcePaymentId: advanceId,
          sourceType,
          isDeleted: false,
        }).session(session);
      }

      if (!existingTransaction) {
        throw new Error(
          "Unable to create or retrieve Staff Advance Finance Transaction"
        );
      }

      // ======================================
      // STORE UPDATED ADVANCE
      // ======================================

      updatedAdvances.push({
        _id: advanceId,
        amount,
        paymentMode: advanceData.paymentMode,
        referenceNumber: advanceData.referenceNumber || "",
        remarks: advanceData.remarks || "",
        financeTransactionId: existingTransaction._id,

        // Preserve Advance History
        amountHistory,
        changeHistory: advanceChangeHistory,
      });
    }

    attendanceRecord.advances = updatedAdvances;
  }

  // ==========================================
  // UPDATE OVERTIME FIELDS
  // ==========================================

  if (data.otType !== undefined) {
    attendanceRecord.otType = data.otType || null;
  }

  const otType = attendanceRecord.otType;

  if (otType === "Hours") {
    attendanceRecord.otHours = Number(data.otHours || 0);
    attendanceRecord.otDays = 0;
    attendanceRecord.otStartTime = null;
    attendanceRecord.otEndTime = null;

  } else if (otType === "Day") {
    attendanceRecord.otDays = Number(data.otDays || 0);
    attendanceRecord.otHours = 0;
    attendanceRecord.otStartTime = null;
    attendanceRecord.otEndTime = null;

  } else if (otType === "Time Between") {
    attendanceRecord.otDays = 0;
    attendanceRecord.otHours = 0;
    attendanceRecord.otStartTime = data.otStartTime || null;
    attendanceRecord.otEndTime = data.otEndTime || null;

  } else {
    attendanceRecord.otType = null;
    attendanceRecord.otDays = 0;
    attendanceRecord.otHours = 0;
    attendanceRecord.otStartTime = null;
    attendanceRecord.otEndTime = null;
  }

  // ==========================================
  // TRACK ATTENDANCE FIELD CHANGES
  // ==========================================

  trackedFields.forEach((field) => {
    const oldValue = previousAttendanceValues[field];
    const newValue = attendanceRecord[field] ?? null;

    addChangeHistory(
      attendanceRecord.changeHistory,
      field,
      oldValue,
      newValue
    );
  });

  // ==========================================
  // SAVE STAFF DOCUMENT
  // ==========================================

  await staff.save({ session });

  return {
    staffId: staff._id,
    staffName: staff.staffName,
    month,
    year,
    monthlyRecordCreated,
    totalDaysInMonth: monthlyRecord.attendance.length,
    attendance: attendanceRecord,
  };
});




// ==========================================
// EXPORT
// ==========================================

module.exports = {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  generateMonthlyAttendance,
  updateAttendance,
  updateMonthlyPayment,
};

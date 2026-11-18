const mongoose = require("mongoose");

const VehicleExpense = require("./VehicleExpense.model");
const FinanceCategory = require("../finance-category/finance-category.model");

const FinanceTransaction = require(
  "../finance-transaction/finance-transaction.model"
);

const {
  createTransaction,
  updateTransaction,
} = require("../finance-transaction/finance-transaction.service");

// FINANCE SOURCE DETAILS
const SOURCE_MODULE = "vehicle-expense";
const SOURCE_TYPE = "vehicle-expense";
const OTHER_SOURCE_TYPE = "vehicle-expense-other";

// CREATE VEHICLE EXPENSE
const createVehicleExpense = async (data, userId) => {
  const {
    date,
    vehicle,
    driver,
    startKms,
  } = data;

  // Generate automatic serial number
  const lastExpense = await VehicleExpense.findOne()
    .sort({ serialNo: -1 })
    .select("serialNo");

  const serialNo = lastExpense?.serialNo
    ? lastExpense.serialNo + 1
    : 1;

  const vehicleExpense = await VehicleExpense.create({
    serialNo,
    date,
    vehicle,
    driver,
    startKms,
    endKms: null,
    totalKms: null,
    diesel: 0,

    // Other Expense Defaults
    otherAmount: 0,
    remarkDescription: [],

    status: "In Progress",

    createdBy: userId,
    updatedBy: null,
    changeHistory: [],
  });

  return vehicleExpense;
};


// GET ALL VEHICLE EXPENSES
const getAllVehicleExpenses = async () => {
  return await VehicleExpense.find()
    .sort({ date: -1, createdAt: -1 });
};


// GET VEHICLE EXPENSE BY ID
const getVehicleExpenseById = async (id) => {
  return await VehicleExpense.findById(id)
    .populate("createdBy", "name role")
    .populate("updatedBy", "name role")
    .populate("changeHistory.changedBy", "name role");
};


// UPDATE VEHICLE EXPENSE
const updateVehicleExpense = async (
  id,
  data,
  userId
) => {
  const session = await mongoose.startSession();

  try {
    let updatedExpense;

    await session.withTransaction(async () => {
  const existingExpense =
    await VehicleExpense.findById(id).session(session);

  if (!existingExpense) {
    throw new Error("Vehicle expense not found.");
  }

  const status =
    data.status ?? existingExpense.status;

  const startKms =
    data.startKms ?? existingExpense.startKms;

  let endKms =
    data.endKms !== undefined
      ? data.endKms
      : existingExpense.endKms;

  let totalKms = existingExpense.totalKms;

  const diesel =
    data.diesel !== undefined
      ? Number(data.diesel)
      : existingExpense.diesel;

  // OTHER AMOUNT
  const otherAmount =
    data.otherAmount !== undefined
      ? Number(data.otherAmount)
      : existingExpense.otherAmount ?? 0;

  // Safely get existing remark descriptions
  // Old database records may not have this field
  const currentRemarkDescription = Array.isArray(
    existingExpense.remarkDescription
  )
    ? existingExpense.remarkDescription
    : [];

  const remarkDescription =
    data.remarkDescription !== undefined
      ? data.remarkDescription
      : currentRemarkDescription.map((item) => ({
          description: item.description ?? "",
          amount: Number(item.amount ?? 0),
        }));

  // Validate Diesel
  if (!Number.isFinite(diesel) || diesel < 0) {
    throw new Error("Invalid diesel amount.");
  }

  // Validate Other Amount
  if (
    !Number.isFinite(otherAmount) ||
    otherAmount < 0
  ) {
    throw new Error("Invalid other amount.");
  }

  // Validate Remark Description
  if (!Array.isArray(remarkDescription)) {
    throw new Error("Invalid remark description.");
  }

  let remarkTotal = 0;

  for (const item of remarkDescription) {
    const description = String(
      item.description ?? ""
    ).trim();

    const amount = Number(item.amount);

    if (!Number.isFinite(amount) || amount < 0) {
      throw new Error(
        "Invalid amount in remark description."
      );
    }

    if (!description && amount > 0) {
      throw new Error(
        "Description is required for remark amount."
      );
    }

    remarkTotal += amount;
  }

  // Allow small floating-point differences
  if (Math.abs(remarkTotal - otherAmount) > 0.01) {
    throw new Error(
      "Remark description total must equal Other Amount."
    );
  }

  // COMPLETED
  if (status === "Completed") {
    if (
      endKms === null ||
      endKms === undefined ||
      endKms === ""
    ) {
      throw new Error(
        "End KMs are required to complete the vehicle expense."
      );
    }

    if (Number(endKms) < Number(startKms)) {
      throw new Error(
        "End KMs cannot be less than Start KMs."
      );
    }

    totalKms = Number(endKms) - Number(startKms);
  }

  // IN PROGRESS
  else if (status === "In Progress") {

    // End KMs entered but status is still In Progress
    if (
      endKms !== null &&
      endKms !== undefined &&
      endKms !== ""
    ) {
      throw new Error(
        "End KMs is entered. Please update status to Completed and try again."
      );
    }

    // Do not allow reverting a diesel transaction
    // until the finance reversal flow is implemented.
    if (existingExpense.diesel > 0) {
      throw new Error(
        "Cannot change a vehicle expense with diesel transaction back to In Progress."
      );
    }

    endKms = null;
    totalKms = null;

    if (diesel > 0) {
      throw new Error(
        "Diesel amount can be added only when completing the vehicle expense."
      );
    }
  } else {
    throw new Error("Invalid vehicle expense status.");
  }

  // PREPARE UPDATED VALUES
  const updatedData = {
    date: data.date ?? existingExpense.date,
    vehicle: data.vehicle ?? existingExpense.vehicle,
    driver: data.driver ?? existingExpense.driver,
    startKms,
    endKms,
    totalKms,
    diesel,
    otherAmount,
    remarkDescription,
    status,
  };

  // TRACK CHANGES
  const trackedFields = [
    "date",
    "vehicle",
    "driver",
    "startKms",
    "endKms",
    "totalKms",
    "diesel",
    "otherAmount",
    "remarkDescription",
    "status",
  ];

  const changes = [];

  for (const field of trackedFields) {
    const oldValue =
      field === "remarkDescription"
        ? currentRemarkDescription
        : existingExpense[field];

    const newValue = updatedData[field];

    const normalizeValue = (value) => {
      if (value instanceof Date) {
        return value.getTime();
      }

      if (
        field === "date" &&
        value !== null &&
        value !== undefined
      ) {
        return new Date(value).getTime();
      }

      if (field === "remarkDescription") {
        return JSON.stringify(
          (value || []).map((item) => ({
            description: item.description ?? "",
            amount: Number(item.amount ?? 0),
          }))
        );
      }

      return value ?? null;
    };

    if (
      normalizeValue(oldValue) !==
      normalizeValue(newValue)
    ) {
      changes.push({
        field,
        oldValue,
        newValue,
      });
    }
  }

  // SAVE VEHICLE EXPENSE AND CHANGE HISTORY
  if (changes.length > 0) {
    existingExpense.set(updatedData);

    existingExpense.changeHistory.push({
      changedBy: userId,
      changedAt: new Date(),
      changes,
      reason: data.reason || "",
    });

    existingExpense.updatedBy = userId;

    await existingExpense.save({ session });
  }

  // FINANCE TRANSACTION - DIESEL
  const dieselChanged = changes.some(
    (change) => change.field === "diesel"
  );

  if (dieselChanged) {
    const oldDiesel = existingExpense.changeHistory
      .at(-1)?.changes.find(
        (change) => change.field === "diesel"
      )?.oldValue;

    const newDiesel = existingExpense.diesel;

    if (newDiesel > 0) {
      // Find Diesel Expense Category
      const dieselCategory = await FinanceCategory.findOne({
        name: "Diesel",
        type: "expense",
      }).session(session);

      if (!dieselCategory) {
        throw new Error(
          "Diesel expense category not found."
        );
      }

      // Find Existing Finance Transaction
      const existingTransaction =
        await FinanceTransaction.findOne({
          sourceModule: SOURCE_MODULE,
          sourceId: existingExpense._id,
          sourceType: SOURCE_TYPE,
        }).session(session);

      const transactionData = {
        entryMode: "automatic",
        type: "expense",
        categoryId: dieselCategory._id,
        amount: newDiesel,
        transactionDate: existingExpense.date,
        paymentMethod: "cash",
        description: `Vehicle ${existingExpense.vehicle} - ${existingExpense.driver}`,
        sourceModule: SOURCE_MODULE,
        sourceId: existingExpense._id,
        sourceType: SOURCE_TYPE,
      };

      if (existingTransaction) {
        // UPDATE EXISTING FINANCE TRANSACTION
        await updateTransaction(
          {
            sourceModule: SOURCE_MODULE,
            sourceId: existingExpense._id,
            sourceType: SOURCE_TYPE,
          },
          {
            categoryId: dieselCategory._id,
            amount: newDiesel,
            transactionDate: existingExpense.date,
            paymentMethod: "cash",
            description: `Vehicle ${existingExpense.vehicle} - ${existingExpense.driver}`,
          },
          userId,
          {
            sourceModule: SOURCE_MODULE,
            session,
          }
        );
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
      }
    }

    // Diesel amount changed to zero after a transaction exists.
    // Existing reversal logic is not implemented.
    if (newDiesel === 0 && Number(oldDiesel) > 0) {
      throw new Error(
        "Diesel transaction reversal is not implemented yet."
      );
    }
  }

  // FINANCE TRANSACTION - OTHER AMOUNT
  const otherAmountChanged = changes.some(
    (change) => change.field === "otherAmount"
  );

  const remarkDescriptionChanged = changes.some(
    (change) => change.field === "remarkDescription"
  );

  const otherFinanceDetailsChanged = changes.some(
    (change) =>
      ["date", "vehicle", "driver"].includes(change.field)
  );

  if (
    otherAmountChanged ||
    remarkDescriptionChanged ||
    otherFinanceDetailsChanged
  ) {
    const newOtherAmount = existingExpense.otherAmount ?? 0;

    // Find Other Expense Category
    const otherCategory = await FinanceCategory.findOne({
      name: "vehicle-expense-other",
      type: "expense",
    }).session(session);

    if (!otherCategory && newOtherAmount > 0) {
      throw new Error(
        "Vehicle expense other category not found."
      );
    }

    // Find Existing Other Finance Transaction
    const existingOtherTransaction =
      await FinanceTransaction.findOne({
        sourceModule: SOURCE_MODULE,
        sourceId: existingExpense._id,
        sourceType: OTHER_SOURCE_TYPE,
      }).session(session);

    // Safely Prepare Remark Description
    const safeRemarkDescription = Array.isArray(
      existingExpense.remarkDescription
    )
      ? existingExpense.remarkDescription
      : [];

    const otherDescription = safeRemarkDescription
      .filter(
        (item) =>
          item.description || Number(item.amount) > 0
      )
      .map(
        (item) =>
          `${item.description}: ₹${Number(item.amount ?? 0).toFixed(2)}`
      )
      .join(", ");

    const transactionDescription =
      `Vehicle ${existingExpense.vehicle} - ${existingExpense.driver}` +
      (otherDescription ? ` | ${otherDescription}` : "");

    // Finance Transaction Data
    const otherTransactionData = {
      entryMode: "automatic",
      type: "expense",
      categoryId: otherCategory?._id,
      amount: newOtherAmount,
      transactionDate: existingExpense.date,
      paymentMethod: "cash",
      description: transactionDescription,
      sourceModule: SOURCE_MODULE,
      sourceId: existingExpense._id,
      sourceType: OTHER_SOURCE_TYPE,
    };

    if (existingOtherTransaction) {
      // UPDATE EXISTING OTHER FINANCE TRANSACTION
      await updateTransaction(
        {
          sourceModule: SOURCE_MODULE,
          sourceId: existingExpense._id,
          sourceType: OTHER_SOURCE_TYPE,
        },
        {
          ...(otherCategory && {
            categoryId: otherCategory._id,
          }),
          amount: newOtherAmount,
          transactionDate: existingExpense.date,
          paymentMethod: "cash",
          description: transactionDescription,
        },
        userId,
        {
          sourceModule: SOURCE_MODULE,
          session,
        }
      );
    } else if (newOtherAmount > 0) {
      // CREATE NEW OTHER FINANCE TRANSACTION
      await createTransaction(
        otherTransactionData,
        userId,
        {
          sourceModule: SOURCE_MODULE,
          session,
        }
      );
    }
  }

  updatedExpense = existingExpense;

    });

    return updatedExpense;
  } finally {
    await session.endSession();
  }
};

// DELETE VEHICLE EXPENSE
const deleteVehicleExpense = async (id) => {
  const session = await mongoose.startSession();

  try {
    let deletedExpense;

    await session.withTransaction(async () => {
  const vehicleExpense =
    await VehicleExpense.findById(id).session(session);

  if (!vehicleExpense) {
    throw new Error("Vehicle expense not found.");
  }

  // Check Diesel and Other Finance Transactions
  const linkedTransaction = await FinanceTransaction.findOne({
    sourceModule: SOURCE_MODULE,
    sourceId: vehicleExpense._id,
    sourceType: {
      $in: [SOURCE_TYPE, OTHER_SOURCE_TYPE],
    },
  }).session(session);

  if (linkedTransaction) {
    throw new Error(
      "This vehicle expense has linked Finance Transactions. Handle the finance reversal before deleting."
    );
  }

  await VehicleExpense.findByIdAndDelete(id).session(session);

  deletedExpense = vehicleExpense;

    });

    return deletedExpense;
  } finally {
    await session.endSession();
  }
};


module.exports = {
  createVehicleExpense,
  getAllVehicleExpenses,
  getVehicleExpenseById,
  updateVehicleExpense,
  deleteVehicleExpense,
};


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
  const existingExpense =
    await VehicleExpense.findById(id);

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

  // Validate Diesel
  if (!Number.isFinite(diesel) || diesel < 0) {
    throw new Error("Invalid diesel amount.");
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

  // Prepare updated values
  const updatedData = {
    date: data.date ?? existingExpense.date,
    vehicle: data.vehicle ?? existingExpense.vehicle,
    driver: data.driver ?? existingExpense.driver,
    startKms,
    endKms,
    totalKms,
    diesel,
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
    "status",
  ];

  const changes = [];

  for (const field of trackedFields) {
    const oldValue = existingExpense[field];
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

  // Save Vehicle Expense and Change History
  if (changes.length > 0) {
    existingExpense.set(updatedData);

    existingExpense.changeHistory.push({
      changedBy: userId,
      changedAt: new Date(),
      changes,
      reason: data.reason || "",
    });

    existingExpense.updatedBy = userId;

    await existingExpense.save();
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

    // Diesel amount changed from 0 to a positive amount
    // OR existing positive amount changed.
    if (newDiesel > 0) {
      // Find Diesel Expense Category
      const dieselCategory = await FinanceCategory.findOne({
        name: "Diesel",
        type: "expense",
      });

      if (!dieselCategory) {
        throw new Error(
          "Diesel expense category not found."
        );
      }

      // Find existing Finance Transaction
      const existingTransaction =
        await FinanceTransaction.findOne({
          sourceModule: SOURCE_MODULE,
          sourceId: existingExpense._id,
          sourceType: SOURCE_TYPE,
        });

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
          }
        );
      } else {
        // CREATE NEW FINANCE TRANSACTION
        await createTransaction(
          transactionData,
          userId,
          {
            sourceModule: SOURCE_MODULE,
          }
        );
      }
    }

    // Diesel amount changed to zero after a transaction exists.
    // Handle this with Finance Transaction reversal logic later.
    if (newDiesel === 0 && Number(oldDiesel) > 0) {
      throw new Error(
        "Diesel transaction reversal is not implemented yet."
      );
    }
  }

  return existingExpense;
};



// DELETE VEHICLE EXPENSE
const deleteVehicleExpense = async (id) => {
  const vehicleExpense =
    await VehicleExpense.findById(id);

  if (!vehicleExpense) {
    throw new Error("Vehicle expense not found.");
  }

  // Prevent deleting a record with an active finance transaction.
  const linkedTransaction = await FinanceTransaction.findOne({
    sourceModule: SOURCE_MODULE,
    sourceId: vehicleExpense._id,
    sourceType: SOURCE_TYPE,
  });

  if (linkedTransaction) {
    throw new Error(
      "This vehicle expense has a linked Finance Transaction. Handle the finance reversal before deleting."
    );
  }

  await VehicleExpense.findByIdAndDelete(id);

  return vehicleExpense;
};


module.exports = {
  createVehicleExpense,
  getAllVehicleExpenses,
  getVehicleExpenseById,
  updateVehicleExpense,
  deleteVehicleExpense,
};

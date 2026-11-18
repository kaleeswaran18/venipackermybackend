
const mongoose = require("mongoose");
const Property = require("./property.model");
const FinanceCategory = require("../finance-category/finance-category.model");
const financeTransactionService = require("../finance-transaction/finance-transaction.service");

// Generate Property Number
const generatePropertyNo = async () => {
  const lastProperty = await Property.findOne({
    propertyNo: {
      $exists: true,
      $regex: /^PROP\d+$/,
    },
  })
    .sort({ createdAt: -1 })
    .select("propertyNo");

  if (!lastProperty || !lastProperty.propertyNo) {
    return "PROP001";
  }

  const number = parseInt(
    lastProperty.propertyNo.replace("PROP", ""),
    10
  );

  return `PROP${String(number + 1).padStart(3, "0")}`;
};

// CREATE PROPERTY
const createProperty = async (data) => {
  const {
    propertyName,
    doorNo,
    propertyType,
    address,
    occupy,
    rentalType,
    rentAmount,
    securityDeposit,
    leaseAmount,
    leasePeriodYears,
    occupancyHistory,
    paymentHistory,
  } = data;

  const propertyNo = await generatePropertyNo();

  return await Property.create({
    propertyNo,
    propertyName,
    doorNo,
    propertyType,
    address,
    occupy: occupy ?? false,
    rentalType,

    rentDetails:
      rentalType === "Rent"
        ? {
            monthlyRent: rentAmount,
            securityDeposit: securityDeposit ?? null,
          }
        : undefined,

    leaseDetails:
      rentalType === "Lease"
        ? {
            leaseAmount,
            leasePeriodYears,
          }
        : undefined,

    occupancyHistory: occupancyHistory || [],
    paymentHistory: paymentHistory || [],
  });
};

// GET ALL PROPERTIES
const getAllProperties = async () => {
  return await Property.find().sort({ createdAt: -1 });
};

// GET PROPERTY BY ID
const getPropertyById = async (propertyId) => {
  const property = await Property.findById(propertyId);

  if (!property) {
    throw new Error("Property not found");
  }

  return property;
};

// CREATE PROPERTY FINANCE TRANSACTION
const createPropertyFinanceTransaction = async ({
  property,
  occupancy,
  type,
  amount,
  userId,
  session,
}) => {
  if (
    amount === undefined ||
    amount === null ||
    !Number.isFinite(Number(amount)) ||
    Number(amount) <= 0
  ) {
    throw new Error("Valid property finance amount is required");
  }

  if (!occupancy || !occupancy._id) {
    throw new Error("Valid occupancy record is required");
  }

  const categoryQuery = FinanceCategory.findOne({
    name: "property",
    type,
  });
  if (session) categoryQuery.session(session);
  const category = await categoryQuery;

  if (!category) {
    throw new Error(`Property ${type} category not found`);
  }

  return await financeTransactionService.createTransaction(
    {
      entryMode: "automatic",
      type,
      categoryId: category._id,
      amount: Number(amount),
      transactionDate: new Date(),
      paymentMethod: "cash",
      description:
        `${property.propertyNo} - ${property.propertyName} - ${occupancy.tenantName} - ${type === "income" ? "Occupy" : "Vacate"}`,
      referenceNumber: property.propertyNo,
      sourceModule: "property",
      sourceId: property._id,
      sourcePaymentId: occupancy._id,
      sourceType: type === "income" ? "occupy" : "vacate",
    },
    userId,
    {
      sourceModule: "property",
      ...(session ? { session } : {}),
    }
  );
};

// UPDATE PROPERTY
const updateProperty = async (propertyId, data, userId) => {
  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      const property = await Property.findById(propertyId).session(session);

  if (!property) {
    throw new Error("Property not found");
  }

  const previousOccupy = property.occupy;

  const isOccupying =
    data.occupy === true && previousOccupy === false;

  const isVacating =
    data.occupy === false && previousOccupy === true;

  let financeAmount = 0;
  let financeType = null;
  let occupancyRecordId = null;

  // OCCUPY FLOW
  if (isOccupying) {
    const history = data.occupancyHistory || [];

    const newOccupancy = [...history]
      .reverse()
      .find((item) => !item.endDate);

    if (!newOccupancy) {
      throw new Error("Active occupancy details are required");
    }

    financeAmount =
      property.rentalType === "Rent"
        ? property.rentDetails?.securityDeposit
        : property.leaseDetails?.leaseAmount;

    financeType = "income";
  }

  // VACATE FLOW
  if (isVacating) {
    const activeOccupancy = property.occupancyHistory.find(
      (item) => !item.endDate
    );

    if (!activeOccupancy) {
      throw new Error("Active occupancy record not found");
    }

    occupancyRecordId = activeOccupancy._id;

    if (
      data.returnAmount === undefined ||
      data.returnAmount === null
    ) {
      throw new Error("Return amount is required for vacating");
    }

    financeAmount = Number(data.returnAmount);

    if (
      !Number.isFinite(financeAmount) ||
      financeAmount <= 0
    ) {
      throw new Error("Return amount must be greater than zero");
    }

    financeType = "expense";
  }

  // UPDATE PROPERTY FIELDS
  if (data.propertyName !== undefined) {
    property.propertyName = data.propertyName;
  }

  if (data.doorNo !== undefined) {
    property.doorNo = data.doorNo;
  }

  if (data.propertyType !== undefined) {
    property.propertyType = data.propertyType;
  }

  if (data.address !== undefined) {
    property.address = data.address;
  }

  if (data.occupy !== undefined) {
    property.occupy = data.occupy;
  }

  if (data.rentalType !== undefined) {
    property.rentalType = data.rentalType;
  }

  if (data.rentDetails !== undefined) {
    property.rentDetails = data.rentDetails;
  }

  if (data.securityDeposit !== undefined) {
    property.rentDetails = property.rentDetails || {};
    property.rentDetails.securityDeposit = data.securityDeposit;
  }

  if (data.leaseDetails !== undefined) {
    property.leaseDetails = data.leaseDetails;
  }

  // OCCUPANCY HISTORY
  if (isVacating) {
    const activeOccupancy = property.occupancyHistory.id(
      occupancyRecordId
    );

    if (!activeOccupancy) {
      throw new Error("Active occupancy record not found");
    }

    activeOccupancy.endDate = new Date();
  } else if (data.occupancyHistory !== undefined) {
    property.occupancyHistory = data.occupancyHistory;
  }

  if (data.paymentHistory !== undefined) {
    property.paymentHistory = data.paymentHistory;
  }

  // SAVE PROPERTY
  await property.save({ session });

  // CREATE AUTOMATIC FINANCE TRANSACTION
  if (financeType) {
    let savedOccupancy = null;

    if (isVacating) {
      savedOccupancy = property.occupancyHistory.id(
        occupancyRecordId
      );
    } else if (isOccupying) {
      savedOccupancy = [...property.occupancyHistory]
        .reverse()
        .find((item) => !item.endDate);
    }

    if (!savedOccupancy) {
      throw new Error("Saved occupancy record not found");
    }

    await createPropertyFinanceTransaction({
      property,
      occupancy: savedOccupancy,
      type: financeType,
      amount: financeAmount,
      userId,
      session,
    });
  }

      result = property;
    });

    return result;
  } finally {
    await session.endSession();
  }
};

// RECOVER MISSING VACATE FINANCE TRANSACTION
const recoverVacateFinanceTransaction = async (
  propertyId,
  occupancyId,
  returnAmount,
  userId
) => {
  const property = await Property.findById(propertyId);

  if (!property) {
    throw new Error("Property not found");
  }

  if (property.occupy === true) {
    throw new Error("Property is still occupied");
  }

  const occupancy = property.occupancyHistory.id(occupancyId);

  if (!occupancy) {
    throw new Error("Occupancy record not found");
  }

  if (!occupancy.endDate) {
    throw new Error("Occupancy record is not vacated");
  }

  const amount = Number(returnAmount);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Return amount must be greater than zero");
  }

  return await createPropertyFinanceTransaction({
    property,
    occupancy,
    type: "expense",
    amount,
    userId,
  });
};

// CREATE RENT PAYMENT + FINANCE INCOME
const createRentPayment = async (propertyId, data, userId) => {
  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      const property = await Property.findById(propertyId).session(session);

  if (!property) {
    throw new Error("Property not found");
  }

  // PROPERTY STATUS VALIDATION
  if (property.occupy !== true) {
    throw new Error("Property is not occupied");
  }

  // RENT PROPERTY ONLY
  if (property.rentalType !== "Rent") {
    throw new Error("Rent payment is available only for Rent properties");
  }

  // FIND ACTIVE TENANT
  const activeOccupancy = [...property.occupancyHistory]
    .reverse()
    .find((item) => !item.endDate);

  if (!activeOccupancy) {
    throw new Error("Active tenant not found");
  }

  // VALIDATE PAYMENT AMOUNT
  const amount = Number(data.amount);

  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    throw new Error("Paid amount must be greater than zero");
  }

  // VALIDATE MONTH
  if (
    !data.month ||
    typeof data.month !== "string" ||
    !data.month.trim()
  ) {
    throw new Error("Payment month is required");
  }

  // VALIDATE PAYMENT DATE
  if (!data.paymentDate) {
    throw new Error("Payment date is required");
  }

  const paymentDate = new Date(data.paymentDate);

  if (Number.isNaN(paymentDate.getTime())) {
    throw new Error("Invalid payment date");
  }

  // VALIDATE PAYMENT METHOD
  const paymentMethod = data.paymentMethod || "cash";

  const allowedPaymentMethods = [
    "cash",
    "upi",
    "bank_transfer",
    "cheque",
  ];

  if (!allowedPaymentMethods.includes(paymentMethod)) {
    throw new Error("Invalid payment method");
  }

  const monthlyRent = Number(
    property.rentDetails?.monthlyRent || 0
  );

  if (monthlyRent <= 0) {
    throw new Error("Valid monthly rent is not configured");
  }

  // CREATE PAYMENT HISTORY RECORD
  property.paymentHistory.push({
    month: data.month.trim(),
    amount,
    paymentDate,
    status: "Partially Paid",
    remarks: data.remarks || "",
  });

  // CALCULATE TOTAL PAID FOR SELECTED MONTH
  const monthlyPayments = property.paymentHistory.filter(
    (item) => item.month === data.month.trim()
  );

  const totalPaid = monthlyPayments.reduce(
    (total, item) => total + Number(item.amount || 0),
    0
  );

  const paymentStatus =
    totalPaid >= monthlyRent ? "Paid" : "Partially Paid";

  // UPDATE STATUS FOR ALL PAYMENTS OF THIS MONTH
  monthlyPayments.forEach((item) => {
    item.status = paymentStatus;
  });

  // SAVE PROPERTY AND GENERATE PAYMENT ID
  await property.save({ session });

  const savedPayment =
    property.paymentHistory[
      property.paymentHistory.length - 1
    ];

  if (!savedPayment || !savedPayment._id) {
    throw new Error("Saved rent payment record not found");
  }

  // FIND PROPERTY INCOME CATEGORY
  const category = await FinanceCategory.findOne({
    name: "property",
    type: "income",
  }).session(session);

  if (!category) {
    throw new Error("Property income category not found");
  }

  // CREATE AUTOMATIC FINANCE INCOME
  const transaction =
    await financeTransactionService.createTransaction(
      {
        entryMode: "automatic",
        type: "income",
        categoryId: category._id,
        amount,
        transactionDate: new Date(),
        paymentMethod,
        description:
          `${property.propertyNo} - ${property.propertyName} - ${activeOccupancy.tenantName} - Rent - ${data.month.trim()}`,
        referenceNumber: property.propertyNo,
        sourceModule: "property",
        sourceId: property._id,
        sourcePaymentId: savedPayment._id,
        sourceType: "rent_payment",
      },
      userId,
      {
        sourceModule: "property",
        session,
      }
    );

      result = {
        property,
        payment: savedPayment,
        transaction,
      };
    });

    return result;
  } finally {
    await session.endSession();
  }
};

// DELETE PROPERTY
const deleteProperty = async (propertyId) => {
  const property = await Property.findById(propertyId);

  if (!property) {
    throw new Error("Property not found");
  }

  await Property.findByIdAndDelete(propertyId);

  return {
    id: property._id,
    message: "Property deleted successfully",
  };
};

module.exports = {
  createProperty,
  getAllProperties,
  getPropertyById,
  updateProperty,
  recoverVacateFinanceTransaction,
  createRentPayment,
  deleteProperty,
};

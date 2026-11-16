
const Joi = require("joi");

// OCCUPANCY HISTORY VALIDATION
const occupancyHistorySchema = Joi.object({
  tenantName: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required(),

  tenantPhone: Joi.string()
    .trim()
    .min(10)
    .max(15)
    .required(),

  startDate: Joi.date()
    .required(),

  endDate: Joi.date()
    .greater(Joi.ref("startDate"))
    .allow(null)
    .optional(),
});

// PAYMENT HISTORY VALIDATION
const paymentHistorySchema = Joi.object({
  month: Joi.string()
    .trim()
    .required(),

  amount: Joi.number()
    .min(0)
    .required(),

  paymentDate: Joi.date()
    .required(),

  status: Joi.string()
    .valid(
      "Pending",
      "Partially Paid",
      "Paid"
    )
    .required(),

  remarks: Joi.string()
    .trim()
    .max(2000)
    .allow("")
    .optional(),
});

// CREATE RENT PAYMENT VALIDATION
const createRentPaymentSchema = Joi.object({
  month: Joi.string()
    .trim()
    .min(1)
    .required(),

  amount: Joi.number()
    .positive()
    .required(),

  paymentDate: Joi.date()
    .required(),

  paymentMethod: Joi.string()
    .valid(
      "cash",
      "upi",
      "bank_transfer",
      "cheque"
    )
    .default("cash"),

  remarks: Joi.string()
    .trim()
    .max(2000)
    .allow("")
    .optional(),
});

// CREATE PROPERTY
const createPropertySchema = Joi.object({
  propertyName: Joi.string()
    .trim()
    .min(2)
    .max(200)
    .required(),

  doorNo: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .required(),

  propertyType: Joi.string()
    .valid(
      "House",
      "Godown",
      "Shop",
      "Office",
      "Land",
      "Other"
    )
    .required(),

  address: Joi.string()
    .trim()
    .min(2)
    .max(500)
    .required(),

  occupy: Joi.boolean()
    .default(false),

  rentalType: Joi.string()
    .valid("Rent", "Lease")
    .required(),

  // RENT
  rentAmount: Joi.number()
    .min(0)
    .when("rentalType", {
      is: "Rent",
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),

  // SECURITY RENT DEPOSIT
  securityDeposit: Joi.number()
    .min(0)
    .when("rentalType", {
      is: "Rent",
      then: Joi.optional(),
      otherwise: Joi.forbidden(),
    }),

  // LEASE
  leaseAmount: Joi.number()
    .min(0)
    .when("rentalType", {
      is: "Lease",
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),

  leasePeriodYears: Joi.number()
    .integer()
    .min(1)
    .when("rentalType", {
      is: "Lease",
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),

  occupancyHistory: Joi.array()
    .items(occupancyHistorySchema)
    .optional(),

  paymentHistory: Joi.array()
    .items(paymentHistorySchema)
    .optional(),
});

// UPDATE PROPERTY
const updatePropertySchema = Joi.object({
  propertyName: Joi.string()
    .trim()
    .min(2)
    .max(200)
    .optional(),

  doorNo: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .optional(),

  propertyType: Joi.string()
    .valid(
      "House",
      "Godown",
      "Shop",
      "Office",
      "Land",
      "Other"
    )
    .optional(),

  address: Joi.string()
    .trim()
    .min(2)
    .max(500)
    .optional(),

  occupy: Joi.boolean()
    .optional(),

  rentalType: Joi.string()
    .valid("Rent", "Lease")
    .optional(),

  // RENT
  rentAmount: Joi.number()
    .min(0)
    .optional(),

  // SECURITY RENT DEPOSIT
  securityDeposit: Joi.number()
    .min(0)
    .optional(),

  // LEASE
  leaseAmount: Joi.number()
    .min(0)
    .optional(),

  leasePeriodYears: Joi.number()
    .integer()
    .min(1)
    .optional(),

  // VACATE RETURN AMOUNT
  returnAmount: Joi.number()
    .min(0.01)
    .optional(),

  occupancyHistory: Joi.array()
    .items(occupancyHistorySchema)
    .optional(),

  paymentHistory: Joi.array()
    .items(paymentHistorySchema)
    .optional(),
});

module.exports = {
  createPropertySchema,
  updatePropertySchema,
  createRentPaymentSchema,
};

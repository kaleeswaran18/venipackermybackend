
const Joi = require("joi");

// ObjectId Validation
const objectId = Joi.string().hex().length(24);

// Common Fields
const commonFields = {
  entryMode: Joi.string()
    .valid("manual", "automatic"),

  type: Joi.string()
    .valid("income", "expense"),

  categoryId: objectId,

  locationId: objectId,

  amount: Joi.number()
    .positive(),

  transactionDate: Joi.date(),

  paymentMethod: Joi.string()
    .valid("cash", "upi", "bank_transfer", "cheque"),

  description: Joi.string()
    .trim()
    .min(1),

  referenceNumber: Joi.string()
    .trim()
    .allow("")
    .optional(),
};

// Create Transaction Schema
const createFinanceTransactionSchema = Joi.object({
  ...commonFields,

  entryMode: Joi.string()
    .valid("manual", "automatic")
    .required(),

  type: commonFields.type.required(),

  categoryId: commonFields.categoryId.required(),

  locationId: commonFields.locationId.required(),

  amount: commonFields.amount.required(),

  transactionDate: commonFields.transactionDate.required(),

  paymentMethod: commonFields.paymentMethod.required(),

  description: commonFields.description.required(),

  referenceNumber: commonFields.referenceNumber,

  // Automatic Source Fields
  sourceModule: Joi.when("entryMode", {
    is: "automatic",
    then: Joi.string()
      .valid("purchase", "customer_delivery", "property")
      .required(),
    otherwise: Joi.forbidden(),
  }),

  sourceId: Joi.when("entryMode", {
    is: "automatic",
    then: objectId.required(),
    otherwise: Joi.forbidden(),
  }),

  sourcePaymentId: Joi.when("entryMode", {
    is: "automatic",
    then: objectId.allow(null).optional(),
    otherwise: Joi.forbidden(),
  }),

  sourceType: Joi.when("entryMode", {
    is: "automatic",
    then: Joi.string().trim().required(),
    otherwise: Joi.forbidden(),
  }),
});

// Update Transaction Schema
const updateFinanceTransactionSchema = Joi.object({
  type: commonFields.type,

  categoryId: commonFields.categoryId,

  locationId: commonFields.locationId,

  amount: commonFields.amount,

  transactionDate: commonFields.transactionDate,

  paymentMethod: commonFields.paymentMethod,

  description: commonFields.description,

  referenceNumber: commonFields.referenceNumber,
}).min(1);

module.exports = {
  createFinanceTransactionSchema,
  updateFinanceTransactionSchema,
};

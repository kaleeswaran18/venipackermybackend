const Joi = require("joi");

// =========================
// Create Tax Validation
// =========================

const createTaxSchema = Joi.object({
  transactionDate: Joi.date().required(),

  transactionType: Joi.string()
    .valid("CREDIT", "DEBIT")
    .required(),

  taxAmount: Joi.number()
    .min(0)
    .required(),

  usedTax: Joi.number()
    .min(0)
    .default(0),

  externalAmount: Joi.number()
    .min(0)
    .default(0),

  sourceType: Joi.string()
    .valid("Purchase", "Delivery")
    .required(),

  sourceId: Joi.string()
    .hex()
    .length(24)
    .required(),

  remarks: Joi.string()
    .trim()
    .allow("")
    .default(""),
});

// =========================
// Update Tax Validation
// =========================

const updateTaxSchema = Joi.object({
  transactionDate: Joi.date().optional(),

  transactionType: Joi.string()
    .valid("CREDIT", "DEBIT")
    .optional(),

  taxAmount: Joi.number()
    .min(0)
    .optional(),

  usedTax: Joi.number()
    .min(0)
    .optional(),

  externalAmount: Joi.number()
    .min(0)
    .optional(),

  sourceType: Joi.string()
    .valid("Purchase", "Delivery")
    .optional(),

  sourceId: Joi.string()
    .hex()
    .length(24)
    .optional(),

  remarks: Joi.string()
    .trim()
    .allow("")
    .optional(),
});

module.exports = {
  createTaxSchema,
  updateTaxSchema,
};
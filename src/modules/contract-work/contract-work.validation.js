
const Joi = require("joi");

const paymentSchema = Joi.object({
  paymentId: Joi.string().optional(),

  paymentType: Joi.string()
    .valid("advance", "payment")
    .default("payment"),

  amount: Joi.number().positive().required(),

  paymentDate: Joi.date().required(),

  paymentMode: Joi.string()
    .valid("Cash", "UPI", "Bank Transfer", "Cheque")
    .required(),

  remarks: Joi.string().allow("").optional(),
});

const createContractWorkSchema = Joi.object({
  contractorName: Joi.string().trim().required(),

  location: Joi.string().hex().length(24).required(),

  workDescription: Joi.string().trim().required(),

  startingDate: Joi.date().required(),

  endingDate: Joi.date().allow(null).optional(),

  contractAmount: Joi.number().positive().required(),

  payments: Joi.array()
    .items(paymentSchema)
    .default([]),

  remarks: Joi.string().allow("").optional(),
});

const updateContractWorkSchema = Joi.object({
  contractorName: Joi.string().trim(),

  location: Joi.string().hex().length(24),

  workDescription: Joi.string().trim(),

  startingDate: Joi.date(),

  endingDate: Joi.date().allow(null),

  contractAmount: Joi.number().positive(),

  payments: Joi.array().items(paymentSchema),

  remarks: Joi.string().allow(""),
}).min(1);

module.exports = {
  createContractWorkSchema,
  updateContractWorkSchema,
};

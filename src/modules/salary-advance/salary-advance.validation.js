const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

// Create Salary Advance
const createSalaryAdvanceSchema = Joi.object({
  employeeId: objectId.required(),

  date: Joi.date().required(),

  amount: Joi.number()
    .min(0)
    .required(),

  remark: Joi.string()
    .trim()
    .allow("", null)
    .optional(),
});

// Update Salary Advance
const updateSalaryAdvanceSchema = Joi.object({
  employeeId: objectId.optional(),

  date: Joi.date().optional(),

  amount: Joi.number()
    .min(0)
    .optional(),

  remark: Joi.string()
    .trim()
    .allow("", null)
    .optional(),
});

module.exports = {
  createSalaryAdvanceSchema,
  updateSalaryAdvanceSchema,
};
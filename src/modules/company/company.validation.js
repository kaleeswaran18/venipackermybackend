const Joi = require("joi");

// CREATE COMPANY
const createCompanySchema = Joi.object({
  companyName: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required(),

  contactPerson: Joi.string()
    .trim()
    .max(100)
    .allow("")
    .optional(),

  phone: Joi.string()
    .trim()
    .max(20)
    .allow("")
    .optional(),

  email: Joi.string()
    .trim()
    .email()
    .allow("")
    .optional(),

  address: Joi.string()
    .trim()
    .max(500)
    .allow("")
    .optional(),

  gstNumber: Joi.string()
    .trim()
    .max(20)
    .allow("")
    .optional(),

  remarks: Joi.string()
    .trim()
    .max(500)
    .allow("")
    .optional(),
});

// UPDATE COMPANY
const updateCompanySchema = Joi.object({
  companyName: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .optional(),

  contactPerson: Joi.string()
    .trim()
    .max(100)
    .allow("")
    .optional(),

  phone: Joi.string()
    .trim()
    .max(20)
    .allow("")
    .optional(),

  email: Joi.string()
    .trim()
    .email()
    .allow("")
    .optional(),

  address: Joi.string()
    .trim()
    .max(500)
    .allow("")
    .optional(),

  gstNumber: Joi.string()
    .trim()
    .max(20)
    .allow("")
    .optional(),

  remarks: Joi.string()
    .trim()
    .max(500)
    .allow("")
    .optional(),

  isActive: Joi.boolean()
    .optional(),
}).min(1);

module.exports = {
  createCompanySchema,
  updateCompanySchema,
};
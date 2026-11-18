
const Joi = require("joi");

// CREATE VEHICLE EXPENSE
const createVehicleExpenseSchema = Joi.object({
  date: Joi.date()
    .required(),

  vehicle: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required(),

  driver: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required(),

  startKms: Joi.number()
    .min(0)
    .required(),
});

// UPDATE VEHICLE EXPENSE
const updateVehicleExpenseSchema = Joi.object({
  serialNo: Joi.number()
    .integer()
    .min(1)
    .optional(),

  date: Joi.date()
    .optional(),

  vehicle: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .optional(),

  driver: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .optional(),

  startKms: Joi.number()
    .min(0)
    .optional(),

  endKms: Joi.number()
    .min(0)
    .allow(null)
    .optional(),

  totalKms: Joi.number()
    .min(0)
    .allow(null)
    .optional(),

  diesel: Joi.number()
    .min(0)
    .optional(),

  // OTHER AMOUNT
  otherAmount: Joi.number()
    .min(0)
    .optional(),

  // OTHER REMARK DESCRIPTION
  remarkDescription: Joi.array()
    .items(
      Joi.object({
        description: Joi.string()
          .trim()
          .allow("")
          .required(),

        amount: Joi.number()
          .min(0)
          .required(),
      })
    )
    .optional(),

  status: Joi.string()
    .valid(
      "In Progress",
      "Completed"
    )
    .optional(),

  reason: Joi.string()
    .allow("")
    .optional(),
});

module.exports = {
  createVehicleExpenseSchema,
  updateVehicleExpenseSchema,
};

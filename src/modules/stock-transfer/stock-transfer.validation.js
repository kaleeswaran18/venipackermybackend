
const Joi = require("joi");

// ==========================================
// COMMON VALIDATION
// ==========================================

const objectId = Joi.string()
  .hex()
  .length(24);

const stockType = Joi.string()
  .valid("item", "nail", "consumable");

const unit = Joi.string()
  .valid("kg", "g", "pcs");

// ==========================================
// CREATE STOCK TRANSFER VALIDATION
// ==========================================

const createStockTransferValidation = Joi.object({
  fromLocation: objectId.required(),

  toLocation: objectId.required(),

  itemType: stockType.required(),

  category: Joi.when("itemType", {
    is: "item",
    then: objectId.required(),
    otherwise: Joi.forbidden(),
  }),

  referenceId: objectId.required(),

  quantity: Joi.when("itemType", {
    is: "item",
    then: Joi.number().positive().optional(),
    otherwise: Joi.number().positive().required(),
  }),

  unit: Joi.when("itemType", {
    is: "item",
    then: unit.optional(),
    otherwise: unit.required(),
  }),

  pieces: Joi.when("itemType", {
    is: "item",
    then: Joi.array()
      .items(
        Joi.object({
          pieceSizeId: objectId.required(),
          count: Joi.number().integer().min(1).required(),
        })
      )
      .optional(),
    otherwise: Joi.forbidden(),
  }),

  remarks: Joi.string().trim().allow("").max(500).optional(),
})
  .custom((value, helpers) => {
    if (String(value.fromLocation) === String(value.toLocation)) {
      return helpers.error("any.invalid");
    }

    return value;
  })
  .messages({
    "any.invalid": "From and To locations cannot be the same",
  })
  .unknown(false);

// ==========================================
// UPDATE STOCK TRANSFER VALIDATION
// ==========================================

const updateStockTransferValidation = Joi.object({
  quantity: Joi.number().positive().optional(),

  pieces: Joi.array()
    .items(
      Joi.object({
        pieceSizeId: objectId.required(),
        count: Joi.number().integer().min(1).required(),
      })
    )
    .min(1)
    .optional(),

  unit: unit.optional(),

  remarks: Joi.string().trim().allow("").max(500).optional(),
})
  .min(1)
  .unknown(false);

// ==========================================
// GET ALL STOCK TRANSFERS VALIDATION
// ==========================================

const getAllStockTransfersValidation = Joi.object({
  fromLocation: objectId.optional(),

  toLocation: objectId.optional(),

  itemType: stockType.optional(),

  referenceId: objectId.optional(),

  startDate: Joi.date().iso().optional(),

  endDate: Joi.date().iso().min(Joi.ref("startDate")).optional(),
})
  .unknown(false);

// ==========================================
// GET BY LOCATION VALIDATION
// ==========================================

const getStockTransfersByLocationValidation = Joi.object({
  locationId: objectId.required(),
});

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  createStockTransferValidation,
  updateStockTransferValidation,
  getAllStockTransfersValidation,
  getStockTransfersByLocationValidation,
};

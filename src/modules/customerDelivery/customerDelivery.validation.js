
const Joi = require("joi");

// DELIVERY FIELD UPDATE
const deliveryFieldUpdateSchema = Joi.object({
  fieldId: Joi.string().required(),

  deliveredQuantity: Joi.number().min(0).optional(),

  pendingQuantity: Joi.number().min(0).optional(),
});

// CREATE - Internal use only
const createCustomerDeliverySchema = Joi.object({
  deliveryNo: Joi.string().trim().required(),

  orderId: Joi.string().hex().length(24).required(),

  // COMPANY REFERENCE
  companyId: Joi.string().hex().length(24).required(),

  customerName: Joi.string().trim().required(),

  expectedDeliveryDate: Joi.date().required(),

  actualDeliveryDate: Joi.date().allow(null).optional(),

  deliveryStatus: Joi.string()
    .valid(
      "Pending",
      "Partially Delivered",
      "Delivered",
      "Cancelled"
    )
    .default("Pending"),

  products: Joi.array()
    .items(
      Joi.object({
        finishedMaterialCategoryId: Joi.string().required(),

        finishedMaterialCategoryName: Joi.string().trim().required(),

        productId: Joi.string().required(),

        productName: Joi.string().trim().required(),

        size: Joi.string().trim().allow("").optional(),

        fields: Joi.array()
          .items(
            Joi.object({
              fieldId: Joi.string().required(),
              fieldName: Joi.string().trim().required(),
              orderedQuantity: Joi.number().min(0).required(),
              deliveredQuantity: Joi.number().min(0).default(0),
              pendingQuantity: Joi.number().min(0).required(),
            })
          )
          .min(1)
          .required(),

        ratePerPiece: Joi.number().min(0).required(),

        amount: Joi.number().min(0).required(),
      })
    )
    .min(1)
    .required(),

  remarks: Joi.string().trim().allow("").optional(),
});

// UPDATE
const updateCustomerDeliverySchema = Joi.object({
  expectedDeliveryDate: Joi.date().optional(),

  actualDeliveryDate: Joi.date().allow(null).optional(),

  deliveryStatus: Joi.string()
    .valid(
      "Pending",
      "Partially Delivered",
      "Delivered",
      "Cancelled"
    )
    .optional(),

  // TAX AMOUNT
  taxAmount: Joi.number().min(0).optional(),

  products: Joi.array()
    .items(
      Joi.object({
        _id: Joi.string().optional(),

        fields: Joi.array()
          .items(deliveryFieldUpdateSchema)
          .min(1)
          .required(),
      })
    )
    .optional(),

  remarks: Joi.string().trim().allow("").optional(),
});

module.exports = {
  createCustomerDeliverySchema,
  updateCustomerDeliverySchema,
};

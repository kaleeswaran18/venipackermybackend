const Joi = require("joi");

// =========================
// Create Purchase Validation
// =========================

const createPurchaseSchema = Joi.object({
  purchaseDate: Joi.date().required(),

  location: Joi.string()
    .hex()
    .length(24)
    .required(),

  type: Joi.string()
    .valid("item", "nail", "consumable")
    .required(),

  category: Joi.string()
    .hex()
    .length(24)
    .when("type", {
      is: "item",
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),

  referenceId: Joi.string()
    .hex()
    .length(24)
    .required(),

  // =========================
  // Quantity
  // =========================

  quantity: Joi.number()
    .min(0)
    .allow(null),

  unit: Joi.string()
    .valid("kg", "g", "pcs")
    .allow(null),

  // =========================
  // New Item
  // =========================

  cft: Joi.number()
    .min(0)
    .allow(null),

  cubicMeter: Joi.number()
    .min(0)
    .allow(null),

  pieces: Joi.array()
    .items(
      Joi.object({
        pieceSizeId: Joi.string()
          .hex()
          .length(24)
          .required(),

        width: Joi.number()
          .min(0)
          .required(),

        inch: Joi.number()
          .min(0)
          .required(),

        feet: Joi.number()
          .min(0)
          .required(),

        count: Joi.number()
          .min(0)
          .required(),
      })
    )
    .default([]),

  // =========================
  // Supplier Details
  // =========================

  supplierName: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required(),

  supplierPhone: Joi.string()
    .trim()
    .min(10)
    .max(15)
    .required(),

  supplierAddress: Joi.string()
    .trim()
    .min(2)
    .max(300)
    .required(),

  // =========================
  // Amount Details
  // =========================

  amount: Joi.number()
    .min(0)
    .required(),

  taxAmount: Joi.number()
    .min(0)
    .required(),

  totalAmount: Joi.number()
    .min(0)
    .required(),

  // =========================
  // Payment History
  // =========================

  paymentHistory: Joi.array()
    .items(
      Joi.object({
        paymentDate: Joi.date().required(),

        amount: Joi.number()
          .min(0)
          .required(),

        paymentMode: Joi.string()
          .valid(
            "Cash",
            "UPI",
            "Bank Transfer",
            "Cheque"
          )
          .required(),

        referenceNo: Joi.string()
          .trim()
          .allow("")
          .default(""),

        remarks: Joi.string()
          .trim()
          .allow("")
          .default(""),
      })
    )
    .default([]),

  paidAmount: Joi.number()
    .min(0)
    .default(0),

  pendingAmount: Joi.number()
    .min(0)
    .default(0),

  paymentStatus: Joi.string()
    .valid(
      "Pending",
      "Partially Paid",
      "Paid"
    )
    .default("Pending"),

  // =========================
  // Remarks
  // =========================

  remarks: Joi.string()
    .trim()
    .allow("")
    .default(""),
});

// =========================
// Update Purchase Validation
// =========================

const updatePurchaseSchema = Joi.object({
  purchaseDate: Joi.date().optional(),

  location: Joi.string()
    .hex()
    .length(24)
    .optional(),

  type: Joi.string()
    .valid("item", "nail", "consumable")
    .optional(),

  category: Joi.string()
    .hex()
    .length(24)
    .allow(null)
    .optional(),

  referenceId: Joi.string()
    .hex()
    .length(24)
    .optional(),

  // =========================
  // Quantity
  // =========================

  quantity: Joi.number()
    .min(0)
    .allow(null)
    .optional(),

  unit: Joi.string()
    .valid("kg", "g", "pcs")
    .allow(null)
    .optional(),

  // =========================
  // New Item
  // =========================

  cft: Joi.number()
    .min(0)
    .allow(null)
    .optional(),

  cubicMeter: Joi.number()
    .min(0)
    .allow(null)
    .optional(),

  pieces: Joi.array()
    .items(
      Joi.object({
        pieceSizeId: Joi.string()
          .hex()
          .length(24)
          .required(),

        width: Joi.number()
          .min(0)
          .required(),

        inch: Joi.number()
          .min(0)
          .required(),

        feet: Joi.number()
          .min(0)
          .required(),

        count: Joi.number()
          .min(0)
          .required(),
      })
    )
    .optional(),

  // =========================
  // Supplier Details
  // =========================

  supplierName: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .optional(),

  supplierPhone: Joi.string()
    .trim()
    .min(10)
    .max(15)
    .optional(),

  supplierAddress: Joi.string()
    .trim()
    .min(2)
    .max(300)
    .optional(),

  // =========================
  // Amount Details
  // =========================

  amount: Joi.number()
    .min(0)
    .optional(),

  taxAmount: Joi.number()
    .min(0)
    .optional(),

  totalAmount: Joi.number()
    .min(0)
    .optional(),

  // =========================
  // Payment History
  // =========================

  paymentHistory: Joi.array()
    .items(
      Joi.object({
        paymentDate: Joi.date().required(),

        amount: Joi.number()
          .min(0)
          .required(),

        paymentMode: Joi.string()
          .valid(
            "Cash",
            "UPI",
            "Bank Transfer",
            "Cheque"
          )
          .required(),

        referenceNo: Joi.string()
          .trim()
          .allow("")
          .default(""),

        remarks: Joi.string()
          .trim()
          .allow("")
          .default(""),
      })
    )
    .optional(),

  paidAmount: Joi.number()
    .min(0)
    .optional(),

  pendingAmount: Joi.number()
    .min(0)
    .optional(),

  paymentStatus: Joi.string()
    .valid(
      "Pending",
      "Partially Paid",
      "Paid"
    )
    .optional(),

  // =========================
  // Remarks
  // =========================

  remarks: Joi.string()
    .trim()
    .allow("")
    .optional(),
});

module.exports = {
  createPurchaseSchema,
  updatePurchaseSchema,
};
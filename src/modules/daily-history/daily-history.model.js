const mongoose = require("mongoose");

const dailyHistorySchema = new mongoose.Schema(
  {
    // --------------------------------
    // WHICH DAY THIS DAILY RECORD
    // BELONGS TO
    // --------------------------------
    date: {
      type: Date,
      required: true,
    },

    // --------------------------------
    // ATTENDANCE
    // --------------------------------
    attendance: [
      {
        locationId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Location",
          required: true,
        },

        workersPresent: {
          type: Number,
          min: 0,
          default: 0,
        },

        workerDetails: {
          type: String,
          trim: true,
          default: "",
        },
      },
    ],

    // --------------------------------
    // PRODUCTION
    // Location
    //   → Category
    //      → Products
    //         → Fields
    // --------------------------------
    production: [
      {
        locationId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Location",
          required: true,
        },

        categories: [
          {
            categoryId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "FinishedMaterial",
              required: true,
            },

            products: [
              {
                productId: {
                  type: mongoose.Schema.Types.ObjectId,
                  ref: "FinishedMaterialProduct",
                  required: true,
                },

                values: {
                  type: Map,
                  of: mongoose.Schema.Types.Mixed,
                  default: {},
                },
              },
            ],
          },
        ],
      },
    ],

    // --------------------------------
    // CONSUMPTION
    //
    // Location
    //   → Item / Nail / Consumable
    //
    // Used Item / Nail / Consumable
    //   → Quantity + Unit
    //
    // New Item
    //   → CFT
    //   → Cubic Meter
    //   → Pieces
    // --------------------------------
    consumption: [
      {
        locationId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Location",
          required: true,
        },

        items: [
          {
            type: {
              type: String,
              enum: [
                "item",
                "nail",
                "consumable",
              ],
              required: true,
            },

            // --------------------------------
            // ITEM CATEGORY
            // Used Item / New Item
            // --------------------------------
            category: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "ItemCategory",
            },

            referenceId: {
              type: mongoose.Schema.Types.ObjectId,
              required: true,
            },

            // --------------------------------
            // USED ITEM / NAIL / CONSUMABLE
            // --------------------------------
            quantity: {
              type: Number,
              min: 0,
            },

            unit: {
              type: String,
              enum: [
                "kg",
                "g",
                "pcs",
                "ltr",
              ],
            },

            // --------------------------------
            // NEW ITEM
            // --------------------------------
            cft: {
              type: Number,
              min: 0,
            },

            cubicMeter: {
              type: Number,
              min: 0,
            },

            // --------------------------------
            // NEW ITEM PIECES
            // --------------------------------
            pieces: {
              type: [
                {
                  pieceSizeId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "PieceSize",
                    required: true,
                  },

                  width: {
                    type: Number,
                    required: true,
                    min: 0,
                  },

                  inch: {
                    type: Number,
                    required: true,
                    min: 0,
                  },

                  height: {
                    type: Number,
                    required: true,
                    min: 0,
                  },

                  count: {
                    type: Number,
                    required: true,
                    min: 0,
                    default: 0,
                  },
                },
              ],

              // Important:
              // Nail / Consumable / Used Item
              // should NOT automatically get []
              default: undefined,
            },
          },
        ],
      },
    ],

    // --------------------------------
    // CUSTOMER DELIVERY
    // Actual deliveries only
    // Location-wise
    // --------------------------------
    customerDelivery: [
      {
        locationId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Location",
          required: true,
        },

        companyName: {
          type: String,
          trim: true,
          required: true,
        },

        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "FinishedMaterialProduct",
          required: true,
        },

        quantity: {
          type: Number,
          min: 0,
          required: true,
        },

        unit: {
          type: String,
          enum: [
            "kg",
            "g",
            "pcs",
            "ltr",
            "boxes",
          ],
        },
      },
    ],

    // --------------------------------
    // UPDATE TRACKING
    // Location-wise
    // --------------------------------
    updates: [
      {
        type: {
          type: String,
          enum: [
            "production",
            "attendance",
            "consumption",
            "customer_delivery",
          ],
          required: true,
        },

        locationId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Location",
          required: true,
        },

        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },

        updatedAt: {
          type: Date,
          default: Date.now,
        },

        // --------------------------------
        // ACTUAL UPDATE DATA
        // --------------------------------
        data: {
          type: mongoose.Schema.Types.Mixed,
          default: {},
        },
      },
    ],
    // --------------------------------
// UPDATE HISTORY / AUDIT HISTORY
// All activity create / edit history
// --------------------------------
updatesHistory: [
  {
    type: {
      type: String,
      enum: [
        "production",
        "attendance",
        "consumption",
        "customer_delivery",
      ],
      required: true,
    },

    action: {
      type: String,
      enum: [
        "created",
        "updated",
        "deleted",
      ],
      required: true,
    },

    // Original updates[] record ID
    updateId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },

    // Before change
    oldData: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined,
    },

    // After change
    newData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
],
  },
  {
    timestamps: true,
  }
);

// --------------------------------
// ONE DAILY HISTORY RECORD
// FOR ONE DATE
// --------------------------------
dailyHistorySchema.index(
  {
    date: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model(
  "DailyHistory",
  dailyHistorySchema
);
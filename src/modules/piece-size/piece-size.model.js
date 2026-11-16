const mongoose = require("mongoose");

const pieceSizeSchema = new mongoose.Schema(
  {
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

    feet: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "PieceSize",
  pieceSizeSchema
);
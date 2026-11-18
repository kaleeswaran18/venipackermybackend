
const mongoose = require("mongoose");

const pieceSizeSchema = new mongoose.Schema(
  {
    width: {
      type: Number,
      required: true,
      min: 0,
    },

    height: {
      type: Number,
      required: true,
      min: 0,
    },

    inch: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate Piece Sizes
pieceSizeSchema.index(
  {
    width: 1,
    height: 1,
    inch: 1,
  
  },
  {
    unique: true,
    name: "unique_piece_size",
  }
);

module.exports = mongoose.model(
  "PieceSize",
  pieceSizeSchema
);

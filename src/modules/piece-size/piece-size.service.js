
const PieceSize = require("./piece-size.model");

const OpeningStock = require(
  "../opening-stock/opening-stock.model"
);

const ItemCategory = require(
  "../item-categories/item-category.model"
);

const DailyHistory = require(
  "../daily-history/daily-history.model"
);


// ----------------------------------------
// HELPER: FIND NEW ITEM CATEGORY
// ----------------------------------------

const getNewItemCategory = async () => {
  return await ItemCategory.findOne({
    name: "newitem",
  });
};


// ----------------------------------------
// HELPER: ADD PIECE SIZE TO DAILY HISTORY
// ----------------------------------------

const addPieceSizeToDailyHistory = async (
  categoryId,
  pieceSize
) => {
  const dailyHistories = await DailyHistory.find({
    "consumption.items.type": "item",
  });

  let updatedHistories = 0;

  for (const dailyHistory of dailyHistories) {
    let isModified = false;

    for (const location of dailyHistory.consumption || []) {
      for (const item of location.items || []) {

        // Only New Item records
        if (
          item.type !== "item" ||
          item.category?.toString() !== categoryId.toString()
        ) {
          continue;
        }

        if (!Array.isArray(item.pieces)) {
          item.pieces = [];
          isModified = true;
        }

        // Prevent duplicate piece size
        const existingPiece = item.pieces.find(
          (piece) =>
            piece.pieceSizeId?.toString() ===
            pieceSize._id.toString()
        );

        if (existingPiece) {
          continue;
        }

        // Add new piece with zero count
        item.pieces.push({
          pieceSizeId: pieceSize._id,
          width: pieceSize.width,
          inch: pieceSize.inch,
          feet: pieceSize.feet,
          count: 0,
        });

        isModified = true;
      }
    }

    if (isModified) {
      dailyHistory.markModified("consumption");
      await dailyHistory.save();

      updatedHistories++;
    }
  }

  return updatedHistories;
};


// ----------------------------------------
// HELPER: UPDATE PIECE SIZE IN DAILY HISTORY
// ----------------------------------------

const updatePieceSizeInDailyHistory = async (
  pieceSize
) => {
  const dailyHistories = await DailyHistory.find({
    "consumption.items.type": "item",
  });

  let updatedHistories = 0;

  for (const dailyHistory of dailyHistories) {
    let isModified = false;

    for (const location of dailyHistory.consumption || []) {
      for (const item of location.items || []) {
        if (
          item.type !== "item" ||
          !Array.isArray(item.pieces)
        ) {
          continue;
        }

        const piece = item.pieces.find(
          (entry) =>
            entry.pieceSizeId?.toString() ===
            pieceSize._id.toString()
        );

        if (!piece) {
          continue;
        }

        piece.width = pieceSize.width;
        piece.inch = pieceSize.inch;
        piece.feet = pieceSize.feet;

        // Existing count is not changed
        isModified = true;
      }
    }

    if (isModified) {
      dailyHistory.markModified("consumption");
      await dailyHistory.save();

      updatedHistories++;
    }
  }

  return updatedHistories;
};


// ----------------------------------------
// HELPER: DELETE PIECE SIZE FROM DAILY HISTORY
// ----------------------------------------

const deletePieceSizeFromDailyHistory = async (
  pieceSizeId
) => {
  const dailyHistories = await DailyHistory.find({
    "consumption.items.type": "item",
  });

  let updatedHistories = 0;

  for (const dailyHistory of dailyHistories) {
    let isModified = false;

    for (const location of dailyHistory.consumption || []) {
      for (const item of location.items || []) {
        if (
          item.type !== "item" ||
          !Array.isArray(item.pieces)
        ) {
          continue;
        }

        const originalLength = item.pieces.length;

        item.pieces = item.pieces.filter(
          (piece) =>
            piece.pieceSizeId?.toString() !==
            pieceSizeId.toString()
        );

        if (item.pieces.length !== originalLength) {
          isModified = true;
        }
      }
    }

    if (isModified) {
      dailyHistory.markModified("consumption");
      await dailyHistory.save();

      updatedHistories++;
    }
  }

  return updatedHistories;
};


// ----------------------------------------
// CREATE PIECE SIZE
// ----------------------------------------

const createPieceSize = async (data) => {
  // 1. Create Piece Size
  const pieceSize = await PieceSize.create(data);

  // 2. Find New Item category
  const newItemCategory = await getNewItemCategory();

  if (!newItemCategory) {
    return pieceSize;
  }

  // 3. Find New Item OpeningStocks
  const openingStocks = await OpeningStock.find({
    type: "item",
    category: newItemCategory._id,
  });

  // 4. Add new piece to OpeningStock
  for (const openingStock of openingStocks) {
    if (!Array.isArray(openingStock.pieces)) {
      openingStock.pieces = [];
    }

    const exists = openingStock.pieces.some(
      (piece) =>
        piece.pieceSizeId?.toString() ===
        pieceSize._id.toString()
    );

    if (exists) {
      continue;
    }

    openingStock.pieces.push({
      pieceSizeId: pieceSize._id,
      width: pieceSize.width,
      inch: pieceSize.inch,
      feet: pieceSize.feet,
      count: 0,
    });

    await openingStock.save();
  }

  // 5. Add to all existing DailyHistory Consumption
  await addPieceSizeToDailyHistory(
    newItemCategory._id,
    pieceSize
  );

  return pieceSize;
};


// ----------------------------------------
// GET ALL PIECE SIZES
// ----------------------------------------

const getPieceSizes = async () => {
  return await PieceSize.find()
    .sort({ createdAt: 1 });
};


// ----------------------------------------
// GET PIECE SIZE BY ID
// ----------------------------------------

const getPieceSizeById = async (id) => {
  const pieceSize = await PieceSize.findById(id);

  if (!pieceSize) {
    const error = new Error("Piece size not found");
    error.statusCode = 404;
    throw error;
  }

  return pieceSize;
};


// ----------------------------------------
// UPDATE PIECE SIZE
// ----------------------------------------

const updatePieceSize = async (id, data) => {
  // 1. Find Piece Size
  const pieceSize = await PieceSize.findById(id);

  if (!pieceSize) {
    const error = new Error("Piece size not found");
    error.statusCode = 404;
    throw error;
  }

  // 2. Update Piece Size Master
  Object.assign(pieceSize, data);

  await pieceSize.save();

  // 3. Find New Item category
  const newItemCategory = await getNewItemCategory();

  if (!newItemCategory) {
    return pieceSize;
  }

  // 4. Update OpeningStock
  const openingStocks = await OpeningStock.find({
    type: "item",
    category: newItemCategory._id,
  });

  for (const openingStock of openingStocks) {
    const piece = (openingStock.pieces || []).find(
      (item) =>
        item.pieceSizeId?.toString() ===
        pieceSize._id.toString()
    );

    if (!piece) {
      continue;
    }

    piece.width = pieceSize.width;
    piece.inch = pieceSize.inch;
    piece.feet = pieceSize.feet;

    // count untouched
    await openingStock.save();
  }

  // 5. Update DailyHistory Consumption
  await updatePieceSizeInDailyHistory(pieceSize);

  return pieceSize;
};


// ----------------------------------------
// DELETE PIECE SIZE
// ----------------------------------------

const deletePieceSize = async (id) => {
  // 1. Find Piece Size
  const pieceSize = await PieceSize.findById(id);

  if (!pieceSize) {
    const error = new Error("Piece size not found");
    error.statusCode = 404;
    throw error;
  }

  // 2. Find New Item category
  const newItemCategory = await getNewItemCategory();

  // 3. Remove from OpeningStock
  if (newItemCategory) {
    const openingStocks = await OpeningStock.find({
      type: "item",
      category: newItemCategory._id,
    });

    for (const openingStock of openingStocks) {
      openingStock.pieces =
        (openingStock.pieces || []).filter(
          (piece) =>
            piece.pieceSizeId?.toString() !==
            pieceSize._id.toString()
        );

      await openingStock.save();
    }
  }

  // 4. Remove from DailyHistory Consumption
  await deletePieceSizeFromDailyHistory(
    pieceSize._id
  );

  // 5. Delete PieceSize master
  await pieceSize.deleteOne();

  return {
    message: "Piece size deleted successfully",
  };
};


module.exports = {
  createPieceSize,
  getPieceSizes,
  getPieceSizeById,
  updatePieceSize,
  deletePieceSize,
};


const mongoose = require("mongoose");
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
// HELPER: DUPLICATE PIECE SIZE ERROR
// ----------------------------------------

const createDuplicateError = (data) => {
  const error = new Error(
    `Piece Size already exists (${data.width} × ${data.height} × ${data.inch})`
  );

  error.statusCode = 409;

  return error;
};


// ----------------------------------------
// HELPER: FIND NEW ITEM CATEGORY
// ----------------------------------------

const getNewItemCategory = async (session = null) => {
  const query = ItemCategory.findOne({
    name: "newitem",
  });

  if (session) query.session(session);

  return await query;
};


// ----------------------------------------
// HELPER: CHECK DUPLICATE PIECE SIZE
// ----------------------------------------

const checkDuplicatePieceSize = async (
  data,
  excludeId = null,
  session = null
) => {
  const query = {
    width: Number(data.width),
    height: Number(data.height),
    inch: Number(data.inch),
  };

  // Exclude current record during update
  if (excludeId) {
    query._id = {
      $ne: excludeId,
    };
  }

  const duplicateQuery = PieceSize.findOne(query);

  if (session) duplicateQuery.session(session);

  const existingPieceSize = await duplicateQuery;

  if (existingPieceSize) {
    throw createDuplicateError(data);
  }
};


// ----------------------------------------
// HELPER: HANDLE MONGODB DUPLICATE ERROR
// ----------------------------------------

const handleDuplicateKeyError = (error, data) => {
  if (error.code === 11000) {
    throw createDuplicateError(data);
  }

  throw error;
};


// ----------------------------------------
// HELPER: ADD PIECE SIZE TO DAILY HISTORY
// ----------------------------------------

const addPieceSizeToDailyHistory = async (
  categoryId,
  pieceSize,
  session = null
) => {
  const dailyHistoryQuery = DailyHistory.find({
    "consumption.items.type": "item",
  });

  if (session) dailyHistoryQuery.session(session);

  const dailyHistories = await dailyHistoryQuery;

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
          height: pieceSize.height,
          inch: pieceSize.inch,
          count: 0,
        });

        isModified = true;
      }
    }

    if (isModified) {
      dailyHistory.markModified("consumption");
      await dailyHistory.save(session ? { session } : undefined);

      updatedHistories++;
    }
  }

  return updatedHistories;
};


// ----------------------------------------
// HELPER: UPDATE PIECE SIZE IN DAILY HISTORY
// ----------------------------------------

const updatePieceSizeInDailyHistory = async (
  pieceSize,
  session = null
) => {
  const dailyHistoryQuery = DailyHistory.find({
    "consumption.items.type": "item",
  });

  if (session) dailyHistoryQuery.session(session);

  const dailyHistories = await dailyHistoryQuery;

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
        piece.height = pieceSize.height;
        piece.inch = pieceSize.inch;

        // Existing count is not changed
        isModified = true;
      }
    }

    if (isModified) {
      dailyHistory.markModified("consumption");
      await dailyHistory.save(session ? { session } : undefined);

      updatedHistories++;
    }
  }

  return updatedHistories;
};


// ----------------------------------------
// HELPER: DELETE PIECE SIZE FROM DAILY HISTORY
// ----------------------------------------

const deletePieceSizeFromDailyHistory = async (
  pieceSizeId,
  session = null
) => {
  const dailyHistoryQuery = DailyHistory.find({
    "consumption.items.type": "item",
  });

  if (session) dailyHistoryQuery.session(session);

  const dailyHistories = await dailyHistoryQuery;

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
      await dailyHistory.save(session ? { session } : undefined);

      updatedHistories++;
    }
  }

  return updatedHistories;
};


// ----------------------------------------
// CREATE PIECE SIZE
// ----------------------------------------

const createPieceSize = async (data) => {
  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      // 1. Check Duplicate
      await checkDuplicatePieceSize(data, null, session);

      let pieceSize;

      try {
        // 2. Create Piece Size
        const createdPieceSizes = await PieceSize.create([data], { session });
        pieceSize = createdPieceSizes[0];
      } catch (error) {
        handleDuplicateKeyError(error, data);
      }

      // 3. Find New Item category
      const newItemCategory = await getNewItemCategory(session);

      if (!newItemCategory) {
        result = pieceSize;
        return;
      }

      // 4. Find New Item OpeningStocks
      const openingStocks = await OpeningStock.find({
        type: "item",
        category: newItemCategory._id,
      }).session(session);

      // 5. Add new piece to OpeningStock
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
          height: pieceSize.height,
          inch: pieceSize.inch,
          count: 0,
        });

        await openingStock.save({ session });
      }

      // 6. Add to all existing DailyHistory Consumption
      await addPieceSizeToDailyHistory(
        newItemCategory._id,
        pieceSize,
        session
      );

      result = pieceSize;
    });

    return result;
  } finally {
    await session.endSession();
  }
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
  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      // 1. Find Piece Size
      const pieceSize = await PieceSize.findById(id).session(session);

      if (!pieceSize) {
        const error = new Error("Piece size not found");
        error.statusCode = 404;
        throw error;
      }

      // 2. Prepare updated values
      const updatedData = {
        width: data.width ?? pieceSize.width,
        height: data.height ?? pieceSize.height,
        inch: data.inch ?? pieceSize.inch,
      };

      // 3. Check Duplicate (Exclude Current ID)
      await checkDuplicatePieceSize(
        updatedData,
        id,
        session
      );

      // 4. Update Piece Size Master
      Object.assign(pieceSize, data);

      try {
        await pieceSize.save({ session });
      } catch (error) {
        handleDuplicateKeyError(error, updatedData);
      }

      // 5. Find New Item category
      const newItemCategory = await getNewItemCategory(session);

      if (!newItemCategory) {
        result = pieceSize;
        return;
      }

      // 6. Update OpeningStock
      const openingStocks = await OpeningStock.find({
        type: "item",
        category: newItemCategory._id,
      }).session(session);

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
        piece.height = pieceSize.height;
        piece.inch = pieceSize.inch;

        // count untouched
        await openingStock.save({ session });
      }

      // 7. Update DailyHistory Consumption
      await updatePieceSizeInDailyHistory(pieceSize, session);

      result = pieceSize;
    });

    return result;
  } finally {
    await session.endSession();
  }
};

// ----------------------------------------
// DELETE PIECE SIZE
// ----------------------------------------

const deletePieceSize = async (id) => {
  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      // 1. Find Piece Size
      const pieceSize = await PieceSize.findById(id).session(session);

      if (!pieceSize) {
        const error = new Error("Piece size not found");
        error.statusCode = 404;
        throw error;
      }

      // 2. Find New Item category
      const newItemCategory = await getNewItemCategory(session);

      // 3. Remove from OpeningStock
      if (newItemCategory) {
        const openingStocks = await OpeningStock.find({
          type: "item",
          category: newItemCategory._id,
        }).session(session);

        for (const openingStock of openingStocks) {
          openingStock.pieces =
            (openingStock.pieces || []).filter(
              (piece) =>
                piece.pieceSizeId?.toString() !==
                pieceSize._id.toString()
            );

          await openingStock.save({ session });
        }
      }

      // 4. Remove from DailyHistory Consumption
      await deletePieceSizeFromDailyHistory(
        pieceSize._id,
        session
      );

      // 5. Delete PieceSize master
      await pieceSize.deleteOne({ session });

      result = {
        message: "Piece size deleted successfully",
      };
    });

    return result;
  } finally {
    await session.endSession();
  }
};

module.exports = {
  createPieceSize,
  getPieceSizes,
  getPieceSizeById,
  updatePieceSize,
  deletePieceSize,
};

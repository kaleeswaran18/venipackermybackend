const express = require("express");
const router = express.Router();

const pieceSizeController = require("./piece-size.controller");

router.post(
  "/",
  pieceSizeController.createPieceSize
);

router.get(
  "/",
  pieceSizeController.getPieceSizes
);

router.get(
  "/:id",
  pieceSizeController.getPieceSizeById
);

router.patch(
  "/:id",
  pieceSizeController.updatePieceSize
);

router.delete(
  "/:id",
  pieceSizeController.deletePieceSize
);

module.exports = router;
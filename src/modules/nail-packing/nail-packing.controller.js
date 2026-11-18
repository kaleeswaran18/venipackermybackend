const nailPackingService = require(
  "./nail-packing.service"
);

// ==========================================
// GET / CREATE MONTHLY REPORT
// ==========================================

const getNailPackingReport = async (
  req,
  res,
  next
) => {
  try {
    const { month, year } = req.query;

    const report =
      await nailPackingService.getNailPackingReport(
        Number(month),
        Number(year)
      );

    res.status(200).json({
      success: true,
      message: "Nail packing report fetched successfully",
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// UPDATE DAILY PRODUCTION
// ==========================================

const updateNailPackingDaily = async (
  req,
  res,
  next
) => {
  try {
    const report =
      await nailPackingService.updateNailPackingDaily(
        req.params.id,
        req.params.date,
        req.body
      );

    res.status(200).json({
      success: true,
      message: "Nail packing daily entry updated successfully",
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNailPackingReport,
  updateNailPackingDaily,
};
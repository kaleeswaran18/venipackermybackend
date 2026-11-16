const companyService = require("./company.service");

// =========================
// CREATE COMPANY
// =========================

const createCompany = async (req, res, next) => {
  try {
    const company = await companyService.createCompany(
      req.body
    );

    res.status(201).json({
      success: true,
      message: "Company created successfully",
      data: company,
    });
  } catch (error) {
    next(error);
  }
};


// =========================
// GET ALL COMPANIES
// =========================

const getAllCompanies = async (req, res, next) => {
  try {
    const companies =
      await companyService.getAllCompanies();

    res.status(200).json({
      success: true,
      message: "Companies fetched successfully",
      data: companies,
    });
  } catch (error) {
    next(error);
  }
};


// =========================
// GET COMPANY BY ID
// =========================

const getCompanyById = async (req, res, next) => {
  try {
    const company =
      await companyService.getCompanyById(
        req.params.id
      );

    res.status(200).json({
      success: true,
      message: "Company fetched successfully",
      data: company,
    });
  } catch (error) {
    next(error);
  }
};


// =========================
// UPDATE COMPANY
// =========================

const updateCompany = async (req, res, next) => {
  try {
    const company =
      await companyService.updateCompany(
        req.params.id,
        req.body
      );

    res.status(200).json({
      success: true,
      message: "Company updated successfully",
      data: company,
    });
  } catch (error) {
    next(error);
  }
};


// =========================
// DELETE COMPANY
// =========================

const deleteCompany = async (req, res, next) => {
  try {
    const result =
      await companyService.deleteCompany(
        req.params.id
      );

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        id: result.id,
      },
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  createCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
};
const Company = require("./company.model");

// =========================
// CREATE COMPANY
// =========================

const createCompany = async (data) => {
  const companyName = data.companyName.trim();

  const existingCompany = await Company.findOne({
    companyName: {
      $regex: `^${companyName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
      $options: "i",
    },
  });

  if (existingCompany) {
    throw new Error("Company already exists");
  }

  const company = await Company.create({
    ...data,
    companyName,
  });

  return company;
};


// =========================
// GET ALL COMPANIES
// =========================

const getAllCompanies = async () => {
  const companies = await Company.find()
    .sort({ createdAt: 1 });

  return companies;
};


// =========================
// GET COMPANY BY ID
// =========================

const getCompanyById = async (companyId) => {
  const company = await Company.findById(companyId);

  if (!company) {
    throw new Error("Company not found");
  }

  return company;
};


// =========================
// UPDATE COMPANY
// =========================

const updateCompany = async (companyId, data) => {
  const company = await Company.findById(companyId);

  if (!company) {
    throw new Error("Company not found");
  }

  if (
    data.companyName &&
    data.companyName.trim().toLowerCase() !==
      company.companyName.toLowerCase()
  ) {
    const companyName = data.companyName.trim();

    const existingCompany = await Company.findOne({
      companyName: {
        $regex: `^${companyName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      },
      _id: { $ne: companyId },
    });

    if (existingCompany) {
      throw new Error("Company already exists");
    }

    company.companyName = companyName;
  }

  if (data.contactPerson !== undefined) {
    company.contactPerson = data.contactPerson;
  }

  if (data.phone !== undefined) {
    company.phone = data.phone;
  }

  if (data.email !== undefined) {
    company.email = data.email;
  }

  if (data.address !== undefined) {
    company.address = data.address;
  }

  if (data.gstNumber !== undefined) {
    company.gstNumber = data.gstNumber;
  }

  if (data.remarks !== undefined) {
    company.remarks = data.remarks;
  }

  if (data.isActive !== undefined) {
    company.isActive = data.isActive;
  }

  await company.save();

  return company;
};


// =========================
// DELETE COMPANY
// SOFT DELETE
// =========================

const deleteCompany = async (companyId) => {
  const company = await Company.findById(companyId);

  if (!company) {
    throw new Error("Company not found");
  }

  company.isActive = false;

  await company.save();

  return {
    id: company._id,
    message: "Company deactivated successfully",
  };
};


module.exports = {
  createCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
};
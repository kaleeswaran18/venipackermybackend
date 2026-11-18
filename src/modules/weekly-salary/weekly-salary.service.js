
const WeeklySalary = require("./weekly-salary.model");
const Employee = require("../employee/employee.model");
const EmployeeAttendance = require(
  "../employee-attendance/employee-attendance.model"
);

// =========================
// GET WEEK START / END
// Sunday → Saturday
// =========================

const getWeekRange = (date) => {
  const currentDate = new Date(date);

  const day = currentDate.getDay();

  const weekStartDate = new Date(currentDate);
  weekStartDate.setDate(
    currentDate.getDate() - day
  );
  weekStartDate.setHours(0, 0, 0, 0);

  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(
    weekStartDate.getDate() + 6
  );
  weekEndDate.setHours(23, 59, 59, 999);

  return {
    weekStartDate,
    weekEndDate,
  };
};

// =========================
// CALCULATE EMPLOYEE SALARY
// =========================

const calculateEmployeeSalary = (
  employee,
  employeeAttendance
) => {
  let workingDays = 0;
  let halfDays = 0;
  let leaveDays = 0;
  let totalWorkingHours = 0;
  let totalOTHours = 0;
  let totalAdvance = 0;

  employeeAttendance.days.forEach((day) => {
    if (day.status === "Working") {
      workingDays++;
    }

    if (day.status === "Half Day") {
      halfDays++;
    }

    if (day.status === "Leave") {
      leaveDays++;
    }

    totalWorkingHours +=
      Number(day.workingHours || 0);

    totalOTHours +=
      Number(day.otHours || 0);

    totalAdvance +=
      Number(day.advance?.amount || 0);
  });

  // =========================
  // BASIC SALARY
  // =========================

  const dailyWage = Number(employee.dailyWage || 0);

  const basicSalary =
    workingDays * dailyWage +
    halfDays * (dailyWage / 2);

  // =========================
  // OT CALCULATION
  // 9 HOURS = DAILY WAGE
  // =========================

  const hourlyRate = dailyWage / 9;

  const otAmount =
    totalOTHours * hourlyRate;

  // =========================
  // GROSS SALARY
  // =========================

  const grossSalary =
    basicSalary + otAmount;

  // =========================
  // FINAL PAYABLE
  // =========================

  const finalPayable = Math.max(
    grossSalary - totalAdvance,
    0
  );

  return {
    employeeId: employee._id,
    name: employee.name,
    workingDays,
    halfDays,
    leaveDays,
    totalWorkingHours,
    totalOTHours,
    dailyWage,
    basicSalary,
    otAmount,
    grossSalary,
    totalAdvance,
    finalPayable,
  };
};

// =========================
// PROCESS ONE EMPLOYEE
// WEEKLY SALARY
// =========================

const processEmployeeWeeklySalary = async ({
  weekStartDate,
  weekEndDate,
  employeeId,
  session = null,
}) => {
  if (
    !weekStartDate ||
    !weekEndDate ||
    !employeeId
  ) {
    throw new Error(
      "Week dates and employee ID are required"
    );
  }

  // =========================
  // GET WEEKLY ATTENDANCE
  // =========================

  const attendance =
    await EmployeeAttendance.findOne({
      weekStartDate,
      weekEndDate,
    }).session(session);

  if (!attendance) {
    throw new Error(
      "Employee attendance not found for this week"
    );
  }

  // =========================
  // GET EMPLOYEE
  // =========================

  const employee =
    await Employee.findById(employeeId).session(session);

  if (!employee) {
    throw new Error(
      `Employee not found: ${employeeId}`
    );
  }

  // =========================
  // FIND EMPLOYEE ATTENDANCE
  // =========================

  let employeeAttendance = null;

  for (const location of attendance.locations) {
    const foundEmployee =
      location.employees.find(
        (item) =>
          item.employeeId.toString() ===
          employeeId.toString()
      );

    if (foundEmployee) {
      employeeAttendance = foundEmployee;
      break;
    }
  }

  if (!employeeAttendance) {
    throw new Error(
      `Attendance not found for employee: ${employee.name}`
    );
  }

  // =========================
  // CALCULATE EMPLOYEE SALARY
  // =========================

  const salaryEmployee =
    calculateEmployeeSalary(
      employee,
      employeeAttendance
    );

  // =========================
  // FIND WEEKLY SALARY
  // ONE DOCUMENT PER WEEK
  // =========================

  let weeklySalary =
    await WeeklySalary.findOne({
      weekStartDate,
      weekEndDate,
    }).session(session);

  // =========================
  // CREATE WEEKLY DOCUMENT
  // IF NOT EXISTS
  // =========================

  if (!weeklySalary) {
    try {
      if (session) {
        [weeklySalary] = await WeeklySalary.create(
          [{
            weekStartDate,
            weekEndDate,
            employees: [salaryEmployee],
            paid: false,
          }],
          { session }
        );
      } else {
        weeklySalary = await WeeklySalary.create({
          weekStartDate,
          weekEndDate,
          employees: [salaryEmployee],
          paid: false,
        });
      }

      return weeklySalary;
    } catch (error) {
      // Another employee may have created
      // the same weekly document concurrently.

      if (error.code !== 11000 || session) {
        throw error;
      }

      weeklySalary =
        await WeeklySalary.findOne({
          weekStartDate,
          weekEndDate,
        });

      if (!weeklySalary) {
        throw error;
      }
    }
  }

  // =========================
  // FIND EXISTING EMPLOYEE
  // =========================

  const existingEmployeeIndex =
    weeklySalary.employees.findIndex(
      (item) =>
        item.employeeId.toString() ===
        employeeId.toString()
    );

  // =========================
  // UPDATE EXISTING EMPLOYEE
  // =========================

  if (existingEmployeeIndex !== -1) {
    weeklySalary.employees[
      existingEmployeeIndex
    ] = salaryEmployee;
  } else {
    // =========================
    // ADD NEW EMPLOYEE
    // =========================

    weeklySalary.employees.push(
      salaryEmployee
    );
  }

  await weeklySalary.save(session ? { session } : {});

  return weeklySalary;
};

// =========================
// CREATE WEEKLY SALARY
// EXISTING BULK FUNCTION
// =========================

const createWeeklySalary = async (data) => {
  const {
    weekStartDate,
    weekEndDate,
    employees,
    paid = false,
  } = data;

  if (!weekStartDate || !weekEndDate) {
    throw new Error(
      "Week start date and week end date are required"
    );
  }

  if (
    !employees ||
    !Array.isArray(employees) ||
    employees.length === 0
  ) {
    throw new Error("Employees are required");
  }

  // =========================
  // CHECK DUPLICATE WEEKLY SALARY
  // =========================

  const existingSalary =
    await WeeklySalary.findOne({
      weekStartDate,
      weekEndDate,
    });

  if (existingSalary) {
    throw new Error(
      "Weekly salary already exists for this week"
    );
  }

  // =========================
  // GET WEEKLY ATTENDANCE
  // =========================

  const attendance =
    await EmployeeAttendance.findOne({
      weekStartDate,
      weekEndDate,
    });

  if (!attendance) {
    throw new Error(
      "Employee attendance not found for this week"
    );
  }

  const salaryEmployees = [];

  // =========================
  // PROCESS EMPLOYEES
  // =========================

  for (const employeeData of employees) {
    const employee =
      await Employee.findById(
        employeeData.employeeId
      );

    if (!employee) {
      throw new Error(
        `Employee not found: ${employeeData.employeeId}`
      );
    }

    let employeeAttendance = null;

    for (const location of attendance.locations) {
      const foundEmployee =
        location.employees.find(
          (item) =>
            item.employeeId.toString() ===
            employeeData.employeeId.toString()
        );

      if (foundEmployee) {
        employeeAttendance = foundEmployee;
        break;
      }
    }

    if (!employeeAttendance) {
      throw new Error(
        `Attendance not found for employee: ${employee.name}`
      );
    }

    const salaryEmployee =
      calculateEmployeeSalary(
        employee,
        employeeAttendance
      );

    salaryEmployees.push(salaryEmployee);
  }

  // =========================
  // CREATE WEEKLY SALARY
  // =========================

  const weeklySalary =
    await WeeklySalary.create({
      weekStartDate,
      weekEndDate,
      employees: salaryEmployees,
      paid,
    });

  return weeklySalary;
};

// =========================
// GET ALL WEEKLY SALARIES
// =========================

const getAllWeeklySalary = async () => {
  return await WeeklySalary.find()
    .populate(
      "employees.employeeId",
      "_id employeeCode name phone"
    )
    .sort({
      weekStartDate: -1,
      createdAt: -1,
    });
};

// =========================
// GET WEEKLY SALARY BY ID
// =========================

const getWeeklySalaryById = async (id) => {
  const salary =
    await WeeklySalary.findById(id)
      .populate(
        "employees.employeeId",
        "_id employeeCode name phone"
      );

  if (!salary) {
    throw new Error(
      "Weekly salary not found"
    );
  }

  return salary;
};

// =========================
// UPDATE WEEKLY SALARY
// =========================

const updateWeeklySalary = async (
  id,
  data
) => {
  const salary =
    await WeeklySalary.findById(id);

  if (!salary) {
    throw new Error(
      "Weekly salary not found"
    );
  }

  if (data.weekStartDate !== undefined) {
    salary.weekStartDate =
      data.weekStartDate;
  }

  if (data.weekEndDate !== undefined) {
    salary.weekEndDate =
      data.weekEndDate;
  }

  if (data.employees !== undefined) {
    salary.employees =
      data.employees;
  }

  if (data.paid !== undefined) {
    salary.paid =
      data.paid;
  }

  await salary.save();

  return salary;
};

// =========================
// DELETE WEEKLY SALARY
// =========================

const deleteWeeklySalary = async (id) => {
  const salary =
    await WeeklySalary.findById(id);

  if (!salary) {
    throw new Error(
      "Weekly salary not found"
    );
  }

  await WeeklySalary.findByIdAndDelete(id);

  return {
    message:
      "Weekly salary deleted successfully",
    id,
  };
};

// =========================
// EXPORT
// =========================

module.exports = {
  createWeeklySalary,
  processEmployeeWeeklySalary,
  getAllWeeklySalary,
  getWeeklySalaryById,
  updateWeeklySalary,
  deleteWeeklySalary,
};

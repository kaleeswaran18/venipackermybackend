const User = require("../auth/auth.model");

// =========================
// GET ALL USERS
// =========================

const getAllUsers = async () => {
  const users = await User.find()
    .select("-password")
    .sort({ createdAt: -1 });

  return users;
};


// =========================
// GET USER BY ID
// =========================

const getUserById = async (userId) => {
  const user = await User.findById(userId)
    .select("-password");

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};


// =========================
// UPDATE USER
// =========================

const updateUser = async (
  userId,
  { name, email, role }
) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  if (email && email !== user.email) {
    const existingUser = await User.findOne({
      email,
      _id: { $ne: userId },
    });

    if (existingUser) {
      throw new Error("Email already registered");
    }

    user.email = email;
  }

  if (name !== undefined) {
    user.name = name;
  }

  if (role !== undefined) {
    user.role = role;
  }

  await user.save();

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  };
};


// =========================
// UPDATE USER STATUS
// =========================

const updateUserStatus = async (
  userId,
  isActive
) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  user.isActive = isActive;

  await user.save();

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  };
};


// =========================
// DELETE USER
// =========================

const deleteUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  await User.findByIdAndDelete(userId);

  return {
    id: user._id,
    message: "User deleted successfully",
  };
};


module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  deleteUser,
};
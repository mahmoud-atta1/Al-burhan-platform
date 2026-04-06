const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");

const User = require("../models/user.model");
const ApiError = require("../utils/apiError");
const ApiFeatures = require("../utils/apiFeatures");

exports.getUsers = asyncHandler(async (req, res) => {
  let filter = {};
  const { phone, keyword, educationLevel } = req.query;

  if (phone) {
    filter.phone = phone;
  }

  if (educationLevel) {
    filter.educationLevel = educationLevel;
  }

  if (keyword) {
    filter.fullName = { $regex: keyword, $options: "i" };
  }

  const countDocuments = await User.countDocuments(filter);
  const apiFeatures = new ApiFeatures(User.find(filter), req.query).paginate(
    countDocuments,
  );

  const { mongooseQuery, paginationResult } = apiFeatures;

  const users = await mongooseQuery.select(
    "fullName phone parentPhone educationLevel active",
  );

  res.status(200).json({
    success: true,
    results: users.length,
    pagination: paginationResult,
    data: users,
  });
});

exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select(
    "fullName email phone parentPhone governorate educationLevel role active",
  );

  if (!user) return next(new ApiError("المستخدم غير موجود", 404));

  res.status(200).json({ success: true, data: user });
});

exports.changeActiveStatus = asyncHandler(async (req, res, next) => {
  const { active } = req.body;

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { active },
    { new: true },
  );
  if (!user) return next(new ApiError("المستخدم غير موجود", 404));

  res.status(200).json({ success: true, data: user });
});

exports.changeUserPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new ApiError("المستخدم غير موجود", 404));

  user.password = req.body.newPassword;
  user.passwordChangedAt = Date.now();
  await user.save();

  res
    .status(200)
    .json({ success: true, message: "تم تغيير كلمة المرور بنجاح" });
});

exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).select(
    "fullName governorate email",
  );

  if (!user) {
    return next(new ApiError("المستخدم غير موجود", 404));
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

exports.updateMe = asyncHandler(async (req, res) => {
  const { fullName, email, governorate } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { fullName, email, governorate },
    { new: true, runValidators: true },
  );

  res.status(200).json({ success: true, data: user });
});

exports.changeMyPassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select("+password");
  const isMatch = await bcrypt.compare(currentPassword, user.password);

  if (!isMatch) {
    return next(new ApiError("كلمة المرور الحالية خاطئة", 400));
  }

  user.password = newPassword;
  user.passwordChangedAt = Date.now();

  await user.save();

  res.status(200).json({
    success: true,
    message: "تم تغيير كلمة المرور بنجاح",
  });
});

exports.deleteMe = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });
  res.status(204).json({ success: true, message: "تم تعطيل الحساب بنجاح" });
});

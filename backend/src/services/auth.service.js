const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const User = require("../models/user.model");
const ApiError = require("../utils/apiError");
const sendEmail = require("../utils/sendEmail");

const generateToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const sendTokenCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: false,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

exports.signup = asyncHandler(async (req, res, next) => {
  const { email, phone } = req.body;
  const userExists = await User.findOne({
    $or: [{ email }, { phone }],
  });

  if (userExists) {
    if (userExists?.phone === phone) {
      return next(new ApiError("رقم الهاتف مستخدم بالفعل", 400));
    }

    if (userExists?.email === email) {
      return next(new ApiError("البريد الإلكتروني مستخدم بالفعل", 400));
    }
  }

  const newUser = await User.create(req.body);
  const token = generateToken({ id: newUser._id });
  sendTokenCookie(res, token);

  newUser.password = undefined;
  res.status(201).json({
    status: "success",
    token,
    data: newUser,
  });
});

exports.login = asyncHandler(async (req, res, next) => {
  const { email, phone, password } = req.body;

  const user = await User.findOne({ $or: [{ email }, { phone }] }).select(
    "+password",
  );

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return next(
      new ApiError(
        "البريد الإلكتروني أو رقم الهاتف أو كلمة المرور غير صحيحة",
        401,
      ),
    );
  }

  const token = generateToken({ id: user._id });
  sendTokenCookie(res, token);

  user.password = undefined;
  res.status(200).json({
    status: "success",
    token,
    data: user,
  });
});

exports.logout = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires: new Date(0),
  });

  res.status(200).json({
    status: "success",
    message: "تم تسجيل الخروج بنجاح",
  });
});

exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return next(new ApiError("لا يوجد مستخدم بهذا البريد الإلكتروني", 404));

  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

  user.passwordResetCode = crypto
    .createHash("sha256")
    .update(resetCode)
    .digest("hex");

  user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  user.passwordResetVerified = false;
  await user.save({ validateBeforeSave: false });

  try {
    await sendEmail({
      email: user.email,
      subject: "كود استعادة كلمة المرور الخاص بك",
      message: `كود التحقق الخاص بك هو: ${resetCode}`,
    });

    res.status(200).json({
      status: "success",
      message: "تم إرسال كود التحقق إلى بريدك الإلكتروني",
    });
  } catch (err) {
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;

    await user.save({ validateBeforeSave: false });

    return next(
      new ApiError("حدث خطأ في إرسال البريد الإلكتروني، حاول لاحقاً", 500),
    );
  }
});

exports.verifyResetCode = asyncHandler(async (req, res, next) => {
  const hashedResetCode = crypto
    .createHash("sha256")
    .update(req.body.resetCode)
    .digest("hex");

  const user = await User.findOne({
    passwordResetCode: hashedResetCode,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) return next(new ApiError("الكود غير صحيح أو انتهت صلاحيته", 400));

  user.passwordResetVerified = true;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "success",
    message: "تم التحقق من الكود بنجاح",
  });
});

exports.resetPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return next(new ApiError("لا يوجد مستخدم بهذا البريد الإلكتروني", 404));

  if (!user.passwordResetExpires || user.passwordResetExpires < Date.now()) {
    return next(new ApiError("انتهت صلاحية كود التحقق، اطلب كود جديد", 400));
  }

  if (!user.passwordResetVerified) {
    return next(new ApiError("يجب التحقق من كود الـ OTP أولاً", 400));
  }

  user.password = req.body.newPassword;

  user.passwordResetCode = undefined;
  user.passwordResetExpires = undefined;
  user.passwordResetVerified = undefined;
  user.passwordChangedAt = Date.now();

  await user.save();

  const token = generateToken({ id: user._id });
  sendTokenCookie(res, token);

  res.status(200).json({
    status: "success",
    token,
  });
});

exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.cookies?.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new ApiError("يرجى تسجيل الدخول أولاً للوصول إلى هذه الخدمة", 401),
    );
  }

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return next(new ApiError("التوكن غير صالح أو انتهت صلاحيته", 401));
  }

  const user = await User.findById(decoded.id).select(
    "passwordChangedAt role active",
  );

  if (!user || !user.active) {
    return next(new ApiError("هذا المستخدم لم يعد متاحاً", 401));
  }

  if (user.passwordChangedAt) {
    const changedTimestamp = parseInt(
      user.passwordChangedAt.getTime() / 1000,
      10,
    );

    if (decoded.iat < changedTimestamp) {
      return next(
        new ApiError(
          "تم تغيير كلمة المرور مؤخراً، يرجى تسجيل الدخول مجدداً",
          401,
        ),
      );
    }
  }

  req.user = user;
  next();
});

exports.allowedTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ApiError("ليس لديك الصلاحية للقيام بهذا الإجراء", 403));
    }

    next();
  };

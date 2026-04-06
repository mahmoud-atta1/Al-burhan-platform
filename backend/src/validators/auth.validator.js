const Joi = require("joi");
const validatorMiddleware = require("../middlewares/validatorMiddleware");

const egyptPhone = Joi.string()
  .pattern(/^01[0125][0-9]{8}$/)
  .length(11)
  .messages({
    "string.pattern.base": "يرجى إدخال رقم هاتف مصري صحيح",
    "string.length": "رقم الهاتف يجب أن يكون 11 رقم",
  });

const signupSchema = Joi.object({
  fullName: Joi.string().trim().min(3).max(50).required().messages({
    "string.empty": "الاسم الكامل مطلوب",
    "string.min": "الاسم الكامل يجب أن يكون على الأقل 3 أحرف",
    "string.max": "الاسم الكامل يجب ألا يتجاوز 50 حرفًا",
  }),

  email: Joi.string().email().required().messages({
    "string.email": "يرجى إدخال بريد إلكتروني صحيح",
    "string.empty": "البريد الإلكتروني مطلوب",
  }),

  phone: egyptPhone.required().messages({
    "string.empty": "رقم الهاتف مطلوب",
  }),

  password: Joi.string().min(6).required().messages({
    "string.empty": "كلمة المرور مطلوبة",
    "string.min": "كلمة المرور يجب أن تكون على الأقل 6 أحرف",
  }),

  passwordConfirm: Joi.string().valid(Joi.ref("password")).required().messages({
    "any.only": "تأكيد كلمة المرور غير مطابق لكلمة المرور",
    "string.empty": "تأكيد كلمة المرور مطلوب",
  }),

  gender: Joi.string().valid("male", "female").required().messages({
    "any.only": "النوع يجب أن يكون ذكر أو أنثى",
    "string.empty": "النوع مطلوب",
  }),

  educationLevel: Joi.string()
    .valid("first_secondary", "second_secondary", "third_secondary")
    .required()
    .messages({
      "any.only": "المرحلة الدراسية غير صحيحة",
      "string.empty": "المرحلة الدراسية مطلوبة",
    }),

  parentPhone: egyptPhone.required().messages({
    "string.empty": "رقم هاتف ولي الأمر مطلوب",
  }),

  governorate: Joi.string().required().messages({
    "string.empty": "المحافظة مطلوبة",
  }),
})
  .unknown(false)
  .messages({
    "object.unknown": "تم إرسال بيانات غير مسموح بها",
  });

const loginSchema = Joi.object({
  phone: egyptPhone.messages({
    "string.empty": "رقم الهاتف مطلوب",
  }),

  email: Joi.string().email().messages({
    "string.email": "يرجى إدخال بريد إلكتروني صحيح",
  }),

  password: Joi.string().required().messages({
    "string.empty": "كلمة المرور مطلوبة",
  }),
})
  .or("phone", "email")
  .unknown(false)
  .messages({
    "object.missing": "يجب إدخال البريد الإلكتروني أو رقم الهاتف",
    "object.unknown": "تم إرسال بيانات غير مسموح بها",
  });

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "يرجى إدخال بريد إلكتروني صحيح",
    "string.empty": "البريد الإلكتروني مطلوب",
  }),
})
  .unknown(false)
  .messages({
    "object.unknown": "تم إرسال بيانات غير مسموح بها",
  });

const verifyCodeSchema = Joi.object({
  resetCode: Joi.string().length(6).required().messages({
    "string.length": "كود التحقق يجب أن يكون 6 أرقام",
    "string.empty": "يرجى إدخال كود التحقق",
  }),
})
  .unknown(false)
  .messages({
    "object.unknown": "تم إرسال بيانات غير مسموح بها",
  });

const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "يرجى إدخال بريد إلكتروني صحيح",
    "string.empty": "البريد الإلكتروني مطلوب",
  }),

  newPassword: Joi.string().min(6).required().messages({
    "string.empty": "كلمة المرور الجديدة مطلوبة",
    "string.min": "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل",
  }),

  newPasswordConfirm: Joi.string()
    .valid(Joi.ref("newPassword"))
    .required()
    .messages({
      "any.only": "تأكيد كلمة المرور غير مطابق",
      "string.empty": "يرجى تأكيد كلمة المرور",
    }),
})
  .unknown(false)
  .messages({
    "object.unknown": "تم إرسال بيانات غير مسموح بها",
  });

exports.signupValidator = validatorMiddleware({ body: signupSchema });

exports.loginValidator = validatorMiddleware({ body: loginSchema });

exports.forgotPasswordValidator = validatorMiddleware({
  body: forgotPasswordSchema,
});

exports.verifyCodeValidator = validatorMiddleware({ body: verifyCodeSchema });

exports.resetPasswordValidator = validatorMiddleware({
  body: resetPasswordSchema,
});

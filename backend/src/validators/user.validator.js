const Joi = require("joi");
const validatorMiddleware = require("../middlewares/validatorMiddleware");

const idParam = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    "string.hex": "ID غير صالح",
    "any.required": "ID مطلوب",
  }),
});

const updateMeSchema = Joi.object({
  fullName: Joi.string().trim().min(3).max(50),
  email: Joi.string().email(),
  governorate: Joi.string(),
}).unknown(false);

const updatePassSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({ "string.empty": "الباسورد الحالي مطلوب" }),
  newPassword: Joi.string()
    .min(6)
    .required()
    .messages({ "string.min": "6 أحرف على الأقل" }),
  passwordConfirm: Joi.string()
    .valid(Joi.ref("newPassword"))
    .required()
    .messages({ "any.only": "تأكيد الباسورد غير متطابق" }),
}).unknown(false);

const adminPassSchema = Joi.object({
  newPassword: Joi.string()
    .min(6)
    .required()
    .messages({ "string.empty": "الباسورد الجديد مطلوب" }),
}).unknown(false);

const statusSchema = Joi.object({
  active: Joi.boolean()
    .required()
    .messages({ "any.required": "حالة الحساب مطلوبة" }),
}).unknown(false);

exports.updateMeValidator = validatorMiddleware({ body: updateMeSchema });

exports.updatePassValidator = validatorMiddleware({ body: updatePassSchema });

exports.getUserValidator = validatorMiddleware({ params: idParam });

exports.adminPassValidator = validatorMiddleware({
  params: idParam,
  body: adminPassSchema,
});

exports.statusValidator = validatorMiddleware({
  params: idParam,
  body: statusSchema,
});

exports.deleteUserValidator = validatorMiddleware({ params: idParam });

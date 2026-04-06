const Joi = require("joi");
const validatorMiddleware = require("../middlewares/validatorMiddleware");

const idParamSchema = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    "string.hex": "ID غير صالح",
    "any.required": "ID مطلوب",
  }),
}).unknown(true);

const courseParamSchema = Joi.object({
  courseId: Joi.string().hex().length(24).required().messages({
    "string.hex": "ID الكورس غير صالح",
    "any.required": "courseId مطلوب",
  }),
}).unknown(true);

const manualAssignSchema = Joi.object({
  studentId: Joi.string().hex().length(24).required().messages({
    "string.hex": "ID الطالب غير صالح",
    "any.required": "studentId مطلوب",
  }),
  courseId: Joi.string().hex().length(24).required().messages({
    "string.hex": "ID الكورس غير صالح",
    "any.required": "courseId مطلوب",
  }),
})
  .unknown(false)
  .messages({
    "object.unknown": "تم إرسال حقل غير مسموح به",
  });

const listQuerySchema = Joi.object({
  status: Joi.string().valid("pending", "active", "canceled", "expired"),
  studentId: Joi.string().hex().length(24),
  courseId: Joi.string().hex().length(24),
})
  .unknown(false)
  .messages({
    "object.unknown": "تم إرسال query غير مسموح بها",
  });

exports.requestEnrollmentValidator = validatorMiddleware({
  params: courseParamSchema,
});

exports.manualAssignEnrollmentValidator = validatorMiddleware({
  body: manualAssignSchema,
});

exports.approveEnrollmentValidator = validatorMiddleware({
  params: idParamSchema,
});

exports.cancelEnrollmentValidator = validatorMiddleware({
  params: idParamSchema,
});

exports.getEnrollmentsValidator = validatorMiddleware({
  query: listQuerySchema,
});

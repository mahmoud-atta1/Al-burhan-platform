const Joi = require("joi");
const validatorMiddleware = require("../middlewares/validatorMiddleware");

const validateExamWindow = (value, helpers) => {
  if (
    value.availableFrom &&
    value.availableUntil &&
    new Date(value.availableUntil) <= new Date(value.availableFrom)
  ) {
    return helpers.error("date.examWindow");
  }

  return value;
};

const idParam = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    "string.hex": "ID الامتحان غير صالح",
    "any.required": "ID الامتحان مطلوب",
  }),
  weekId: Joi.string().hex().length(24).messages({
    "string.hex": "ID الأسبوع غير صالح",
  }),
  courseId: Joi.string().hex().length(24).messages({
    "string.hex": "ID الكورس غير صالح",
  }),
  trackId: Joi.string().hex().length(24).messages({
    "string.hex": "ID المسار غير صالح",
  }),
}).unknown(true);

const listParam = Joi.object({
  weekId: Joi.string().hex().length(24).messages({
    "string.hex": "ID الأسبوع غير صالح",
  }),
  courseId: Joi.string().hex().length(24).messages({
    "string.hex": "ID الكورس غير صالح",
  }),
  trackId: Joi.string().hex().length(24).messages({
    "string.hex": "ID المسار غير صالح",
  }),
}).unknown(true);

const createExamSchema = Joi.object({
  title: Joi.string().trim().min(3).max(200).required().messages({
    "string.empty": "عنوان الامتحان مطلوب",
  }),

  duration: Joi.number().integer().min(1).required().messages({
    "number.base": "المدة يجب أن تكون رقم",
    "number.min": "المدة يجب أن تكون 1 على الأقل",
    "any.required": "المدة مطلوبة",
  }),

  totalMarks: Joi.number().min(1).required().messages({
    "number.base": "إجمالي الدرجات يجب أن يكون رقم",
    "number.min": "إجمالي الدرجات يجب أن يكون 1 على الأقل",
    "any.required": "إجمالي الدرجات مطلوب",
  }),

  availableFrom: Joi.date().iso().messages({
    "date.format": "وقت بداية الامتحان غير صالح",
  }),

  availableUntil: Joi.date().iso().messages({
    "date.format": "وقت نهاية الامتحان غير صالح",
  }),

  isPublished: Joi.boolean(),

  weekId: Joi.string().hex().length(24).messages({
    "string.hex": "ID الأسبوع غير صالح",
  }),
})
  .custom(validateExamWindow)
  .unknown(false)
  .messages({
    "object.unknown": "تم إرسال حقل غير مسموح به",
    "date.examWindow": "وقت نهاية الامتحان يجب أن يكون بعد وقت البداية",
  });

const updateExamSchema = Joi.object({
  title: Joi.string().trim().min(3).max(200).messages({
    "string.min": "عنوان الامتحان يجب أن يكون 3 أحرف على الأقل",
  }),

  duration: Joi.number().integer().min(1).messages({
    "number.base": "المدة يجب أن تكون رقم",
    "number.min": "المدة يجب أن تكون 1 على الأقل",
  }),

  totalMarks: Joi.number().min(1).messages({
    "number.base": "إجمالي الدرجات يجب أن يكون رقم",
    "number.min": "إجمالي الدرجات يجب أن يكون 1 على الأقل",
  }),

  availableFrom: Joi.date().iso().messages({
    "date.format": "وقت بداية الامتحان غير صالح",
  }),

  availableUntil: Joi.date().iso().messages({
    "date.format": "وقت نهاية الامتحان غير صالح",
  }),

  isPublished: Joi.boolean(),
})
  .min(1)
  .custom(validateExamWindow)
  .unknown(false)
  .messages({
    "object.unknown": "تم إرسال حقل غير مسموح به",
    "date.examWindow": "وقت نهاية الامتحان يجب أن يكون بعد وقت البداية",
  });

exports.getExamsValidator = validatorMiddleware({
  params: listParam,
});

exports.createExamValidator = validatorMiddleware({
  params: listParam,
  body: createExamSchema,
});

exports.getExamValidator = validatorMiddleware({
  params: idParam,
});

exports.updateExamValidator = validatorMiddleware({
  params: idParam,
  body: updateExamSchema,
});

exports.deleteExamValidator = validatorMiddleware({
  params: idParam,
});

const Joi = require("joi");
const validatorMiddleware = require("../middlewares/validatorMiddleware");

const idParam = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    "string.hex": "ID الحصة غير صالح",
    "any.required": "ID الحصة مطلوب",
  }),
  weekId: Joi.string().hex().length(24).required().messages({
    "string.hex": "ID الأسبوع غير صالح",
    "any.required": "ID الأسبوع مطلوب",
  }),
  courseId: Joi.string().hex().length(24).messages({
    "string.hex": "ID الكورس غير صالح",
  }),
  trackId: Joi.string().hex().length(24).messages({
    "string.hex": "ID المسار غير صالح",
  }),
}).unknown(true);

const weekIdParam = Joi.object({
  weekId: Joi.string().hex().length(24).required().messages({
    "string.hex": "ID الأسبوع غير صالح",
    "any.required": "ID الأسبوع مطلوب",
  }),
  courseId: Joi.string().hex().length(24).messages({
    "string.hex": "ID الكورس غير صالح",
  }),
  trackId: Joi.string().hex().length(24).messages({
    "string.hex": "ID المسار غير صالح",
  }),
}).unknown(true);

const createLessonSchema = Joi.object({
  title: Joi.string().trim().min(3).max(200).required().messages({
    "string.empty": "عنوان الحصة مطلوب",
  }),

  description: Joi.string().allow("").optional(),

  type: Joi.string()
    .valid("video", "pdf", "exam", "assignment")
    .required()
    .messages({
      "any.only": "نوع الحصة غير صحيح (video, pdf, exam, assignment)",
    }),

  weekId: Joi.string().hex().length(24).required().messages({
    "string.hex": "ID الأسبوع غير صالح",
    "any.required": "ID الأسبوع مطلوب",
  }),

  contentUrl: Joi.string().optional(),

  order: Joi.number().integer().min(1).required().messages({
    "number.base": "ترتيب الحصة يجب أن يكون رقماً",
    "any.required": "ترتيب الحصة مطلوب",
  }),

  isFree: Joi.boolean().optional(),
  isPublished: Joi.boolean().optional(),
}).unknown(false);

const updateLessonSchema = Joi.object({
  title: Joi.string().trim().min(3).max(200),
  description: Joi.string().allow(""),
  weekId: Joi.string().hex().length(24).required(),
  type: Joi.string().valid("video", "pdf", "exam", "assignment"),
  contentUrl: Joi.string(),
  order: Joi.number().integer().min(1),
  isFree: Joi.boolean(),
  isPublished: Joi.boolean(),
})
  .min(1)
  .unknown(false);

exports.createLessonValidator = validatorMiddleware({
  params: weekIdParam,
  body: createLessonSchema,
});

exports.updateLessonValidator = validatorMiddleware({
  params: idParam,
  body: updateLessonSchema,
});

exports.getLessonValidator = validatorMiddleware({
  params: idParam,
});

exports.deleteLessonValidator = validatorMiddleware({
  params: idParam,
});

exports.getWeekLessonsValidator = validatorMiddleware({
  params: weekIdParam,
});

const Joi = require("joi");
const validatorMiddleware = require("../middlewares/validatorMiddleware");

const idParam = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    "string.hex": "ID غير صالح",
    "any.required": "ID مطلوب",
  }),
  trackId: Joi.string().hex().length(24).messages({
    "string.hex": "ID المسار غير صالح",
  }),
}).unknown(true);

const trackParam = Joi.object({
  trackId: Joi.string().hex().length(24).messages({
    "string.hex": "ID المسار غير صالح",
  }),
}).unknown(true);

const createCourseSchema = Joi.object({
  title: Joi.string().trim().min(3).max(200).required().messages({
    "string.empty": "عنوان الكورس مطلوب",
    "string.min": "عنوان الكورس يجب أن يكون 3 أحرف على الأقل",
  }),

  description: Joi.string().allow(""),

  price: Joi.number().min(0).required().messages({
    "number.base": "السعر يجب أن يكون رقم",
    "any.required": "السعر مطلوب",
  }),

  track: Joi.string().hex().length(24).required().messages({
    "string.hex": "المسار غير صالح",
    "any.required": "المسار مطلوب",
  }),

  durationInWeeks: Joi.number().integer().min(1).messages({
    "number.base": "عدد الأسابيع يجب أن يكون رقم",
    "number.integer": "عدد الأسابيع يجب أن يكون رقم صحيح",
    "number.min": "عدد الأسابيع يجب أن يكون 1 على الأقل",
  }),

  coverImage: Joi.string().allow(""),

  isPublished: Joi.boolean(),
})
  .unknown(false)
  .messages({
    "object.unknown": "تم إرسال حقل غير مسموح به",
  });

const updateCourseSchema = Joi.object({
  title: Joi.string().trim().min(3).max(200).messages({
    "string.min": "عنوان الكورس يجب أن يكون 3 أحرف على الأقل",
  }),

  description: Joi.string().allow(""),

  price: Joi.number().min(0).messages({
    "number.base": "السعر يجب أن يكون رقم",
  }),

  track: Joi.string().hex().length(24).messages({
    "string.hex": "المسار غير صالح",
  }),

  durationInWeeks: Joi.number().integer().min(1).messages({
    "number.base": "عدد الأسابيع يجب أن يكون رقم",
    "number.integer": "عدد الأسابيع يجب أن يكون رقم صحيح",
    "number.min": "عدد الأسابيع يجب أن يكون 1 على الأقل",
  }),

  coverImage: Joi.string().allow(""),

  isPublished: Joi.boolean(),

  active: Joi.boolean(),
})
  .min(1)
  .unknown(false)
  .messages({
    "object.unknown": "تم إرسال حقل غير مسموح به",
  });

exports.createCourseValidator = validatorMiddleware({
  params: trackParam,
  body: createCourseSchema,
});

exports.updateCourseValidator = validatorMiddleware({
  params: idParam,
  body: updateCourseSchema,
});

exports.getCourseValidator = validatorMiddleware({
  params: idParam,
});

exports.deleteCourseValidator = validatorMiddleware({
  params: idParam,
});

exports.getCoursesValidator = validatorMiddleware({
  params: trackParam,
});

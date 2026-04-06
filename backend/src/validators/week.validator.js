const Joi = require("joi");
const validatorMiddleware = require("../middlewares/validatorMiddleware");

const idParam = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    "string.hex": "ID غير صالح",
    "any.required": "ID مطلوب",
  }),
  courseId: Joi.string().hex().length(24).messages({
    "string.hex": "ID الكورس غير صالح",
  }),
  trackId: Joi.string().hex().length(24).messages({
    "string.hex": "ID المسار غير صالح",
  }),
}).unknown(true);

const courseParam = Joi.object({
  courseId: Joi.string().hex().length(24).messages({
    "string.hex": "ID الكورس غير صالح",
  }),
  trackId: Joi.string().hex().length(24).messages({
    "string.hex": "ID المسار غير صالح",
  }),
}).unknown(true);

const createWeekSchema = Joi.object({
  title: Joi.string().trim().min(2).max(200).required().messages({
    "string.empty": "عنوان الأسبوع مطلوب",
    "any.required": "عنوان الأسبوع حقل إلزامي",
  }),

  order: Joi.number().integer().min(1).required().messages({
    "number.base": "الترتيب يجب أن يكون رقمًا",
    "number.integer": "الترتيب يجب أن يكون رقمًا صحيحًا",
    "any.required": "ترتيب الأسبوع مطلوب",
  }),

  description: Joi.string().allow(""),

  course: Joi.string().hex().length(24).messages({
    "string.hex": "ID الكورس غير صالح",
  }),

  active: Joi.boolean(),
}).unknown(false);

const updateWeekSchema = Joi.object({
  title: Joi.string().trim().min(2).max(200),
  order: Joi.number().integer().min(1),
  description: Joi.string().allow(""),
  active: Joi.boolean(),
})
  .min(1)
  .unknown(false);

exports.createWeekValidator = validatorMiddleware({
  params: courseParam,
  body: createWeekSchema,
});

exports.updateWeekValidator = validatorMiddleware({
  params: idParam,
  body: updateWeekSchema,
});

exports.getWeekValidator = validatorMiddleware({
  params: idParam,
});

exports.deleteWeekValidator = validatorMiddleware({
  params: idParam,
});

exports.getWeeksValidator = validatorMiddleware({
  params: courseParam,
});

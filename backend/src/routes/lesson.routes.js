const express = require("express");

const router = express.Router({ mergeParams: true });

const {
  createLesson,
  getWeekLessons,
  getLesson,
  updateLesson,
  deleteLesson,
} = require("../services/lesson.service");

const {
  createLessonValidator,
  getWeekLessonsValidator,
  updateLessonValidator,
  getLessonValidator,
  deleteLessonValidator,
} = require("../validators/lesson.validator");

const {
  uploadSingle,
  processLessonPDF,
} = require("../middlewares/uploadMiddleware");

const { protect, allowedTo } = require("../services/auth.service");
const { requireActiveEnrollment } = require("../middlewares/enrollment.middleware");

const setWeekIdToBody = (req, res, next) => {
  if (!req.body.weekId && req.params.weekId) {
    req.body.weekId = req.params.weekId;
  }
  next();
};

router.use(protect);

router.get(
  "/",
  allowedTo("admin", "student"),
  requireActiveEnrollment,
  getWeekLessonsValidator,
  getWeekLessons,
);
router.get(
  "/:id",
  allowedTo("admin", "student"),
  requireActiveEnrollment,
  getLessonValidator,
  getLesson,
);

router.use(allowedTo("admin"));

router.post(
  "/",
  uploadSingle("pdfFile"),
  processLessonPDF("lessons"),
  setWeekIdToBody,
  createLessonValidator,
  createLesson,
);

router.put(
  "/:id",
  uploadSingle("pdfFile"),
  processLessonPDF("lessons"),
  setWeekIdToBody,
  updateLessonValidator,
  updateLesson,
);

router.delete("/:id", deleteLessonValidator, deleteLesson);

module.exports = router;

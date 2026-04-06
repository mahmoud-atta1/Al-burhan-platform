const express = require("express");
const router = express.Router({ mergeParams: true });

const weekRoute = require("./week.routes");
const examRoute = require("./exam.routes");
const { protect, allowedTo } = require("../services/auth.service");

const {
  uploadSingle,
  resizeImage,
} = require("../middlewares/uploadMiddleware");

const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
} = require("../services/course.service");

const {
  createCourseValidator,
  updateCourseValidator,
  getCourseValidator,
  deleteCourseValidator,
} = require("../validators/course.validator");

const setTrackIdToBody = (req, res, next) => {
  if (req.params.trackId) req.body.track = req.params.trackId;
  next();
};

router.use("/:courseId/weeks", weekRoute);
router.use("/:courseId/exams", examRoute);

router.get("/", getCourses);
router.get("/:id", getCourseValidator, getCourse);

router.use(protect, allowedTo("admin"));

router.post(
  "/",
  uploadSingle("coverImage"),
  resizeImage("courses", 800, 450),
  setTrackIdToBody,
  createCourseValidator,
  createCourse,
);

router.put(
  "/:id",
  uploadSingle("coverImage"),
  resizeImage("courses", 800, 450),
  setTrackIdToBody,
  updateCourseValidator,
  updateCourse,
);

router.delete("/:id", deleteCourseValidator, deleteCourse);

module.exports = router;

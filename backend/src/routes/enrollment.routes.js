const express = require("express");

const router = express.Router();

const { protect, allowedTo } = require("../services/auth.service");
const {
  getMyEnrollments,
  getEnrollments,
  manualAssignEnrollment,
} = require("../services/enrollment.service");
const {
  manualAssignEnrollmentValidator,
  getEnrollmentsValidator,
} = require("../validators/enrollment.validator");

router.use(protect);

router.get("/me", allowedTo("student"), getMyEnrollments);

router.use(allowedTo("admin"));

router.get("/", getEnrollmentsValidator, getEnrollments);
router.post(
  "/manual-assign",
  manualAssignEnrollmentValidator,
  manualAssignEnrollment,
);

module.exports = router;

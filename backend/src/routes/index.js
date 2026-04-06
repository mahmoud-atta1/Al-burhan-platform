const userRoute = require("./user.routes");
const authRoute = require("./auth.routes");
const trackRoute = require("./track.routes");
const courseRoute = require("./course.routes");
const weekRoute = require("./week.routes");
const examRoute = require("./exam.routes");
const enrollmentRoute = require("./enrollment.routes");

const mountRoutes = (app) => {
  app.use("/api/v1/auth", authRoute);
  app.use("/api/v1/users", userRoute);
  app.use("/api/v1/tracks", trackRoute);
  app.use("/api/v1/courses", courseRoute);
  app.use("/api/v1/weeks", weekRoute);
  app.use("/api/v1/exams", examRoute);
  app.use("/api/v1/enrollments", enrollmentRoute);
};

module.exports = mountRoutes;

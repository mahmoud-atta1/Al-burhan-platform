const sendEmail = async (options) => {
  console.log("1");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.GOOGLE_APP_PASSWORD,
    },
  });

  console.log("2");

  const mailOpts = {
    from: `منصة البرهان التعليمية <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  console.log("3");

  await transporter.sendMail(mailOpts);

  console.log("4");
};

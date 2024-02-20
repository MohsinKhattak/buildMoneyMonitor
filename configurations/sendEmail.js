const nodemailer = require("nodemailer");

const sendEmail = async (email, subject, text, type) => {
  bodyContent = `This is your verification ${type} : ${text}`;
  console.log("this is link ::: ", text);
  console.log(" this is port ", Number(process.env.EMAIL_PORT));
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.HOST,
      service: process.env.SERVICE,
      port: Number(process.env.EMAIL_PORT),
      //   secure: Boolean(process.env.SECURE),

      auth: {
        user: String(process.env.EMAIL),
        pass: String(process.env.PASS),
      },
    });
    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: subject,
      html: "<h2>" + bodyContent + "</h2>",
    });
    console.log("email sent successfully");
    return;
  } catch (error) {
    console.log("email not sent!");
    console.log("error while sending email : ", error);

    throw new Error("Failed to sending email to User");
  }
};

module.exports = { sendEmail };

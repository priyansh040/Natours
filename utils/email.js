import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  // 1) Create a transporter using Gmail
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USERNAME, // your Gmail address
      pass: process.env.EMAIL_PASSWORD, // your Gmail App Password
    },
  });

  // 2) Define the email options
  const mailOptions = {
    from: 'TourNest <your-email@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  // 3) Actually send the email
  await transporter.sendMail(mailOptions);
};

export default sendEmail;

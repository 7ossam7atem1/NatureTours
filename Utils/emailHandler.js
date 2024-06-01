const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1) Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    //Now in gmail we should Activate less secure App options
  });
  //2) define email options
  const mailOptions = {
    from: 'Hossam Hatem <7ossam7atem1@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };
  //3) Actually send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;

//Trying Gmail version
// const sendEmail = async (options) => {
//     // 1) Create a transporter
//     const transporter = nodemailer.createTransport({
//       service: 'Gmail',
//       auth: {
//         user: process.env.GMAIL_EMAIL,
//         pass: process.env.GMAIL_PASSWORD,
//       },
//     });

//     // 2) Define email options
//     const mailOptions = {
//       from: 'Hossam Hatem <hossam@gmail.com>',
//       to: options.email,
//       subject: options.subject,
//       text: options.message,
//     };

//     // 3) Actually send the email
//     await transporter.sendMail(mailOptions);
//   };

//   module.exports = sendEmail;

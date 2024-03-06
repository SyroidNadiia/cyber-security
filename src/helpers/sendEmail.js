const nodemailer = require("nodemailer");

const { MAIL_PASSWORD } = process.env;

const nodemailerConfig = {
  host: "smtp.meta.ua",
  port: 465,
  secure: true,
  auth: {
    user: "samchukdmytro@meta.ua",
    pass: MAIL_PASSWORD,
  },
};

const transport = nodemailer.createTransport(nodemailerConfig);

const sendEmail = async (data) => {
  const email = { ...data, from: "samchukdmytro@meta.ua" };
  await transport.sendMail(email);
  return true;
};

module.exports = sendEmail;

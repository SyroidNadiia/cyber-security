const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");

const { BASE_URL } = process.env;

const createVerifyEmail = (verificationToken, email) => {
  const templatePath = path.join(
    __dirname,
    "..",
    "views",
    "verifyEmailTemplate.hbs"
  );
  const emailTemplate = fs.readFileSync(templatePath, "utf-8");
  const compiledTemplate = handlebars.compile(emailTemplate);
  const verificationLink = `${BASE_URL}/verify/${verificationToken}`;
  const emailContent = compiledTemplate({ verificationLink });

  return {
    to: email,
    subject: "Verify email",
    html: emailContent,
  };
};



module.exports = createVerifyEmail;

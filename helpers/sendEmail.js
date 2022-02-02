const sgMail = require('@sendgrid/mail');
require('dotenv').config();

const { SENDGRID_API_KEY, PERSONAL_EMAIL } = process.env;

sgMail.setApiKey(SENDGRID_API_KEY);

const sendEmail = async data => {
  try {
    const email = { ...data, from: PERSONAL_EMAIL };
    await sgMail.send(email);
    return true;
  } catch (error) {
    throw error.message;
  }
};

module.exports = sendEmail;

const { Contact, joiSchema } = require('./contact');
const {
  User,
  joiUserSchema,
  joiSignupSchema,
  joiLoginSchema,
} = require('./user');

module.exports = {
  Contact,
  joiSchema,
  User,
  joiUserSchema,
  joiSignupSchema,
  joiLoginSchema,
};

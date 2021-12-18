const express = require('express');
const router = express.Router();
const { NotFound, BadRequest } = require('http-errors');
const Joi = require('joi');

const {
  listContacts,
  getContactById,
  addContact,
  updateContact,
  removeContact,
} = require('../../model/index');

router.get('/', async (req, res, next) => {
  try {
    const contacts = await listContacts();
    res.json(contacts);
  } catch (error) {
    next(error);
  }
});

router.get('/:contactId', async (req, res, next) => {
  const { contactId } = req.params;
  try {
    const contact = await getContactById(contactId);
    if (!contact) {
      throw new NotFound();
    }
    res.json(contact);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  const body = req.body;
  try {
    const { error } = joiSchema.validate(req.body);
    if (error) {
      throw new BadRequest('missing required name field');
    }
    const newContact = await addContact(body);
    res.status(201).json(newContact);
  } catch (error) {
    next(error);
  }
});

router.put('/:contactId', async (req, res, next) => {
  const { contactId } = req.params;
  try {
    const { error } = joiSchema.validate(req.body);
    if (error) {
      throw new BadRequest('missing required name field');
    }
    const updateContactById = await updateContact(contactId, req.body);
    if (!updateContactById) {
      throw new NotFound();
    }
    res.json(updateContactById);
  } catch (error) {
    next(error);
  }
});

router.delete('/:contactId', async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const deleteContact = await removeContact(contactId);
    if (!deleteContact) {
      throw new NotFound();
    }
    res.json({ message: 'contact deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

const joiSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().required(),
  phone: Joi.string().required(),
});

const express = require('express');
const router = express.Router();
const { NotFound, BadRequest } = require('http-errors');

const { authenticate } = require('../../middlewares');
const { Contact, joiSchema } = require('../../models');

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, favorite } = req.query;
    const { _id } = req.user;
    const skip = (page - 1) * limit;
    if (!favorite) {
      const contacts = await Contact.find(
        { owner: _id },
        '-createdAt -updatedAt',
        { skip, limit: +limit },
      );
      res.json(contacts);
    }
    const filteredContacts = await Contact.find(
      { owner: _id, favorite },
      '-createdAt -updatedAt',
      { skip, limit: +limit },
    );
    res.json(filteredContacts);
  } catch (error) {
    next(error);
  }
});

router.get('/:contactId', authenticate, async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const contact = await Contact.findById(contactId);
    if (!contact) {
      throw new NotFound();
    }
    res.json(contact);
  } catch (error) {
    if (error.message.includes('Cast to ObjectId failed')) {
      error.status = 404;
    }
    next(error);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const body = req.body;
    const { error } = joiSchema.validate(body);
    if (error) {
      throw new BadRequest('missing required name field');
    }
    const { _id } = req.user;
    const newContact = await Contact.create({ ...body, owner: _id });
    res.status(201).json(newContact);
  } catch (error) {
    if (error.message.includes('validation failed')) {
      error.status = 400;
    }
    next(error);
  }
});

router.put('/:contactId', authenticate, async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const { error } = joiSchema.validate(req.body);
    if (error) {
      throw new BadRequest('missing required name field');
    }
    const updateContactById = await Contact.findByIdAndUpdate(
      contactId,
      req.body,
      { new: true },
    );
    if (!updateContactById) {
      throw new NotFound();
    }
    res.json(updateContactById);
  } catch (error) {
    if (error.message.includes('validation failed')) {
      error.status = 400;
    }
    next(error);
  }
});

router.patch('/:contactId/favorite', authenticate, async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const { favorite } = req.body;
    const { error } = joiSchema.validate(req.body);
    if (error) {
      throw new BadRequest('missing required name field');
    }
    const updateStatusContact = await Contact.findByIdAndUpdate(
      contactId,
      { favorite },
      { new: true },
    );
    if (!favorite) {
      throw new BadRequest('missing field favorite');
    }
    res.json(updateStatusContact);
  } catch (error) {
    if (error.message.includes('validation failed')) {
      error.status = 400;
    }
    next(error);
  }
});

router.delete('/:contactId', authenticate, async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const deleteContact = await Contact.findByIdAndRemove(contactId);
    if (!deleteContact) {
      throw new NotFound();
    }
    res.json({ message: 'contact deleted' });
    console.log(deleteContact);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

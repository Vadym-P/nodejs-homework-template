const fs = require('fs/promises');
const express = require('express');
const { BadRequest, Conflict, Unauthorized } = require('http-errors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const gravatar = require('gravatar');
const path = require('path');
const Jimp = require('jimp');

const {
  User,
  joiUserSchema,
  joiSignupSchema,
  joiLoginSchema,
} = require('../../models');
const { authenticate, upload } = require('../../middlewares');

const router = express.Router();

const avatarsDir = path.join(__dirname, '../../', 'public', 'avatars');

const { SECRET_KEY } = process.env;

router.post('/signup', async (req, res, next) => {
  try {
    const { error } = joiSignupSchema.validate(req.body);
    if (error) {
      throw new BadRequest(error.message);
    }
    const { name, email, password } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      throw new Conflict('Email in use');
    }
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    const avatarURL = gravatar.url(email);
    const newUser = await User.create({
      name,
      email,
      password: hashPassword,
      avatarURL,
    });
    res.status(201).json({
      user: {
        name: newUser.name,
        email: newUser.email,
        subscription: 'starter',
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { error } = joiLoginSchema.validate(req.body);
    if (error) {
      throw new BadRequest(error.message);
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      throw new Unauthorized('Email or password is wrong');
    }
    const passwordCompare = await bcrypt.compare(password, user.password);
    if (!passwordCompare) {
      throw new Unauthorized('Email or password is wrong');
    }
    const { _id } = user;
    const payload = {
      id: _id,
    };
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' });
    await User.findByIdAndUpdate(_id, { token });
    res.json({
      token,
      user: {
        email,
        subscription: 'starter',
      },
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/', authenticate, async (req, res, next) => {
  try {
    const { _id } = req.user;
    const { subscription } = req.body;
    const { error } = joiUserSchema.validate(req.body);
    if (error) {
      throw new BadRequest(
        `Validation failed: '${subscription}' is not a valid enum value for path description`,
      );
    }
    const updateStatusUser = await User.findByIdAndUpdate(
      _id,
      { subscription },
      { new: true },
    );
    if (!subscription) {
      throw new BadRequest('missing field subscription');
    }
    const { name, email } = updateStatusUser;
    res.json({
      user: {
        _id,
        name,
        email,
        subscription,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/logout', authenticate, async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: null });
  res.sendStatus(204);
});

router.get('/current', authenticate, async (req, res) => {
  const { name, email, subscription } = req.user;
  res.json({
    user: {
      name,
      email,
      subscription,
    },
  });
});

router.patch(
  '/avatars',
  authenticate,
  upload.single('avatar'),
  async (req, res, next) => {
    const { path: tempUpload, originalname } = req.file;
    const [extension] = originalname.split('.').reverse();
    const newFileName = `${req.user._id}.${extension}`;
    const fileUpload = path.join(avatarsDir, newFileName);
    await fs.rename(tempUpload, fileUpload);

    // const resizeFile = await Jimp.read(fileUpload, (err, img) => {
    //   try {
    //     if (err) {
    //       throw err;
    //     }
    //     img.resize(250, 250).write(`${req.user._id}.${extension}`);
    //   } catch (error) {
    //     next(error);
    //   }
    // });
    const avatarURL = path.join('avatars', newFileName);
    await User.findByIdAndUpdate(req.user._id, { avatarURL }, { new: true });
    res.json({ avatarURL });
  },
);

module.exports = router;

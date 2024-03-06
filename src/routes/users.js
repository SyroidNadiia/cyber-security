const express = require("express");
const upload = require("../utils/multer");
const User = require("../models/user");
const auth = require("../middlewares/auth");
const { increaseLoginAttempts } = require("../utils/authUtils");
const bcrypt = require("bcrypt");
const gravatar = require("gravatar");
const { nanoid } = require("nanoid");

const { createVerifyEmail, sendEmail, HttpError } = require("../helpers");

const router = new express.Router();

// Create a user
router.post("/users", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user) {
      throw HttpError(409, "Email already in use");
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const avatarURL = gravatar.url(email);

    const verificationToken = nanoid();

    const newUser = await User.create({
      ...req.body,
      password: hashPassword,
      avatarURL,
      verificationToken,
    });

    newUser.verificationToken = verificationToken;
    await newUser.save();

    const verifyEmail = createVerifyEmail(verificationToken, email);
    await sendEmail(verifyEmail);

    res.status(201).json({
      status: "success",
      code: 201,
      date: {
        user: {
          email: newUser.email,
          subscription: newUser.subscription,
        },
      },
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// eslint-disable-next-line consistent-return
router.post(
  "/users/photo/:id",
  upload.single("file"),
  async (req, res, next) => {
    const url = `${req.protocol}://${req.get("host")}`;
    const { file } = req;
    const userId = req.params.id;
    try {
      if (!file) {
        const error = new Error("Please upload a file");
        error.httpStatusCode = 400;
        return next(error);
      }
      const user = await User.findById(userId);
      if (!user) return res.sendStatus(404);
      user.imageurl = `${url}/${file.path}`;
      await user.save();
      res.send({ user, file });
    } catch (e) {
      console.log(e);
      res.sendStatus(400).send(e);
    }
  }
);

// Login User
router.post("/users/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      await increaseLoginAttempts(email);
      throw HttpError(401, "Email is wrong");
    }
    const passwordCompare = await bcrypt.compare(password, user.password);

    if (!passwordCompare) {
      await increaseLoginAttempts(email);
      throw new HttpError(401, "password is wrong");
    }

    if (!user.verify) {
      throw HttpError(401, `Verification not confirmed`);
    }

    const payload = {
      id: user._id,
    };

    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "23h" });
    await User.findByIdAndUpdate(user._id, { token });

    res.json({
      status: "success",
      code: 200,
      data: {
        token,
        user: {
          email: user.email,
        },
      },
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// Logout user
router.post("/users/logout", auth.simple, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });
    await req.user.save();
    res.send({});
  } catch (e) {
    res.status(400).send(e);
  }
});

// Logout all
router.post("/users/logoutAll", auth.enhance, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post("/verify", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw HttpError(404, `User not found`);
  }
  if (user.verify) {
    throw HttpError(400, "Verification has already been passed");
  }

  const newVerificationToken = nanoid();
  user.verificationToken = newVerificationToken;
  await user.save();

  const verifyEmail = createVerifyEmail(newVerificationToken, email);
  await sendEmail(verifyEmail);

  res.json({
    status: "success",
    code: 200,
    data: {
      message: "Verification email sent",
    },
  });
});

router.get("/verify/:verificationToken", async (req, res) => {
  const { verificationToken } = req.params;
  const user = await User.findOne({ verificationToken });
  if (!user) {
    throw HttpError(404, `User not found`);
  }
  await User.findByIdAndUpdate(user._id, {
    verify: true,
    verificationToken: "",
  });

  res.json({
    status: "success",
    code: 200,
    data: {
      message: "Verification successful",
    },
  });
});

// Get all users
// eslint-disable-next-line consistent-return
router.get("/users", auth.enhance, async (req, res) => {
  if (req.user.role !== "superadmin")
    return res.status(400).send({
      error: "Only the god can see all the users!",
    });
  try {
    const users = await User.find({});
    res.send(users);
  } catch (e) {
    res.status(400).send(e);
  }
});

// User infos
router.get("/users/me", auth.simple, async (req, res) => {
  try {
    res.send(req.user);
  } catch (e) {
    res.status(400).send(e);
  }
});

// Get user by id only for admin
// eslint-disable-next-line consistent-return
router.get("/users/:id", auth.enhance, async (req, res) => {
  if (req.user.role !== "superadmin")
    return res.status(400).send({
      error: "Only the god can see the user!",
    });
  const _id = req.params.id;
  try {
    const user = await User.findById(_id);
    if (!user) return res.sendStatus(404);
    res.send(user);
  } catch (e) {
    res.sendStatus(400);
  }
});

// Edit/Update user
// eslint-disable-next-line consistent-return
router.patch("/users/me", auth.simple, async (req, res) => {
  console.log(req.body);
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "phone", "username", "email", "password"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );
  if (!isValidOperation)
    return res.status(400).send({ error: "Invalid updates!" });

  try {
    const { user } = req;
    // eslint-disable-next-line no-return-assign
    updates.forEach((update) => (user[update] = req.body[update]));
    await user.save();
    res.send(user);
  } catch (e) {
    res.status(400).send(e);
  }
});

// Admin can update user by id
// eslint-disable-next-line consistent-return
router.patch("/users/:id", auth.enhance, async (req, res) => {
  if (req.user.role !== "superadmin")
    return res.status(400).send({
      error: "Only the god can update the user!",
    });
  const _id = req.params.id;

  const updates = Object.keys(req.body);
  const allowedUpdates = [
    "name",
    "phone",
    "username",
    "email",
    "password",
    "role",
  ];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation)
    return res.status(400).send({ error: "Invalid updates!" });

  try {
    const user = await User.findById(_id);
    // eslint-disable-next-line no-return-assign
    updates.forEach((update) => (user[update] = req.body[update]));
    await user.save();

    if (!user) return res.sendStatus(404);
    res.send(user);
  } catch (e) {
    res.status(400).send(e);
  }
});

// Delete by id
// eslint-disable-next-line consistent-return
router.delete("/users/:id", auth.enhance, async (req, res) => {
  if (req.user.role !== "superadmin")
    return res.status(400).send({
      error: "Only the god can delete the user!",
    });
  const _id = req.params.id;

  try {
    const user = await User.findByIdAndDelete(_id);
    if (!user) return res.sendStatus(404);

    res.send({ message: "User Deleted" });
  } catch (e) {
    res.sendStatus(400);
  }
});

// eslint-disable-next-line consistent-return
router.delete("/users/me", auth.simple, async (req, res) => {
  if (req.user.role !== "superadmin")
    return res.status(400).send({
      error: "You cannot delete yourself!",
    });
  try {
    await req.user.remove();
    res.send(req.user);
  } catch (e) {
    res.sendStatus(400);
  }
});

router.get("/verify/:verificationToken", async (req, res) => {
  const { verificationToken } = req.params;
  const user = await User.findOne({ verificationToken });
  if (!user) {
    throw HttpError(404, `User not found`);
  }
  await User.findByIdAndUpdate(user._id, {
    verify: true,
    verificationToken: "",
  });

  res.json({
    status: "success",
    code: 200,
    data: {
      message: "Verification successful",
    },
  });
});

module.exports = router;

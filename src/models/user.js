const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const emailRegexp = require("./emailRegexp");

const handleSaveErrors = require("../helpers/handelSaveErrors");
const { Schema } = mongoose;
const userSchema = Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("email is invalid");
        }
      },
    },
    password: {
      type: String,
      trim: true,
      minlength: 7,
      validate(value) {
        if (value.toLowerCase().includes("password")) {
          throw new Error("Password should not contain word: password");
        }
      },
    },
    role: {
      type: String,
      default: "guest",
      enum: ["guest", "admin", "superadmin"],
    },

    phone: {
      type: String,
      unique: true,
      trim: true,
      validate(value) {
        if (!validator.isMobilePhone(value)) {
          throw new Error("Phone is invalid");
        }
      },
    },
    imageurl: {
      type: String,
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const registerSchema = Joi.object({
  name: Joi.string().required(),
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().pattern(emailRegexp).required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/)
    .required()
    .messages({
      "string.pattern.base":
        "Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character (!@#$%^&*)",
    }),
  phone: Joi.string().required(),
  imageurl: Joi.string(),
});

const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});

const verifyEmailSchema = Joi.object({
  email: Joi.string().pattern(emailRegexp).required(),
});

userSchema.post("save", handleSaveErrors);

userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();
  if (!userObject.role === "superadmin") {
    delete userObject.updatedAt;
    delete userObject.__v;
  }
  delete userObject.password;
  delete userObject.tokens;

  return userObject;
};

function verifyEmail(email) {
  const validationResult = verifyEmailSchema.validate({ email });
  if (validationResult.error) {
    throw new Error(validationResult.error.details[0].message);
  }
}

userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, "mySecret");
  user.tokens = user.tokens.concat({ token });
  await user.save();
  return token;
};

userSchema.statics.findByCredentials = async (username, password) => {
  // eslint-disable-next-line no-use-before-define
  const user = await User.findOne({ username });
  if (!user) throw new Error("Unable to login");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Unable to login");

  return user;
};

// Hash the plain text password before save
userSchema.pre("save", async function (next) {
  const user = this;

  try {
    verifyEmail(user.email);

    if (user.isModified("password")) {
      user.password = await bcrypt.hash(user.password, 8);
    }

    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.validateRegisterInput = function (userInput) {
  return registerSchema.validate(userInput);
};

userSchema.methods.validateLoginInput = function (loginInput) {
  return loginSchema.validate(loginInput);
};

const User = mongoose.model("User", userSchema);

module.exports = User;

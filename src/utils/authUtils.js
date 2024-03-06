const User = require("../models/user");

const increaseLoginAttempts = async (email) => {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("User not found");
    }

    user.loginAttempts += 1;
    if (user.loginAttempts >= 5) {
      user.lockUntil = Date.now() + 24 * 60 * 60 * 1000;
    }

    await user.save();
    return "Login attempts increased successfully";
  } catch (error) {
    if (error.name === "MongoError" && error.code === 11000) {
      throw new Error(
        "Duplicate key error: Login attempts could not be increased"
      );
    } else if (error.message === "User not found") {
      throw new Error("User not found");
    } else {
      throw new Error("Failed to increase login attempts");
    }
  }
};

module.exports = {
  increaseLoginAttempts,
};

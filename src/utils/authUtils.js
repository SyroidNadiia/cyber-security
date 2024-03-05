const { User } = require("../models/user");

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
  } catch (error) {
    throw new Error("Failed to increase login attempts");
  }
};

module.exports = {
  increaseLoginAttempts,
};

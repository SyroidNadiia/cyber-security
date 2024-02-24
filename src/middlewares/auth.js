const jwt = require('jsonwebtoken');
const User = require('../models/user');

const simple = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    const { SECRET_KEY } = process.env;
    console.log(email);

    const payload = {
      id: user._id,
    };

    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '23h' });
    if (!user) throw new Error();
    req.token = token;
    req.user = user;
    next();
  } catch (e) {
    res.status(401).send({ error: 'Please authenticate.' });
  }
};

const enhance = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    console.log(email);

    const { SECRET_KEY } = process.env;

    const payload = {
      id: user._id,
    };

    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '23h' });

    if (!user) throw new Error();

    req.token = token;
    req.user = user;
    next();
  } catch (e) {
    res.status(401).send({ error: 'Please authenticate.' });
  }
};

module.exports = { simple, enhance };

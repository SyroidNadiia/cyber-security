const mongoose = require('mongoose');
const Joi = require("joi");
const handleSaveErrors = require("../helpers/handelSaveErrors");

const { Schema } = mongoose;

const cinemaSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  ticketPrice: {
    type: Number,
    required: true,
  },
  city: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  seats: {
    type: [Schema.Types.Mixed],
    required: true,
  },
  seatsAvailable: {
    type: Number,
    required: true,
  },
  image: {
    type: String,
  },
});

cinemaSchema.post("save", handleSaveErrors);

const cinemaSchemaValidation = Joi.object({
  name: Joi.string()
    .min(2)
    .regex(/^[a-zA-Z0-9 ]+$/)
    .required(),
  ticketPrice: Joi.number().required(),
  city: Joi.string().required(),
  seats: Joi.array().required(),
  seatsAvailable: Joi.number().required(),
  image: Joi.string(),
});

cinemaSchema.methods.validateCinemaData = function validateCinema(cinemaData) {
  return cinemaSchemaValidation.validate(cinemaData);
};

const Cinema = mongoose.model('Cinema', cinemaSchema);

module.exports = Cinema;

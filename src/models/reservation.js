const mongoose = require('mongoose');
const Joi = require("joi");
const handleSaveErrors = require("../helpers/handelSaveErrors");

const { Schema } = mongoose;
const reservationSchema = new Schema({
  date: {
    type: Date,
    required: true,
  },
  startAt: {
    type: String,
    required: true,
    trim: true,
  },
  seats: {
    type: [Schema.Types.Mixed],
    required: true,
  },
  ticketPrice: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  movieId: {
    type: Schema.Types.ObjectId,
    ref: 'Movie',
    required: true,
  },
  cinemaId: {
    type: Schema.Types.ObjectId,
    ref: 'Cinema',
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  checkin: {
    type: Boolean,
    default: false,
  },
});

reservationSchema.post("save", handleSaveErrors);

const reservationSchemaValidation = Joi.object({
  date: Joi.date().required(),
  startAt: Joi.string().required(),
  seats: Joi.array().required(),
  ticketPrice: Joi.number().required(),
  total: Joi.number().required(),
  movieId: Joi.string().required(),
  cinemaId: Joi.string().required(),
  username: Joi.string().required(),
  phone: Joi.string().required(),
  checkin: Joi.boolean().default(false),
});

reservationSchema.methods.validateReservationData =
  function validateReservation(reservationData) {
    return reservationSchemaValidation.validate(reservationData);
  };

const Reservation = mongoose.model('Reservation', reservationSchema);

module.exports = Reservation;

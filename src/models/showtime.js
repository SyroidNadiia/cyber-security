const mongoose = require("mongoose");
const Joi = require("joi");
const handleSaveErrors = require("../helpers/handelSaveErrors");

const { Schema } = mongoose;
const showtimeSchema = new Schema({
  startAt: {
    type: String,
    required: true,
    trim: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  movieId: {
    type: Schema.Types.ObjectId,
    ref: "Movie",
    required: true,
  },
  cinemaId: {
    type: Schema.Types.ObjectId,
    ref: "Cinema",
    required: true,
  },
});

showtimeSchema.post("save", handleSaveErrors);

const showtimeSchemaValidation = Joi.object({
  startAt: Joi.string().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  movieId: Joi.string().required(),
  cinemaId: Joi.string().required(),
});

showtimeSchema.methods.validateShowtimeData = function validateShowtime(
  showtimeData
) {
  return showtimeSchemaValidation.validate(showtimeData);
};

const Showtime = mongoose.model("Showtime", showtimeSchema);

module.exports = Showtime;

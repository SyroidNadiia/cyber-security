const mongoose = require("mongoose");
const Joi = require("joi");

const handleSaveErrors = require("../helpers/handelSaveErrors");
const { Schema } = mongoose;

const movieSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  image: {
    type: String,
  },
  language: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  genre: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  director: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  cast: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  releaseDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
});

movieSchema.post("save", handleSaveErrors);

const movieSchemaValidation = Joi.object({
  title: Joi.string().required(),
  image: Joi.string(),
  language: Joi.string().required(),
  genre: Joi.string().required(),
  director: Joi.string().required(),
  cast: Joi.string().required(),
  description: Joi.string().required(),
  duration: Joi.number().required(),
  releaseDate: Joi.date().required(),
  endDate: Joi.date().required(),
});

movieSchema.methods.validateMovieData = function validateMovie(movieData) {
  return movieSchemaValidation.validate(movieData);
};

const Movie = mongoose.model("Movie", movieSchema);

module.exports = Movie;

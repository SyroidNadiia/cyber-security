const Reservation = require('../models/reservation');
const Movie = require('../models/movie');
const Cinema = require('../models/cinema');

// Cinema User modeling (GET ALL CINEMAS)
// Get all cinemas based on the user's past reservations
// @return a sorted cinema list
const cinemaUserModeling = async (cinemas, username) => {
  const userReservations = await Reservation.find({ username: username });

  if (userReservations.length) {
    const cinemaResult = {};
    // eslint-disable-next-line array-callback-return
    userReservations.map(userReservation => {
      const id = userReservation.cinemaId;
      // eslint-disable-next-line no-unused-expressions, no-prototype-builtins, no-plusplus
      cinemaResult.hasOwnProperty(id) ? ++cinemaResult[id] : (cinemaResult[id] = 1);
    });
    const sortedCinemaResult = [];
    // eslint-disable-next-line no-restricted-syntax, guard-for-in
    for (const cinema in cinemaResult) {
      sortedCinemaResult.push([cinema, cinemaResult[cinema]]);
    }

    sortedCinemaResult.sort((a, b) => {
      return b[1] - a[1];
    });
    console.log(sortedCinemaResult);

    const newCinemas = JSON.parse(JSON.stringify(cinemas));
    let i = 0;
    let extractedObj;
    // eslint-disable-next-line no-restricted-syntax
    for (const sortedCinema of sortedCinemaResult) {
      // eslint-disable-next-line no-loop-func
      newCinemas.forEach((cinema, index) => {
        // eslint-disable-next-line eqeqeq
        if (cinema._id == sortedCinema[0]) {
          console.log('FOUND');
          extractedObj = newCinemas.splice(index, 1);
        }
      });
      newCinemas.splice(i, 0, extractedObj[0]);
      // eslint-disable-next-line no-plusplus
      i++;
    }

    console.log(newCinemas);

    return newCinemas;
  }
  return cinemas;
};

const moviesUserModeling = async username => {
  // eslint-disable-next-line no-undef
  userPreference = {
    genre: {},
    director: {},
    cast: {},
  };

  const userReservations = JSON.parse(
    JSON.stringify(await Reservation.find({ username: username }))
  );
  const Allmovies = JSON.parse(JSON.stringify(await Movie.find({})));

  // eslint-disable-next-line array-callback-return, consistent-return
  const moviesWatched = userReservations.map(reservation => {
    // eslint-disable-next-line no-restricted-syntax
    for (const movie of Allmovies) {
      // eslint-disable-next-line eqeqeq
      if (movie._id == reservation.movieId) {
        return movie;
      }
    }
  });

  //  console.log(moviesWatched);

  // eslint-disable-next-line array-callback-return
  moviesWatched.map(movie => {
    const genres = movie.genre.replace(/\s*,\s*/g, ',').split(',');
    const directors = movie.director.replace(/\s*,\s*/g, ',').split(',');
    const casts = movie.cast.replace(/\s*,\s*/g, ',').split(',');
    // eslint-disable-next-line no-restricted-syntax
    for (const genre of genres) {
      // eslint-disable-next-line no-unused-expressions, no-undef
      if (userPreference.genre[genre]) {
        // eslint-disable-next-line no-plusplus, no-undef
        ++userPreference.genre[genre];
      } else {
        // eslint-disable-next-line no-undef
        userPreference.genre[genre] = 1;
      }
    }
    // eslint-disable-next-line no-restricted-syntax
    for (const director of directors) {
      // eslint-disable-next-line no-unused-expressions, no-undef
      userPreference.director[director]
        ? // eslint-disable-next-line no-plusplus, no-undef
          ++userPreference.director[director]
        : // eslint-disable-next-line no-undef
          (userPreference.director[director] = 1);
    }
    // eslint-disable-next-line no-restricted-syntax
    for (const cast of casts) {
      // eslint-disable-next-line no-unused-expressions, no-undef, no-plusplus
      userPreference.cast[cast] ? ++userPreference.cast[cast] : (userPreference.cast[cast] = 1);
    }
  });

  // console.log(userPreference)

  // find movies that are available for booking
  // eslint-disable-next-line no-use-before-define
  const availableMovies = availableMoviesFilter(Allmovies);
  // console.log(availableMovies)
  // eslint-disable-next-line no-use-before-define
  const moviesNotWatched = moviesNotWatchedFilter(availableMovies, userReservations);
  // console.log(moviesNotWatched)

  // eslint-disable-next-line no-use-before-define, no-undef
  const moviesRated = findRates(moviesNotWatched, userPreference);

  moviesRated.sort((a, b) => {
    return b[1] - a[1];
  });
  // console.log(moviesRated)

  const moviesToObject = moviesRated.map(array => {
    return array[0];
  });
  return moviesToObject;
};

const findRates = (moviesNotWatched, userPreference) => {
  const result = [];
  let rate;
  // eslint-disable-next-line no-restricted-syntax
  for (const movie of moviesNotWatched) {
    rate = 0;
    // eslint-disable-next-line no-restricted-syntax, guard-for-in
    for (const pref in userPreference) {
      // eslint-disable-next-line no-use-before-define
      rate += getRateOfProperty(pref, userPreference, movie);
      // TODO we can use weights here
      console.log(rate, pref);
    }
    if (rate !== 0) result.push([movie, rate]);
  }
  // console.log(result);
  return result;
};

const getRateOfProperty = (pref, userPreference, movie) => {
  let rate = 0;
  const values = Object.keys(userPreference[pref]).map(key => {
    return [key, userPreference[pref][key]];
  });
  const movieValues = movie[pref].replace(/\s*,\s*/g, ',').split(',');
  // eslint-disable-next-line no-restricted-syntax, no-const-assign
  for (values of values) {
    if (movieValues.length) {
      // eslint-disable-next-line no-restricted-syntax, no-const-assign
      for (movieValues of movieValues) {
        // eslint-disable-next-line eqeqeq
        if (movieValues == values[0]) {
          rate += values[1];
        }
      }
    }
  }

  return rate;
};

const availableMoviesFilter = Allmovies => {
  const today = new Date();
  const returnMovies = [];
  // eslint-disable-next-line array-callback-return
  Allmovies.map(movie => {
    const releaseDate = new Date(movie.releaseDate);
    const endDate = new Date(movie.endDate);
    if (today >= releaseDate && today <= endDate) {
      returnMovies.push(movie);
    }
  });
  return returnMovies;
};

const moviesNotWatchedFilter = (availableMovies, userReservations) => {
  const returnMovies = [];
  // eslint-disable-next-line array-callback-return
  availableMovies.map(movie => {
    const isFirst = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const reservation of userReservations) {
      // eslint-disable-next-line eqeqeq
      if (reservation.movieId == movie._id) {
        isFirst.push(false);
      } else {
        isFirst.push(true);
      }
    }

    if (isFirst.every(Boolean)) {
      returnMovies.push(movie);
    }
  });
  return returnMovies;
};

const reservationSeatsUserModeling = async username => {
  const numberOfTicketsArray = [];
  let numberOfTickets = 1;
  const positions = {
    front: 0,
    center: 0,
    back: 0,
  };
  const cinemas = JSON.parse(JSON.stringify(await Cinema.find({})));
  const userReservations = JSON.parse(
    JSON.stringify(await Reservation.find({ username: username }))
  );

  // eslint-disable-next-line array-callback-return
  userReservations.map(reservation => {
    // eslint-disable-next-line no-restricted-syntax
    for (const cinema of cinemas) {
      // eslint-disable-next-line eqeqeq
      if (cinema._id == reservation.cinemaId) {
        // find how many rows the cinema has
        // eslint-disable-next-line no-use-before-define
        const position = getPosition(cinema.seats.length, reservation.seats);
        // eslint-disable-next-line no-plusplus
        ++positions[position];
        numberOfTicketsArray.push(reservation.seats.length);
      }
    }
  });
  numberOfTickets = Math.round(
    numberOfTicketsArray.reduce((a, b) => a + b, 0) / numberOfTicketsArray.length
  );

  return {
    numberOfTickets,
    positions,
  };
};

// eslint-disable-next-line consistent-return
const getPosition = (cinemaRows, seats) => {
  const rowNum = seats[0][0];
  const step = cinemaRows / 3;
  let pos = 1;
  for (let i = step; i <= cinemaRows; i += step) {
    if (rowNum < i) {
      // eslint-disable-next-line default-case
      switch (pos) {
        case 1:
          return 'front';
        case 2:
          return 'center';
        case 3:
          return 'back';
      }
    }
    // eslint-disable-next-line no-plusplus
    pos++;
  }
};

const userModeling = {
  cinemaUserModeling,
  moviesUserModeling,
  reservationSeatsUserModeling,
};

module.exports = userModeling;

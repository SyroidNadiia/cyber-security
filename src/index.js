const express = require("express");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const winston = require("winston");
const { JSDOM } = require("jsdom");
const createDOMPurify = require("dompurify");

if (process.env.NODE_ENV !== "production") {
  // eslint-disable-next-line import/no-extraneous-dependencies, global-require, node/no-unpublished-require
  require("dotenv").config({ path: path.join(__dirname, "../.env") });
}

require("./db/mongoose");

const winstonLogger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/info.log", level: "info" }),
  ],
});

// Routes
const userRouter = require("./routes/users");
const movieRouter = require("./routes/movies");
const cinemaRouter = require("./routes/cinema");
const showtimeRouter = require("./routes/showtime");
const reservationRouter = require("./routes/reservation");
const invitationsRouter = require("./routes/invitations");

const app = express();
app.disable("x-powered-by");
const port = process.env.PORT || 8080;
app.use(cors());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "../../client/build")));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Request methods you wish to allow
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );

  // Request headers you wish to allow
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers,X-Access-Token,XKey,Authorization"
  );

  //  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  // Pass to next layer of middleware
  next();
});
app.use(express.json());
app.use(userRouter);
app.use(movieRouter);
app.use(cinemaRouter);
app.use(showtimeRouter);
app.use(reservationRouter);
app.use(invitationsRouter);

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

app.use((req, res, next) => {
  winstonLogger.info("Отримано запит", { url: req.url, method: req.method });
  if (req.body.htmlData) {
    req.body.htmlData = DOMPurify.sanitize(req.body.htmlData);
  }
  next();
});

// app.get('/api/test', (req, res) => res.send('Hello World'))

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get("/*", (req, res) => {
  res.sendFile(path.join(`${__dirname}../../client/build/index.html`));
});
app.listen(port, () => console.log(`app is running in PORT: ${port}`));

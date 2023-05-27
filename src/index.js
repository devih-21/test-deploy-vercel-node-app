require("dotenv").config();
const express = require("express");
const path = require("path");
const methodOverride = require("method-override");
const route = require("./routes");
const cors = require("cors");
const bodyParser = require("body-parser");
var logger = require("morgan");
var cookieParser = require("cookie-parser");
var debug = require("debug")("demopaymentnodb:server");
var http = require("http");

const PORT = process.env.PORT || 3001;

const app = express();

app.use(bodyParser.json({ limit: "50mb" }));

app.use(cors());
app.use(logger("dev"));
app.use(express.static(path.join(__dirname, "./public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.json());
app.use(methodOverride("_method"));

route(app);

var server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

server.on("listening", onListening);

function onListening() {
  var addr = server.address();
  var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  debug("Listening on " + bind);
}

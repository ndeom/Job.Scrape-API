require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());

app.get("/", (req, res) => {
  console.log("You've connected to the API, YAY!");
});

app.get("/api", (req, res) => {
  console.log("You've successfully reached the api route!");
});

app.listen(port, () => {
  console.log(`App is listening on ${port}`);
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("There was an error!");
});

import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import mysql from "mysql";

// const express = require("express");
// const cors = require("cors");
// const fetch = require("node-fetch");

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());

app.get("/", (req, res) => {
  console.log("You've connected to the API, YAY!");
});

app.get("/api", (req, res) => {
  console.log("You've successfully reached the api route!");
  console.log(req.query);

  const {
    keywords = null,
    city = null,
    state = null,
    zipcode = null,
    tech = null,
    skill = null,
  } = req.query;
});

app.listen(port, () => {
  console.log(`App is listening on PORT: ${port}`);
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("There was an error!");
});

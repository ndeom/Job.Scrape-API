import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import mysql from "mysql";
import { queryFormatter } from "./api/apiMethods.js";

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

  console.log(Object.keys(req.query).length);

  const { queryString, queryValues } = queryFormatter(req.query);

  const connection = mysql.createConnection({
    host: process.env.ENDPOINT,
    user: process.env.USER,
    password: process.env.PASSWORD,
  });

  connection.query(queryString, queryValues, (error, results, fields) => {
    if (error) throw error;
    return res.json(results);
  });
});

app.listen(port, () => {
  console.log(`App is listening...`);
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("There was an error!");
});

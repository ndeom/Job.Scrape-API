import dotenv from "dotenv";
dotenv.config();
import mysql from "mysql";
import shortid from "shortid";
import {
  getStackOverflowData,
  getYCombinatorData,
  getTriplebyteData,
  sqlDateFormat,
} from "./api/apiMethods.js";

/**
 * Collect data from YCombinator, Stack Overflow, and TripleByte-------------
 */

//Start Timer
console.time("Scrape Time");

Promise.all([
  getStackOverflowData(),
  getYCombinatorData(),
  getTriplebyteData(),
]).then((data) => {
  const [stackData, yCombData, tripData] = data;
  const currentDate = new Date();
  const fillDate = sqlDateFormat(currentDate);

  const fStackData = stackData.map((job) => {
    return {
      job_id: shortid.generate(),
      title: job.title,
      link: job.link,
      category: job.category,
      company: job["a10:author"]["a10:name"],
      date: sqlDateFormat(job.pubDate),
      location: job.location,
    };
  });

  const fYCombData = yCombData.map((job) => {
    return {
      job_id: shortid.generate(),
      title: job.title,
      link: job.link,
      category: "",
      company: job.company,
      date: fillDate,
      location: job.location,
    };
  });

  const fTripData = tripData.map((job) => {
    return {
      job_id: shortid.generate(),
      title: job.title,
      link: job.link,
      category: job.technologies,
      company: job.company,
      date: fillDate,
      location:
        typeof job.location === "object" && job.location.length === 0
          ? [""]
          : job.location,
    };
  });

  /**
   * Combine data and format for table insert
   */

  const compositeData = [...fStackData, ...fYCombData, ...fTripData];

  const jobsTableInsert = compositeData.map((job) => [
    job.job_id,
    job.title,
    job.date,
    job.location,
    job.link,
    job.company,
  ]);

  const jobTechTableInsert = compositeData
    .reduce((accum, job) => {
      if (typeof job.category === "object") {
        let uniqueCategories = [...new Set(job.category)];
        return [
          ...accum,
          ...uniqueCategories.map((category) => [job.job_id, category]),
        ];
      }
      return [...accum, [job.job_id, job.category]];
    }, [])
    .filter((job) => job[1]);

  console.log("TECH TABLE: ", jobTechTableInsert);

  const jobLocationTableInsert = compositeData.reduce((accum, job) => {
    if (typeof job.location === "object") {
      return [
        ...accum,
        ...job.location.map((location) => [job.job_id, location]),
      ];
    }
    return [...accum, [job.job_id, job.location]];
  }, []);

  /**
   * Truncate all table contents and fill with the newly scraped data.
   * This will be done every 12 hours and ensures that there are no duplicate jobs
   * from the same sources.
   */

  const pool = mysql.createPool({
    connectionLimit: 3,
    host: process.env.ENDPOINT,
    user: process.env.USER,
    password: process.env.PASSWORD,
  });

  pool.getConnection((err, connection) => {
    if (err) throw err;

    connection.query("TRUNCATE TABLE jobs.jobs", (error, results, fields) => {
      connection.release();
      if (error) throw error;
      console.log("RESULTS: ", results);
      console.log("FIELDS: ", fields);
    });

    connection.query(
      "TRUNCATE TABLE jobs.job_tech",
      (error, results, fields) => {
        connection.release();
        if (error) throw error;
        console.log("RESULTS: ", results);
        console.log("FIELDS: ", fields);
      }
    );

    connection.query(
      "TRUNCATE TABLE jobs.job_location",
      (error, results, fields) => {
        connection.release();
        if (error) throw error;
        console.log("RESULTS: ", results);
        console.log("FIELDS: ", fields);
      }
    );

    connection.query(
      "INSERT INTO jobs.jobs (job_id, title, pub_date, location, link, company) VALUES ?",
      [jobsTableInsert],
      (error, results, fields) => {
        connection.release();
        if (error) throw error;
        console.log("MAIN QUERY");
        console.log("RESULTS: ", results);
        console.log("FIELDS: ", fields);
      }
    );

    connection.query(
      "INSERT INTO jobs.job_tech (job_id, technology) VALUES ?",
      [jobTechTableInsert],
      (error, results, fields) => {
        connection.release();
        if (error) throw error;
        console.log("TECH QUERY");
        console.log("RESULTS: ", results);
        console.log("FIELDS: ", fields);
      }
    );

    connection.query(
      "INSERT INTO jobs.job_location (job_id, location) VALUES ?",
      [jobLocationTableInsert],
      (error, results, fields) => {
        connection.release();
        if (error) throw error;
        console.log("LOCATION QUERY");
        console.log("RESULTS: ", results);
        console.log("FIELDS: ", fields);
      }
    );

    pool.end((err) => {
      if (err) throw err;
      console.timeEnd("Scrape Time");
    });
  });
});

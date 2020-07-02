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
      logo: null,
    };
  });

  const fYCombData = yCombData.map((job) => {
    return {
      job_id: shortid.generate(),
      title: job.title,
      link: job.link,
      category: null,
      company: job.company,
      date: fillDate,
      location: job.location,
      logo: job.logo,
    };
  });

  const fTripData = tripData.map((job) => {
    return {
      job_id: shortid.generate(),
      title: job.title,
      link: job.link,
      category: job.technologies === undefined ? null : job.technologies,
      company: job.company,
      date: fillDate,
      location:
        typeof job.location === "object" && job.location.length === 0
          ? ""
          : `${job.location}`,
      logo: job.logo,
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
    job.link,
    job.company,
    `${job.category}`,
    job.location,
    job.logo,
  ]);

  const connection = mysql.createConnection({
    host: process.env.ENDPOINT,
    user: process.env.USER,
    password: process.env.PASSWORD,
  });

  connection.query(
    "TRUNCATE TABLE jobs.jobs_main",
    (error, results, fields) => {
      if (error) throw error;
      console.log("RESULTS: ", results);
      console.log("FIELDS: ", fields);
    }
  );

  connection.query(
    "INSERT INTO jobs.jobs_main (job_id, title, pub_date, link, company, technologies, location, logo) VALUES ?",
    [jobsTableInsert],
    (error, results, fields) => {
      if (error) throw error;
      console.log("MAIN QUERY");
      console.log("RESULTS: ", results);
      console.log("FIELDS: ", fields);
    }
  );

  connection.end();
});

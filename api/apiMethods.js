import fetch from "node-fetch";
import parser from "fast-xml-parser";
import he from "he";
import cheerio from "cheerio";

// const parser = require("fast-xml-parser");
// const he = require("he");
// const cheerio = require("cheerio");
// const e = require("express");

/**
 * Options for XML parser---------------------------------------------------
 */

var options = {
  attributeNamePrefix: "@_",
  attrNodeName: "attr", //default is 'false'
  textNodeName: "#text",
  ignoreAttributes: true,
  ignoreNameSpace: false,
  allowBooleanAttributes: false,
  parseNodeValue: true,
  parseAttributeValue: false,
  trimValues: false,
  cdataTagName: "__cdata", //default is 'false'
  cdataPositionChar: "\\c",
  parseTrueNumberOnly: false,
  arrayMode: false, //"strict"
  attrValueProcessor: (val, attrName) =>
    he.decode(val, { isAttributeValue: true }), //default is a=>a
  tagValueProcessor: (val, tagName) => he.decode(val), //default is a=>a
  stopNodes: ["parse-me-as-string"],
};

/**
 * Data collection functions--------------------------------------------------
 */

export async function getStackOverflowData() {
  console.log("getting data from Stack Overflow");
  const response = await fetch("https://stackoverflow.com/jobs/feed");
  const xml = await response.text();

  if (parser.validate(xml)) {
    const parsedXML = parser.parse(xml, options);
    return parsedXML.rss.channel.item.filter((job) => {
      let currentDate = Date.now();
      let publishDate = new Date(job.pubDate);

      //Returns only jobs that have been posted in the last 7
      //calendar days
      return currentDate - publishDate < 604800000;
    });
  }
}

export async function getYCombinatorData() {
  console.log("getting data from Hacker News");
  const response = await fetch("https://www.workatastartup.com/jobs");
  const html = await response.text();
  const $ = cheerio.load(html);
  const body = $("body");

  const logos = body.find(".logo").map((i, el) => {
    return {
      logo: el.attribs.src,
    };
  });

  const jobTitlesAndLinks = body.find(".job-name").map((i, el) => {
    return {
      title: el.children[0].data,
      link: "https://www.workatastartup.com".concat(el.attribs.href),
    };
  });

  const jobDetails = body.find(".job-details").map((i, el) => {
    let childArr = el.children.map((child) => child.children[0].data);
    return {
      company: childArr[0],
      type: childArr[1],
      location: childArr[2],
      field: childArr[3],
    };
  });

  let keys = Object.keys(jobTitlesAndLinks);
  keys = keys.slice(0, keys.length - 4);

  // Returns an array of job objects with the following format:
  // [{title: ..., link: ..., company: ..., type: ..., location: ..., field: ...}, ...]

  return keys.map((i) => ({
    ...jobTitlesAndLinks[i],
    ...jobDetails[i],
    ...logos[i],
  }));
}

export async function getTriplebyteData() {
  console.log("getting data from Triplebyte");
  let response = await fetch("https://triplebyte.com/jobs");
  let html = await response.text();
  let $ = cheerio.load(html);
  let body = $("body");

  let logos = body.find(".max-h-20").map((i, el) => {
    return {
      logo: el.attribs["data-src"],
    };
  });

  let jobTitlesAndLinks = body.find(".font-bold > a").map((i, el) => {
    return {
      title: el.children[0].data,
      link: "https://triplebyte.com".concat(el.attribs.href),
    };
  });

  let companies = body.find(".font-normal > a").map((i, el) => {
    return {
      company: el.children[0].data,
    };
  });

  let fieldsAndTechnologies = body.find(".my-1").map((i, el) => {
    return {
      fields: el.children
        .filter((e) => e.name === "span")
        .map((e) => e.children[0].children[0].data),
      technologies: el.next.next.children
        .filter((e) => e.name === "div")[0]
        .children.filter((e) => e.name === "span")
        .map((e) => e.children[0].children[0].data),
    };
  });

  let location = body.find(".mt-auto").map((i, el) => {
    return {
      location: el.children
        .filter((e) => e.name === "div")[0]
        .children.filter((e) => e.name === "div")[0]
        .children.map((e) => {
          return e.data;
        }),
    };
  });

  let keys = Object.keys(jobTitlesAndLinks);
  keys = keys.slice(0, keys.length - 4);

  let finalOutput = keys.map((i) => ({
    ...jobTitlesAndLinks[i],
    ...companies[i],
    ...fieldsAndTechnologies[i],
    ...location[i],
    ...logos[i],
  }));

  for (let i = 2; i < 11; i++) {
    response = await fetch(`https://triplebyte.com/jobs?page=${i}`);
    html = await response.text();
    $ = cheerio.load(html);
    body = $("body");

    logos = body.find(".max-h-20").map((i, el) => {
      return {
        logo: el.attribs["data-src"],
      };
    });

    jobTitlesAndLinks = body.find(".font-bold > a").map((i, el) => {
      return {
        title: el.children[0].data,
        link: "https://triplebyte.com".concat(el.attribs.href),
      };
    });

    companies = body.find(".font-normal > a").map((i, el) => {
      return {
        company: el.children[0].data,
      };
    });

    fieldsAndTechnologies = body.find(".my-1").map((i, el) => {
      return {
        fields: el.children
          .filter((e) => e.name === "span")
          .map((e) => e.children[0].children[0].data),
        category: el.next.next.children
          .filter((e) => e.name === "div")[0]
          .children.filter((e) => e.name === "span")
          .map((e) => e.children[0].children[0].data),
      };
    });

    location = body.find(".mt-auto").map((i, el) => {
      let location = el.children
        .filter((e) => e.name === "div")[0]
        .children.filter((e) => e.name === "div")[0]
        .children.map((e) => {
          return e.data;
        });

      return {
        location: location,
      };
    });

    keys = Object.keys(jobTitlesAndLinks);
    keys = keys.slice(0, keys.length - 4);

    finalOutput = [
      ...finalOutput,
      ...keys.map((i) => ({
        ...jobTitlesAndLinks[i],
        ...companies[i],
        ...fieldsAndTechnologies[i],
        ...location[i],
        ...logos[i],
      })),
    ];
  }
  return finalOutput;
}

/**
 * Returns a date string formatted for MySQL input
 */

export function sqlDateFormat(date) {
  date = typeof date === "string" ? new Date(date) : date;
  const day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate();
  const month =
    date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1;
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
}

/**
 * Returns a formatted MySQL query based on form inputs with
 * appropriate escapes
 */

export function queryFormatter(queryString) {
  const {
    keywords = null,
    city = null,
    state = null,
    zipcode = null,
    tech = null,
    skill = null,
  } = queryString;

  let specifiers = [];
  let queryValues = [];
  let baseQuery = `SELECT * FROM jobs.jobs_main`;

  if (keywords) {
    specifiers.push(
      "WHERE MATCH (title, company, technologies, location) AGAINST (?)"
    );
    queryValues.push(keywords);
  }

  switch (skill) {
    case "Beginner": {
      specifiers.length
        ? (specifiers = [specifiers[0].concat(" junior entry")])
        : specifiers.push(
            "WHERE MATCH (title, company, technologies, location) AGAINST ('junior entry')"
          );
      break;
    }
    case "Intermediate":
      break;
    case "Experienced": {
      specifiers.length
        ? (queryValues = [queryValues[0].concat(" senior lead principle")])
        : specifiers.push(
            "WHERE MATCH (title, company, technologies, location) AGAINST ('senior lead principle')"
          );
      break;
    }
    default:
      break;
  }

  if (city && state) {
    specifiers.length
      ? specifiers.push(" AND LOCATE(?, location)")
      : specifiers.push(" WHERE LOCATE(?, location)");
    queryValues.push(`${city}, ${state}`);
  }

  if (city && !state) {
    specifiers.length
      ? specifiers.push(" AND LOCATE(?, location)")
      : specifiers.push(" WHERE LOCATE(?, location)");
    queryValues.push(city);
  }

  if (state && !city) {
    specifiers.length
      ? specifiers.push(" AND LOCATE(?, location)")
      : specifiers.push(" WHERE LOCATE(?, location)");
    queryValues.push(state);
  }

  if (tech) {
    specifiers.length ? specifiers.concat("AND") : specifiers.concat("WHERE");
    tech.split(" ").forEach((el, i) => {
      i < 1
        ? specifiers.push("WHERE LOCATE(?, technologies)")
        : specifiers.push(" AND LOCATE(?, technologies)");
      queryValues.push(el);
    });
  }

  console.log("queryString: ", baseQuery.concat(" ", specifiers.join(" ")));
  console.log("queryValues: ", queryValues);

  return {
    queryString: baseQuery.concat(" ", specifiers.join(" ")),
    queryValues,
  };
}

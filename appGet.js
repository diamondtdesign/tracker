"use strict";

const express = require('express');
const app = express();

const mongo = require("./mongoDbAtlas.js");
const connect = mongo.connect, 
      closeConn = mongo.closeConn,
      findOne = mongo.findOne,
      findAll = mongo.findAll,
      dataChecker = mongo.dataChecker,
      url = mongo.url,
      database = mongo.database
;

const generalFunctions = require("./generalFunctions.js");
const stampToDate = generalFunctions.stampToDate,
      ISOtoStamp = generalFunctions.ISOtoStamp
;

// get the index.html:
app.get("/", (request, response) => response.sendFile(`${__dirname}/views/index.html`));


// get all users: id & username:
app.get("/api/exercise/users", (request, response) => {
  connect(url, database).then(dbObj => getAllUsers(dbObj));
  
  const getAllUsers = dbObj => {
    const db = dbObj.db, dbo = dbObj.dbo;
    findAll(dbo, "users", {}, {log: 0}).then(result => {
      response.send(result);
      return closeConn(db);
    });
  };
});

let userId, from, to, limit;

const checkGetData = (request, response, next) => {
  let warning;
  userId = + request.query.userId;
  from = request.query.from;
  to = request.query.to;
  limit = request.query.limit;
  warning = dataChecker(request.query.userId, "userId");
  if (isNaN(userId)) warning = {warning: "Unknown userId"};
  if (warning) return response.send(warning);
  warning = [];
  if (from && 
      (!(isNaN(+ from + 1)) || isNaN(ISOtoStamp(from)))) warning.push({error: "from: invalid Date Format (expected: yyyy-mm-dd)"});
  if (to && 
      (!(isNaN(+ to + 1)) || isNaN(ISOtoStamp(to)))) warning.push({error: "to: invalid Date Format (expected: yyyy-mm-dd)"});
  if (limit) {
    if (isNaN(limit)) warning.push({error: "limit: invalid format (expected number)"});
    if (limit < 0) warning.push({warning: "limit: cannot to be negativ number"});
  } 
  if (warning.length) return response.send(warning);
  next();
};

// get exercise log: https://whispering-allium.glitch.me/api/exercise/log?userId=1&from=1970-01-01&to=2015-09-01&limit=2
// GET variable from user: must check all data befor use!!!
app.get("/api/exercise/log", checkGetData, (request, response) => {
  connect(url, database).then(dbObj => findUserId(dbObj));
  const findUserId = dbObj => {
    const db = dbObj.db, dbo = dbObj.dbo;
    findOne(dbo, "users", {_id: userId}).then(result => {
      if (result) {
        result.count = result.log.length;
        if (result.count) {
          let filteredLog = [];
          if (from) {
            result.from = from;
            from = ISOtoStamp(from);
          } else {
            from = - Infinity;
          }
          if (to) {
            result.to = to;
            to = ISOtoStamp(to) + 60*60*24*1000;
          } else {
            to = Infinity;
          }
          if (limit) result.limit = limit;
          for (let i = 0; i < result.count; i++) {
            const exercise = result.log[i];
            let date = exercise.date;
            if (date >= from && date <= to) {
              exercise.date = stampToDate(date)
              filteredLog.push(exercise);
              if (limit) {
                limit --;
                if (limit === 0) break;
              }
            }
          }
          result.log = filteredLog;
          result.count = result.log.length;
        }
        response.send(result);
        return 
      } else {
        return response.send({warning: "Unknown userId"});
      }
    });
  };
});

module.exports = app;

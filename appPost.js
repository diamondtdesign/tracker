"use strict";
const express = require('express');
const app = module.exports = express();

const mongo = require("./mongoDbAtlas.js");
const connect = mongo.connect, 
      closeConn = mongo.closeConn,
      findOne = mongo.findOne,
      insertOne = mongo.insertOne,
      updateOne = mongo.updateOne,
      dataChecker = mongo.dataChecker,
      url = mongo.url,
      database = mongo.database
;

const generalFunctions = require("./generalFunctions.js");
const stampToDate = generalFunctions.stampToDate;

/** this project needs to parse POST bodies **/
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({
  extended: false
}));

const checkPostData = (request, response, next) => {
  const warning = dataChecker(request.body.username, "username");
  if (warning) return response.send(warning); 
  next();
};

const addNewUser = (request, response) => {
  const userName = request.body.username;
  connect(url, database).then(dbObj => findUserName(dbObj));
  
  const findUserName = dbObj => {
    const db = dbObj.db, dbo = dbObj.dbo;
    findOne(dbo, "users", {username: userName}).then(result => {
      if (result === null) {
        findOne(dbo, "autoIncrId", {_id: 1}).then(result => {
          // create autoIncrement Id collection:
          let autoIncrId;
          if (result === null) {
            autoIncrId = 1
            insertOne(dbo, "autoIncrId", {_id: autoIncrId, counter: 1});
          } else { 
            autoIncrId = result.counter + 1;
            updateOne(dbo, "autoIncrId", {_id: 1}, {counter: autoIncrId});
          }
          // create users collection:
          insertOne(dbo, "users", {_id: autoIncrId, username: userName, log: []});
          response.send({id: autoIncrId, username: userName});
          return closeConn(db);
        });
      } else {
        response.send({warning: `username ${userName} already taken...`});
        return closeConn(db);
      }
    });
  };
};

const checkExerciseBody  = (request, response, next) => {
  
  let warning = [];
  for (let property in request.body) {
    const value = request.body[property];
    const isDefined = dataChecker(value, property);
    // required data:
    if (isDefined && property !== "date") warning.push(isDefined);
  }
  if (isNaN(request.body.userId)) warning.push({error: "given id is not a number"});
  if (isNaN(request.body.duration)) warning.push({error: "given duration is not a number"});
  if (request.body.date && isNaN(Date.parse(request.body.date))) {
    warning.push({error: "given date is not an ISO format (YYYY-MM-DD)"});
  }
  if (warning.length) return response.send(warning);
  next();
};

const logAdd = (request, response) => {
  // the given data is checked and ready to update users.log array...
  let responseToClient = {error: "unknown userId"};
  const userId = + request.body.userId;
  connect(url, database).then(dbObj => findUserId(dbObj));
  
  const findUserId = dbObj => {
    const db = dbObj.db, dbo = dbObj.dbo;
    findOne(dbo, "users", {_id: userId}).then(result => {
      if (result) {
        const description = request.body.description,
              duration = request.body.duration
        ;
        let log = result.log;
        // userId found: add new log to the user.log array
        let date = request.body.date;
        date ? date = Date.parse(date) : date = Date.now();
        const newValue = {
            description: description,
            duration: duration,
            date: date
        };
        log.push(newValue);
        
        updateOne(dbo, "users", {_id: userId}, {$set: {log: log}});
        responseToClient = {
          username: result.username,
          _id: userId,
          description: description,
          duration: duration,
          date: stampToDate(date)
        };
      }
      response.send(responseToClient);
      return closeConn(db);
    });
  };
};

// POST form new user:
app.post("/api/exercise/new-user", checkPostData, addNewUser);

// POST form new exercise:
app.post("/api/exercise/add", checkExerciseBody, logAdd);

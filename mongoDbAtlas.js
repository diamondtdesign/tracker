"use strict";

// I don't use mongoose in this projects...
// Connection to the database:
const MongoClient = require("mongodb").MongoClient;

// return db & dbo asyncronously:
const connect = (url, database) => {
  return new Promise(waitForObj => {
    MongoClient.connect(url, (error, db) => {
      
      if (error) throw error;
      waitForObj({
        db: db,
        dbo: db.db(database)
      });
      console.log(`Connected to the ${database}`)
    });
  });
};

const closeConn = (db) => {
  db.close();
  console.log("Database connection closed.");
}

const findOne = (dbo, collection, queryObj) => {
  return new Promise(waitForResult => {
    dbo.collection(collection).findOne(queryObj, (error, result) => {
      if (error) throw error;
      waitForResult(result);
    });
  });
};

const findAll = (dbo, collection, queryObj, projectionObj) => {
  return new Promise(waitForResult => {
    dbo.collection(collection).find(queryObj, projectionObj).toArray((error, result) => {
      if (error) throw error;
      waitForResult(result);
    });
  });
};

const insertOne = (dbo, collection, insertObj) => {
  dbo.collection(collection).insertOne(insertObj, (error, result) => {
    if (error) throw error;
    console.log(insertObj, `inserted to the ${collection}`);
  });
};

const updateOne = (dbo, collection, toUpdate, newValues) => {
  dbo.collection(collection).updateOne(toUpdate, newValues, (error, result) => {
    if (error) throw error;
    console.log(toUpdate, "document updated to", newValues, `in the ${collection} collection.`);
  });
};

// if the given data is empty send return a warning message:
const dataChecker = (data, name) => {
  if (!data) return {warning: `no ${name} given`};
};

const mongo = {
  connect:connect,
  closeConn:closeConn,
  findOne: findOne,
  findAll: findAll,
  insertOne: insertOne,
  updateOne: updateOne,
  dataChecker: dataChecker,
  url: process.env.MONGO_URI,
  database: "cluster0-towls"
};

module.exports = mongo;

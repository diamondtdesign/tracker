const stampToDate = (timeStamp) => new Date(timeStamp).toDateString();

const ISOtoStamp = (ISO) => {
  return Date.parse(ISO);
};

const generalFunctions = {
  stampToDate: stampToDate,
  ISOtoStamp: ISOtoStamp
};

module.exports = generalFunctions;

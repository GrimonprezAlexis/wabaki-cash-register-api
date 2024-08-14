const _ = require('lodash');

module.exports.executeAndSendResult = async function (func, res, next) {
  try {
    const result = await func(); // Execute the function
    return res.json(result); // Send the result as a JSON response
  } catch (e) {
    if (!res.headersSent) { // Check if the headers have not been sent yet
      res.status(400).json({ error: e.message }); // Send the error response with a status code and message
    } else {
      console.error("Headers already sent, cannot send error response.");
    }
  }
};

// Handle MongoDB connection errors
module.exports.handleDBError = (error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
};


module.exports.handleErrorForCB = function (error, errorCB) {
  if (!errorCB) throw error;
  errorCB(error);
};

const isEmpty = (v) => (!v && v !== false && v !== 0);
module.exports.hasProperty = (o, p) => !isEmpty(_.get(o, p));
module.exports.checkRequiredProperties = function (o, properties = Object.keys(o), errorCB) {
  const errors = properties.filter(p => !module.exports.hasProperty(o, p));
  if (errors.length > 0) module.exports.handleErrorForCB(new Error("Missing properties: " + errors), errorCB);
};

module.exports.log = function(arguments){
  console.log('>>>', arguments);
}

module.exports.handleError = function (res, error, errorMessage) {
  console.error(errorMessage, error);
  res.status(500).json({
    success: false,
    message: errorMessage,
    error
  });
};

module.exports.handleNotFoundError = function (res, errorMessage) {
  res.status(404).send(errorMessage);
};

module.exports.sendSuccessResponse = (res, data, message = 'Success') => {
  res.status(200).json({
      success: true,
      message: message,
      data: data
  });
};

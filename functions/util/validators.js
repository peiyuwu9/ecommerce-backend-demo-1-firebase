// Helper function to validate input information
const isEmail = (email) => {
  const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return email.match(regEx) ? true : false;
};

const isNan = (number) => {
  const regEx = /^[1-9][0-9]*$/;
  return !number.match(regEx) ? true : false;
};

const isEmpty = (string) => {
  return string.trim() === "" ? true : false;
};

exports.validateSignupData = (newUserData) => {
  // Save error message
  let error = {};

  // Validate input information
  isEmpty(newUserData.email)
    ? (error.email = "Must not be empty")
    : !isEmail(newUserData.email) && (error.email = "Must be a valid email");

  isEmpty(newUserData.password) && (error.password = "Must not be empty");

  newUserData.password !== newUserData.confirmPassword &&
    (error.confirmPassword = "Passwords not match");

  isEmpty(newUserData.userName) && (error.userName = "Must not be empty");

  return {
    error,
    valid: Object.keys(error).length === 0 ? true : false,
  };
};

exports.validateLoginData = (userData) => {
  let error = {};

  isEmpty(userData.email) && (error.email = "Must not be empty");
  isEmpty(userData.password) && (error.password = "Must not be empty");

  return {
    error,
    valid: Object.keys(error).length === 0 ? true : false,
  };
};

exports.validatePostData = (formData) => {
  let error = {};

  !formData.title &&
    isEmpty(formData.title) &&
    (error.title = "Must not be empty");

  !formData.price && isEmpty(formData.price)
    ? (error.price = "Must not be empty")
    : isNan(formData.price) && (error.price = "Must be a valid number");

  return {
    error,
    valid: Object.keys(error).length === 0 ? true : false,
  };
};

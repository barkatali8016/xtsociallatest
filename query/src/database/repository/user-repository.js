const { UserModel } = require("../models");
const {
  APIError,
  BadRequestError,
  STATUS_CODES,
} = require("../../utils/app-errors");

//Dealing with data base operations
class UserRepository {
  async CreateUser(userInputs) {
    try {
      const user = new UserModel(userInputs);
      const userResult = await user.save();
      return userResult;
    } catch (err) {
      throw new APIError(
        "API Error",
        STATUS_CODES.INTERNAL_ERROR,
        "Unable to Create Customer"
      );
    }
  }

  async CreateMultipleUser(userInputs) {
    try {
      const users = UserModel.insertMany(userInputs);
      return users;
    } catch (err) {
      throw new APIError(
        "API Error",
        STATUS_CODES.INTERNAL_ERROR,
        "Unable to oboard users"
      );
    }
  }

  async FindUser({ email }) {
    try {
      const user = await UserModel.findOne({ email });
      return user;
    } catch (error) {
      throw new APIError(
        "API Error",
        STATUS_CODES.INTERNAL_ERROR,
        "Unable to Create Customer"
      );
    }
  }
  async FindUserById({ _id }) {
    try {
      const user = await UserModel.findOne({ _id });
      return user;
    } catch (error) {
      throw new APIError(
        "API Error",
        STATUS_CODES.INTERNAL_ERROR,
        "Unable to Create Customer"
      );
    }
  }
}

module.exports = UserRepository;

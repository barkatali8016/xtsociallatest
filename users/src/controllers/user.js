const { UserRepository } = require("../database");

const { sendOTPMail, verifyOTPMail } = require("../utils");
const {
  FormateData,
  GeneratePassword,
  GenerateSalt,
  GenerateSignature,
  ValidatePassword,
} = require("../utils");

class UserController {
  constructor() {
    this.repository = new UserRepository();
  }
  async onboard(data) {
    try {
      for (var i = 0; i < data.length; i++) {
        let salt = await GenerateSalt();
        let pass = await GeneratePassword(`${data[i].firstname}@1234`, salt);
        data[i].password = pass;
        data[i].salt = salt;
      }
      const createdUsers = await this.repository.CreateMultiUser(data);
      if (!createdUsers) {
        return {};
      }

      return createdUsers;
    } catch (error) {
      console.error(error);
    }
  }
  async SignUp(userInputs) {
    const { password } = userInputs;

    try {
      // create salt
      let salt = await GenerateSalt();

      let userPassword = await GeneratePassword(password, salt);

      const createdUser = await this.repository.CreateUser({
        ...userInputs,
        password: userPassword,
        salt,
      });
      if (!createdUser) {
        return {};
      }

      return FormateData({ user: createdUser });
    } catch (error) {
      throw error;
    }
  }
  async SignIn({ email, password }) {
    try {
      const existingUser = await this.repository.FindUser({ email });
      if (existingUser) {
        const validPassword = await ValidatePassword(
          password,
          existingUser.password,
          existingUser.salt
        );
        if (validPassword) {
          const tempToken = await GenerateSignature(
            {
              _id: existingUser._id,
            },
            "15m"
          );
          const stateId = await sendOTPMail(existingUser.email);
          if (stateId && stateId.state_id) {
            return FormateData({
              tempToken,
              stateId: stateId.state_id,
            });
          }
        }
      }
      return {};
    } catch (error) {
      throw error;
    }
  }
  async verifyOtp({ otp, stateId, _id }) {
    try {
      const validOtp = await verifyOTPMail(otp, stateId);
      console.log(validOtp, "ABC");
      if (
        validOtp.code == 913 ||
        validOtp.code == 915 ||
        !validOtp.authenticated
      ) {
        return FormateData({ ...validOtp });
      }
      const existingUser = await this.repository.FindUserById({ _id });
      console.log(existingUser);
      if (existingUser) {
        const token = await GenerateSignature({
          _id: existingUser._id,
        });
        return FormateData({
          token,
          email: existingUser.email,
          firstname: existingUser.firstname,
          lastname: existingUser.lastname,
          _id,
        });
      }
      return {};
    } catch (error) {
      throw error;
    }
  }
  async SubscribeEvents(payload) {
    const { event, data } = JSON.parse(payload);

    switch (event) {
      case "POST_ADDED":
      case "POST_DELETED":
      case "POST_UPDATED":
        // UPDATE USER DB
        console.log(event, "EVENT in Controller");
        break;
      case "COMMENT_ADDED":
      case "COMMENT_DELETED":
      case "COMMENT_UPDATED":
        // UPDATE USER DB
        console.log(event, "EVENT in Controller");
        break;
      default:
        break;
    }
  }
}
module.exports = UserController;

const { UserController } = require("../controllers");
const {
  validateSignUpBody,
  validateSignInBody,
  validateVerifyOtpBody,
} = require("../utils/validators");
const UserAuth = require("./middlewares/auth");
const { STATUS_CODES } = require("../utils/app-errors");
const { PublishMessage } = require("../utils");
const { XTSOCIAL_BINDING_KEY } = require("../config");
const path = require("path");
const multer = require("multer");
const XLSX = require("xlsx");
module.exports = async (app, channel) => {
  const userController = new UserController();
  /*****
   * SIGN UP
   * @body
   */
  app.post("/signup", async (req, res, next) => {
    try {
      const validate = validateSignUpBody(req.body);
      if (validate.error) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
          error: validate.error.details[0].message,
        });
      }
      // const { firstname, lastname, email, password, phone,careerState,address } = req.body;

      const { data } = await userController.SignUp(req.body);
      if (data) {
        PublishMessage(
          channel,
          XTSOCIAL_BINDING_KEY,
          JSON.stringify({ event: "USER_CREATED", data: { ...data } })
        );
        return res.status(STATUS_CODES.USER_CREATED).json(data);
      } else {
        return res
          .status(STATUS_CODES.BAD_REQUEST)
          .json({ error: "Email already exist." });
      }
    } catch (error) {
      // next(error);
      throw error;
    }
  });

  /*****
   * SIGN IN
   * @body
   */
  app.post("/signin", async (req, res, next) => {
    try {
      const validate = validateSignInBody(req.body);
      if (validate.error) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
          error: validate.error.details[0].message,
        });
      }
      const { email, password } = req.body;
      const { data } = await userController.SignIn({
        email,
        password,
      });
      if (data) {
        return res.status(STATUS_CODES.OK).json(data);
      } else {
        return res
          .status(STATUS_CODES.INTERNAL_ERROR)
          .json({ error: "Something went wrong." });
      }
    } catch (error) {
      next(error);
    }
  });

  /*****
   * verifyOtp
   * @body
   */
  app.post("/verifyOtp", UserAuth, async (req, res, next) => {
    try {
      const validate = validateVerifyOtpBody(req.body);
      if (validate.error) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
          error: validate.error.details[0].message,
        });
      }
      const { _id } = req.user;

      const { otp, stateId } = req.body;
      const { data } = await userController.verifyOtp({
        otp,
        stateId,
        _id,
      });
      if (data) {
        return res.status(STATUS_CODES.OK).json(data);
      } else {
        return res
          .status(STATUS_CODES.INTERNAL_ERROR)
          .json({ error: "Something went wrong." });
      }
    } catch (error) {
      next(error);
    }
  });

  const uploadXLSX = async (req, res, next) => {
    try {
      let path = req.file.path;
      var workbook = XLSX.readFile(path);
      var sheet_name_list = workbook.SheetNames;
      let jsonData = XLSX.utils.sheet_to_json(
        workbook.Sheets[sheet_name_list[0]]
      );
      if (jsonData.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Xls sheet has no data",
        });
      }
      const createdUsers = await userController.onboard(jsonData);
      if (createdUsers) {
        PublishMessage(
          channel,
          XTSOCIAL_BINDING_KEY,
          JSON.stringify({ event: "USERS_ONBOARDED", data: createdUsers })
        );
      }
      return res.status(201).json({
        success: true,
        message: jsonData.length + " users added to the database",
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  };

  var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.resolve(__dirname, "../../assets/xls"));
    },
    filename: function (req, file, cb) {
      cb(null, "users.xlsx");
    },
  });

  const upload = multer({ storage: storage });

  app.post("/onboard", upload.single("xlsx"), uploadXLSX);
};

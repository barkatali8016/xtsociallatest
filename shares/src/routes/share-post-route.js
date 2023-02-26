var express = require("express");
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();
var router = express.Router();
const { STATUS_CODES } = require("../utils/app-errors");
const { SharePostController } = require("../controllers");
const sharePostController = new SharePostController();
const { PublishMessage } = require("../utils");
const { XTSOCIAL_BINDING_KEY, INTERACTION_QUEUE } = require("../config");
const { RPCRequest } = require('../utils/rpc');

/*****
 * Share a post.
 * @params postId
 * @URL localhost:80/shares/123/share
 */
router.put("/:postId/share", jsonParser, async (req, res, next) => {
  try {
    const postId = req.params.postId;
    const userId = req.user._id;
    const response = await RPCRequest(INTERACTION_QUEUE, postId, req.channel);
    if (response.event === "POST_FOUND") {
      if (!response.isDisabledInteractions) {
        const { data } = await sharePostController.share({
          postId,
          userId,
        });
        if (data) {
          PublishMessage(
            req.channel,
            XTSOCIAL_BINDING_KEY,
            JSON.stringify({ event: "POST_SHARED", data })
          );
          return res
            .status(STATUS_CODES.OK)
            .json({ SUCCESS: "Post shared successfully." });
        }
        return returnError(res);
      }
      return returnError(res, "Interactions are disabled.")
    }
    return returnError(res, "Post not found.",STATUS_CODES.NOT_FOUND);
  } catch (error) {
    console.error(error);
    return returnError(res);
  }
});

returnError = (res, msg = "Something went wrong.", code = STATUS_CODES.INTERNAL_ERROR) => {
  return res
    .status(code)
    .json({ ERROR: msg });
}
module.exports = router;

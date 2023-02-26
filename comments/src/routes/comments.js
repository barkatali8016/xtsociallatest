const { CommentsController } = require("../controllers");
const CommentsAuth = require("./middlewares/auth");
const { STATUS_CODES } = require("../utils/app-errors");
const { randomBytes } = require("crypto");
const { PublishMessage } = require("../utils");
const { RPCRequest } = require("../utils/rpc");
const { XTSOCIAL_BINDING_KEY, INTERACTION_QUEUE } = require("../config");
const Filter = require("bad-words");

module.exports = async (app, channel) => {
  const commentsController = new CommentsController();

  let filter = new Filter({ placeHolder: "x" });

  /*****
   * ADD COMMENTS
   * @params postId
   * @URL localhost:80/comments/1234/addComment
   */
  app.post("/:postId/addComment", CommentsAuth, async (req, res, next) => {
    try {
      const postId = req.params.postId;
      let { commentText } = req.body;
      const userId = req.user._id;

      const response = await RPCRequest(INTERACTION_QUEUE, postId, channel);
      if (response.event === "POST_FOUND") {
        if (!response.isDisabledInteractions) {
          //Filtering Bad Words
          commentText = filter.clean(commentText);
          const { data } = await commentsController.comment(
            postId,
            commentText,
            userId
          );
          if (data) {
            PublishMessage(
              channel,
              XTSOCIAL_BINDING_KEY,
              JSON.stringify({ event: "COMMENT_CREATED", data })
            );
            return res.status(STATUS_CODES.COMMENT_CREATED).json(data);
          }
          return res
            .status(STATUS_CODES.BAD_REQUEST)
            .json({ error: "Something went wrong" });
        }
        return returnError(res, "Interactions are disabled.")
      }
      return returnError(res, "Post not found.");
    } catch (error) {
      console.error(error);
      return returnError(res);
    }
  });

  returnError = (res, msg = "Something went wrong.") => {
    return res
      .status(STATUS_CODES.INTERNAL_ERROR)
      .json({ ERROR: msg });
  }
  /*****
   * GET COMMENTS BY POST ID
   * @params postId
   * @URL localhost:80/comments/1234/getComments
   */
  app.get("/:postId/getComments", CommentsAuth, async (req, res, next) => {
    try {
      const postId = req.params.postId;

      const { data } = await commentsController.getComments({
        postId,
      });
      if (data) {
        return res.status(STATUS_CODES.OK).json(data);
      } else {
        return res
          .status(STATUS_CODES.BAD_REQUEST)
          .json({ error: "Something went wrong" });
      }
    } catch (error) {
      throw error;
    }
  });

  /*****
   * EDIT COMMENTS BY ID
   * @params commentId
   * @URL localhost:80/comments/1234/editComment
   */
  app.put("/:commentId/editComment", CommentsAuth, async (req, res, next) => {
    try {
      const commentId = req.params.commentId;
      let { commentText } = req.body;
      commentText = filter.clean(commentText);

      const { data } = await commentsController.editComment(
        commentId,
        commentText
      );
      if (data) {
        PublishMessage(
          channel,
          XTSOCIAL_BINDING_KEY,
          JSON.stringify({ event: "COMMENT_UPDATED", data })
        );
        return res.status(STATUS_CODES.OK).json(data);
      } else {
        return res
          .status(STATUS_CODES.BAD_REQUEST)
          .json({ error: "Something went wrong" });
      }
    } catch (error) {
      throw error;
    }
  });

  /*****
   * DELETE COMMENTS BY ID
   * @params commentId
   * @URL localhost:80/comments/1234/deleteComment
   */
  app.delete("/:commentId/deleteComment", CommentsAuth, async (req, res) => {
    try {
      const commentId = req.params.commentId;
      const { data } = await commentsController.deletedComment({
        commentId,
      });
      if (data) {
        PublishMessage(
          channel,
          XTSOCIAL_BINDING_KEY,
          JSON.stringify({ event: "COMMENT_DELETED", data })
        );
        return res.status(STATUS_CODES.OK).json(data);
      } else {
        return res
          .status(STATUS_CODES.BAD_REQUEST)
          .json({ error: "Something went wrong" });
      }
    } catch (error) {
      return error.message;
    }
  });
};

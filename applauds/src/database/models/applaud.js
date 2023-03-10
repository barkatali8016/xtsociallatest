const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ApplaudSchema = new Schema(
  {
    postId: { type: Schema.Types.ObjectId, require: true },
    userId: { type: Schema.Types.ObjectId, require: true },
    applaudKey: { type: Number, require: true },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('applauds', ApplaudSchema);

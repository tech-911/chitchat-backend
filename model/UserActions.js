const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const userActionSchema = new Schema({
  email: {
    type: String,
    required: true,
    max: 255,
    min: 5,
  },
  liked: {
    type: Array,
    required: false,
  },
  unlike: {
    type: Array,
    required: false,
  },
});

const UserAction = mongoose.model("UserAction", userActionSchema);
module.exports = { UserAction };

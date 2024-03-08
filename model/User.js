const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: String,
    required: false,
    min: 4,
    max: 255,
  },
  conversations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' }],
  dob: {
    type: Date,
    required: false,
  },
  gender: {
    type: String,
    required: false,
  },
  height: {
    type: String,
    required: false,
  },
  marital_status: {
    type: String,
    required: false,
  },
  location: {
    type: String,
    required: false,
  },
   current_location: {
    type: String,
    required: false,
  },
  profession: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: false,
    max: 255,
    min: 5,
  },
  phone_no: {
    type: String,
    required: false,
  },
  phone_key: {
    type: Object,
    required: false,
  },
  photo: {
    type: Array,
    min: 2,
    required: false,
  },
  provider: {
    type: String,
    required: false,
  },
  related: {
    type: Object,
    required: false,
    default: {},
  },
  status: {
    type: String,
    required: false,
    default: "ongoing",
  },
  date: {
    type: Date,
    default: Date.now,
  },
  token: {
    type: String,
    required: false,
  },
});

const User = mongoose.model("User", userSchema);
module.exports = { User };

const { User } = require("../model/User");
const { UserAction } = require("../model/UserActions");

const GetAllUsersByGender = async (req, res) => {
  const { gender } = req.body;
  User.find({ gender: gender }, (err, docs) => {
    if (err) {
      res.status(400).send(err);
    } else {
      res.status(201).send(docs);
    }
  });
};
const Reacted = async (req, res) => {
  const { email, reactEmail, action } = req.body;

  const actionResponse = await UserAction.findOne({ email: email });
  console.log(actionResponse);
  if (actionResponse) {
    if (action === "like") {
      if (actionResponse.liked.includes(reactEmail)) {
        // console.log("haha")
        return res.status(201).send({ message: "user already liked" });
      } else {
        if (actionResponse.unlike.includes(reactEmail)) {
          const index = actionResponse.unlike.indexOf(reactEmail);
          if (index > -1) {
            actionResponse.unlike.splice(index, 1);
          }
          actionResponse.liked.push(reactEmail);
          actionResponse.save();
          console.log(actionResponse);
          res.status(201).send({ message: "reacted sucessfully" });
        } else {
          actionResponse.liked.push(reactEmail);
          actionResponse.save();
          console.log(actionResponse);
          res.status(201).send({ message: "reacted sucessfully" });
        }
      }
    } else if (action === "unlike") {
      if (actionResponse.unlike.includes(reactEmail)) {
        return res.status(400).send({ message: "user already unliked" });
      } else {
        if (actionResponse.liked.includes(reactEmail)) {
          const index = actionResponse.liked.indexOf(reactEmail);
          if (index > -1) {
            actionResponse.liked.splice(index, 1);
          }
          actionResponse.unlike.push(reactEmail);
          actionResponse.save();
          console.log(actionResponse);
          res.status(201).send({ message: "reacted sucessfully" });
        } else {
          actionResponse.unlike.push(reactEmail);
          actionResponse.save();
          console.log(actionResponse);
          res.status(201).send({ message: "reacted sucessfully" });
        }
      }
    } else {
      return res.status(400).send({ message: "incorrect react action" });
    }
  } else {
    if (action === "like") {
      try {
        const userActionRes = await new UserAction({
          email: email,
          liked: [reactEmail],
          unlike: [],
        });
        const saveValue = await userActionRes.save();
        console.log(saveValue);
        res.status(201).send(saveValue);
      } catch (err) {
        console.log(err);
        res.status(400).send(err);
      }
    } else if (action === "unlike") {
      try {
        const userActionRes = await new UserAction({
          email: email,
          liked: [],
          unlike: [reactEmail],
        });
        const saveValue = await userActionRes.save();
        console.log(saveValue);
        res.status(201).send(saveValue);
      } catch (err) {
        console.log(err);
        res.status(400).send(err);
      }
    }
  }
};

const getLikedMeData = async (req, res) => {
  const { email } = req.body;
  let followers = [];
  let users = [];

  try {
    const result = await UserAction.find({ liked: email });
    followers = result.map((value) => {
      return value.email;
    });
    try {
      users = await User.find();
      const userThatLikedMe = users.filter((value) => {
        return followers.includes(value.email);
      });
      res.status(201).send(userThatLikedMe);
    } catch (err) {
      res.status(400).send(err);
    }
  } catch (error) {
    res.status(500).json({ error: "An error occurred" });
  }
};

const getLikedData = async (req, res) => {
  const { email } = req.body;

  try {
    const iliked = await UserAction.findOne({ email: email });
    const users = await User.find();
    const userThatILiked = users.filter((value) => {
      return iliked.liked.includes(value.email);
    });
    res.status(201).send(userThatILiked);
  } catch (err) {
    res.status(400).send(err);
  }
};

module.exports = {
  GetAllUsersByGender,
  Reacted,
  getLikedMeData,
  getLikedData,
};

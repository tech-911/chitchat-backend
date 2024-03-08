const express = require("express");
const router = express.Router();
const verify = require("../verification/verifyToken");
const {
  GetAllUsersByGender,
  Reacted,
  getLikedMeData,
  getLikedData,
} = require("../controllers/userActionsController");

router.post("/getallusersbygender", verify, GetAllUsersByGender); //get users by gender
router.post("/reacted", verify, Reacted); //get users by gender
router.post("/likedme", verify, getLikedMeData); //get users by gender
router.post("/iliked", verify, getLikedData); //get users by gender

module.exports = router;

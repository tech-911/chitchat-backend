const express = require("express");
const router = express.Router();
const verify = require("../verification/verifyToken");
const passport = require("passport");
const multer = require("multer");
const {
  index,
  login,
  facebooksignup,
  googlesignup,
  logout,
  phonesignup,
  otp,
  register,
  editProfile
} = require("../controllers/authController");

const upload = multer({ dest: "uploads/" });
const upload1 = multer({ dest: "uploads1/" });

router.get("/", index); //index

//---------------Social Authentication---------------------
router.post(
  "/facebooksignup",
  passport.authenticate("facebook-token", { scope: "email", session: false }),
  facebooksignup
);
router.post("/googlesignup", googlesignup); //google authentication

//---------------Social Authentication End-----------------
router.post("/login", login);
router.post("/logout", logout);
router.post("/phone", phonesignup);
router.post("/otp", otp);
router.post("/register", upload.array("image"), register);
router.post("/editprofile", upload1.array("image"), editProfile);

module.exports = router;

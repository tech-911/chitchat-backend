require("dotenv").config(); //dotenv import
const { User } = require("../model/User"); //users model import
const { Booking } = require("../model/Booking"); //booking model import
const bcrypt = require("bcryptjs"); //bcrypt import
const jwt = require("jsonwebtoken"); //jwt import
const {
  registerValidationMethod,
  loginValidationMethod,
} = require("../validations/validation"); //joi validation import
const { OAuth2Client } = require("google-auth-library"); //oauth for google import
var twilio = require("twilio")(
  process.env.TWILIO_SID,
  process.env.TWILIO_TOKEN
); //twilio import
const cloudinary = require("cloudinary").v2; //cloudinary import
const fs = require("fs");
const path = require("path");

// auxilliary code for hashing password
//  const salt = await bcrypt.genSalt(10);
//  const hashedPassword = await bcrypt.hash(password, salt);

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const index = (req, res) => {
  console.log("a get request was made to /");
  res.status(201).send("Welcome to halal match making 💗");
};

const login = async (req, res) => {
  //===============validation===============

  const { error } = loginValidationMethod(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  const { email } = req.body;

  //===============Checking existence of user by email===============

  let user = await User.findOne({ email: email });

  if (!user) return res.status(400).send("Email doesnt exists");

  // Creating jwt token
  const jwtSecretKey = process.env.TOKEN_SECRET;
  const token = jwt.sign({ _id: user._id }, jwtSecretKey);
  user.token = token;
  await user.save();
  res.status(201).send(user);
};
const logout = async (req, res) => {
  //===============validation===============

  const { error } = loginValidationMethod(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  const { email } = req.body;

  //===============Checking existence of user by email===============

  let user = await User.findOne({ email: email });

  if (!user) return res.status(400).send("Email doesnt exists");

  user.token = null;
  await user.save();
  res.status(201).send(user);
};
const googlesignup = async (req, res) => {
  const { token } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const userid = payload["sub"];
    // If request specified a G Suite domain:
    // const domain = payload['hd'];

    const user = await User.findOne({ email: payload.email });
    if (user) {
      console.log(user);
      res.status(201).send(user);
    } else {
      try {
        const user = await new User({
          name: payload.name,
          email: payload.email,
          provider: "google",
        });
        const saveValue = await user.save();
        console.log(saveValue);
        res.status(201).send(saveValue);
      } catch (err) {
        console.log(err);
        res.status(400).send(err);
      }
    }
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
};
const facebooksignup = async (req, res) => {
  res.status(201).send(req.user || req.saveValue);
};

const phonesignup = async (req, res) => {
  const { otp, phone_no } = req.body;
  const check = await User.findOne({ phone_no: phone_no });
  if (check) {
    console.log(check);
    return res.status(201).send({ message: "user exist", check });
  }
  const user = await User.findOne({ "phone_key.otp": otp });
  if (!user) return res.status(400).send("Wrong OTP");
  if (new Date().getTime() - user.phone_key.timestamp > 390000) {
    return res.status(400).send("OTP expired");
  }
  user.phone_no = phone_no;
  user.phone_key = {};
  const saveValue = await user.save();
  res.status(201).send("success...");
};

const otp = async (req, res) => {
  const { phone_no } = req.body;
  const user = await User.findOne({ phone_no: phone_no });
  if (user) {
    console.log(user);
    res.status(201).send({ message: "user exist", user });
  } else {
    let otp = "";
    for (let i = 0; i < 6; i++) {
      const digit = Math.floor(Math.random() * 10);
      otp += digit.toString();
    }
    const timestamp = new Date().getTime();
    try {
      const user = await new User({
        phone_key: { timestamp, otp },
      });
      const saveValue = await user.save();
      console.log(saveValue);
    } catch (err) {
      console.log(err);
      res.status(400).send(err);
    }

    twilio.messages
      .create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone_no,
        body: `Hala match maker OTP: ${otp}`,
      })
      .then((response) => {
        console.log(response);
        res.status(201).send(`OTP sent to ${phone_no}. OTP expires in 6 minuites`);
      })
      .catch((err) => {
        console.log(err);
        res.status(400).send(err);
      });
  }
};

const register = async (req, res) => {
  const {
    name,
    dob,
    gender,
    height,
    marital_status,
    location,
    current_location,
    profession,
    email,
    phone_no,
  } = req.body;
  cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
  });

  if (!req.files || req.files.length === 0) {
    return res
      .status(400)
      .send({ error: "No image files provided. Needs at least 2 images" });
  }

  const promises = req.files.map((file) => {
    // Upload each file to Cloudinary
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(file.path, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  });

  // Wait for all upload promises to resolve
  Promise.all(promises)
    .then(async (results) => {
      const pictures = results.map((value) => {
        return value?.secure_url;
      });
      console.log("pictures: ", pictures);
      const user = await User.findOne({ email: email });

      if (user) {
        user.name = name;
        user.dob = dob;
        user.gender = gender;
        user.height = height;
        user.marital_status = marital_status;
        user.location = location;
        user.current_location = current_location;
        user.profession = profession;
        user.phone_no = phone_no;
        user.photo = pictures;
        user.email = email;
        user.status = "done";
      } else {
        res.status(400).send("No User specified. Try re-signup");
      }
      const savedinfo = await user.save();
      console.log(savedinfo);

      //----------Clear files in upload folder to prevent memory overload

      const folderPath = "uploads";
      fs.readdir(folderPath, (err, files) => {
        if (err) {
          console.error("Error reading upload folder:", err);
          return res.status(400).send(err);
        }
        console.log("files: ", files);
        // Delete each file in the upload folder
        files.forEach((file) => {
          fs.unlink(path.join(folderPath, file), (err) => {
            if (err) {
              console.error(`Error deleting file ${file}:`, err);
            } else {
              console.log(`Deleted file: ${file}`);
            }
          });
        });
      });
      //-----------------End of cleanup

      //------------Send back completely registered user data to user
      res.status(201).send(savedinfo);
    })
    .catch((error) => {
      console.log(error);
      res.status(400).send(error);
    });
};

const editProfile = async (req, res) => {
  const {
    name,
    email,
    date,
    gender,
    height,
    relationship,
    children,
    plan,
    biography,
    description,
    blood,
    genotype,
    skin,
    practice,
    pray,
    alcohol,
    smoke,
    interest,
    personality,
    education,
    profession,
    ethnicity,
    language,
  } = req.body;


  const dataSaveMethod = async (pictures) => {
    try {
      const user = await User.findOneAndUpdate({ email: email }, {
        name: name,
        photo: pictures,
        dob: date,
        related: {
          relationship: relationship,
          children: children,
          marragePlans: plan,
          biography: biography,
          description: description,
          blood: blood,
          genotype: genotype,
          skin: skin,
          religion: practice,
          pray: pray,
          alcohol: alcohol,
          smoke: smoke,
          interest: interest,
          personality: personality,
          education: education,
          ethnicity: ethnicity,
          language: language,
        },
        gender: gender,
        height: height,
        profession: profession,
        email: email,
      });
      if (user) {
        // const savedinfo = await user.save();
        // console.log(savedinfo);
        res.status(200).send(user);

        return savedinfo;
      } else {
        res.status(400).send("No User specified.");
      }
    } catch (err) {
      console.log(err);
      res.status(400).send(err);
    }
  };

  cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
  });

  if (!req.files || req.files.length === 0) {
    dataSaveMethod()
      .then((value) => console.log("saved edit without pic: ", value))
      .then((value2) => res.status(201).send(value2))
      .catch((err) => res.status(400).send(err));
  } else {
    const promises = req.files.map((file) => {
      // Upload each file to Cloudinary
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload(file.path, (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        });
      });
    });

    Promise.all(promises)
      .then(async (results) => {
        const pictures = results.map((value) => {
          return value?.secure_url;
        });
        console.log("pictures: ", pictures);
        let resultValue = "";
        dataSaveMethod(pictures)
          .then((response0) => {
            console.log("saved values with images: ", response0);
          })
          .then((response1) => {
            resultValue = response1;
          })
          .catch((err) => res.status(400).send(err));

        //----------Clear files in upload folder to prevent memory overload

        const folderPath = "uploads1";
        fs.readdir(folderPath, (err, files) => {
          if (err) {
            console.error("Error reading upload folder:", err);
            return res.status(400).send(err);
          }
          console.log("files: ", files);
          // Delete each file in the upload folder
          files.forEach((file) => {
            fs.unlink(path.join(folderPath, file), (err) => {
              if (err) {
                console.error(`Error deleting file ${file}:`, err);
              } else {
                console.log(`Deleted file: ${file}`);
              }
            });
          });
        });
        //-----------------End of cleanup

        //------------Send back completely registered user data to user
        res.status(201).send(resultValue);
      })
      .catch((error) => {
        console.log(error);
        res.status(400).send(error);
      });
  }
};

const getProfile = async (req, res) => {

  const dataSaveMethod = async (pictures) => {
    try {
      const user = await User.findOne({ email: req.query.email });
      if (user) {
        // const savedinfo = await user.save();
        // console.log(savedinfo);
        res.status(200).send(user);

      } else {
        res.status(400).send("No User specified.");
      }
    } catch (err) {
      console.log(err);
      res.status(400).send(err);
    }
  };

  dataSaveMethod()

};

module.exports = {
  index,
  login,
  facebooksignup,
  googlesignup,
  logout,
  phonesignup,
  otp,
  register,
  editProfile,
  getProfile
};

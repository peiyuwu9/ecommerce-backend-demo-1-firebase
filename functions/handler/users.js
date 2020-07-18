const { db } = require("../util/admin");
const config = require("../util/config");
const { validateSignupData, validateLoginData } = require("../util/validators");

// Initiate firebase
const firebase = require("firebase");
firebase.initializeApp(config);

exports.signup = (req, res) => {
  // Save user information
  let token, userId;

  const newUser = {
    userName: req.body.userName.trim(),
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    isAdmin: false,
  };

  const { valid, error } = validateSignupData(newUser);

  if (!valid) return res.status(400).json(error);

  firebase
    .auth()
    .createUserWithEmailAndPassword(newUser.email, newUser.password)
    .then((user) => {
      userId = user.user.uid;
      return user.user.getIdToken();
    })
    .then((idToken) => {
      token = idToken;
      const userCredentials = {
        userName: newUser.userName,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        isAdmin: newUser.isAdmin,
        userId,
      };

      return db.doc(`/users/${userId}`).set(userCredentials);
    })
    .then(() => {
      return res.status(201).json({ idToken: token });
    })
    .catch((err) => {
      console.log(err);
      return err.code === "auth/email-already-in-use"
        ? res.status(403).json({
            email: "Email is already in use",
          })
        : res
            .status(500)
            .json({ error: "Something went wrong, please try again" });
    });
};

exports.login = (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password,
  };

  const { valid, error } = validateLoginData(user);

  if (!valid) return res.status(400).json(error);

  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then((user) => {
      return user.user.getIdToken();
    })
    .then((idToken) => {
      return res.status(201).json({ idToken });
    })
    .catch((err) => {
      console.log(err);
      return res.status(403).json({
        error: "Wrong email/password, please try again",
      });
    });
};

exports.getUserDetail = (req, res) => {
  let userFullData = {};
  db.doc(`/users/${req.user.userId}`)
    .get()
    .then((user) => {
      if (!user.exists) {
        return res.status(403).json({ error: "No user data" });
      } else {
        userFullData.userDetails = user.data();
        if (req.user.isAdmin) {
          // Query for admin user detail
          return db
            .collection("notifications")
            .orderBy("createdAt", "desc")
            .limit(20)
            .get();
        } else {
          // Query for general user detail
          return db
            .collection("likes")
            .where("userId", "==", req.user.userId)
            .get();
        }
      }
    })
    .then((data) => {
      if (req.user.isAdmin) {
        userFullData.notifications = [];
        data.forEach((notification) => {
          // Only show those notifications not from Admin
          notification.data().sender !== req.user.userName &&
            userFullData.notifications.push({
              ...notification.data(),
              notificationId: notification.id,
            });
        });
      } else {
        userFullData.likes = [];
        data.forEach((like) => {
          userFullData.likes.push(like.data());
        });
      }
      return res.status(201).json(userFullData);
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({
        error: err.code,
      });
    });
};

exports.markNotificationsRead = (req, res) => {
  db.doc(`/notifications/${req.body.notificationId}`)
    .update({ read: true })
    .then(() => {
      return res.status(201).json({ success: "Notifications marked read" });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

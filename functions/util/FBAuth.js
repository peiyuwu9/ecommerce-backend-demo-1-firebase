const { admin, db } = require("./admin");

module.exports = (req, res, next) => {
  let idToken;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    idToken = req.headers.authorization.split("Bearer ")[1];
  } else {
    console.log("No token found");
    return res.status(403).json({ error: "Unauthorized" });
  }

  admin
    .auth()
    .verifyIdToken(idToken)
    .then((decodedToken) => {
      req.user = decodedToken;
      return db
        .collection("users")
        .where("userId", "==", req.user.uid)
        .limit(1)
        .get();
    })
    .then((data) => {
      console.log(data.docs[0]);
      req.user.userName = data.docs[0].data().userName;
      req.user.userId = data.docs[0].data().userId;
      req.user.isAdmin = data.docs[0].data().isAdmin;
      return next();
    })
    .catch((err) => {
      console.log("Error while verifying token: ", err);
      return res.status(403).json({ error: err.code });
    });
};

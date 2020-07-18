// Initiate firebase function
const functions = require("firebase-functions");

// Initiate express to handle api routes
const express = require("express");
const app = express();

// Allow CORS
const cors = require("cors");
app.use(cors());

const { db } = require("./util/admin");

const {
  getAllPosts,
  uploadSinglePost,
  getSinglePost,
  commentOnPost,
  likePost,
  unlikePost,
  deletePost,
} = require("./handler/posts");
const {
  signup,
  login,
  getUserDetail,
  markNotificationsRead,
} = require("./handler/users");

const FBAuth = require("./util/FBAuth");

// Post routes
app.get("/posts", getAllPosts);
app.post("/post", FBAuth, uploadSinglePost);
app.get("/post/:postId", getSinglePost);
app.post("/post/:postId/comment", FBAuth, commentOnPost);
app.get("/post/:postId/like", FBAuth, likePost);
app.get("/post/:postId/unlike", FBAuth, unlikePost);
app.delete("/post/:postId", FBAuth, deletePost);

// User routes
app.post("/signup", signup);
app.post("/login", login);
// There are different details for general users and admins
app.get("/user", FBAuth, getUserDetail);
app.post("/user/notification", FBAuth, markNotificationsRead);

exports.api = functions.https.onRequest(app);

exports.createNotificationOnLike = functions.firestore
  .document(`/likes/{id}`)
  .onCreate((snapshot) => {
    return db
      .doc(`/posts/${snapshot.data().postId}`)
      .get()
      .then((post) => {
        const notification = {
          sender: snapshot.data().userName,
          read: false,
          postId: post.id,
          title: snapshot.data().title,
          type: "like",
          createdAt: new Date().toISOString(),
        };

        if (post.exists && post.data().adminName !== snapshot.data().userName) {
          // Give notification same id as like or comment
          return db.doc(`/notifications/${snapshot.id}`).set(notification);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  });

exports.deleteNotificationOnUnlike = functions.firestore
  .document(`/likes/{id}`)
  .onDelete((snapshot) => {
    return db
      .doc(`/notifications/${snapshot.id}`)
      .delete()
      .catch((err) => {
        console.log(err);
        return;
      });
  });

exports.createNotificationOnComment = functions.firestore
  .document(`/comments/{id}`)
  .onCreate((snapshot) => {
    return db
      .doc(`/posts/${snapshot.data().postId}`)
      .get()
      .then((post) => {
        const notification = {
          sender: snapshot.data().userName,
          read: false,
          postId: post.id,
          title: snapshot.data().title,
          type: "comment",
          createdAt: new Date().toISOString(),
        };

        if (post.exists && post.data().adminName !== snapshot.data().userName) {
          // Give notification same id as like or comment
          return db.doc(`/notifications/${snapshot.id}`).set(notification);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  });

exports.onPostDelete = functions.firestore
  .document("/posts/{id}")
  .onDelete((snapshot, context) => {
    const postId = context.params.id;
    const batch = db.batch();
    return db
      .collection("comments")
      .where("postId", "==", postId)
      .get()
      .then((comments) => {
        comments.forEach((comment) => {
          batch.delete(db.doc(`/comments/${comment.id}`));
        });
        return db.collection("likes").where("postId", "==", postId).get();
      })
      .then((likes) => {
        likes.forEach((like) => {
          batch.delete(db.doc(`/likes/${like.id}`));
        });
        return db
          .collection("notifications")
          .where("postId", "==", postId)
          .get();
      })
      .then((notifications) => {
        notifications.forEach((notification) => {
          batch.delete(db.doc(`/notifications/${notification.id}`));
        });
        return batch.commit();
      })
      .catch((err) => console.error(err));
  });

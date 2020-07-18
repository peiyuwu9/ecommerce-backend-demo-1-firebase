const { admin, db } = require("../util/admin");
const config = require("../util/config");
const { validatePostData } = require("../util/validators");

exports.getAllPosts = (req, res) => {
  db.collection("posts")
    .orderBy("createdAt", "desc")
    .get()
    .then((posts) => {
      let postsData = [];
      posts.forEach((post) => {
        postsData.push({
          postId: post.id,
          ...post.data(),
        });
      });
      return res.status(201).json(postsData);
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({
        error: err.code,
      });
    });
};

exports.uploadSinglePost = (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: "Unauthorized" });

  const BusBoy = require("busboy");
  const path = require("path");
  const os = require("os");
  const fs = require("fs");

  const busboy = new BusBoy({ headers: req.headers });

  let imageToBeUploaded = {};
  let imageFileName;
  // String for image token
  // let generatedToken = uuid();

  const newPost = {
    title: "",
    price: "",
    adminId: req.user.userId,
    adminName: req.user.userName,
    imageUrl: "",
    createdAt: new Date().toISOString(),
    likeCount: 0,
    commentCount: 0,
  };

  let formData = {};

  busboy.on("field", (fieldname, val) => {
    formData[fieldname] = val;
  });

  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    if (!filename) return res.status(400).json({ error: "No image uploaded" });

    if (mimetype !== "image/jpeg" && mimetype !== "image/png") {
      return res.status(400).json({ error: "Wrong file type submitted" });
    }

    // my.image.png => ['my', 'image', 'png']
    const imageExtension = filename.split(".")[filename.split(".").length - 1];
    // 32756238461724837.png
    imageFileName = `${Math.round(
      Math.random() * 1000000000000
    ).toString()}.${imageExtension}`;
    const filepath = path.join(os.tmpdir(), imageFileName);
    imageToBeUploaded = { filepath, mimetype };
    file.pipe(fs.createWriteStream(filepath));
  });

  busboy.on("finish", () => {
    const { valid, error } = validatePostData(formData);
    if (!valid) return res.status(400).json(error);
    admin
      .storage()
      .bucket()
      .upload(imageToBeUploaded.filepath, {
        resumable: false,
        metadata: {
          metadata: {
            contentType: imageToBeUploaded.mimetype,
            //Generate token to be appended to imageUrl
            // firebaseStorageDownloadTokens: generatedToken,
          },
        },
      })
      .then(() => {
        newPost.title = formData.title.trim();
        newPost.price = formData.price.trim();
        newPost.imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
        return db.collection("posts").add(newPost);
      })
      .then((post) => {
        const resPost = newPost;
        resPost.postId = post.id;
        return res.status(201).json(resPost);
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({ error: "Something went wrong" });
      });
  });
  busboy.end(req.rawBody);
};

exports.getSinglePost = (req, res) => {
  let postFullData = {};
  db.doc(`/posts/${req.params.postId}`)
    .get()
    .then((post) => {
      if (!post.exists)
        return res.status(404).json({ error: "Post not found" });
      postFullData = post.data();
      postFullData.postId = post.id;
      return db
        .collection("comments")
        .orderBy("createdAt", "desc")
        .where("postId", "==", req.params.postId)
        .get();
    })
    .then((comments) => {
      postFullData.comments = [];
      comments.forEach((comment) => {
        postFullData.comments.push(comment.data());
      });
      return res.status(201).json(postFullData);
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({
        error: err.code,
      });
    });
};

exports.commentOnPost = (req, res) => {
  if (req.body.body.trim() === "")
    return res.status(400).json({ error: "Must not be empty" });

  const newComment = {
    postId: req.params.postId,
    userName: req.user.userName,
    body: req.body.body,
    createdAt: new Date().toISOString(),
  };

  const postDocument = db.doc(`/posts/${req.params.postId}`);

  postDocument
    .get()
    .then((post) => {
      if (!post.exists) {
        return res.status(404).json({ error: "Scream not found" });
      }
      newComment.title = post.data().title;
      return post.ref.update({ commentCount: post.data().commentCount + 1 });
    })
    .then(() => {
      return db.collection("comments").add(newComment);
    })
    .then(() => {
      return res.status(201).json(newComment);
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({
        error: err.code,
      });
    });
};

exports.likePost = (req, res) => {
  const likeDocument = db
    .collection("likes")
    .where("userId", "==", req.user.userId)
    .where("postId", "==", req.params.postId)
    .limit(1);

  const postDocument = db.doc(`/posts/${req.params.postId}`);

  let postData;

  postDocument
    .get()
    .then((post) => {
      if (post.exists) {
        postData = post.data();
        return likeDocument.get();
      } else {
        return res.status(404).json({ error: "Post not found" });
      }
    })
    .then((likes) => {
      if (likes.empty) {
        return db
          .collection("likes")
          .add({
            postId: req.params.postId,
            userName: req.user.userName,
            userId: req.user.userId,
            title: postData.title,
            price: postData.price,
            imageUrl: postData.imageUrl,
          })
          .then(() => {
            postData.postId = req.params.postId;
            postData.userName = req.user.userName;
            postData.userId = req.user.userId;
            postData.likeCount++;
            return postDocument.update({ likeCount: postData.likeCount });
          })
          .then(() => {
            return res.status(201).json(postData);
          });
      } else {
        return res.status(400).json({ error: "You already liked the post" });
      }
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({
        error: err.code,
      });
    });
};

exports.unlikePost = (req, res) => {
  const likeDocument = db
    .collection("likes")
    .where("userId", "==", req.user.userId)
    .where("postId", "==", req.params.postId)
    .limit(1);

  const postDocument = db.doc(`/posts/${req.params.postId}`);

  let postData;

  postDocument
    .get()
    .then((post) => {
      if (post.exists) {
        postData = post.data();
        return likeDocument.get();
      } else {
        return res.status(404).json({ error: "Post not found" });
      }
    })
    .then((likes) => {
      if (likes.empty) {
        return res.status(400).json({ error: "Post not liked yet" });
      } else {
        return db
          .doc(`/likes/${likes.docs[0].id}`)
          .delete()
          .then(() => {
            postData.postId = req.params.postId;
            postData.userName = req.user.userName;
            postData.userId = req.user.userId;
            postData.likeCount--;
            return postDocument.update({ likeCount: postData.likeCount });
          })
          .then(() => {
            return res.status(201).json(postData);
          });
      }
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({
        error: err.code,
      });
    });
};

exports.deletePost = (req, res) => {
  const document = db.doc(`/posts/${req.params.postId}`);
  document
    .get()
    .then((post) => {
      if (!post.exists)
        return res.status(404).json({ error: "Post not found" });
      if (!req.user.isAdmin) {
        return res.status(403).json({ error: "Unauthorized" });
      } else {
        document.delete();
      }
    })
    .then(() => {
      return res.status(201).json({ success: "Post deleted" });
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({ error: err.code });
    });
};

let db = {
  basicUserData: {
    userName: "user",
    email: "123@email.com",
    isAdmin: true,
    createAt: "2020-07-06T21:56:53.876Z",
  },
  basicPostData: [
    {
      adminName: "user",
      adminId: "kdjsfgdksuufhgkdsufky",
      title: "this is the post body",
      price: "12",
      createAt: "2020-07-06T21:56:53.876Z",
      imageUrl: "124123423.jpg",
      likeCount: 5,
      commentCount: 2,
      postId: "kdjsfgdksuufhgkdsufky",
    },
  ],
  comments: [
    {
      userName: "user",
      postId: "kdjsfgdksuufhgkdsufky",
      body: "nice one mate!",
      createdAt: "2019-03-15T10:59:52.798Z",
    },
  ],
  notification: [
    {
      // recipient: "adminUser",
      sender: "userName",
      read: false,
      postId: "kdjsfgdksuufhgkdsufky",
      type: "like",
      createAt: "2019-03-15T10:59:52.798Z",
    },
  ],
  userFullData: {
    userDetails: {
      userName: "user",
      email: "123@email.com",
      isAdmin: true,
      createAt: "2020-07-06T21:56:53.876Z",
    },
    likes: [
      {
        postId: "FjapwNZqnw62cSMUv7vR",
        userName: "user",
        userId,
        title: "this is the post body",
        price: "12",
        imageUrl: "124123423.jpg",
      },
      {
        postId: "FjapwNZqnw62cSMUv7vR",
        userName: "user",
        userId,
        title: "this is the post body",
        price: "12",
        imageUrl: "124123423.jpg",
      },
    ],
    notifications: [
      {
        // recipient: "adminUser",
        sender: "userName",
        read: false,
        postId: "kdjsfgdksuufhgkdsufky",
        type: "like",
        createAt: "2019-03-15T10:59:52.798Z",
      },
    ],
  },
  postFullData: {
    adminName: "user",
    title: "this is the post body",
    price: "12",
    createAt: "2020-07-06T21:56:53.876Z",
    imageUrl: "124123423.jpg",
    postId: "kdjsfgdksuufhgkdsufky",
    likeCount: 5,
    commentCount: 2,
    comments: [
      {
        userName: "user",
        postId: "kdjsfgdksuufhgkdsufky",
        title: "post1",
        body: "nice one mate!",
        createdAt: "2019-03-15T10:59:52.798Z",
      },
    ],
  },
};

export const PRISMA_SELECT = {
  USER: {
    id: true,
    email: true,
    isVerified: true,
    bio: true,
    createdAt: true,
    lastname: true,
    name: true,
    updatedAt: true,
    username: true,
    status: true,
    avatar: true,
  },
  MESSAGE: {
    id: true,
    read: true,
    messageId: true,
    userId: true,
    type: true,
    updatedAt: true,
    createdAt: true,
    user: {
      select: {
        id: true,
        email: true,
        isVerified: true,
        bio: true,
        createdAt: true,
        lastname: true,
        name: true,
        updatedAt: true,
        username: true,
        status: true,
        avatar: true,
      },
    },
    message: {
      select: {
        id: true,
        text: true,
        userId: true,
        replyMessageId: true,
        updatedAt: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            email: true,
            isVerified: true,
            bio: true,
            createdAt: true,
            lastname: true,
            name: true,
            updatedAt: true,
            username: true,
            status: true,
            avatar: true,
          },
        },
        replyMessage: {
          select: {
            id: true,
            read: true,
            messageId: true,
            userId: true,
            type: true,
            updatedAt: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                email: true,
                isVerified: true,
                bio: true,
                createdAt: true,
                lastname: true,
                name: true,
                updatedAt: true,
                username: true,
                status: true,
                avatar: true,
              },
            },
            message: {
              select: {
                id: true,
                text: true,
                userId: true,
                replyMessageId: true,
                updatedAt: true,
                createdAt: true,
                user: {
                  select: {
                    id: true,
                    email: true,
                    isVerified: true,
                    bio: true,
                    createdAt: true,
                    lastname: true,
                    name: true,
                    updatedAt: true,
                    username: true,
                    status: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

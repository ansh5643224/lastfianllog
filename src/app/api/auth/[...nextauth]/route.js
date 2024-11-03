import NextAuth from "next-auth";
import { JWT } from "next-auth/jwt"; // Import JWT for type annotations if needed.

// Ensure todo: replace with appropriate types if you're using TypeScript
const { getServerSession } = require("next-auth/next");

export const authOptions = {
  // Use JSON Web Tokens for session management
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    {
      id: "AniListProvider",
      name: "AniList",
      type: "oauth",
      token: "https://anilist.co/api/v2/oauth/token",
      authorization: {
        url: "https://anilist.co/api/v2/oauth/authorize",
        params: { scope: "", response_type: "code" },
      },
      userinfo: {
        url: "https://graphql.anilist.co",
        async request(context) {
          const response = await fetch("https://graphql.anilist.co", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${context.tokens.access_token}`,
              Accept: "application/json",
            },
            body: JSON.stringify({
              query: `
                query {
                  Viewer {
                    id
                    name
                    avatar {
                      large
                      medium
                    }
                    bannerImage
                    createdAt
                    mediaListOptions {
                      animeList {
                        customLists
                      }
                    }
                  }
                }
              `,
            }),
          });

          const data = await response.json();

          const userLists = data.Viewer?.mediaListOptions.animeList.customLists || [];
          
          // Add custom list if not already present
          if (!userLists.includes("Watched Via 1Anime")) {
            userLists.push("Watched Via 1Anime");

            await fetch("https://graphql.anilist.co/", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${context.tokens.access_token}`,
                Accept: "application/json",
              },
              body: JSON.stringify({
                query: `
                  mutation($lists: [String]) {
                    UpdateUser(animeListOptions: { customLists: $lists }) {
                      id
                    }
                  }
                `,
                variables: { lists: userLists },
              });
          }

          return {
            token: context.tokens.access_token,
            id: data.Viewer.id,
            name: data.Viewer.name,
            image: data.Viewer.avatar,
            createdAt: data.Viewer.createdAt,
            list: userLists,
          };
        },
      },
      clientId: process.env.ANILIST_CLIENT_ID,
      clientSecret: process.env.ANILIST_CLIENT_SECRET,
      profile(profile) {
        return {
          token: profile.token,
          id: profile.id,
          name: profile.name,
          image: profile.image,
          createdAt: profile.createdAt,
          list: profile.list,
        };
      },
    },
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Append user data to the token
      if (user) {
        token = { ...token, ...user };
      }
      return token;
    },
    async session({ session, token }) {
      // Attach the JWT token to the session
      session.user = token;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export const getAuthSession = () => {
  return getServerSession(authOptions);
};

// Export handlers for Next.js API routes
export { handler as GET, handler as POST };

import NextAuth from "next-auth";
import { getServerSession } from "next-auth";

// Define the authOptions for NextAuth
export const authOptions = {
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

          const { data } = await response.json();
          const userLists = data.Viewer?.mediaListOptions.animeList.customLists ?? [];
          const customLists = userLists.includes("Watched Via 1Anime") ? userLists : [...userLists, "Watched Via 1Anime"];

          const fetchGraphQL = async (query, variables) => {
            const fetchResponse = await fetch("https://graphql.anilist.co/", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(context.tokens.access_token && {
                  Authorization: `Bearer ${context.tokens.access_token}`,
                }),
                Accept: "application/json",
              },
              body: JSON.stringify({ query, variables }),
            });
            return await fetchResponse.json();
          };

          if (!userLists.includes("Watched Via 1Anime")) {
            const modifiedLists = async (lists) => {
              const setList = `
                mutation($lists: [String]){
                  UpdateUser(animeListOptions: { customLists: $lists }){
                    id
                  }
                }
              `;
              await fetchGraphQL(setList, { lists });
            };
            await modifiedLists(customLists);
          }

          return {
            token: context.tokens.access_token,
            name: data.Viewer.name,
            sub: data.Viewer.id,
            image: data.Viewer.avatar,
            createdAt: data.Viewer.createdAt,
            list: customLists,
          };
        },
      },
      clientId: process.env.ANILIST_CLIENT_ID,
      clientSecret: process.env.ANILIST_CLIENT_SECRET,
      profile(profile) {
        return {
          token: profile.token,
          id: profile.sub,
          name: profile?.name,
          image: profile.image,
          createdAt: profile?.createdAt,
          list: profile?.list,
        };
      },
    },
  ],
  session: {
    strategy: "jwt", // Using JWTs for sessions
  },
  callbacks: {
    async jwt({ token, user }) {
      return { ...token, ...user }; // Combine token and user
    },
    async session({ session, token }) {
      session.user = token; // Add user data to session
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

// Function to get server session
export const getAuthSession = () => getServerSession(authOptions);

// Export the handler for NextAuth API routes
export { handler as GET, handler as POST };

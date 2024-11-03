import NextAuth from "next-auth";
import { getServerSession } from "next-auth";
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const fetchGraphQL = async (query, variables, accessToken) => {
  const response = await fetch("https://graphql.anilist.co/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  return response.json();
};

const db = await open({
  filename: './database.sqlite',
  driver: sqlite3.Database
});

export const authOptions = {
  secret: "yqsdAIKIgB2YZOTaT4NO9aPNxCbTCzwoGJ36rQJO",
  providers: [
    {
      id: "AniListProvider",
      name: "AniList",
      type: "oauth",
      token: "https://anilist.co/api/v2/oauth/token",
      authorization: {
        url: "https://anilist.co/api/v2/oauth/authorize",
        params: {
          scope: "read:anime write:anime",
          response_type: "code",
          redirect_uri: "https://airin-fcon.vercel.app/api/auth/callback/AniListProvider",
          client_id: "22155"
        },
      },
      userinfo: {
        url: "https://graphql.anilist.co",
        async request(context) {
          const res = await fetch("https://graphql.anilist.co", {
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
          const data = await res.json();

          const userLists = data.Viewer?.mediaListOptions.animeList.customLists;
          let customLists = userLists || [];

          if (!userLists?.includes("Watched Via Airin")) {
            customLists.push("Watched Via Airin");
            const setList = `
              mutation($lists: [String]){
                UpdateUser(animeListOptions: { customLists: $lists }){
                  id
                }
              }
            `;
            await fetchGraphQL(setList, { lists: customLists }, context.tokens.access_token);
          }

          return {
            token: context.tokens.access_token,
            name: data.Viewer.name,
            sub: data.Viewer.id,
            image: data.Viewer.avatar,
            createdAt: data.Viewer.createdAt,
            list: data.Viewer?.mediaListOptions.animeList.customLists,
          };
        },
      },
      clientId: "22155",
      clientSecret: "8bmea5HynlioXnpZWhP2uvGyslpDZpSKqFOBZiMa",
      profile(profile) {
        return {
          token: profile.token,
          id: profile.sub,
          name: profile.name,
          image: profile.image,
          createdAt: profile.createdAt,
          list: profile.list,
        };
      },
    },
  ],
  database: db,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      return { ...token, ...user };
    },
    async session({ session, token }) {
      session.user = token;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export const getAuthSession = () => getServerSession(authOptions);

export { handler as GET, handler as POST };

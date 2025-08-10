import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import connectDB from "./connectDB";
import Usermodel from "@/models/user.model";
import bcrypt from "bcryptjs";
import GitHubProvider from "next-auth/providers/github";
import { Account, Profile, User } from "next-auth";
import { AdapterUser } from "next-auth/adapters";

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      name: string;
      email: string;
      image: string;
    };
  }

  interface JWT {
    id: string;
    username: string;
  }
}
const authoptions: NextAuthOptions = {
  // Your NextAuth options here
  providers: [
    CredentialsProvider({
      name: "Credentials",

      credentials: {
        identifier: {
          label: "Identifier",
          type: "text",
          placeholder: "jsmith/abc@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        try {
          await connectDB();
          if (
            !credentials ||
            !credentials.identifier ||
            !credentials.password
          ) {
            return null;
          }
          const existingUser = await Usermodel.findOne({
            $or: [
              { email: credentials.identifier },
              { username: credentials.identifier },
            ],
          });
          if (!existingUser) {
            throw new Error(
              "No user found with the given identifier, Please check your credentials or sign up."
            );
          }
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            existingUser.password
          );
          if (!isPasswordValid) {
            throw new Error("Invalid password, Please check your credentials.");
          }

          return existingUser;
        } catch (error) {
          if (process.env.NODE_ENV !== "production") {
            console.error("Authorization error:", error);
          }
          throw new Error("Authorization failed, Please try again later.");
        }
      },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({
      user,
      account,
    }: {
      user: User | AdapterUser;
      account: Account | null;
    }) {
      try {
        await connectDB();

        if (account?.provider === "github") {
          const existingUser = await Usermodel.findOne({ email: user.email });

          // If user doesn't exist, create a new one
          if (!existingUser) {
            const newUser = new Usermodel({
              email: user.email,
              username: user.name || user.email?.split("@")[0],
              name: user.name,
              provider: "github",
            });
            await newUser.save();
            console.log("New GitHub user created:", user.email);
          }
        }

        return true;
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Sign-in error:", error);
        }
        return false;
      }
    },

    async jwt({ token, user, account }) {
      // Persist user data to token on first sign in
      if (user) {
        await connectDB();
        const dbUser = await Usermodel.findOne({ email: user.email });
        if (dbUser) {
          token.id = dbUser._id.toString();
          token.username = dbUser.username;
          token.name = dbUser.name;
          token.email = dbUser.email;
          token.image = dbUser.image;
        }
      }
      return token;
    },

    async session({ session, token }) {
      // Send properties to the client
      if (token) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.image as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default authoptions;

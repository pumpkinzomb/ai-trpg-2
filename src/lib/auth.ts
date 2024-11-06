import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/dbConnect";
import { compare } from "bcryptjs";
import { User, IUser } from "@/app/models";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("이메일과 비밀번호가 필요합니다.");
        }

        await dbConnect();

        const user = await User.findOne({ email: credentials.email })
          .select("+password")
          .lean<IUser>();

        if (!user) {
          throw new Error("존재하지 않는 사용자입니다.");
        }

        const isValid = await compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error("비밀번호가 일치하지 않습니다.");
        }

        // IUser에서 필요한 필드만 반환
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          id: user.id,
          role: user.role,
        };
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          role: token.role,
        },
      };
    },
  },
};

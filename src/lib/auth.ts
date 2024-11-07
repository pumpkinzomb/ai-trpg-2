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
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.image = user.image;
      }

      // update 트리거 발생 시 DB에서 최신 정보 조회
      if (trigger === "update") {
        try {
          await dbConnect();
          const latestUser = await User.findOne({
            email: token.email,
          }).lean<IUser>();
          if (latestUser) {
            token.name = latestUser.name;
            token.image = latestUser.image;
            token.role = latestUser.role;
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
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
          image: token.image,
        },
      };
    },
  },
};

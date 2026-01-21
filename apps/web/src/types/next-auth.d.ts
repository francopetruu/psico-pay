import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      therapistId?: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role?: string;
    therapistId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    role?: string;
    therapistId?: string;
  }
}

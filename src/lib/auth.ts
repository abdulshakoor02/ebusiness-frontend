import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                try {
                    // return {
                    //     id: "1",
                    //     name: "Admin User",
                    //     email: "test@test.com",
                    //     role: "super_admin",
                    //     tenant_id: "1",
                    //     token: "token",
                    // };
                    const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/auth/login", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            email: credentials?.email,
                            password: credentials?.password,
                        }),
                    });

                    const data = await res.json();

                    if (res.ok && data?.token && data?.user) {
                        const isSuperadmin = data.user.role === 'superadmin';
                        return {
                            id: data.user.id,
                            name: data.user.name,
                            email: data.user.email,
                            role: data.user.role,
                            tenant_id: data.user.tenant_id || "",
                            token: data.token,
                            tax: isSuperadmin ? 0 : (data.tax ?? 0),
                            currency: isSuperadmin ? "AED" : (data.currency ?? "USD"),
                        };
                    }
                    return null;
                } catch (error) {
                    console.error("Auth error:", error);
                    return null;
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.tenant_id = user.tenant_id;
                token.accessToken = user.token;
                token.tax = user.tax ?? 0;
                token.currency = user.currency ?? "USD";
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.tenant_id = token.tenant_id as string;
                session.user.token = token.accessToken as string;
                session.user.tax = (token.tax as number) ?? 0;
                session.user.currency = (token.currency as string) ?? "USD";
            }
            return session;
        }
    },
    pages: {
        signIn: "/", // Root route is our login page
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_dev_mode_only",
};

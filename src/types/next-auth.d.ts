import "next-auth";

declare module "next-auth" {
    interface User {
        id: string;
        role: string;
        tenant_id: string;
        token: string;
        tax?: number;
        currency?: string;
    }
    interface Session {
        user: User & {
            id: string;
            role: string;
            tenant_id: string;
            token: string;
            tax: number;
            currency: string;
        };
    }
}

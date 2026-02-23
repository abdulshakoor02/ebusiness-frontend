import { z } from "zod";

export const LoginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const UserSchema = z.object({
    id: z.string(),
    tenant_id: z.string(),
    name: z.string(),
    email: z.string().email(),
    mobile: z.string().optional(),
    role: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
});
export type User = z.infer<typeof UserSchema>;

export const AuthResponseSchema = z.object({
    token: z.string(),
    user: UserSchema,
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const AddressSchema = z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    zip_code: z.string().optional(),
});
export type Address = z.infer<typeof AddressSchema>;

export const TenantSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    logo_url: z.string().url().optional().or(z.literal("")),
    address: AddressSchema.optional(),
    created_at: z.string(),
    updated_at: z.string(),
});
export type Tenant = z.infer<typeof TenantSchema>;

export const CreateTenantSchema = z.object({
    name: z.string().min(1, "Company Name is required"),
    email: z.string().email("Invalid email address"),
    logo_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    address: AddressSchema.optional(),
    admin_user: z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Invalid email address"),
        mobile: z.string().min(1, "Mobile is required"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        role: z.string().default("admin"),
    }),
});
export type CreateTenantInput = z.input<typeof CreateTenantSchema>;

// Leads Module Schemas

export const LeadCategorySchema = z.object({
    id: z.string(),
    name: z.string().min(1, "Category name is required"),
    description: z.string().optional(),
    created_at: z.string(),
    updated_at: z.string(),
});
export type LeadCategory = z.infer<typeof LeadCategorySchema>;

export const LeadCommentSchema = z.object({
    id: z.string(),
    lead_id: z.string(),
    author_id: z.string(),
    content: z.string().min(1, "Comment cannot be empty"),
    created_at: z.string(),
    updated_at: z.string(),
});
export type LeadComment = z.infer<typeof LeadCommentSchema>;

export const LeadAppointmentSchema = z.object({
    id: z.string(),
    lead_id: z.string(),
    organizer_id: z.string(),
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    start_time: z.string(),
    end_time: z.string(),
    status: z.enum(["scheduled", "completed", "cancelled"]),
    created_at: z.string(),
    updated_at: z.string(),
});
export type LeadAppointment = z.infer<typeof LeadAppointmentSchema>;

export const LeadSourceSchema = z.object({
    id: z.string(),
    name: z.string().min(1, "Source name is required"),
    description: z.string().optional(),
    created_at: z.string(),
    updated_at: z.string(),
});
export type LeadSource = z.infer<typeof LeadSourceSchema>;

export const LeadSchema = z.object({
    id: z.string(),
    assigned_to: z.string().optional(),
    category_id: z.union([
        z.string(),
        z.object({ id: z.string(), name: z.string().optional() })
    ]).optional(),
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    company: z.string().optional(),
    title: z.string().optional(),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone: z.string().optional(),
    status: z.string(),
    source_id: z.union([
        z.string(),
        z.object({ id: z.string(), name: z.string().optional() })
    ]).optional(),
    created_at: z.string(),
    updated_at: z.string(),
});
export type Lead = z.infer<typeof LeadSchema>;

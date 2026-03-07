"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateUser, useUpdateUser, CreateUserInput } from "@/hooks/useUsers";
import { User } from "@/lib/schemas";
import { useRoles } from "@/hooks/usePermissions";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface UserFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user?: User;
}

const userFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    mobile: z.string().min(1, "Mobile number is required"),
    password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
    role: z.string().min(1, "Role is required"),
});

type UserFormValues = z.infer<typeof userFormSchema>;

export function UserFormModal({ open, onOpenChange, user }: UserFormModalProps) {
    const createUser = useCreateUser();
    const updateUser = useUpdateUser();
    const isEditing = !!user;
    const { data: roles, isLoading: isLoadingRoles, isError: isErrorRoles } = useRoles();

    const form = useForm<UserFormValues>({
        resolver: zodResolver(userFormSchema),
        defaultValues: {
            name: "",
            email: "",
            mobile: "",
            password: "",
            role: "viewer",
        },
    });

    useEffect(() => {
        if (user) {
            form.reset({
                name: user.name || "",
                email: user.email || "",
                mobile: user.mobile || "",
                password: "",
                role: user.role || "viewer",
            });
        } else {
            form.reset({
                name: "",
                email: "",
                mobile: "",
                password: "",
                role: "viewer",
            });
        }
    }, [user, form]);

    function onSubmit(data: UserFormValues) {
        if (isEditing && user) {
            const { password, ...updateData } = data;
            const payload = password && password.length >= 6 ? data : updateData;
            updateUser.mutate(
                { id: user.id, data: payload },
                {
                    onSuccess: () => {
                        form.reset();
                        onOpenChange(false);
                    },
                }
            );
        } else {
            createUser.mutate(data, {
                onSuccess: () => {
                    form.reset();
                    onOpenChange(false);
                },
            });
        }
    }

    const isPending = createUser.isPending || updateUser.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit User" : "Add New User"}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Update user profile details and role."
                            : "Create a new user profile and assign them a role and organization."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="John Doe" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="john@example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="mobile"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mobile Number</FormLabel>
                                        <FormControl>
                                            <Input type="tel" placeholder="+1234567890" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {isEditing ? "New Password (optional)" : "Temporary Password"}
                                        </FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="••••••••" {...field} value={field.value || ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Role</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a role" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {isErrorRoles ? (
                                                <SelectItem value="error" disabled>Failed to load roles</SelectItem>
                                            ) : isLoadingRoles ? (
                                                <SelectItem value="loading" disabled>Loading roles...</SelectItem>
                                            ) : roles?.length ? (
                                                roles.map((role) => (
                                                    <SelectItem key={role} value={role}>
                                                        {role.replace("_", " ")}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="none" disabled>No roles available</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {isEditing ? "Saving..." : "Creating..."}
                                    </>
                                ) : (
                                    isEditing ? "Save Changes" : "Create User"
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

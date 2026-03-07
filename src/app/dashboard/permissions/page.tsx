import { redirect } from "next/navigation";

export default function OldPermissionsRedirect() {
    redirect("/dashboard/access-management/role-permissions");
}
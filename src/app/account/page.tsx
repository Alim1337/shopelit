import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AccountOverviewPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Account Overview</h1>
        <p className="text-slate-500 mt-1">Manage your personal information and preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500 mb-1">Full name</p>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{user.name || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Email</p>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{user.email}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Email verified</p>
            <Badge variant={user.emailVerified ? "success" : "warning"}>
              {user.emailVerified ? "Verified" : "Not verified"}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Account type</p>
            <Badge variant="secondary" className="capitalize">
              {user.role.replace("_", " ")}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

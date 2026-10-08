"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Ban, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: "customer" | "admin" | "super_admin";
  isActive: boolean;
  isBanned: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: "1", limit: "50" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      if (data.success) setUsers(data.data.data);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const updateUser = async (id: string, updates: Partial<AdminUser>) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || "Failed to update user");
        return;
      }
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
      toast.success("User updated");
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Users</h1>
        <p className="text-slate-500 mt-1">{users.length} registered users</p>
      </div>

      <Input
        placeholder="Search by name or email..."
        leftIcon={<Search className="h-4 w-4" />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3 font-medium">User</th>
              <th className="text-left px-5 py-3 font-medium">Joined</th>
              <th className="text-left px-5 py-3 font-medium">Role</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
              <th className="text-right px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-500">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-500">No users found.</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{u.name || "—"}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{formatDate(u.createdAt)}</td>
                  <td className="px-5 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => updateUser(u.id, { role: e.target.value as AdminUser["role"] })}
                      className="text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-900 px-2 py-1 capitalize focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="customer">Customer</option>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </td>
                  <td className="px-5 py-3">
                    {u.isBanned ? (
                      <Badge variant="destructive">Banned</Badge>
                    ) : u.isActive ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => updateUser(u.id, { isBanned: !u.isBanned })}
                      className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors ${
                        u.isBanned ? "text-green-600 hover:text-green-700" : "text-red-500 hover:text-red-600"
                      }`}
                    >
                      {u.isBanned ? (
                        <>
                          <CheckCircle className="h-3.5 w-3.5" /> Unban
                        </>
                      ) : (
                        <>
                          <Ban className="h-3.5 w-3.5" /> Ban
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

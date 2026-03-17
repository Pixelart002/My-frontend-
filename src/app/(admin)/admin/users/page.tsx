"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "@/lib/api-services";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { UserProfile } from "@/types";

export default function AdminUsersPage() {
 const qc = useQueryClient();
 const [page, setPage] = useState(1);
 
 const { data, isLoading } = useQuery({
  queryKey: ["admin", "users", page],
  queryFn: () => userService.listUsers(page, 20),
 });
 
 const updateMutation = useMutation({
  mutationFn: ({ id, data }: { id: string;data: { is_active ? : boolean;role ? : string } }) =>
   userService.updateUser(id, data),
  onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
 });
 
 return (
  <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        {data && <p className="text-sm text-muted-foreground">{data.total} total</p>}
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Joined</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Role</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    {[1,2,3,4,5].map(c => (
                      <td key={c} className="px-4 py-3"><div className="h-4 skeleton rounded" /></td>
                    ))}
                  </tr>
                ))
              : data?.items.map((user: UserProfile) => (
                  <tr key={user.id} className="border-b hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <p className="font-medium">{user.full_name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        user.role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        user.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="outline" size="sm" className="h-7 text-xs"
                          onClick={() => updateMutation.mutate({
                            id: user.id,
                            data: { role: user.role === "admin" ? "customer" : "admin" },
                          })}
                        >
                          {user.role === "admin" ? "Make customer" : "Make admin"}
                        </Button>
                        <Button
                          variant="outline" size="sm" className="h-7 text-xs"
                          onClick={() => updateMutation.mutate({
                            id: user.id,
                            data: { is_active: !user.is_active },
                          })}
                        >
                          {user.is_active ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {data && data.pages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {data.pages}</span>
          <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
    </div>
 );
}
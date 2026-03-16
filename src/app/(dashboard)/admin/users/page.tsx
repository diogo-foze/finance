"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { User, Shield, Trash2, Edit } from "lucide-react";
import { UserForm } from "./user-form";
import { EditUserModal } from "./edit-user-modal";

interface DBUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  provider: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<DBUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<DBUser | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (res.ok) setUsers(data);
    } catch (error) {
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;

    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Usuário excluído");
        setUsers(users.filter(u => u._id !== id));
      }
    } catch (error) {
      toast.error("Erro ao excluir");
    }
  }

  async function toggleRole(user: DBUser) {
    const newRole = user.role === "admin" ? "user" : "admin";
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user._id, role: newRole })
      });
      if (res.ok) {
        toast.success("Nível de acesso atualizado");
        setUsers(users.map(u => u._id === user._id ? { ...u, role: newRole } : u));
      }
    } catch (error) {
      toast.error("Erro ao atualizar papel");
    }
  }

  if (loading) return <p>Carregando usuários...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Gestão de Usuários</h2>
        <UserForm onSuccess={fetchUsers} />
      </div>

      <EditUserModal 
        user={editingUser} 
        open={!!editingUser} 
        onOpenChange={(open) => !open && setEditingUser(null)}
        onSuccess={fetchUsers}
      />

      <Card>
        <CardHeader>
          <CardTitle>Usuários Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Provedor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell className="font-medium">
                    <button 
                      onClick={() => setEditingUser(user)}
                      className="hover:text-primary hover:underline transition-all text-left font-bold"
                    >
                      {user.name}
                    </button>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                      {user.role === "admin" ? "Administrador" : "Usuário"}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">{user.provider}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setEditingUser(user)}
                      title="Editar Usuário"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => toggleRole(user)}
                      title="Alterar Nível"
                    >
                      <Shield className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleDelete(user._id)}
                      title="Excluir Usuário"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner";
import { User, Key } from "lucide-react";

interface EditUserModalProps {
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
    image?: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditUserModal({ user, open, onOpenChange, onSuccess }: EditUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    password: "",
  });

  // Update form data when user prop changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        password: "",
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);

    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: user._id,
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: user.role
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao atualizar usuário");
      }

      toast.success("Usuário atualizado com sucesso!");
      onOpenChange(false);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast.error(error.message || "Ocorreu um erro ao atualizar o usuário.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {user.image ? (
              <img src={user.image} alt="Avatar" className="w-8 h-8 rounded-full object-cover shadow-sm mr-3" />
            ) : (
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                <User className="w-5 h-5 text-primary" />
              </div>
            )}
            Editar Usuário
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome Completo</label>
            <Input 
              required 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Ex: João Silva"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input 
              type="email"
              required 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="joao@exemplo.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1">
              Nova Senha
              <span className="text-[10px] text-muted-foreground font-normal">(Deixe em branco para não alterar)</span>
            </label>
            <div className="relative">
              <Input 
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="••••••••"
                className="pl-9"
              />
              <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
          
          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Salvar Alterações"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

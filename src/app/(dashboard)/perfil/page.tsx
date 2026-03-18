"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { UserCircle, Camera, Save, Upload } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";

export default function PerfilPage() {
  const { data: session, update } = useSession();
  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setPreview(session.user.image || "");
    }
  }, [session]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setPreview(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("O nome não pode estar vazio.");
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Force NextAuth to update the session locally if supported, otherwise just reload
      await update({ name: data.user.name, image: data.user.image });
      
      toast.success("Perfil atualizado com sucesso");
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar perfil");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 space-y-6 max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Meu Perfil</h2>
          <p className="text-muted-foreground">Gerencie suas informações pessoais e foto de perfil.</p>
        </div>
      </div>

      <Card className="shadow-sm border-border">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Informações Públicas</CardTitle>
            <CardDescription>Estes dados serão exibidos no sistema.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              <div 
                className="relative group rounded-full overflow-hidden w-24 h-24 bg-muted border-4 border-background shadow-md shrink-0 flex items-center justify-center cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {preview ? (
                  <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <UserCircle className="w-12 h-12 text-muted-foreground" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="space-y-2 flex-1 w-full">
                <label className="text-sm font-medium">Foto de Perfil</label>
                <div className="flex items-center gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Escolher Imagem
                  </Button>
                  {imageFile && <span className="text-xs text-muted-foreground">{imageFile.name}</span>}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <p className="text-xs text-muted-foreground">O tamanho máximo ideal é de 2MB. Recomendamos formatos quadrados (1:1).</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Nome Completo</label>
              <Input 
                placeholder="Seu nome" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input 
                value={session?.user?.email || ""}
                disabled
                className="bg-muted/50 text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">O endereço de email não pode ser alterado por aqui.</p>
            </div>

            <Button type="submit" disabled={isSaving} className="w-full sm:w-auto mt-4">
              {isSaving ? "Salvando..." : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}

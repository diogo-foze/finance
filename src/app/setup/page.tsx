"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, Download, UserPlus, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [isDbEmpty, setIsDbEmpty] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkDb() {
      try {
        const res = await fetch("/api/setup/import");
        const data = await res.json();
        console.log(data)
        if (data.isEmpty === false) {
          // If already has users, redirect to login
          router.push("/login");
        } else {
          setIsDbEmpty(true);
        }
      } catch (error) {
        console.error("Erro ao verificar banco:", error);
        setIsDbEmpty(true); // Se falhar, assumimos que precisa de setup ou mostramos a tela mesmo assim
      } finally {
        setLoading(false);
      }
    }
    checkDb();
  }, [router]);

  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await fetch("/api/setup/import", { method: "POST" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Falha na importação");

      toast.success("Dados importados com sucesso!");
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 relative overflow-hidden">
      {/* Background blobs for premium feel */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute bottom-0 -right-4 w-72 h-72 bg-blue-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

      <div className="w-full max-w-2xl z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4 border border-primary/20">
            <Database className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">Bem-vindo ao FinanSys</h1>
          <p className="text-zinc-400 text-lg">Inicie sua jornada financeira com estilo e organização.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-xl group hover:border-primary/50 transition-all duration-500">
            <CardHeader>
              <Download className="w-6 h-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
              <CardTitle className="text-white">Importar Dados</CardTitle>
              <CardDescription className="text-zinc-500">Use seu arquivo de backup anterior localizado em `docker-init/init-db.js`.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-xs text-zinc-500 space-y-2">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Restaura usuários admins</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Importa histórico de receitas</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Mantém despesas cadastradas</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleImport}
                disabled={importing}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold"
              >
                {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                Começar Importação
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-xl group hover:border-zinc-700 transition-all duration-500 opacity-60 grayscale hover:opacity-100 hover:grayscale-0">
            <CardHeader>
              <UserPlus className="w-6 h-6 text-zinc-400 mb-2 group-hover:scale-110 transition-transform" />
              <CardTitle className="text-white">Instalação Limpa</CardTitle>
              <CardDescription className="text-zinc-500">Configure o sistema do zero e crie o primeiro usuário manualmente.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-xs text-zinc-500 space-y-2">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-zinc-600" /> Banco de dados vázio</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-zinc-600" /> Criação de senha mestre</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-zinc-600" /> Configuração manual</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                onClick={() => router.push("/register")} // Or a manual setup flow
                className="w-full border-zinc-800 bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-white"
                disabled={importing}
              >
                Configurar Manualmente
              </Button>
            </CardFooter>
          </Card>
        </div>

        <p className="text-center text-zinc-600 text-[10px] mt-8 uppercase tracking-widest font-medium">FinanSys Premium Dashboard &copy; 2026</p>
      </div>
    </div>
  );
}

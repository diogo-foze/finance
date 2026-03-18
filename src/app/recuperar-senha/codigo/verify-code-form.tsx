"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function VerifyCodeForm() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams?.get("email") || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Referência de email perdida. Volte para o início.");
      return;
    }

    if (code.length !== 6) {
      toast.error("O código inválido.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ocorreu um erro inesperado");
      }

      toast.success(data.message);
      router.push(`/recuperar-senha/nova-senha?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Verificar Código</CardTitle>
          <CardDescription>
            Enviamos um código de 6 dígitos para <strong className="text-foreground">{email}</strong>. Por favor, insira-o abaixo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 text-center">
              <label htmlFor="code" className="text-sm font-medium sr-only">Código de 6 dígitos</label>
              <Input
                id="code"
                type="text"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                required
                disabled={loading}
                className="text-center text-3xl font-bold tracking-[0.5em] h-16 uppercase placeholder:font-normal placeholder:tracking-normal"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading || code.length !== 6}>
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verificando...</>
              ) : (
                "Validar Código"
              )}
            </Button>

            <div className="mt-4 text-center">
              <Link href="/recuperar-senha" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Tentar outro e-mail
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

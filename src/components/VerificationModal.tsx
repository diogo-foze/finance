"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Mail, CheckCircle2, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

export function VerificationModal({ isOpen, onClose, email }: VerificationModalProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { update } = useSession();

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast.error("O código deve ter 6 dígitos.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erro ao verificar código.");

      toast.success("E-mail verificado com sucesso!");
      
      // Update session to reflect verified status
      await update({ isEmailVerified: true });
      
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
      });

      if (!res.ok) throw new Error("Erro ao reenviar código.");

      toast.success("Novo código enviado para seu e-mail.");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <div className="mb-4 p-3 rounded-full bg-primary/10 text-primary">
            <Mail className="w-8 h-8" />
          </div>
          <DialogTitle className="text-xl">Verifique seu e-mail</DialogTitle>
          <DialogDescription>
            Enviamos um código de 6 dígitos para <span className="font-semibold">{email}</span>.
            Digite-o abaixo para ativar sua conta.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            className="text-center text-2xl tracking-[10px] h-14 font-bold"
            maxLength={6}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResend}
            disabled={resending}
            className="text-xs text-muted-foreground hover:text-primary"
          >
            {resending ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : null}
            Não recebeu o código? Clique para reenviar
          </Button>
        </div>

        <DialogFooter className="sm:justify-center">
          <Button
            onClick={handleVerify}
            disabled={loading || code.length !== 6}
            className="w-full sm:w-auto px-8"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            Verificar e Ativar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

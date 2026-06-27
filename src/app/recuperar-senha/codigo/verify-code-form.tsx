"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function VerifyCodeForm() {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams?.get("email") || "";
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus the first input field on load
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const code = digits.join("");

  const handleChange = (value: string, index: number) => {
    // Only allow digits
    const cleanValue = value.replace(/[^0-9]/g, "");
    if (!cleanValue) {
      const newDigits = [...digits];
      newDigits[index] = "";
      setDigits(newDigits);
      return;
    }

    const newDigits = [...digits];
    const valChars = cleanValue.split("");
    
    // Fill digits from the current index onwards
    for (let i = 0; i < valChars.length && index + i < 6; i++) {
      newDigits[index + i] = valChars[i];
    }
    setDigits(newDigits);

    // Focus the next empty input or next input
    const nextIndex = Math.min(index + valChars.length, 5);
    if (nextIndex !== index) {
      inputRefs.current[nextIndex]?.focus();
    } else if (index < 5 && valChars.length > 0) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        // If current is empty, delete previous and move focus back
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        setDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
      } else {
        // Just clear the current digit
        const newDigits = [...digits];
        newDigits[index] = "";
        setDigits(newDigits);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
    if (pastedData) {
      const newDigits = [...digits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pastedData[i] || "";
      }
      setDigits(newDigits);
      
      // Focus the last filled input or the last input
      const focusIndex = Math.min(pastedData.length, 5);
      inputRefs.current[focusIndex]?.focus();
    }
  };

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
            Enviamos um código para <strong className="text-foreground">{email}</strong>. Por favor, insira-o abaixo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <label className="text-sm font-medium block text-center text-muted-foreground">Código de 6 dígitos</label>
              <div className="flex justify-center gap-2 sm:gap-3">
                {digits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(e.target.value, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={handlePaste}
                    required
                    disabled={loading}
                    className="w-12 h-14 text-center text-2xl font-bold border border-input bg-transparent rounded-lg transition-colors outline-none focus:border-ring focus:ring-3 focus:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                  />
                ))}
              </div>
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

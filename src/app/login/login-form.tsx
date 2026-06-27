"use client";

import { useState, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showGoogle, setShowGoogle] = useState(true);

  const [loginMode, setLoginMode] = useState<"password" | "code_request" | "code_verify">("password");
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    async function checkSetupAndLoadConfig() {
      try {
        // Double check if system needs setup
        const setupRes = await fetch("/api/setup/import");
        if (setupRes.ok) {
          const setupData = await setupRes.json();
          if (setupData.isEmpty) {
            router.push("/setup");
            return;
          }
        }

        const res = await fetch("/api/config");
        const config = await res.json();
        if (config.google_login_enabled !== undefined) {
          setShowGoogle(config.google_login_enabled);
        }
      } catch (error) {
        console.error("Erro ao carregar configurações iniciais:", error);
      }
    }
    checkSetupAndLoadConfig();
  }, [router]);

  const searchParams = useSearchParams();
  const urlError = searchParams?.get("error");
  const urlMessage = searchParams?.get("message");

  useEffect(() => {
    if (urlError === "GoogleRegistrationBlocked" && urlMessage) {
      setError(decodeURIComponent(urlMessage));
    } else if (urlError && urlError !== "CredentialsSignin") {
      setError("Erro ao autenticar: " + urlError);
    }
  }, [urlError, urlMessage]);

  const code = digits.join("");

  const handleChangeCode = (value: string, index: number) => {
    const cleanValue = value.replace(/[^0-9]/g, "");
    if (!cleanValue) {
      const newDigits = [...digits];
      newDigits[index] = "";
      setDigits(newDigits);
      return;
    }

    const newDigits = [...digits];
    const valChars = cleanValue.split("");
    
    for (let i = 0; i < valChars.length && index + i < 6; i++) {
      newDigits[index + i] = valChars[i];
    }
    setDigits(newDigits);

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
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        setDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
      } else {
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
      
      const focusIndex = Math.min(pastedData.length, 5);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (loginMode === "password") {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Credenciais inválidas");
        setIsLoading(false);
      } else {
        router.push("/dashboard");
      }
    } else if (loginMode === "code_request") {
      try {
        const res = await fetch("/api/auth/send-login-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Erro ao enviar o código.");
        }

        toast.success(data.message || "Código enviado com sucesso!");
        setLoginMode("code_verify");
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 100);
      } catch (err: any) {
        setError(err.message || "Erro inesperado");
      } finally {
        setIsLoading(false);
      }
    } else if (loginMode === "code_verify") {
      if (code.length !== 6) {
        setError("Digite o código de 6 dígitos.");
        setIsLoading(false);
        return;
      }

      const res = await signIn("code-credentials", {
        email,
        code,
        redirect: false,
      });

      if (res?.error) {
        setError("Código inválido ou expirado.");
        setIsLoading(false);
      } else {
        toast.success("Login realizado com sucesso!");
        router.push("/dashboard");
      }
    }
  };

  const handleResendCode = async () => {
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/send-login-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao enviar o código.");
      }

      toast.success(data.message || "Código enviado com sucesso!");
      setDigits(Array(6).fill(""));
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      setError(err.message || "Erro inesperado");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <Card className="w-full max-w-sm shadow-xl">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">
          {loginMode === "code_verify" ? "Verificar Código" : "Login"}
        </CardTitle>
        <CardDescription>
          {loginMode === "code_verify"
            ? `Código enviado para o e-mail ${email}`
            : "Entre na sua conta FinanSys"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loginMode !== "code_verify" && (
          <div className="flex border-b border-zinc-100 mb-6">
            <button
              type="button"
              className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors ${
                loginMode === "password"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => {
                setLoginMode("password");
                setError("");
              }}
            >
              Com Senha
            </button>
            <button
              type="button"
              className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors ${
                loginMode === "code_request"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => {
                setLoginMode("code_request");
                setError("");
              }}
            >
              Sem Senha
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {loginMode !== "code_verify" && (
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                required
                disabled={isLoading}
              />
            </div>
          )}

          {loginMode === "password" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Senha
                </label>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                disabled={isLoading}
              />
            </div>
          )}

          {loginMode === "code_verify" && (
            <div className="space-y-4">
              <label className="text-sm font-medium block text-center text-muted-foreground">
                Código de 6 dígitos
              </label>
              <div className="flex justify-center gap-2">
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
                    onChange={(e) => handleChangeCode(e.target.value, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={handlePaste}
                    required
                    disabled={isLoading}
                    className="w-10 h-12 text-center text-xl font-bold border border-input bg-transparent rounded-lg transition-colors outline-none focus:border-ring focus:ring-3 focus:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                  />
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-sm font-medium text-destructive">{error}</p>}

          {loginMode !== "code_verify" ? (
            <div className="space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {loginMode === "password" ? (
                  isLoading ? "Entrando..." : "Entrar"
                ) : (
                  isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</> : "Enviar Código de Acesso"
                )}
              </Button>
              {loginMode === "password" && (
                <div className="text-left">
                  <Link href="/recuperar-senha" className="text-xs font-medium text-primary hover:underline" tabIndex={-1}>
                    Esqueci a senha
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading || code.length !== 6}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Entrando...</> : "Validar e Entrar"}
              </Button>

              <div className="flex items-center justify-between text-xs mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode("code_request");
                    setDigits(Array(6).fill(""));
                    setError("");
                  }}
                  className="font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Corrigir e-mail
                </button>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isLoading}
                  className="font-bold text-primary hover:underline disabled:opacity-50"
                >
                  Reenviar código
                </button>
              </div>
            </div>
          )}

          {loginMode !== "code_verify" && (
            <div className="text-center pt-2 border-t border-zinc-100 mt-4">
              <span className="text-xs text-muted-foreground">Novo por aqui? </span>
              <Link href="/register" className="text-xs font-bold text-primary hover:underline">
                Crie uma conta
              </Link>
            </div>
          )}
        </form>

        {showGoogle && loginMode !== "code_verify" && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Ou continue com
                </span>
              </div>
            </div>

            <Button variant="outline" type="button" className="w-full" onClick={handleGoogleSignIn}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
                <path d="M1 1h22v22H1z" fill="none" />
              </svg>
              Entrar com Google
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

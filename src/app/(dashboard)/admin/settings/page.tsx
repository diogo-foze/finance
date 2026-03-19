"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Settings, ShieldCheck, Mail, Globe, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ConfigItem {
  key: string;
  value: any;
  description: string;
  isPublic: boolean;
}

export default function AdminSettingsPage() {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"auth" | "smtp">("auth");
  const [testingSmtp, setTestingSmtp] = useState(false);

  const fetchConfigs = async () => {
    try {
      const res = await fetch("/api/admin/config");
      const data = await res.json();
      if (res.ok) {
        setConfigs(data);
      }
    } catch (error) {
      toast.error("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: string, currentValue: boolean) => {
    const newValue = !currentValue;
    
    // Optimistic update
    setConfigs(prev => prev.map(c => c.key === key ? { ...c, value: newValue } : c));

    try {
      const res = await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: newValue }),
      });

      if (!res.ok) throw new Error();
      toast.success("Configuração atualizada");
    } catch (error) {
      toast.error("Erro ao salvar configuração");
      toast.error("Erro ao salvar configuração");
      // Rollback
      setConfigs(prev => prev.map(c => c.key === key ? { ...c, value: currentValue } : c));
    }
  };

  const saveTextChange = async (key: string, newValue: string) => {
    const originalConfig = configs.find(c => c.key === key);
    if (!originalConfig || originalConfig.value === newValue) return;

    try {
      const res = await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: newValue }),
      });
      if (!res.ok) throw new Error();
      setConfigs(prev => prev.map(c => c.key === key ? { ...c, value: newValue } : c));
      toast.success("Configuração atualizada");
    } catch {
      toast.error("Erro ao salvar configuração");
    }
  };

  const handleTestSmtp = async () => {
    setTestingSmtp(true);
    try {
      const getConfig = (key: string) => configs.find(c => c.key === key)?.value;
      
      const res = await fetch("/api/admin/config/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: getConfig("smtp_host"),
          port: getConfig("smtp_port"),
          user: getConfig("smtp_user"),
          pass: getConfig("smtp_password"),
          from: getConfig("smtp_from_email"),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro desconhecido");

      toast.success(data.message);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setTestingSmtp(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
          <p className="text-muted-foreground italic">Controle total sobre o back-office e comunicações.</p>
        </div>
        <div className="p-3 bg-primary/10 rounded-2xl">
          <Settings className="w-8 h-8 text-primary" />
        </div>
      </div>

      <div className="flex p-1 bg-muted/50 rounded-xl w-fit mb-6 border border-border">
        <button 
          onClick={() => setActiveTab("auth")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
            activeTab === "auth" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <ShieldCheck className="w-4 h-4" /> Autenticação
        </button>
        <button 
          onClick={() => setActiveTab("smtp")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
            activeTab === "smtp" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Mail className="w-4 h-4" /> E-mail (SMTP)
        </button>
      </div>

      <div className="grid gap-6">
        <Card className="shadow-sm border-zinc-200 overflow-hidden">
          <CardHeader className="bg-zinc-50/50 border-b pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">
                  {activeTab === "auth" ? "Regras de Acesso" : "Servidor de Disparo"}
                </CardTitle>
                <CardDescription>
                  {activeTab === "auth" ? "Gerencie como os usuários entram no sistema." : "Configurações para envio de relatórios e senhas."}
                </CardDescription>
              </div>
              {activeTab === "smtp" && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-white border-primary/20 text-primary hover:bg-primary/5 font-bold"
                  onClick={handleTestSmtp}
                  disabled={testingSmtp || loading}
                >
                  {testingSmtp ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  Testar Conexão
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-20 text-center flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Carregando parâmetros...</span>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {configs
                  .filter(c => {
                    if (activeTab === "auth") return c.key.includes("google");
                    if (activeTab === "smtp") return c.key.includes("smtp");
                    return true;
                  })
                  .map((config) => {
                    const isBoolean = typeof config.value === 'boolean';
                    return (
                      <div key={config.key} className="p-6 transition-colors hover:bg-zinc-50/30">
                        <div className={isBoolean ? 'flex items-center justify-between gap-4' : 'flex flex-col gap-4'}>
                          <div className="space-y-1 pr-4">
                            <p className="font-bold text-zinc-900 flex items-center gap-2">
                              {config.key === 'google_login_enabled' ? 'Login via Google' :
                               config.key === 'block_google_registration' ? 'Bloquear Novos Cadastros' :
                               config.key === 'google_registration_blocked_message' ? 'Mensagem de Bloqueio' : 
                               config.key === 'smtp_host' ? 'Servidor SMTP (Host)' :
                               config.key === 'smtp_port' ? 'Porta SMTP' :
                               config.key === 'smtp_user' ? 'Usuário SMTP' :
                               config.key === 'smtp_password' ? 'Senha SMTP' :
                               config.key === 'smtp_from_email' ? 'E-mail do Remetente' : config.key}
                              {config.isPublic && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] bg-emerald-100 text-emerald-800 font-bold uppercase tracking-tight">
                                  Lado Cliente
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-zinc-500 leading-relaxed max-w-2xl">{config.description}</p>
                          </div>
                          {isBoolean ? (
                            <Switch 
                              checked={config.value === true}
                              onCheckedChange={() => handleToggle(config.key, config.value)}
                            />
                          ) : (
                            <div className="w-full sm:max-w-md">
                              <Input 
                                defaultValue={config.value}
                                type={config.key === 'smtp_password' ? 'password' : 'text'}
                                onBlur={(e) => saveTextChange(config.key, e.target.value)}
                                className="w-full bg-white border-zinc-200 focus:ring-primary shadow-none"
                                placeholder="Clique fora para salvar automaticamente..."
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                }
                {configs.filter(c => activeTab === "auth" ? c.key.includes("google") : c.key.includes("smtp")).length === 0 && (
                  <div className="p-10 text-center text-muted-foreground italic">
                    Nenhuma configuração encontrada nesta categoria.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

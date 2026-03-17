"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Settings, ShieldCheck, Globe } from "lucide-react";
import { toast } from "sonner";

interface ConfigItem {
  key: string;
  value: any;
  description: string;
  isPublic: boolean;
}

export default function AdminSettingsPage() {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);

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
      // Rollback
      setConfigs(prev => prev.map(c => c.key === key ? { ...c, value: currentValue } : c));
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Configurações do Sistema</h2>
          <p className="text-muted-foreground">Gerencie os serviços e funcionalidades globais.</p>
        </div>
        <Settings className="w-10 h-10 text-muted-foreground/20" />
      </div>

      <div className="grid gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <CardTitle>Autenticação e Acesso</CardTitle>
            </div>
            <CardDescription>Configurações de métodos de login e segurança.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="py-4 text-center text-muted-foreground">Carregando...</div>
            ) : (
              configs.map((config) => (
                <div key={config.key} className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30">
                  <div className="space-y-1">
                    <p className="font-semibold text-sm">
                      {config.key === 'google_login_enabled' ? 'Login via Google' : config.key}
                    </p>
                    <p className="text-xs text-muted-foreground">{config.description}</p>
                    {config.isPublic && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-primary/10 text-primary font-bold uppercase tracking-wider mt-1">
                        <Globe className="w-3 h-3" /> Público
                      </span>
                    )}
                  </div>
                  <Switch 
                    checked={config.value === true}
                    onCheckedChange={() => handleToggle(config.key, config.value)}
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

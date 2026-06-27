"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download, Upload, ShieldAlert, CheckCircle2, AlertTriangle, RefreshCw, FileJson, Info } from "lucide-react";

export default function BackupPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [confirmWord, setConfirmWord] = useState("");
  const [showConfirmInput, setShowConfirmInput] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/users/backup");
      if (!res.ok) {
        throw new Error("Falha ao exportar backup.");
      }

      // Read filename from headers if possible
      const disposition = res.headers.get("content-disposition");
      let fileName = `finansys_backup_${Date.now()}.json`;
      if (disposition && disposition.indexOf("attachment") !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          fileName = matches[1].replace(/['"]/g, "");
        }
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Backup exportado e baixado com sucesso!");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erro ao exportar os dados.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/json" && !file.name.endsWith(".json")) {
        toast.error("Por favor, selecione apenas arquivos do tipo JSON (.json).");
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      if (importMode === "replace") {
        setShowConfirmInput(true);
      }
    }
  };

  const handleModeChange = (mode: "merge" | "replace") => {
    setImportMode(mode);
    if (mode === "replace" && selectedFile) {
      setShowConfirmInput(true);
    } else {
      setShowConfirmInput(false);
      setConfirmWord("");
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Nenhum arquivo de backup selecionado.");
      return;
    }

    if (importMode === "replace" && confirmWord !== "SUBSTITUIR") {
      toast.error("Por favor, digite a palavra 'SUBSTITUIR' para confirmar a sobrescrita.");
      return;
    }

    setIsImporting(true);
    try {
      const fileText = await selectedFile.text();
      let backupData;
      try {
        backupData = JSON.parse(fileText);
      } catch (err) {
        throw new Error("Arquivo corrompido ou formato JSON inválido.");
      }

      const res = await fetch("/api/users/backup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          backupData,
          mode: importMode,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      toast.success(result.message || "Dados restaurados com sucesso!");
      setSelectedFile(null);
      setConfirmWord("");
      setShowConfirmInput(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Falha ao restaurar o backup.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="flex-1 space-y-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Backup e Restauração</h2>
          <p className="text-muted-foreground">
            Exporte uma cópia local de todos os seus dados ou restaure suas tabelas a partir de um backup existente.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <Card className="shadow-sm border-border flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                <Download className="w-5 h-5" />
              </div>
              <CardTitle>Exportar Dados</CardTitle>
            </div>
            <CardDescription>
              Baixe todos os seus dados cadastrados no FinanSys em um arquivo seguro formato JSON.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                O arquivo de backup gerado contém as seguintes informações associadas à sua conta:
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 bg-muted/40 p-2.5 rounded-lg border border-border">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Receitas</span>
                </div>
                <div className="flex items-center gap-2 bg-muted/40 p-2.5 rounded-lg border border-border">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Despesas</span>
                </div>
                <div className="flex items-center gap-2 bg-muted/40 p-2.5 rounded-lg border border-border">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Clientes</span>
                </div>
                <div className="flex items-center gap-2 bg-muted/40 p-2.5 rounded-lg border border-border">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Fornecedores</span>
                </div>
                <div className="flex items-center gap-2 bg-muted/40 p-2.5 rounded-lg border border-border col-span-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Vínculos de Transações & Conversas (Chat)</span>
                </div>
              </div>

              <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3 flex items-start gap-2.5 text-xs text-blue-600 dark:text-blue-400">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <p className="leading-normal">
                  Seus dados e relacionamentos são vinculados de forma criptografada e segura, garantindo compatibilidade total ao restaurar.
                </p>
              </div>
            </div>

            <Button 
              onClick={handleExport} 
              disabled={isExporting} 
              className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Processando dados...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Backup JSON
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Import Card */}
        <Card className="shadow-sm border-border">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <Upload className="w-5 h-5" />
              </div>
              <CardTitle>Restaurar Backup</CardTitle>
            </div>
            <CardDescription>
              Selecione um arquivo de backup exportado anteriormente no sistema para restaurar suas tabelas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleImportSubmit} className="space-y-4">
              
              {/* Radio buttons for import mode */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Modo de Restauração</label>
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    onClick={() => handleModeChange("merge")}
                    className={`cursor-pointer border rounded-xl p-3 flex flex-col gap-1 transition-all ${
                      importMode === "merge" 
                        ? "border-blue-500 bg-blue-500/5 ring-1 ring-blue-500/30" 
                        : "border-border hover:bg-muted/40"
                    }`}
                  >
                    <span className="text-xs font-bold flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                      Mesclar Dados
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-normal">
                      Insere novos dados e atualiza duplicatas por documento. Mantém dados existentes.
                    </span>
                  </div>

                  <div 
                    onClick={() => handleModeChange("replace")}
                    className={`cursor-pointer border rounded-xl p-3 flex flex-col gap-1 transition-all ${
                      importMode === "replace" 
                        ? "border-red-500 bg-red-500/5 ring-1 ring-red-500/30" 
                        : "border-border hover:bg-muted/40"
                    }`}
                  >
                    <span className="text-xs font-bold flex items-center gap-1.5 text-red-600 dark:text-red-400">
                      Substituir Dados
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-normal">
                      Apaga **tudo** o que está no seu painel antes de importar o backup. Cuidado!
                    </span>
                  </div>
                </div>
              </div>

              {/* Upload Input Box */}
              <div className="space-y-2 pt-2">
                <label className="text-sm font-semibold">Arquivo de Backup (.json)</label>
                <div className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/30 transition-colors relative group">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {selectedFile ? (
                    <div className="space-y-2">
                      <FileJson className="w-8 h-8 text-blue-500 mx-auto" />
                      <div>
                        <p className="text-xs font-bold truncate max-w-[280px]">{selectedFile.name}</p>
                        <p className="text-[10px] text-muted-foreground">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors mx-auto" />
                      <div>
                        <p className="text-xs font-semibold">Clique para selecionar</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Apenas arquivos do tipo JSON gerados pelo FinanSys</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Security confirmation for Replace Mode */}
              {importMode === "replace" && showConfirmInput && selectedFile && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 space-y-3">
                  <div className="flex gap-2 text-red-600 dark:text-red-400">
                    <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold">Confirmação de Segurança Exigida</h4>
                      <p className="text-[10px] leading-relaxed mt-0.5">
                        Esta operação irá apagar permanentemente todas as suas receitas, despesas, clientes, fornecedores e conversas do sistema. Não há como desfazer isso.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                      Digite <span className="text-red-600 font-bold">SUBSTITUIR</span> para prosseguir:
                    </label>
                    <input
                      type="text"
                      value={confirmWord}
                      onChange={(e) => setConfirmWord(e.target.value)}
                      placeholder="SUBSTITUIR"
                      className="w-full text-xs font-bold px-3 py-2 border border-red-500/30 bg-background rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isImporting || !selectedFile || (importMode === "replace" && confirmWord !== "SUBSTITUIR")}
                className={`w-full mt-2 font-semibold ${
                  importMode === "replace" 
                    ? "bg-red-600 hover:bg-red-700 text-white" 
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Restaurando dados...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Confirmar Restauração
                  </>
                )}
              </Button>

            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

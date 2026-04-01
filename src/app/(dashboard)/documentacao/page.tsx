"use client";

import { useState } from "react";
import { 
  FileText, 
  Key, 
  User, 
  Banknote, 
  Users, 
  LayoutDashboard, 
  MessageSquare, 
  Settings,
  ChevronRight,
  Code2,
  Lock,
  Globe,
  Truck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const sections = [
  { id: "auth", title: "Autenticação", icon: Key },
  { id: "profile", title: "Perfil e Usuário", icon: User },
  { id: "finance", title: "Gestão Financeira", icon: Banknote },
  { id: "customers", title: "Gestão de Clientes", icon: Users },
  { id: "suppliers", title: "Gestão de Fornecedores", icon: Truck },
  { id: "dashboard", title: "Relatórios e Stats", icon: LayoutDashboard },
  { id: "messages", title: "Sistema de Chat", icon: MessageSquare },
  { id: "admin", title: "Administração", icon: Settings },
];

const apiDocs = {
  auth: {
    title: "Autenticação",
    description: "Todas as rotas exigem autenticação (exceto login/registro). O sistema suporta Sessão de Navegador e JWT Bearer Token.",
    endpoints: [
      { method: "POST", path: "/api/auth/login", desc: "Autentica o usuário e retorna o Token JWT." },
      { method: "POST", path: "/api/auth/register", desc: "Cria uma nova conta e envia código de ativação." },
      { method: "POST", path: "/api/auth/verify-email", desc: "Valida o e-mail utilizando o código de 6 dígitos." },
      { method: "POST", path: "/api/auth/forgot-password", desc: "Solicita recuperação de senha por e-mail." },
      { method: "POST", path: "/api/auth/reset-password", desc: "Redefine a senha com o código validado." },
    ]
  },
  profile: {
    title: "Perfil e Usuário",
    description: "Gerenciamento dos dados da conta pessoal do usuário.",
    endpoints: [
      { method: "GET", path: "/api/users/profile", desc: "Retorna os dados do perfil logado." },
      { method: "PATCH", path: "/api/users/profile", desc: "Atualiza nome, username ou foto de perfil." },
    ]
  },
  finance: {
    title: "Gestão Financeira",
    description: "Endpoints para controle de Receitas e Despesas, incluindo consolidação e parcelamento.",
    endpoints: [
      { method: "GET", path: "/api/receitas", desc: "Lista receitas com filtros de data." },
      { method: "POST", path: "/api/receitas", desc: "Cria uma nova entrada financeira." },
      { method: "PUT", path: "/api/receitas", desc: "Atualiza ou consolida uma receita (suporta parcelamento)." },
      { method: "DELETE", path: "/api/receitas", desc: "Remove uma transação específica." },
      { method: "GET", path: "/api/despesas", desc: "Lista todas as saídas financeiras." },
    ]
  },
  customers: {
    title: "Gestão de Clientes",
    description: "Controle de clientes, suporte a CPF/CNPJ e limites de crédito.",
    endpoints: [
      { method: "GET", path: "/api/clientes", desc: "Lista todos os clientes vinculados." },
      { method: "POST", path: "/api/clientes", desc: "Cadastra cliente (suporta auto-preenchimento CNPJ)." },
      { method: "PUT", path: "/api/clientes", desc: "Atualiza dados ou status (ativo/desativado)." },
      { method: "DELETE", path: "/api/clientes", desc: "Alterna status de ativação do cliente." },
    ]
  },
  suppliers: {
    title: "Gestão de Fornecedores",
    description: "Controle de fornecedores e suas despesas vinculadas.",
    endpoints: [
      { method: "GET", path: "/api/fornecedores", desc: "Lista fornecedores com saldo de débito calculado." },
      { method: "POST", path: "/api/fornecedores", desc: "Cadastra fornecedor com suporte a CPF/CNPJ." },
      { method: "PUT", path: "/api/fornecedores", desc: "Atualiza dados do fornecedor." },
      { method: "DELETE", path: "/api/fornecedores", desc: "Ativa ou desativa um fornecedor." },
      { method: "GET", path: "/api/fornecedores/despesas", desc: "Busca despesas planejadas de um fornecedor específico." },
    ]
  },
  dashboard: {
    title: "Relatórios e Stats",
    description: "Dados agregados para visualização de performance financeira.",
    endpoints: [
      { method: "GET", path: "/api/dashboard/stats", desc: "Estatísticas mensais, balanço e histórico de 6 meses." },
      { method: "POST", path: "/api/relatorios/email", desc: "Envia resumo via e-mail configurado." },
    ]
  },
  messages: {
    title: "Sistema de Chat",
    description: "Comunicação interna em tempo real via Socket.io e API.",
    endpoints: [
      { method: "GET", path: "/api/messages", desc: "Histórico de mensagens entre usuários." },
      { method: "POST", path: "/api/messages", desc: "Envia mensagem de texto convencional." },
      { method: "POST", path: "/api/messages/delete", desc: "Exclusão de mensagem (até 120 segundos após envio)." },
      { method: "GET", path: "/api/messages/conversations", desc: "Lista de conversas ativas." },
    ]
  },
  admin: {
    title: "Administração",
    description: "Acesso restrito a usuários com privilégios administrativos.",
    endpoints: [
      { method: "GET", path: "/api/admin/config", desc: "Lista parâmetros do sistema (SMTP, SMTP, etc)." },
      { method: "PATCH", path: "/api/admin/config", desc: "Atualiza chaves de configuração globais." },
      { method: "GET", path: "/api/admin/users", desc: "Listagem gerencial de todos os usuários." },
    ]
  }
};

const MethodBadge = ({ method }: { method: string }) => {
  const colors: Record<string, string> = {
    GET: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    POST: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    PUT: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    PATCH: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    DELETE: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  };
  return (
    <Badge variant="outline" className={cn("font-bold min-w-[60px] justify-center", colors[method] || "bg-zinc-100 text-zinc-600")}>
      {method}
    </Badge>
  );
};

export default function DocumentacaoPage() {
  const [activeSection, setActiveSection] = useState("auth");

  const currentDoc = (apiDocs as any)[activeSection];

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2 mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Documentação da API</h2>
          <p className="text-muted-foreground">Guia técnico para integrações e desenvolvimento.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Local */}
        <div className="space-y-1">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md ring-1 ring-primary/20" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "text-muted-foreground/60 group-hover:text-primary")} />
                  {section.title}
                </div>
                {isActive && <ChevronRight className="h-4 w-4" />}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="md:col-span-3 space-y-6">
          <div className="bg-card p-6 rounded-xl border shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b pb-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold">{currentDoc.title}</h3>
            </div>
            
            <p className="text-sm text-muted-foreground leading-relaxed">
              {currentDoc.description}
            </p>

            <div className="space-y-3 pt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Endpoints</h4>
              <div className="divide-y border rounded-lg overflow-hidden bg-muted/20">
                {currentDoc.endpoints.map((endpoint: any, idx: number) => (
                  <div key={idx} className="p-3 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3 mb-1">
                      <MethodBadge method={endpoint.method} />
                      <code className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-900 dark:text-zinc-100">
                        {endpoint.path}
                      </code>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 pl-[72px]">
                      {endpoint.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {activeSection === "auth" && (
              <div className="mt-8 space-y-4">
                <div className="p-4 rounded-xl bg-zinc-900 text-zinc-100 space-y-3 font-mono text-xs border border-zinc-700 shadow-inner">
                  <div className="flex justify-between items-center text-zinc-500 pb-2 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                      <Lock className="w-3 h-3" /> Exemplo de Cabeçalho
                    </div>
                    <Badge variant="outline" className="text-[9px] border-zinc-700 text-zinc-400">HTTP</Badge>
                  </div>
                  <div className="space-y-1">
                    <p><span className="text-purple-400">Authorization:</span> Bearer {'<'}SEU_TOKEN_JWT_AQUI{'>'}</p>
                    <p><span className="text-purple-400">Content-Type:</span> application/json</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 text-xs">
                  <Globe className="w-4 h-4 flex-shrink-0" />
                  <span>Para acesso via navegador, os cookies de sessão são gerenciados automaticamente pelo NextAuth.</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-muted/30 p-6 rounded-xl border border-dashed flex flex-col items-center justify-center text-center space-y-2">
            <Code2 className="h-6 w-6 text-muted-foreground/40" />
            <h4 className="text-sm font-semibold">Precisa de mais detalhes?</h4>
            <p className="text-xs text-muted-foreground max-w-xs">
              Consulte os arquivos internos em <code className="bg-muted px-1 rounded">/docs</code> para especificações de modelos e payloads.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

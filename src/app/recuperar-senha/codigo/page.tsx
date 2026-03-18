import { Metadata } from "next";
import { Suspense } from "react";
import VerifyCodeForm from "./verify-code-form";

export const metadata: Metadata = {
  title: "Verificar Código | FinanSys",
  description: "Digite o código recebido por email",
};

export default function VerifyCodePage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Carregando formulário...</div>}>
      <VerifyCodeForm />
    </Suspense>
  );
}

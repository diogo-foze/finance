import { Metadata } from "next";
import { Suspense } from "react";
import NewPasswordForm from "./new-password-form";

export const metadata: Metadata = {
  title: "Nova Senha | FinanSys",
  description: "Crie uma nova senha",
};

export default function NewPasswordPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Carregando formulário...</div>}>
      <NewPasswordForm />
    </Suspense>
  );
}

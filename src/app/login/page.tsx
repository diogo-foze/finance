import { Metadata } from "next";
import { Suspense } from "react";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Login | FinanSys",
  description: "Faça login no FinanSys",
};

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
      <Suspense fallback={<div>Carregando...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

import { Metadata } from "next";
import RegisterForm from "./register-form";

export const metadata: Metadata = {
  title: "Cadastro | FinanSys",
  description: "Crie sua conta no FinanSys",
};

export default function RegisterPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
      <RegisterForm />
    </div>
  );
}

import { Metadata } from "next";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Login | FinanSys",
  description: "Faça login no FinanSys",
};

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
      <LoginForm />
    </div>
  );
}

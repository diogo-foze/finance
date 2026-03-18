import { Metadata } from "next";
import ForgotPasswordForm from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Recuperar Senha | FinanSys",
  description: "Solicite um código de recuperação",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}

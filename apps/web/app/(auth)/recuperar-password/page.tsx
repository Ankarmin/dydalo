import type { Metadata } from "next";
import { RecoverPasswordForm } from "@/components/auth/recover-password-form";

export const metadata: Metadata = {
  title: "Recuperar Contraseña",
};

export default function RecoverPasswordPage() {
  return <RecoverPasswordForm />;
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { showRecoveryEmailToast } from "@/components/auth/auth-toast";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/lib/utils/routes";

export function RecoverPasswordForm() {
  const [sent, setSent] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: "" },
  });

  function onSubmit() {
    setIsPending(true);

    setTimeout(() => {
      showRecoveryEmailToast();
      setSent(true);
      setIsPending(false);
    }, 1500);
  }

  if (sent) {
    return (
      <div className="space-y-6 text-center">
        <Mail className="mx-auto size-12 text-accent" strokeWidth={1.5} />
        <div>
          <h1 className="text-2xl font-bold tracking-heading">
            REVISA TU EMAIL
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Te enviamos un link para restablecer tu contraseña. Si no lo ves,
            revisa tu carpeta de spam.
          </p>
        </div>
        <Button variant="outline" className="w-full" onClick={() => setSent(false)}>
          Reenviar email
        </Button>
        <Link
          href={ROUTES.login}
          className="inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-accent"
        >
          <ArrowLeft className="size-4" />
          Volver al inicio de sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-heading">
          RECUPERAR CONTRASEÑA
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ingresa tu email y te enviaremos un link para restablecerla.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="tu@email.com"
                    autoComplete="email"
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Mail className="size-4" />
            )}
            ENVIAR LINK
          </Button>
        </form>
      </Form>

      <Link
        href={ROUTES.login}
        className="inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-accent"
      >
        <ArrowLeft className="size-4" />
        Volver al inicio de sesión
      </Link>
    </div>
  );
}

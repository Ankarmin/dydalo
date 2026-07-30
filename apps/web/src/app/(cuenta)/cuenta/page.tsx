"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail, Pencil, Phone, Save, ShieldCheck, User, X } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import {
  changePasswordSchema,
  profileSchema,
  type ChangePasswordInput,
  type ProfileInput,
} from "@/lib/validations/auth";
import { getUserFirstName, getUserLastName } from "@/lib/utils/user-name";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageBreadcrumbs } from "@/components/breadcrumbs/page-breadcrumbs";
import { ROUTES } from "@/lib/utils/routes";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { notifyAdmin } from "@/components/admin/admin-toast";

export default function CuentaPage() {
  const { state, actions } = useAuth();
  const [editingProfile, setEditingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [profilePending, setProfilePending] = useState(false);
  const [passwordPending, setPasswordPending] = useState(false);

  const user = state.user;

  const profileForm = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user ? getUserFirstName(user) : "",
      lastName: user ? getUserLastName(user) : "",
      phone: user?.phone ?? "",
    },
  });

  const passwordForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!user) return;
    profileForm.reset({
      firstName: getUserFirstName(user),
      lastName: getUserLastName(user),
      phone: user.phone ?? "",
    });
  }, [profileForm, user]);

  async function saveProfile(values: ProfileInput) {
    setProfilePending(true);
    const result = await actions.updateProfile(values);
    setProfilePending(false);

    if (result.success) {
      setEditingProfile(false);
      notifyAdmin("Perfil actualizado", "Tus datos fueron guardados", "success");
    } else {
      notifyAdmin("Error", result.error, "error");
    }
  }

  async function savePassword(values: ChangePasswordInput) {
    setPasswordPending(true);
    const result = await actions.changePassword(values.currentPassword, values.newPassword);
    setPasswordPending(false);

    if (result.success) {
      setChangingPassword(false);
      passwordForm.reset();
      notifyAdmin("Contraseña actualizada", "Ya puedes usar tu nueva contraseña", "success");
    } else {
      passwordForm.setError("currentPassword", { message: result.error });
    }
  }

  return (
    <div className="space-y-8 pt-4">
      <PageBreadcrumbs
        className="mb-0"
        items={[
          { label: "Home", href: ROUTES.home },
          { label: "Mi cuenta" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold tracking-heading">MI PERFIL</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Edita tus datos personales y la seguridad de tu cuenta.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base font-bold uppercase tracking-[0.1em]">
              Datos personales
            </CardTitle>
            <CardDescription>
              El email se mantiene fijo por ahora para evitar conflictos de acceso.
            </CardDescription>
          </div>
          {!editingProfile && (
            <Button variant="outline" size="sm" onClick={() => setEditingProfile(true)}>
              <Pencil className="size-3.5" />
              Editar datos
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {editingProfile ? (
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(saveProfile)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={profileForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombres</FormLabel>
                        <FormControl>
                          <Input {...field} autoComplete="given-name" disabled={profilePending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apellidos</FormLabel>
                        <FormControl>
                          <Input {...field} autoComplete="family-name" disabled={profilePending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={profileForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input {...field} type="tel" autoComplete="tel" disabled={profilePending} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{user?.email ?? "—"}</p>
                </div>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={profilePending}
                    onClick={() => {
                      if (user) {
                        profileForm.reset({
                          firstName: getUserFirstName(user),
                          lastName: getUserLastName(user),
                          phone: user.phone ?? "",
                        });
                      }
                      setEditingProfile(false);
                    }}
                  >
                    <X className="size-3.5" />
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={profilePending}>
                    <Save className="size-3.5" />
                    Guardar cambios
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <User className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Nombres</p>
                  <p className="text-sm text-muted-foreground">
                    {user ? getUserFirstName(user) : "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Apellidos</p>
                  <p className="text-sm text-muted-foreground">
                    {user ? getUserLastName(user) || "—" : "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Teléfono</p>
                  <p className="text-sm text-muted-foreground">{user?.phone ?? "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{user?.email ?? "—"}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base font-bold uppercase tracking-[0.1em]">
              Seguridad
            </CardTitle>
            <CardDescription>
              Actualiza tu contraseña para mantener tu cuenta protegida.
            </CardDescription>
          </div>
          {!changingPassword && (
            <Button variant="outline" size="sm" onClick={() => setChangingPassword(true)}>
              <Lock className="size-3.5" />
              Cambiar contraseña
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {changingPassword ? (
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(savePassword)} className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña actual</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" autoComplete="current-password" disabled={passwordPending} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nueva contraseña</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" autoComplete="new-password" disabled={passwordPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar nueva contraseña</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" autoComplete="new-password" disabled={passwordPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={passwordPending}
                    onClick={() => {
                      passwordForm.reset();
                      setChangingPassword(false);
                    }}
                  >
                    <X className="size-3.5" />
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={passwordPending}>
                    <Save className="size-3.5" />
                    Actualizar contraseña
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4">
              <ShieldCheck className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Contraseña activa</p>
                <p className="text-sm text-muted-foreground">
                  Puedes cambiar tu contraseña cuando lo necesites. Usa una clave segura y distinta a la anterior.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

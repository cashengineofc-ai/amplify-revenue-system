import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) return { user: data.user };

    // Acesso livre para testes: cria uma sessão de convidado automaticamente.
    const { data: guest, error: guestError } = await supabase.auth.signInAnonymously();
    if (guestError || !guest.user) throw redirect({ to: "/auth" });
    return { user: guest.user };
  },

  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});

import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/admin")({
  component: () => (
    <AppShell admin>
      <Outlet />
    </AppShell>
  ),
});

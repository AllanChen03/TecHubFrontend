import { Outlet, createRootRoute, HeadContent, Scripts, useNavigate, useLocation, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { AuthProvider } from "../lib/auth";
import { Toaster } from "@/components/ui/sonner";
import appCss from "../styles.css?url";

// 1. LA PANTALLA 404 (Que habíamos borrado accidentalmente)
function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página no encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">La página que buscas no existe o fue movida.</p>
        <div className="mt-6">
          <Link to="/app" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Volver al catálogo
          </Link>
        </div>
      </div>
    </div>
  );
}

// 2. CONECTAMOS LA PANTALLA 404 A LA RAÍZ
export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "TecHub — Marketplace TEC" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent, // <-- AQUÍ LA RECONECTAMOS
});

// 3. EL ESQUELETO Y EL GUARDIA (Intactos)
function RootComponent() {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        <AuthProvider>
          <RouteGuard />
          <Outlet />
          <Toaster />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}

function RouteGuard() {
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('techub_token');
    const isPublic = ["/", "/login", "/register", "/forgot"].includes(loc.pathname);

    if (!token && !isPublic) {
      nav({ to: "/login" });
    }
  }, [loc.pathname, nav]);

  return null;
}
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ShoppingBag, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import techubHero from "@/assets/techub-hero.png";
import { API_URL } from "@/lib/config";

// 👇 IMPORTAMOS NUESTRO CONTEXTO DE AUTENTICACIÓN
import { useAuth } from "@/lib/auth"; 

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  // 👇 EXTRAEMOS LA FUNCIÓN LOGIN DEL CONTEXTO
  const { login } = useAuth(); 
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const respuesta = await fetch(`${API_URL}/usuarios/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await respuesta.json();

      if (!respuesta.ok) {
        toast.error(data.error || "Error al iniciar sesión");
        return;
      }

      // Validamos que el backend sí nos haya mandado el token y los datos del usuario
      if (!data.token || !data.user) {
        toast.error("El servidor devolvió información incompleta");
        return;
      }

      // 1. Guardamos todo de golpe usando nuestra función de auth.tsx
      login(data.token, data.user);

      toast.success("¡Inicio de sesión exitoso!");

      // 2. Redirección Inteligente basándonos en el rol que nos mandó el backend
      // En el backend lo configuramos para que envíe "admin" o "estudiante"
      if (data.user.rol === 'admin' || data.user.rol === 1) {
        await nav({ to: "/admin", replace: true });
      } else {
        await nav({ to: "/app", replace: true });
      }

    } catch (error) {
      console.error("Error conectando con el servidor:", error);
      toast.error("Error de conexión. Verifica que el backend esté corriendo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="flex items-center justify-center p-4 lg:p-8 lg:order-1 order-2">
        <Card className="w-full max-w-md p-8 shadow-lg">
          <img src={techubHero} alt="TecHub" className="lg:hidden w-40 mx-auto mb-4" />
          <div className="flex items-center justify-center gap-2 text-primary font-bold text-2xl mb-6">
            <ShoppingBag className="size-7" aria-hidden="true" />
            <h1>Inicio de sesión</h1>
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                  // [+] Le avisa a NVDA si la contraseña está visible o no
                  aria-describedby="password-toggle-hint"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  // [+] NVDA leerá: "Mostrar contraseña, botón" o "Ocultar contraseña, botón"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  // [+] Le indica a NVDA el estado actual (presionado = visible)
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gray-700"
                >
                  {showPassword
                    ? <Eye className="size-4" aria-hidden="true" />
                    : <EyeOff className="size-4" aria-hidden="true" />
                  }
                </button>
                {/* [+] Texto oculto visualmente pero leído por NVDA */}
                <span id="password-toggle-hint" className="sr-only">
                  {showPassword ? "La contraseña está visible" : "La contraseña está oculta"}
                </span>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Ingresando..." : "Iniciar sesión"}
            </Button>
            <div className="flex justify-between text-sm pt-2">
              <Link to="/forgot" className="text-primary hover:underline">
                ¿Olvidó su contraseña?
              </Link>
              <Link to="/register" className="text-primary hover:underline">
                Crear cuenta
              </Link>
            </div>
          </form>
        </Card>
      </div>
      <div className="hidden lg:flex bg-background items-center justify-center p-8">
        <div className="text-center max-w-md">
          <img
            src={techubHero}
            alt="TecHub - Marketplace estudiantil del TEC"
            className="w-full h-auto"
          />
        </div>
      </div>
    </div>
  );
}
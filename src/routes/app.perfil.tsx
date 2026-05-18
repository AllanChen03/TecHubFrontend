import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Settings, Star, User, Mail, Phone, Lock, ArrowLeft, Save, Trash2, Eye, EyeOff} from "lucide-react";
import { API_URL } from "@/lib/config";

export const Route = createFileRoute("/app/perfil")({
  component: PerfilPage,
});

function PerfilPage() {
  const { user, updateUser, deleteUser, logout } = useAuth();
  const nav = useNavigate();
  
  const [view, setView] = useState<"ver" | "editar" | "password">("ver");
  const [isLoading, setIsLoading] = useState(false);

  // Estado para los datos del perfil (Incluye el email editable)
  const [f, setF] = useState({
    nombre: "", 
    apellidos: "", 
    email: "",
    telefono: ""
  });

  // Estado para el cambio de contraseña
  const [passForm, setPassForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Estado para la valoración real
  const [valoracion, setValoracion] = useState<{ promedio: number | null; total: number }>({ promedio: null, total: 0 });

  // Estado para valoracion como comprador
  const [valoracionComprador, setValoracionComprador] = useState<{ promedio: number | null }>({ promedio: null });

  // Fetch ambas valoraciones
  useEffect(() => {
    const fetchValoraciones = async () => {
      try {
        const token = localStorage.getItem('techub_token');
        const headers = { Authorization: `Bearer ${token}` };
        const [resVendedor, resComprador] = await Promise.all([
          fetch(`${API_URL}/usuarios/mi-valoracion`, { headers }),
          fetch(`${API_URL}/usuarios/mi-valoracion-comprador`, { headers }),
        ]);
        if (resVendedor.ok) setValoracion(await resVendedor.json());
        if (resComprador.ok) setValoracionComprador(await resComprador.json());
      } catch { /* silencioso */ }
    };
    fetchValoraciones();
  }, []);

  // Sincronizar datos del usuario con el estado local
  useEffect(() => {
    if (user) {
      const nombreReal = user.nombre || user.Nombre || "";
      const apellidosReal = user.apellidos || user.Apellidos || "";
      const emailReal = user.email || user.Email || "";
      const telReal = user.telefono || user.Telefono || "";

      setF({
        nombre: nombreReal,
        apellidos: apellidosReal,
        email: emailReal,
        telefono: telReal.replace("+506", "") // Quitamos prefijo para el input
      });
    }
  }, [user]);

  if (!user) return <div className="p-20 text-center">Cargando perfil...</div>;

  const handleGuardarPerfil = async () => {
    // Validaciones de negocio
    if (f.telefono.length !== 8) return toast.error("El teléfono debe tener 8 dígitos");
    if (!f.email.endsWith('@estudiantec.cr')) {
      return toast.error("El correo debe ser institucional (@estudiantec.cr)");
    }
    
    setIsLoading(true);
    try {
      await updateUser(user.id, {
        nombre: f.nombre,
        apellidos: f.apellidos,
        email: f.email,
        telefono: `+506${f.telefono}`
      });
      toast.success("¡Información actualizada!");
      setView("ver");
    } catch (err) {
      toast.error("Error al actualizar los datos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) {
      return toast.error("La nueva contraseña no coincide");
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/usuarios/${user.id}/password`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('techub_token')}`
        },
        body: JSON.stringify({
          oldPassword: passForm.oldPassword,
          newPassword: passForm.newPassword
        })
      });

      if (res.ok) {
        toast.success("Contraseña actualizada exitosamente");
        setPassForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
        setView("editar"); // Regresamos al panel de configuración
      } else {
        const d = await res.json();
        toast.error(d.error || "Error al cambiar la contraseña");
      }
    } catch (error) {
      toast.error("Error de conexión con el servidor");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-xl mx-auto p-6 mt-8 shadow-sm border-t-4 border-t-primary">
      {/* CABECERA DINÁMICA */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            {view === "ver" && "Mi Perfil"}
            {view === "editar" && "Configuración"}
            {view === "password" && "Seguridad"}
          </h1>
        </div>
        {view === "ver" && (
          <Button variant="ghost" size="icon" onClick={() => setView("editar")} className="hover:bg-primary/10">
            <Settings className="size-6 text-muted-foreground hover:text-primary" />
          </Button>
        )}
      </div>

      {/* 1. VISTA DE CONSULTA (Lo que todos ven) */}
      {view === "ver" && (
        <div className="space-y-6">
          {/* Valoraciones: vendedor y comprador */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 bg-yellow-50/50 rounded-lg border border-yellow-100">
              <Star className="size-6 text-yellow-500 fill-yellow-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-yellow-700 font-bold uppercase tracking-wider">Vendedor</p>
                <p className="text-xl font-black">
                  {valoracion.promedio !== null ? valoracion.promedio.toFixed(1) : "—"}
                  <span className="text-xs font-normal text-muted-foreground"> / 5.0</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
              <Star className="size-6 text-blue-500 fill-blue-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-blue-700 font-bold uppercase tracking-wider">Comprador</p>
                <p className="text-xl font-black">
                  {valoracionComprador.promedio !== null ? valoracionComprador.promedio.toFixed(1) : "—"}
                  <span className="text-xs font-normal text-muted-foreground"> / 5.0</span>
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b pb-2">
              <User className="size-4 text-primary" />
              <p className="text-sm"><strong>Nombre:</strong> {user.nombre || user.Nombre} {user.apellidos || user.Apellidos}</p>
            </div>
            <div className="flex items-center gap-3 border-b pb-2">
              <Mail className="size-4 text-primary" />
              <p className="text-sm"><strong>Correo:</strong> {user.email || user.Email}</p>
            </div>
            <div className="flex items-center gap-3 border-b pb-2">
              <Phone className="size-4 text-primary" />
              <p className="text-sm"><strong>WhatsApp:</strong> {user.telefono || user.Telefono || "No registrado"}</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. VISTA DE CONFIGURACIÓN (Editar datos y botones de acción) */}
      {view === "editar" && (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input value={f.nombre} onChange={e => setF({...f, nombre: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Apellidos</Label>
                <Input value={f.apellidos} onChange={e => setF({...f, apellidos: e.target.value})} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Correo Institucional</Label>
              <Input type="email" value={f.email} onChange={e => setF({...f, email: e.target.value})} />
            </div>

            <div className="space-y-2">
              <Label>Teléfono WhatsApp</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 bg-muted text-sm">+506</span>
                <Input className="rounded-l-none" maxLength={8} value={f.telefono} onChange={e => setF({...f, telefono: e.target.value})} />
              </div>
            </div>
          </div>

          {/* Acciones de Cuenta */}
          <div className="pt-4 border-t space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Zona de Seguridad</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => setView("password")} className="flex-1 gap-2">
                <Lock className="size-4" /> Cambiar Contraseña
              </Button>
              
              {/* 👇 AQUÍ ESTÁ EL BOTÓN DE ELIMINAR CORREGIDO 👇 */}
              <Button type="button" variant="destructive" className="flex-1 gap-2" onClick={async () => {
                if(confirm("¿Estás seguro de que deseas eliminar tu cuenta? Esta acción es permanente.")) {
                  try {
                    await deleteUser(user.id); // Esperamos a que el backend procese la eliminación
                    logout(); // Si sale bien, borramos los datos locales
                    nav({to: "/login"}); // Lo mandamos al login
                  } catch (error: any) {
                    // Si el backend da error (ej: el usuario tiene productos ligados), lo mostramos en pantalla
                    toast.error(error.message || "Error al intentar eliminar la cuenta");
                  }
                }
              }}>
                <Trash2 className="size-4" /> Eliminar Cuenta
              </Button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setView("ver")} className="flex-1">Cancelar</Button>
            <Button onClick={handleGuardarPerfil} disabled={isLoading} className="flex-1 gap-2">
              <Save className="size-4" /> {isLoading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </div>
      )}

      {/* 3. VISTA DE CAMBIO DE CONTRASEÑA */}
      {view === "password" && (
        <form onSubmit={handleCambiarPassword} className="space-y-4">
          <div className="space-y-2">
            <Label>Contraseña Actual</Label>
            <div className="relative">
              <Input type={showOld ? "text" : "password"} required value={passForm.oldPassword} onChange={e => setPassForm({...passForm, oldPassword: e.target.value})} className="pr-10" />
              <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gray-700">
                {showOld ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Nueva Contraseña</Label>
            <div className="relative">
              <Input type={showNew ? "text" : "password"} required value={passForm.newPassword} onChange={e => setPassForm({...passForm, newPassword: e.target.value})} className="pr-10" />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gray-700">
                {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Confirmar Nueva Contraseña</Label>
            <div className="relative">
              <Input type={showConfirm ? "text" : "password"} required value={passForm.confirmPassword} onChange={e => setPassForm({...passForm, confirmPassword: e.target.value})} className="pr-10" />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gray-700">
                {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setView("editar")} className="flex-1 gap-2">
              <ArrowLeft className="size-4" /> Volver
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Actualizando..." : "Actualizar"}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
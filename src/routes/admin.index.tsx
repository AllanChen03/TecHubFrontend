import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { API_URL } from "@/lib/config";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Shield, User, Eye, Pencil, Trash2, X, Search, AlertTriangle, Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

interface Usuario {
  UsuarioID: number;
  Nombre: string;
  Apellidos: string;
  Email: string;
  Telefono: string;
  RolID: number;
  verificado: boolean | number;
}

// [+] Tipo para modal de confirmación de eliminación
interface ConfirmEliminar {
  id: number;
  nombre: string;
}

function AdminDashboard() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  // Modal ver/editar
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoModal, setModoModal] = useState<"ver" | "editar">("ver");
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);
  const [procesando, setProcesando] = useState(false);

  // [+] Modal de confirmación de eliminación
  const [confirmEliminar, setConfirmEliminar] = useState<ConfirmEliminar | null>(null);
  const [eliminando, setEliminando] = useState(false);

  // Refs para focus trap
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLDivElement>(null);
  const botonAbrirRef = useRef<HTMLButtonElement | null>(null);
  const botonEliminarRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => { cargarUsuarios(); }, []);

  // [+] Foco en modal ver/editar
  useEffect(() => {
    if (modalAbierto) {
      setTimeout(() => {
        modalRef.current?.querySelector<HTMLElement>("[data-modal-title]")?.focus();
      }, 50);
    } else {
      botonAbrirRef.current?.focus();
    }
  }, [modalAbierto]);

  // [+] Foco en modal confirmación eliminación
  useEffect(() => {
    if (confirmEliminar) {
      setTimeout(() => {
        confirmRef.current?.querySelector<HTMLElement>("[data-confirm-title]")?.focus();
      }, 50);
    } else {
      botonEliminarRef.current?.focus();
    }
  }, [confirmEliminar]);

  // [+] Focus trap modal ver/editar
  const handleModalKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") { setModalAbierto(false); return; }
    if (e.key !== "Tab") return;
    const enfocables = modalRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!enfocables || enfocables.length === 0) return;
    const primero = enfocables[0];
    const ultimo = enfocables[enfocables.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
    } else {
      if (document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
    }
  };

  // [+] Focus trap modal confirmación
  const handleConfirmKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") { setConfirmEliminar(null); return; }
    if (e.key !== "Tab") return;
    const enfocables = confirmRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!enfocables || enfocables.length === 0) return;
    const primero = enfocables[0];
    const ultimo = enfocables[enfocables.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
    } else {
      if (document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
    }
  };

  const cargarUsuarios = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/usuarios`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("techub_token")}` },
      });
      if (!res.ok) throw new Error("No se pudieron cargar los usuarios");
      setUsuarios(await res.json());
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setCargando(false);
    }
  };

  // [+] Pide confirmación antes de eliminar
  const pedirConfirmacionEliminar = (id: number, nombre: string, boton: HTMLButtonElement) => {
    botonEliminarRef.current = boton;
    setConfirmEliminar({ id, nombre });
  };

  // [+] Ejecuta la eliminación tras confirmar
  const confirmarEliminar = async () => {
    if (!confirmEliminar) return;
    setEliminando(true);
    try {
      const res = await fetch(`${API_URL}/admin/usuarios/${confirmEliminar.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("techub_token")}` },
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Error al eliminar");
      }
      toast.success("Usuario eliminado correctamente");
      setConfirmEliminar(null);
      cargarUsuarios();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setEliminando(false);
    }
  };

  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioSeleccionado) return;
    setProcesando(true);
    try {
      const res = await fetch(`${API_URL}/admin/usuarios/${usuarioSeleccionado.UsuarioID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("techub_token")}`
        },
        body: JSON.stringify({
          nombre: usuarioSeleccionado.Nombre,
          apellidos: usuarioSeleccionado.Apellidos,
          email: usuarioSeleccionado.Email,
          rolID: usuarioSeleccionado.RolID
        })
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Error al actualizar");
      }
      toast.success("Usuario actualizado correctamente");
      setModalAbierto(false);
      cargarUsuarios();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setProcesando(false);
    }
  };

  const abrirModal = (u: Usuario, modo: "ver" | "editar", boton: HTMLButtonElement) => {
    botonAbrirRef.current = boton;
    setUsuarioSeleccionado({ ...u });
    setModoModal(modo);
    setModalAbierto(true);
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    const termino = busqueda.toLowerCase();
    return `${u.Nombre} ${u.Apellidos}`.toLowerCase().includes(termino) ||
      u.Email.toLowerCase().includes(termino);
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Users className="size-8 text-primary" aria-hidden="true" />
          <h1 className="text-3xl font-bold text-gray-800">Gestión de Usuarios</h1>
        </div>

        {/* [+] aria-label en el buscador */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" aria-hidden="true" />
          <Input
            placeholder="Buscar por nombre o correo..."
            className="pl-9 w-full bg-white"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            aria-label="Buscar usuario por nombre o correo"
            // [+] Anuncia cuántos resultados hay al escribir
            aria-describedby="resultados-busqueda"
          />
        </div>
      </div>

      {/* [+] Anuncio de resultados para NVDA */}
      <p id="resultados-busqueda" className="sr-only" aria-live="polite" aria-atomic="true">
        {busqueda
          ? `${usuariosFiltrados.length} ${usuariosFiltrados.length === 1 ? "usuario encontrado" : "usuarios encontrados"} para "${busqueda}"`
          : `${usuariosFiltrados.length} usuarios en total`
        }
      </p>

      <Card className="p-0 overflow-hidden shadow-sm">
        {cargando ? (
          <div className="p-10 text-center text-gray-500" aria-live="polite" aria-busy="true">
            Cargando usuarios...
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* [+] caption describe la tabla a NVDA */}
            <table className="w-full text-left border-collapse" aria-label="Lista de usuarios del sistema">
              <caption className="sr-only">
                Tabla de gestión de usuarios. {usuariosFiltrados.length} usuarios mostrados.
              </caption>
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th scope="col" className="p-4 font-semibold text-gray-600">ID</th>
                  <th scope="col" className="p-4 font-semibold text-gray-600">Nombre</th>
                  <th scope="col" className="p-4 font-semibold text-gray-600">Correo</th>
                  <th scope="col" className="p-4 font-semibold text-gray-600 text-center">Rol</th>
                  <th scope="col" className="p-4 font-semibold text-gray-600 text-center">Estado</th>
                  <th scope="col" className="p-4 font-semibold text-gray-600 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {usuariosFiltrados.map((u) => (
                  <tr key={u.UsuarioID} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-gray-500">#{u.UsuarioID}</td>
                    <td className="p-4 font-medium text-gray-900">{u.Nombre} {u.Apellidos}</td>
                    <td className="p-4 text-gray-600">{u.Email}</td>
                    <td className="p-4 text-center">
                      {u.RolID === 1 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <Shield className="size-3" aria-hidden="true" /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <User className="size-3" aria-hidden="true" /> Estudiante
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {u.verificado ? (
                        <span className="text-green-600 font-medium text-sm">Verificado</span>
                      ) : (
                        <span className="text-yellow-600 font-medium text-sm">Pendiente</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        {/* [+] aria-label descriptivo con nombre del usuario */}
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          aria-label={`Ver detalles de ${u.Nombre} ${u.Apellidos}`}
                          onClick={(e) => abrirModal(u, "ver", e.currentTarget)}
                        >
                          <Eye className="size-4" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          aria-label={`Editar usuario ${u.Nombre} ${u.Apellidos}`}
                          onClick={(e) => abrirModal(u, "editar", e.currentTarget)}
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          aria-label={`Eliminar usuario ${u.Nombre} ${u.Apellidos}`}
                          onClick={(e) => pedirConfirmacionEliminar(u.UsuarioID, `${u.Nombre} ${u.Apellidos}`, e.currentTarget)}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

                {usuariosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      {busqueda !== ""
                        ? `No se encontró a nadie con "${busqueda}"`
                        : "No hay usuarios registrados en el sistema."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* MODAL VER / EDITAR */}
      {modalAbierto && usuarioSeleccionado && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-usuario-titulo"
          ref={modalRef}
          onKeyDown={handleModalKeyDown}
        >
          <Card className="w-full max-w-md p-6 bg-white shadow-xl relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4"
              onClick={() => setModalAbierto(false)}
              aria-label="Cerrar ventana"
            >
              <X className="size-5 text-gray-500" aria-hidden="true" />
            </Button>

            {/* [+] tabIndex={-1} para recibir foco al abrir */}
            <h2
              id="modal-usuario-titulo"
              data-modal-title
              tabIndex={-1}
              className="text-xl font-bold mb-4 outline-none"
            >
              {modoModal === "ver"
                ? `Detalles de ${usuarioSeleccionado.Nombre} ${usuarioSeleccionado.Apellidos}`
                : `Editar usuario: ${usuarioSeleccionado.Nombre} ${usuarioSeleccionado.Apellidos}`
              }
            </h2>

            <form onSubmit={handleGuardarEdicion} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="modal-nombre">Nombre</Label>
                  <Input
                    id="modal-nombre"
                    disabled={modoModal === "ver"}
                    value={usuarioSeleccionado.Nombre}
                    onChange={e => setUsuarioSeleccionado({...usuarioSeleccionado, Nombre: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="modal-apellidos">Apellidos</Label>
                  <Input
                    id="modal-apellidos"
                    disabled={modoModal === "ver"}
                    value={usuarioSeleccionado.Apellidos}
                    onChange={e => setUsuarioSeleccionado({...usuarioSeleccionado, Apellidos: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="modal-email">Correo Electrónico</Label>
                <Input
                  id="modal-email"
                  disabled={modoModal === "ver"}
                  type="email"
                  value={usuarioSeleccionado.Email}
                  onChange={e => setUsuarioSeleccionado({...usuarioSeleccionado, Email: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="modal-telefono">Teléfono</Label>
                <Input
                  id="modal-telefono"
                  disabled
                  value={usuarioSeleccionado.Telefono || "No registrado"}
                />
                {modoModal === "editar" && (
                  <p className="text-xs text-gray-400">El teléfono solo lo puede cambiar el dueño de la cuenta.</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="modal-rol">Rol del Sistema</Label>
                <select
                  id="modal-rol"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={modoModal === "ver"}
                  value={usuarioSeleccionado.RolID}
                  onChange={e => setUsuarioSeleccionado({...usuarioSeleccionado, RolID: Number(e.target.value)})}
                >
                  <option value={1}>Administrador</option>
                  <option value={2}>Estudiante</option>
                </select>
              </div>

              {/* [+] Estado del usuario visible en modo ver */}
              <div className="space-y-1">
                <Label>Estado de la cuenta</Label>
                <p className={`text-sm font-medium ${usuarioSeleccionado.verificado ? "text-green-600" : "text-yellow-600"}`}>
                  {usuarioSeleccionado.verificado ? "Verificado" : "Pendiente de verificación"}
                </p>
              </div>

              {modoModal === "editar" && (
                <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                  <Button type="button" variant="ghost" onClick={() => setModalAbierto(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={procesando}>
                    {procesando
                      ? <><Loader2 className="size-4 animate-spin mr-2" aria-hidden="true" /> Guardando...</>
                      : "Guardar Cambios"
                    }
                  </Button>
                </div>
              )}
            </form>
          </Card>
        </div>
      )}

      {/* [+] MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {confirmEliminar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-eliminar-titulo"
          aria-describedby="confirm-eliminar-descripcion"
          ref={confirmRef}
          onKeyDown={handleConfirmKeyDown}
        >
          <Card className="w-full max-w-sm p-6 bg-white shadow-2xl">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="size-8 text-red-600" aria-hidden="true" />
              </div>
              <h2
                id="confirm-eliminar-titulo"
                data-confirm-title
                tabIndex={-1}
                className="text-lg font-bold text-gray-800 outline-none"
              >
                ¿Eliminar usuario?
              </h2>
              <p id="confirm-eliminar-descripcion" className="text-sm text-muted-foreground">
                Estás a punto de eliminar permanentemente a{" "}
                <span className="font-semibold text-gray-700">"{confirmEliminar.nombre}"</span>.
                Esta acción no se puede deshacer y se perderán todos sus datos.
              </p>
              <div className="flex gap-3 w-full pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setConfirmEliminar(null)}
                  disabled={eliminando}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 gap-2"
                  onClick={confirmarEliminar}
                  disabled={eliminando}
                  aria-label={`Confirmar eliminación de ${confirmEliminar.nombre}`}
                >
                  {eliminando
                    ? <><Loader2 className="size-4 animate-spin" aria-hidden="true" /> Eliminando...</>
                    : <><Trash2 className="size-4" aria-hidden="true" /> Sí, eliminar</>
                  }
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
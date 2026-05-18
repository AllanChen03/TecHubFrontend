import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { API_URL } from "@/lib/config";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LayoutGrid, Plus, Search, Pencil, Trash2, X, Image as ImageIcon, Loader2, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/admin/categorias")({
  component: CategoriasPage,
});

interface Categoria {
  CategoriaID: number;
  NombreCategoria: string;
  ImagenPath: string | null;
}

// [+] Tipo para modal de confirmación
interface ConfirmEliminar {
  id: number;
  nombre: string;
}

function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modo, setModo] = useState<"crear" | "editar">("crear");
  const [procesando, setProcesando] = useState(false);

  const [nombre, setNombre] = useState("");
  const [idSeleccionado, setIdSeleccionado] = useState<number | null>(null);
  const [archivoImagen, setArchivoImagen] = useState<File | null>(null);

  // [+] Modal de confirmación de eliminación
  const [confirmEliminar, setConfirmEliminar] = useState<ConfirmEliminar | null>(null);
  const [eliminando, setEliminando] = useState(false);

  // Refs para focus trap
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLDivElement>(null);
  const botonAbrirRef = useRef<HTMLButtonElement | null>(null);
  const botonEliminarRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => { cargarCategorias(); }, []);

  // [+] Foco en modal crear/editar
  useEffect(() => {
    if (modalAbierto) {
      setTimeout(() => {
        modalRef.current?.querySelector<HTMLElement>("[data-modal-title]")?.focus();
      }, 50);
    } else {
      botonAbrirRef.current?.focus();
    }
  }, [modalAbierto]);

  // [+] Foco en modal confirmación
  useEffect(() => {
    if (confirmEliminar) {
      setTimeout(() => {
        confirmRef.current?.querySelector<HTMLElement>("[data-confirm-title]")?.focus();
      }, 50);
    } else {
      botonEliminarRef.current?.focus();
    }
  }, [confirmEliminar]);

  // [+] Focus trap modal crear/editar
  const handleModalKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") { cerrarModal(); return; }
    if (e.key !== "Tab") return;
    const enfocables = modalRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
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

  const cargarCategorias = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/categorias`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("techub_token")}` },
      });
      if (!res.ok) throw new Error("Error al obtener categorías");
      setCategorias(await res.json());
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setCargando(false);
    }
  };

  // [+] Pide confirmación antes de eliminar
  const pedirConfirmacion = (id: number, nombre: string, boton: HTMLButtonElement) => {
    botonEliminarRef.current = boton;
    setConfirmEliminar({ id, nombre });
  };

  // [+] Ejecuta la eliminación tras confirmar
  const confirmarEliminarCategoria = async () => {
    if (!confirmEliminar) return;
    setEliminando(true);
    try {
      const res = await fetch(`${API_URL}/admin/categorias/${confirmEliminar.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("techub_token")}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al eliminar");
      toast.success("Categoría eliminada");
      setConfirmEliminar(null);
      cargarCategorias();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setEliminando(false);
    }
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcesando(true);
    const formData = new FormData();
    formData.append("nombreCategoria", nombre);
    if (archivoImagen) formData.append("imagen", archivoImagen);
    try {
      const url = modo === "crear"
        ? `${API_URL}/admin/categorias`
        : `${API_URL}/admin/categorias/${idSeleccionado}`;
      const res = await fetch(url, {
        method: modo === "crear" ? "POST" : "PUT",
        headers: { "Authorization": `Bearer ${localStorage.getItem("techub_token")}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Error al guardar la categoría");
      toast.success(modo === "crear" ? "Categoría creada" : "Categoría actualizada");
      cerrarModal();
      cargarCategorias();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setProcesando(false);
    }
  };

  const abrirModal = (c?: Categoria, boton?: HTMLButtonElement) => {
    if (boton) botonAbrirRef.current = boton;
    if (c) {
      setModo("editar");
      setNombre(c.NombreCategoria);
      setIdSeleccionado(c.CategoriaID);
    } else {
      setModo("crear");
      setNombre("");
      setIdSeleccionado(null);
    }
    setArchivoImagen(null);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setNombre("");
    setArchivoImagen(null);
  };

  const filtradas = categorias.filter(c =>
    c.NombreCategoria.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <LayoutGrid className="size-8 text-primary" aria-hidden="true" />
          <h1 className="text-3xl font-bold text-gray-800">Catálogo de Categorías</h1>
        </div>

        <div className="flex gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Buscar categoría..."
              className="pl-9 bg-white"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              aria-label="Buscar categoría por nombre"
              aria-describedby="resultados-categorias"
            />
          </div>
          {/* [+] ref para devolver foco al cerrar modal */}
          <Button
            onClick={(e) => abrirModal(undefined, e.currentTarget)}
            className="gap-2"
            aria-label="Crear nueva categoría"
          >
            <Plus className="size-4" aria-hidden="true" /> Nueva Categoría
          </Button>
        </div>
      </div>

      {/* [+] Anuncio de resultados para NVDA */}
      <p id="resultados-categorias" className="sr-only" aria-live="polite" aria-atomic="true">
        {busqueda
          ? `${filtradas.length} ${filtradas.length === 1 ? "categoría encontrada" : "categorías encontradas"} para "${busqueda}"`
          : `${filtradas.length} categorías en total`
        }
      </p>

      {/* CUADRÍCULA */}
      {cargando ? (
        <div className="flex justify-center p-20" aria-live="polite" aria-busy="true">
          <Loader2 className="animate-spin size-10 text-primary" aria-hidden="true" />
          <span className="sr-only">Cargando categorías...</span>
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 list-none p-0">
          {filtradas.map(c => (
            <li key={c.CategoriaID}>
              <Card className="overflow-hidden flex flex-col shadow-sm border-muted h-full">
                {/* Imagen — decorativa, NVDA la ignora */}
                <div className="h-40 bg-muted relative overflow-hidden">
                  {c.ImagenPath ? (
                    <img
                      src={c.ImagenPath.startsWith("http") ? c.ImagenPath : `${API_URL}${c.ImagenPath}`}
                      alt=""
                      aria-hidden="true"
                      className="w-full h-full object-contain p-4"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <ImageIcon className="size-12 opacity-20" aria-hidden="true" />
                    </div>
                  )}
                </div>

                {/* Cuerpo */}
                <div className="p-4 flex items-center justify-between gap-2">
                  {/* [+] h2 para que NVDA anuncie el nombre al navegar */}
                  <h2 className="font-bold text-gray-700 truncate text-base">{c.NombreCategoria}</h2>

                  <div className="flex gap-1">
                    {/* [+] aria-label con nombre de la categoría */}
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                      aria-label={`Editar categoría: ${c.NombreCategoria}`}
                      onClick={(e) => abrirModal(c, e.currentTarget)}
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                      aria-label={`Eliminar categoría: ${c.NombreCategoria}`}
                      onClick={(e) => pedirConfirmacion(c.CategoriaID, c.NombreCategoria, e.currentTarget)}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </Card>
            </li>
          ))}

          {filtradas.length === 0 && (
            <li className="col-span-full p-10 text-center text-gray-500 bg-white rounded-lg border border-dashed">
              No se encontraron categorías registradas.
            </li>
          )}
        </ul>
      )}

      {/* MODAL CREAR/EDITAR */}
      {modalAbierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-categoria-titulo"
          ref={modalRef}
          onKeyDown={handleModalKeyDown}
        >
          <Card className="w-full max-w-md p-6 relative bg-white shadow-2xl">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4"
              onClick={cerrarModal}
              aria-label="Cerrar ventana"
            >
              <X className="size-5" aria-hidden="true" />
            </Button>

            {/* [+] tabIndex={-1} para recibir foco al abrir */}
            <h2
              id="modal-categoria-titulo"
              data-modal-title
              tabIndex={-1}
              className="text-xl font-bold mb-6 text-primary outline-none"
            >
              {modo === "crear" ? "Nueva Categoría" : `Editar categoría: ${nombre}`}
            </h2>

            <form onSubmit={handleGuardar} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="nombre-categoria">Nombre</Label>
                <Input
                  id="nombre-categoria"
                  required
                  placeholder="Ej: Libros, Ropa..."
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imagen-categoria">Imagen</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition-colors">
                  <Input
                    id="imagen-categoria"
                    type="file"
                    accept="image/*"
                    className="cursor-pointer"
                    onChange={e => setArchivoImagen(e.target.files?.[0] || null)}
                    aria-describedby="imagen-hint"
                  />
                  <p id="imagen-hint" className="text-[10px] text-muted-foreground mt-2 uppercase font-bold tracking-widest">
                    {archivoImagen ? archivoImagen.name : "Formatos: JPG, PNG o WEBP"}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button type="button" variant="ghost" className="flex-1" onClick={cerrarModal}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={procesando}>
                  {procesando
                    ? <><Loader2 className="size-4 animate-spin mr-2" aria-hidden="true" /> Guardando...</>
                    : "Guardar"
                  }
                </Button>
              </div>
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
          aria-labelledby="confirm-categoria-titulo"
          aria-describedby="confirm-categoria-descripcion"
          ref={confirmRef}
          onKeyDown={handleConfirmKeyDown}
        >
          <Card className="w-full max-w-sm p-6 bg-white shadow-2xl">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="size-8 text-red-600" aria-hidden="true" />
              </div>
              <h2
                id="confirm-categoria-titulo"
                data-confirm-title
                tabIndex={-1}
                className="text-lg font-bold text-gray-800 outline-none"
              >
                ¿Eliminar categoría?
              </h2>
              <p id="confirm-categoria-descripcion" className="text-sm text-muted-foreground">
                Estás a punto de eliminar{" "}
                <span className="font-semibold text-gray-700">"{confirmEliminar.nombre}"</span>.
                Los productos asociados podrían quedar sin categoría.
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
                  onClick={confirmarEliminarCategoria}
                  disabled={eliminando}
                  aria-label={`Confirmar eliminación de la categoría ${confirmEliminar.nombre}`}
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
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { API_URL } from "@/lib/config";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package, Search, Trash2, Image as ImageIcon, Loader2, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/admin/productos")({
  component: AdminProductos,
});

interface Producto {
  ProductoID: number;
  NombreProducto: string;
  Precio: number;
  ImagenPath: string | null;
  NombreCategoria: string;
  NombreSede: string;
  EstadoProducto: string;
  VendedorNombre: string;
  VendedorApellidos: string;
  DisponibilidadID: number;
}

// [+] Tipo para modal de confirmación
interface ConfirmEliminar {
  id: number;
  nombre: string;
}

const getImageSrc = (path: string) =>
  path.startsWith("http") ? path : `${API_URL}${path}`;

function AdminProductos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  // [+] Modal de confirmación
  const [confirmEliminar, setConfirmEliminar] = useState<ConfirmEliminar | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const confirmRef = useRef<HTMLDivElement>(null);
  const botonEliminarRef = useRef<HTMLButtonElement | null>(null);

  const headers = { Authorization: `Bearer ${localStorage.getItem("techub_token")}` };

  useEffect(() => { cargarProductos(); }, []);

  // [+] Foco en modal de confirmación
  useEffect(() => {
    if (confirmEliminar) {
      setTimeout(() => {
        confirmRef.current?.querySelector<HTMLElement>("[data-confirm-title]")?.focus();
      }, 50);
    } else {
      botonEliminarRef.current?.focus();
    }
  }, [confirmEliminar]);

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

  const cargarProductos = async () => {
    setCargando(true);
    try {
      const res = await fetch(`${API_URL}/admin/productos`, { headers });
      if (!res.ok) throw new Error("Error al obtener productos");
      setProductos(await res.json());
    } catch (e: any) {
      toast.error(e.message);
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
  const confirmarEliminar = async () => {
    if (!confirmEliminar) return;
    setEliminando(true);
    try {
      const res = await fetch(`${API_URL}/admin/productos/${confirmEliminar.id}`, {
        method: "DELETE", headers,
      });
      if (!res.ok) throw new Error("Error al eliminar");
      toast.success(`"${confirmEliminar.nombre}" eliminado correctamente`);
      setConfirmEliminar(null);
      cargarProductos();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setEliminando(false);
    }
  };

  const filtrados = productos.filter(p =>
    p.NombreProducto.toLowerCase().includes(busqueda.toLowerCase()) ||
    `${p.VendedorNombre} ${p.VendedorApellidos}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  const disponibilidadLabel = (id: number) =>
    id === 1
      ? { label: "Disponible", clase: "bg-green-100 text-green-700" }
      : { label: "No disponible", clase: "bg-red-100 text-red-700" };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Package className="size-8 text-primary" aria-hidden="true" />
          <h1 className="text-3xl font-bold text-gray-800">Gestión de Productos</h1>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" aria-hidden="true" />
          <Input
            placeholder="Buscar por nombre o vendedor..."
            className="pl-9 bg-white"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            aria-label="Buscar producto por nombre o vendedor"
            aria-describedby="resultados-productos"
          />
        </div>
      </div>

      {/* [+] Anuncio de resultados para NVDA */}
      <p id="resultados-productos" className="sr-only" aria-live="polite" aria-atomic="true">
        {busqueda
          ? `${filtrados.length} ${filtrados.length === 1 ? "producto encontrado" : "productos encontrados"} para "${busqueda}"`
          : `${filtrados.length} productos en total`
        }
      </p>

      {/* TABLA */}
      <Card className="p-0 overflow-hidden shadow-sm">
        {cargando ? (
          <div className="flex justify-center p-20" aria-live="polite" aria-busy="true">
            <Loader2 className="animate-spin size-10 text-primary" aria-hidden="true" />
            <span className="sr-only">Cargando productos...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" aria-label="Lista de productos del sistema">
              <caption className="sr-only">
                Tabla de gestión de productos. {filtrados.length} productos mostrados.
              </caption>
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th scope="col" className="p-4 font-semibold text-gray-600">Producto</th>
                  <th scope="col" className="p-4 font-semibold text-gray-600">Vendedor</th>
                  <th scope="col" className="p-4 font-semibold text-gray-600">Categoría</th>
                  <th scope="col" className="p-4 font-semibold text-gray-600">Sede</th>
                  <th scope="col" className="p-4 font-semibold text-gray-600 text-right">Precio</th>
                  <th scope="col" className="p-4 font-semibold text-gray-600 text-center">Estado</th>
                  <th scope="col" className="p-4 font-semibold text-gray-600 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtrados.map(p => {
                  const disp = disponibilidadLabel(p.DisponibilidadID);
                  return (
                    <tr key={p.ProductoID} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-lg bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center border">
                            {p.ImagenPath ? (
                              <img
                                src={getImageSrc(p.ImagenPath)}
                                alt=""
                                aria-hidden="true"
                                className="w-full h-full object-contain p-1"
                              />
                            ) : (
                              <ImageIcon className="size-5 text-muted-foreground opacity-30" aria-hidden="true" />
                            )}
                          </div>
                          <span className="font-medium text-gray-900 line-clamp-1">{p.NombreProducto}</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-600">{p.VendedorNombre || ""} {p.VendedorApellidos || ""}</td>
                      <td className="p-4 text-gray-600">{p.NombreCategoria || "—"}</td>
                      <td className="p-4 text-gray-600">{p.NombreSede || "—"}</td>
                      <td className="p-4 text-right font-bold text-primary"
                        aria-label={`Precio: ${Number(p.Precio).toLocaleString()} colones`}
                      >
                        ₡{Number(p.Precio).toLocaleString()}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${disp.clase}`}
                          aria-label={`Estado: ${disp.label}`}
                        >
                          {disp.label}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {/* [+] aria-label descriptivo con nombre del producto */}
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          aria-label={`Eliminar producto: ${p.NombreProducto} de ${p.VendedorNombre} ${p.VendedorApellidos}`}
                          onClick={(e) => pedirConfirmacion(p.ProductoID, p.NombreProducto, e.currentTarget)}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {filtrados.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      {busqueda
                        ? `No se encontraron productos con "${busqueda}"`
                        : "No hay productos registrados."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* [+] MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {confirmEliminar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-producto-titulo"
          aria-describedby="confirm-producto-descripcion"
          ref={confirmRef}
          onKeyDown={handleConfirmKeyDown}
        >
          <Card className="w-full max-w-sm p-6 bg-white shadow-2xl">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="size-8 text-red-600" aria-hidden="true" />
              </div>
              <h2
                id="confirm-producto-titulo"
                data-confirm-title
                tabIndex={-1}
                className="text-lg font-bold text-gray-800 outline-none"
              >
                ¿Eliminar producto?
              </h2>
              <p id="confirm-producto-descripcion" className="text-sm text-muted-foreground">
                Estás a punto de eliminar permanentemente{" "}
                <span className="font-semibold text-gray-700">"{confirmEliminar.nombre}"</span>.
                Esta acción no se puede deshacer.
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
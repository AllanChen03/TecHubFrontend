import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { API_URL } from "@/lib/config";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Search, Trash2, Loader2, Star, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/admin/comentarios")({
  component: AdminComentarios,
});

interface Comentario {
  ComentarioID: number;
  Comentario: string;
  Valoracion: number;
  Fecha: string;
  NombreProducto: string;
  CompradorNombre: string;
  CompradorApellidos: string;
  VendedorNombre: string;
  VendedorApellidos: string;
}

// [+] Etiquetas para cada valoración
const etiquetasValoracion = ["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"];

function AdminComentarios() {
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  // [+] Modal de confirmación
  const [confirmEliminar, setConfirmEliminar] = useState<{ id: number; producto: string } | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const confirmRef = useRef<HTMLDivElement>(null);
  const botonEliminarRef = useRef<HTMLButtonElement | null>(null);

  const headers = { Authorization: `Bearer ${localStorage.getItem("techub_token")}` };

  useEffect(() => { cargarComentarios(); }, []);

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

  const cargarComentarios = async () => {
    setCargando(true);
    try {
      const res = await fetch(`${API_URL}/admin/comentarios`, { headers });
      if (!res.ok) throw new Error("Error al obtener comentarios");
      setComentarios(await res.json());
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCargando(false);
    }
  };

  // [+] Pide confirmación antes de eliminar
  const pedirConfirmacion = (id: number, producto: string, boton: HTMLButtonElement) => {
    botonEliminarRef.current = boton;
    setConfirmEliminar({ id, producto });
  };

  // [+] Ejecuta la eliminación
  const confirmarEliminar = async () => {
    if (!confirmEliminar) return;
    setEliminando(true);
    try {
      const res = await fetch(`${API_URL}/admin/comentarios/${confirmEliminar.id}`, {
        method: "DELETE", headers,
      });
      if (!res.ok) throw new Error("Error al eliminar");
      toast.success("Comentario eliminado — la valoración se mantiene");
      setConfirmEliminar(null);
      cargarComentarios();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setEliminando(false);
    }
  };

  const formatFecha = (fecha: string) =>
    new Date(fecha).toLocaleString("es-CR", {
      day: "numeric", month: "short", year: "numeric",
    });

  const filtrados = comentarios.filter(c =>
    c.NombreProducto.toLowerCase().includes(busqueda.toLowerCase()) ||
    `${c.CompradorNombre} ${c.CompradorApellidos}`.toLowerCase().includes(busqueda.toLowerCase()) ||
    `${c.VendedorNombre} ${c.VendedorApellidos}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <MessageSquare className="size-8 text-primary" aria-hidden="true" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Gestión de Reseñas</h1>
            <p className="text-muted-foreground text-sm">{comentarios.length} reseñas en total</p>
          </div>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" aria-hidden="true" />
          <Input
            placeholder="Buscar por producto o usuario..."
            className="pl-9 bg-white"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            aria-label="Buscar reseña por producto o usuario"
            aria-describedby="resultados-resenas"
          />
        </div>
      </div>

      {/* [+] Anuncio de resultados para NVDA */}
      <p id="resultados-resenas" className="sr-only" aria-live="polite" aria-atomic="true">
        {busqueda
          ? `${filtrados.length} ${filtrados.length === 1 ? "reseña encontrada" : "reseñas encontradas"} para "${busqueda}"`
          : `${filtrados.length} reseñas en total`
        }
      </p>

      {/* CONTENIDO */}
      {cargando ? (
        <div className="flex justify-center p-20" aria-live="polite" aria-busy="true">
          <Loader2 className="animate-spin size-10 text-primary" aria-hidden="true" />
          <span className="sr-only">Cargando reseñas...</span>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="p-10 text-center text-gray-500 bg-white rounded-lg border border-dashed">
          {busqueda ? `No se encontraron reseñas con "${busqueda}"` : "No hay reseñas registradas."}
        </div>
      ) : (
        /* [+] Lista semántica para que NVDA anuncie cuántas reseñas hay */
        <ul className="flex flex-col gap-4 list-none p-0">
          {filtrados.map(c => (
            <li key={c.ComentarioID}>
              <Card className="p-5 shadow-sm bg-white">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">

                    {/* [+] article con aria-label completo para que NVDA lo anuncie de una vez */}
                    <article tabIndex={0} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded p-1">
                      {/* [+] Título oculto visualmente pero leído por NVDA como encabezado de la reseña */}
                      <h2 className="sr-only">
                        Reseña de {c.CompradorNombre} {c.CompradorApellidos} sobre {c.NombreProducto}
                      </h2>

                      {/* Estrellas + fecha */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
                        <div
                          className="flex gap-0.5"
                          role="img"
                          aria-label={`${c.Valoracion} de 5 estrellas: ${etiquetasValoracion[c.Valoracion]}`}
                        >
                          {[1, 2, 3, 4, 5].map(i => (
                            <Star
                              key={i}
                              className={`size-4 ${i <= c.Valoracion ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`}
                              aria-hidden="true"
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">{formatFecha(c.Fecha)}</span>
                      </div>

                      {/* Comentario — NVDA lo lee como texto normal */}
                      {c.Comentario ? (
                        <p className="text-sm text-gray-700 mb-3">{c.Comentario}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic mb-3">Sin comentario escrito</p>
                      )}

                      {/* Meta info con dl/dt/dd para que NVDA anuncie etiqueta y valor */}
                      <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <div>
                          <dt className="inline font-semibold text-gray-600">Producto: </dt>
                          <dd className="inline">{c.NombreProducto}</dd>
                        </div>
                        <div>
                          <dt className="inline font-semibold text-gray-600">Comprador: </dt>
                          <dd className="inline">{c.CompradorNombre} {c.CompradorApellidos}</dd>
                        </div>
                        <div>
                          <dt className="inline font-semibold text-gray-600">Vendedor: </dt>
                          <dd className="inline">{c.VendedorNombre} {c.VendedorApellidos}</dd>
                        </div>
                      </dl>
                    </article>
                  </div>

                  {/* [+] aria-label descriptivo con producto y comprador */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0 whitespace-nowrap"
                    aria-label={`Eliminar comentario de ${c.CompradorNombre} ${c.CompradorApellidos} sobre ${c.NombreProducto}`}
                    onClick={(e) => pedirConfirmacion(c.ComentarioID, c.NombreProducto, e.currentTarget)}
                  >
                    <Trash2 className="size-4" aria-hidden="true" /> Eliminar comentario
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {/* [+] MODAL DE CONFIRMACIÓN */}
      {confirmEliminar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-resena-titulo"
          aria-describedby="confirm-resena-descripcion"
          ref={confirmRef}
          onKeyDown={handleConfirmKeyDown}
        >
          <Card className="w-full max-w-sm p-6 bg-white shadow-2xl">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="size-8 text-red-600" aria-hidden="true" />
              </div>
              <h2
                id="confirm-resena-titulo"
                data-confirm-title
                tabIndex={-1}
                className="text-lg font-bold text-gray-800 outline-none"
              >
                ¿Eliminar comentario?
              </h2>
              <p id="confirm-resena-descripcion" className="text-sm text-muted-foreground">
                Vas a eliminar el texto del comentario sobre{" "}
                <span className="font-semibold text-gray-700">"{confirmEliminar.producto}"</span>.
                La valoración en estrellas se mantendrá.
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
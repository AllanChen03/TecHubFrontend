import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { API_URL } from "@/lib/config";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Package, ShoppingBag, Loader2, CheckCircle,
  XCircle, Image as ImageIcon, ShoppingCart, Store, Star, AlertTriangle,
} from "lucide-react";

export const Route = createFileRoute("/app/ordenes")({
  component: OrdenesPage,
});

interface OrdenCompra {
  OrdenID: number;
  Fecha: string;
  PrecioTotal: number;
  EstadoID: number;
  NombreEstado: string;
  ProductoID: number;
  NombreProducto: string;
  ImagenPath: string | null;
  VendedorNombre: string;
  VendedorApellidos: string;
}

interface OrdenVenta {
  OrdenID: number;
  Fecha: string;
  PrecioTotal: number;
  EstadoID: number;
  NombreEstado: string;
  ProductoID: number;
  NombreProducto: string;
  ImagenPath: string | null;
  CompradorNombre: string;
  CompradorApellidos: string;
  YaCalificadoComprador: number;
  CompradorID: number;
}

// [+] Tipo para el modal de confirmación de acciones
interface ConfirmAccion {
  ordenID: number;
  tipo: "completar" | "cancelar";
  nombre: string;
}

const getImageSrc = (path: string) =>
  path.startsWith("http") ? path : `${API_URL}${path}`;

const estadoConfig: Record<number, { label: string; clase: string }> = {
  1: { label: "Pendiente",  clase: "bg-yellow-100 text-yellow-800" },
  2: { label: "Completada", clase: "bg-green-100  text-green-800"  },
  3: { label: "Cancelada",  clase: "bg-red-100    text-red-800"    },
};

function OrdenesPage() {
  const [compras, setCompras] = useState<OrdenCompra[]>([]);
  const [ventas,  setVentas]  = useState<OrdenVenta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [tab, setTab] = useState<"compras" | "ventas">("compras");
  const [procesando, setProcesando] = useState<number | null>(null);

  // [+] Modal de confirmación de acciones (completar/cancelar)
  const [confirmAccion, setConfirmAccion] = useState<ConfirmAccion | null>(null);
  const [ejecutando, setEjecutando] = useState(false);
  const confirmRef = useRef<HTMLDivElement>(null);
  const botonAccionRef = useRef<HTMLButtonElement | null>(null);

  const token = localStorage.getItem("techub_token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { cargarOrdenes(); }, []);

  // [+] Foco en modal de confirmación
  useEffect(() => {
    if (confirmAccion) {
      setTimeout(() => {
        confirmRef.current?.querySelector<HTMLElement>("[data-confirm-title]")?.focus();
      }, 50);
    } else {
      botonAccionRef.current?.focus();
    }
  }, [confirmAccion]);

  // [+] Focus trap modal confirmación
  const handleConfirmKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") { setConfirmAccion(null); return; }
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

  const cargarOrdenes = async () => {
    setCargando(true);
    try {
      const [resCompras, resVentas] = await Promise.all([
        fetch(`${API_URL}/usuarios/mis-compras`,  { headers }),
        fetch(`${API_URL}/usuarios/mis-ventas`,   { headers }),
      ]);
      if (resCompras.ok) setCompras(await resCompras.json());
      if (resVentas.ok)  setVentas(await resVentas.json());
    } catch {
      toast.error("Error al cargar órdenes");
    } finally {
      setCargando(false);
    }
  };

  // [+] Pide confirmación antes de ejecutar la acción
  const pedirConfirmacion = (ordenID: number, tipo: "completar" | "cancelar", nombre: string, boton: HTMLButtonElement) => {
    botonAccionRef.current = boton;
    setConfirmAccion({ ordenID, tipo, nombre });
  };

  // [+] Ejecuta la acción confirmada
  const ejecutarAccion = async () => {
    if (!confirmAccion) return;
    setEjecutando(true);
    try {
      const { ordenID, tipo } = confirmAccion;
      const res = await fetch(`${API_URL}/usuarios/ordenes/${ordenID}/${tipo}`, {
        method: "PUT", headers,
      });
      if (!res.ok) throw new Error(`Error al ${tipo} la orden`);
      toast.success(tipo === "completar"
        ? "Orden completada — se notificó al comprador"
        : "Orden cancelada"
      );
      setConfirmAccion(null);
      cargarOrdenes();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setEjecutando(false);
      setProcesando(null);
    }
  };

  const formatFecha = (fecha: string) =>
    new Date(fecha).toLocaleString("es-CR", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true,
    });

  const ImagenProducto = ({ path, nombre }: { path: string | null; nombre: string }) => (
    <div className="size-20 rounded-lg bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center border">
      {path ? (
        <img src={getImageSrc(path)} alt={nombre} className="w-full h-full object-contain p-2" />
      ) : (
        <ImageIcon className="size-8 text-muted-foreground opacity-30" aria-hidden="true" />
      )}
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* CABECERA */}
      <div className="flex items-center gap-3 border-b pb-6">
        <Package className="size-8 text-primary" aria-hidden="true" />
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Órdenes</h1>
          <p className="text-muted-foreground text-sm">Historial de compras y ventas</p>
        </div>
      </div>

      {/* TABS */}
      {/* [+] role="tablist" para que NVDA entienda que son pestañas */}
      <div className="flex gap-2" role="tablist" aria-label="Secciones de órdenes">
        {(["compras", "ventas"] as const).map((t) => {
          const count = t === "compras" ? compras.length : ventas.length;
          const activo = tab === t;
          return (
            <button
              key={t}
              role="tab"
              aria-selected={activo}
              aria-controls={`panel-${t}`}
              id={`tab-${t}`}
              onClick={() => setTab(t)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activo
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {t === "compras"
                ? <ShoppingCart className="size-4" aria-hidden="true" />
                : <Store className="size-4" aria-hidden="true" />
              }
              {t === "compras" ? "Mis compras" : "Mis ventas"}
              {count > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                  activo ? "bg-white/20" : "bg-primary/10 text-primary"
                }`} aria-label={`${count} órdenes`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* CONTENIDO */}
      {cargando ? (
        <div className="flex flex-col items-center justify-center p-20 gap-4" aria-live="polite" aria-busy="true">
          <Loader2 className="animate-spin size-10 text-primary" aria-hidden="true" />
          <p className="text-muted-foreground animate-pulse">Cargando órdenes...</p>
        </div>
      ) : tab === "compras" ? (
        /* ── MIS COMPRAS ── */
        <div id="panel-compras" role="tabpanel" aria-labelledby="tab-compras">
          {compras.length === 0 ? (
            <EstadoVacio mensaje="Aún no has comprado nada" sub="Explorá los productos disponibles" />
          ) : (
            <ul className="flex flex-col gap-4 list-none p-0">
              {compras.map((o) => {
                const estado = estadoConfig[o.EstadoID] ?? { label: o.NombreEstado, clase: "bg-gray-100 text-gray-700" };
                return (
                  <li key={o.OrdenID}>
                    <Card className="p-5 shadow-sm bg-white">
                      <div className="flex gap-4">
                        <ImagenProducto path={o.ImagenPath} nombre={o.NombreProducto} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <p className="font-bold text-gray-800 line-clamp-1">{o.NombreProducto}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{formatFecha(o.Fecha)}</p>
                            </div>
                            {/* [+] aria-label para que NVDA lea el estado completo */}
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${estado.clase}`}
                              aria-label={`Estado: ${estado.label}`}
                            >
                              {estado.label}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                            <p className="text-primary font-black text-lg" aria-label={`Precio: ${Number(o.PrecioTotal).toLocaleString()} colones`}>
                              ₡{Number(o.PrecioTotal).toLocaleString()}
                            </p>
                            <p className="text-sm text-muted-foreground self-center">
                              Vendedor: {o.VendedorNombre} {o.VendedorApellidos}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : (
        /* ── MIS VENTAS ── */
        <div id="panel-ventas" role="tabpanel" aria-labelledby="tab-ventas">
          {ventas.length === 0 ? (
            <EstadoVacio mensaje="Aún no tienes ventas" sub="Tus ventas aceptadas aparecerán aquí" />
          ) : (
            <ul className="flex flex-col gap-4 list-none p-0">
              {ventas.map((o) => {
                const estado = estadoConfig[o.EstadoID] ?? { label: o.NombreEstado, clase: "bg-gray-100 text-gray-700" };
                const estaProcesando = procesando === o.OrdenID;
                return (
                  <li key={o.OrdenID}>
                    <Card className="p-5 shadow-sm bg-white">
                      <div className="flex gap-4">
                        <ImagenProducto path={o.ImagenPath} nombre={o.NombreProducto} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <p className="font-bold text-gray-800 line-clamp-1">{o.NombreProducto}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{formatFecha(o.Fecha)}</p>
                            </div>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${estado.clase}`}
                              aria-label={`Estado: ${estado.label}`}
                            >
                              {estado.label}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                            <p className="text-primary font-black text-lg" aria-label={`Precio: ${Number(o.PrecioTotal).toLocaleString()} colones`}>
                              ₡{Number(o.PrecioTotal).toLocaleString()}
                            </p>
                            <p className="text-sm text-muted-foreground self-center">
                              Comprador: {o.CompradorNombre} {o.CompradorApellidos}
                            </p>
                          </div>

                          {/* Pendiente: completar o cancelar */}
                          {o.EstadoID === 1 && (
                            <div className="flex gap-2 mt-3 pt-3 border-t">
                              {/* [+] aria-label descriptivo con nombre del producto */}
                              <Button
                                size="sm"
                                className="gap-1.5 bg-green-600 hover:bg-green-700"
                                disabled={estaProcesando}
                                aria-label={`Marcar como completada la orden de ${o.NombreProducto}`}
                                onClick={(e) => pedirConfirmacion(o.OrdenID, "completar", o.NombreProducto, e.currentTarget)}
                              >
                                {estaProcesando
                                  ? <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                                  : <CheckCircle className="size-4" aria-hidden="true" />}
                                Marcar completada
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                disabled={estaProcesando}
                                aria-label={`Cancelar la orden de ${o.NombreProducto}`}
                                onClick={(e) => pedirConfirmacion(o.OrdenID, "cancelar", o.NombreProducto, e.currentTarget)}
                              >
                                <XCircle className="size-4" aria-hidden="true" /> Cancelar
                              </Button>
                            </div>
                          )}

                          {/* Completada: calificar al comprador */}
                          {o.EstadoID === 2 && o.YaCalificadoComprador === 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <Link to="/app/calificarComprador/$ordenID" params={{ ordenID: String(o.OrdenID) }}>
                                {/* [+] aria-label con nombre del comprador y producto */}
                                <Button
                                  size="sm"
                                  className="gap-1.5 bg-purple-600 hover:bg-purple-700 w-full"
                                  aria-label={`Calificar al comprador ${o.CompradorNombre} ${o.CompradorApellidos} por la compra de ${o.NombreProducto}`}
                                >
                                  <Star className="size-4" aria-hidden="true" /> Calificar comprador
                                </Button>
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* [+] MODAL DE CONFIRMACIÓN DE ACCIÓN */}
      {confirmAccion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-accion-titulo"
          aria-describedby="confirm-accion-descripcion"
          ref={confirmRef}
          onKeyDown={handleConfirmKeyDown}
        >
          <Card className="w-full max-w-sm p-6 bg-white shadow-2xl">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className={`p-3 rounded-full ${confirmAccion.tipo === "completar" ? "bg-green-100" : "bg-red-100"}`}>
                {confirmAccion.tipo === "completar"
                  ? <CheckCircle className="size-8 text-green-600" aria-hidden="true" />
                  : <AlertTriangle className="size-8 text-red-600" aria-hidden="true" />
                }
              </div>
              <h2
                id="confirm-accion-titulo"
                data-confirm-title
                tabIndex={-1}
                className="text-lg font-bold text-gray-800 outline-none"
              >
                {confirmAccion.tipo === "completar"
                  ? "¿Marcar orden como completada?"
                  : "¿Cancelar esta orden?"
                }
              </h2>
              <p id="confirm-accion-descripcion" className="text-sm text-muted-foreground">
                {confirmAccion.tipo === "completar"
                  ? <>Vas a marcar la orden de <span className="font-semibold text-gray-700">"{confirmAccion.nombre}"</span> como completada. Se notificará al comprador automáticamente.</>
                  : <>Vas a cancelar la orden de <span className="font-semibold text-gray-700">"{confirmAccion.nombre}"</span>. El producto volverá a estar disponible.</>
                }
              </p>
              <div className="flex gap-3 w-full pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setConfirmAccion(null)}
                  disabled={ejecutando}
                >
                  Cancelar
                </Button>
                <Button
                  className={`flex-1 gap-2 ${confirmAccion.tipo === "completar" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
                  onClick={ejecutarAccion}
                  disabled={ejecutando}
                >
                  {ejecutando
                    ? <><Loader2 className="size-4 animate-spin" aria-hidden="true" /> Procesando...</>
                    : confirmAccion.tipo === "completar"
                      ? <><CheckCircle className="size-4" aria-hidden="true" /> Sí, completar</>
                      : <><XCircle className="size-4" aria-hidden="true" /> Sí, cancelar</>
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

function EstadoVacio({ mensaje, sub }: { mensaje: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white rounded-2xl border-2 border-dashed">
      <ShoppingBag className="size-16 text-muted-foreground/20" aria-hidden="true" />
      <div className="text-center">
        <p className="font-semibold text-gray-600">{mensaje}</p>
        <p className="text-sm text-muted-foreground mt-1">{sub}</p>
      </div>
    </div>
  );
}
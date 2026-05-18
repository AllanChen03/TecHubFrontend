import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { API_URL } from "@/lib/config";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2, Bell, ShoppingBag, CheckCircle, XCircle, Star, Phone,
  Trash2, PackageCheck, PackageX, ShoppingCart, User as UserIcon, AlertTriangle,
} from "lucide-react";

export const Route = createFileRoute("/app/notificaciones")({
  component: NotificacionesPage,
});

interface Notificacion {
  NotificacionID: number;
  Titulo: string;
  Mensaje: string;
  Tipo: "solicitud_compra" | "compra_aceptada" | "compra_completada" | "compra_cancelada";
  ProductoID: number | null;
  OrdenID: number | null;
  NombreProducto: string | null;
  ImagenPath: string | null;
  FechaCreacion: string;
  RemitenteID: number | null;
}

// [+] Tipo para modal de confirmación de rechazo
interface ConfirmRechazo {
  notif: Notificacion;
}

const getImageSrc = (path: string) =>
  path.startsWith("http") ? path : `${API_URL}${path}`;

function NotificacionesPage() {
  const nav = useNavigate();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState<number | null>(null);

  // [+] Modal de confirmación de rechazo
  const [confirmRechazo, setConfirmRechazo] = useState<ConfirmRechazo | null>(null);
  const [rechazando, setRechazando] = useState(false);
  const confirmRef = useRef<HTMLDivElement>(null);
  const botonRechazoRef = useRef<HTMLButtonElement | null>(null);

  const token = localStorage.getItem("techub_token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { cargarNotificaciones(); }, []);

  // [+] Foco en modal de confirmación
  useEffect(() => {
    if (confirmRechazo) {
      setTimeout(() => {
        confirmRef.current?.querySelector<HTMLElement>("[data-confirm-title]")?.focus();
      }, 50);
    } else {
      botonRechazoRef.current?.focus();
    }
  }, [confirmRechazo]);

  // [+] Focus trap modal confirmación
  const handleConfirmKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") { setConfirmRechazo(null); return; }
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

  const cargarNotificaciones = async () => {
    setCargando(true);
    try {
      const res = await fetch(`${API_URL}/usuarios/notificaciones`, { headers });
      if (res.ok) setNotificaciones(await res.json());
    } catch {
      toast.error("Error al cargar notificaciones");
    } finally {
      setCargando(false);
    }
  };

  const handleAceptar = async (notif: Notificacion) => {
    setProcesando(notif.NotificacionID);
    try {
      const res = await fetch(`${API_URL}/usuarios/ordenes/${notif.NotificacionID}/aceptar`, {
        method: "POST", headers,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al aceptar");
      toast.success("Solicitud aceptada — se notificó al comprador");
      cargarNotificaciones();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setProcesando(null);
    }
  };

  // [+] Pide confirmación antes de rechazar
  const pedirConfirmacionRechazo = (notif: Notificacion, boton: HTMLButtonElement) => {
    botonRechazoRef.current = boton;
    setConfirmRechazo({ notif });
  };

  // [+] Ejecuta el rechazo tras confirmar
  const confirmarRechazo = async () => {
    if (!confirmRechazo) return;
    setRechazando(true);
    try {
      const res = await fetch(`${API_URL}/usuarios/notificaciones/${confirmRechazo.notif.NotificacionID}`, {
        method: "DELETE", headers,
      });
      if (!res.ok) throw new Error("Error al rechazar");
      toast.success("Solicitud rechazada");
      setConfirmRechazo(null);
      cargarNotificaciones();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setRechazando(false);
    }
  };

  const handleEliminar = async (id: number) => {
    try {
      await fetch(`${API_URL}/usuarios/notificaciones/${id}`, { method: "DELETE", headers });
      setNotificaciones(prev => prev.filter(n => n.NotificacionID !== id));
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const formatFecha = (fecha: string) => {
    const d = new Date(fecha);
    return d.toLocaleString("es-CR", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true,
    });
  };

  const esMensajeValido = (msg: string, tipo: string) =>
    msg && msg !== tipo && !msg.includes("_");

  const tipoConfig = {
    solicitud_compra: {
      icon: <ShoppingCart className="size-5 text-blue-600" aria-hidden="true" />,
      bg: "bg-blue-50 border-blue-100",
      badge: "bg-blue-100 text-blue-700",
      label: "Solicitud de compra",
    },
    compra_aceptada: {
      icon: <CheckCircle className="size-5 text-green-600" aria-hidden="true" />,
      bg: "bg-green-50 border-green-100",
      badge: "bg-green-100 text-green-700",
      label: "Compra aceptada",
    },
    compra_completada: {
      icon: <PackageCheck className="size-5 text-purple-600" aria-hidden="true" />,
      bg: "bg-purple-50 border-purple-100",
      badge: "bg-purple-100 text-purple-700",
      label: "Compra completada",
    },
    compra_cancelada: {
      icon: <PackageX className="size-5 text-red-500" aria-hidden="true" />,
      bg: "bg-red-50 border-red-100",
      badge: "bg-red-100 text-red-700",
      label: "Compra cancelada",
    },
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* CABECERA */}
      <div className="flex items-center justify-between border-b pb-6">
        <div className="flex items-center gap-3">
          <Bell className="size-8 text-primary" aria-hidden="true" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Notificaciones</h1>
            <p className="text-muted-foreground text-sm">
              {notificaciones.length} {notificaciones.length === 1 ? "notificación" : "notificaciones"}
            </p>
          </div>
        </div>
      </div>

      {/* CONTENIDO */}
      {cargando ? (
        <div className="flex flex-col items-center justify-center p-20 gap-4" aria-live="polite" aria-busy="true">
          <Loader2 className="animate-spin size-10 text-primary" aria-hidden="true" />
          <p className="text-muted-foreground animate-pulse">Cargando notificaciones...</p>
        </div>
      ) : notificaciones.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white rounded-2xl border-2 border-dashed">
          <Bell className="size-16 text-muted-foreground/20" aria-hidden="true" />
          <div className="text-center">
            <p className="font-semibold text-gray-600">Sin notificaciones</p>
            <p className="text-sm text-muted-foreground mt-1">
              Cuando alguien quiera comprar tu producto, aparecerá aquí
            </p>
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-4 list-none p-0">
          {notificaciones.map((notif) => {
            const config = tipoConfig[notif.Tipo];
            const estaProcesando = procesando === notif.NotificacionID;

            return (
              <li key={notif.NotificacionID}>
                <Card className={`p-5 border ${config.bg} shadow-sm`}>
                  <div className="flex gap-4">
                    {/* Imagen del producto */}
                    <div className="size-16 rounded-lg bg-white border overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {notif.ImagenPath ? (
                        <img
                          src={getImageSrc(notif.ImagenPath)}
                          alt={notif.NombreProducto || "Producto"}
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <ShoppingBag className="size-7 text-muted-foreground opacity-30" aria-hidden="true" />
                      )}
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.badge}`}>
                          {config.icon}
                          {config.label}
                        </span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {formatFecha(notif.FechaCreacion)}
                        </span>
                      </div>

                      <p className="font-bold text-gray-800 text-sm">{notif.Titulo}</p>
                      {esMensajeValido(notif.Mensaje, notif.Tipo) && (
                        <p className="text-sm text-gray-600 mt-1 leading-relaxed">{notif.Mensaje}</p>
                      )}

                      {/* ACCIONES POR TIPO */}
                      <div className="mt-4 flex flex-wrap gap-2">

                        {/* SOLICITUD DE COMPRA */}
                        {notif.Tipo === "solicitud_compra" && (
                          <>
                            <Button
                              size="sm"
                              className="gap-1.5 bg-green-600 hover:bg-green-700"
                              disabled={estaProcesando}
                              aria-label={`Aceptar solicitud de compra de ${notif.NombreProducto}`}
                              onClick={() => handleAceptar(notif)}
                            >
                              {estaProcesando
                                ? <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                                : <CheckCircle className="size-4" aria-hidden="true" />}
                              Aceptar solicitud
                            </Button>
                            {/* [+] Modal de confirmación en vez de confirm() */}
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                              disabled={estaProcesando}
                              aria-label={`Rechazar solicitud de compra de ${notif.NombreProducto}`}
                              onClick={(e) => pedirConfirmacionRechazo(notif, e.currentTarget)}
                            >
                              <XCircle className="size-4" aria-hidden="true" /> Rechazar
                            </Button>
                            {notif.RemitenteID && (
                              <Link to="/app/usuario/$id" params={{ id: String(notif.RemitenteID) }}>
                                <Button size="sm" variant="outline" className="gap-1.5"
                                  aria-label="Ver perfil del comprador"
                                >
                                  <UserIcon className="size-4" aria-hidden="true" /> Ver perfil
                                </Button>
                              </Link>
                            )}
                          </>
                        )}

                        {/* COMPRA ACEPTADA */}
                        {notif.Tipo === "compra_aceptada" && (
                          <>
                            <div className="w-full flex items-center gap-2 bg-white rounded-lg border border-green-200 px-3 py-2">
                              <Phone className="size-4 text-green-600 flex-shrink-0" aria-hidden="true" />
                              <p className="text-sm font-bold text-green-700">
                                {notif.Mensaje.match(/\+?\d[\d\s-]{6,}/)?.[0] || "Ver mensaje"}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="gap-1.5 text-muted-foreground"
                              aria-label="Descartar notificación de compra aceptada"
                              onClick={() => handleEliminar(notif.NotificacionID)}
                            >
                              <Trash2 className="size-4" aria-hidden="true" /> Descartar
                            </Button>
                          </>
                        )}

                        {/* COMPRA COMPLETADA → Calificar vendedor */}
                        {notif.Tipo === "compra_completada" && (
                          <>
                            <Button
                              size="sm"
                              className="gap-1.5 bg-purple-600 hover:bg-purple-700"
                              // [+] aria-label con nombre del producto
                              aria-label={`Calificar al vendedor de ${notif.NombreProducto}`}
                              onClick={() => nav({
                                to: "/app/calificar/$ordenID",
                                params: { ordenID: String(notif.OrdenID) }
                              })}
                            >
                              <Star className="size-4" aria-hidden="true" /> Calificar vendedor
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="gap-1.5 text-muted-foreground"
                              aria-label="Descartar notificación de compra completada"
                              onClick={() => handleEliminar(notif.NotificacionID)}
                            >
                              <Trash2 className="size-4" aria-hidden="true" /> Descartar
                            </Button>
                          </>
                        )}

                        {/* COMPRA CANCELADA */}
                        {notif.Tipo === "compra_cancelada" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1.5 text-muted-foreground"
                            aria-label="Descartar notificación de compra cancelada"
                            onClick={() => handleEliminar(notif.NotificacionID)}
                          >
                            <Trash2 className="size-4" aria-hidden="true" /> Descartar
                          </Button>
                        )}

                      </div>
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {/* [+] MODAL DE CONFIRMACIÓN DE RECHAZO */}
      {confirmRechazo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-rechazo-titulo"
          aria-describedby="confirm-rechazo-descripcion"
          ref={confirmRef}
          onKeyDown={handleConfirmKeyDown}
        >
          <Card className="w-full max-w-sm p-6 bg-white shadow-2xl">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="size-8 text-red-600" aria-hidden="true" />
              </div>
              <h2
                id="confirm-rechazo-titulo"
                data-confirm-title
                tabIndex={-1}
                className="text-lg font-bold text-gray-800 outline-none"
              >
                ¿Rechazar solicitud?
              </h2>
              <p id="confirm-rechazo-descripcion" className="text-sm text-muted-foreground">
                Vas a rechazar la solicitud de compra de{" "}
                <span className="font-semibold text-gray-700">
                  "{confirmRechazo.notif.NombreProducto}"
                </span>.
                El comprador no podrá completar esta compra.
              </p>
              <div className="flex gap-3 w-full pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setConfirmRechazo(null)}
                  disabled={rechazando}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 gap-2"
                  onClick={confirmarRechazo}
                  disabled={rechazando}
                >
                  {rechazando
                    ? <><Loader2 className="size-4 animate-spin" aria-hidden="true" /> Rechazando...</>
                    : <><XCircle className="size-4" aria-hidden="true" /> Sí, rechazar</>
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
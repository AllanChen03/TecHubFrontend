import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { API_URL } from "@/lib/config";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Star, Loader2, ArrowLeft, CheckCircle, User } from "lucide-react";

export const Route = createFileRoute("/app/calificar/$ordenID")({
  component: CalificarPage,
});

interface DetalleOrden {
  OrdenID: number;
  ProductoID: number;
  VendedorID: number;
  NombreProducto: string;
  ImagenPath: string | null;
  VendedorNombre: string;
  VendedorApellidos: string;
  YaCalificado: number;
}

const getImageSrc = (path: string) =>
  path.startsWith("http") ? path : `${API_URL}${path}`;

// [+] Etiquetas descriptivas para cada estrella
const etiquetasValoracion = ["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"];

function CalificarPage() {
  const { ordenID } = Route.useParams();
  const nav = useNavigate();

  const [orden, setOrden] = useState<DetalleOrden | null>(null);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const [valoracion, setValoracion] = useState(0);
  const [hover, setHover] = useState(0);
  const [comentario, setComentario] = useState("");

  const token = localStorage.getItem("techub_token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetchOrden = async () => {
      try {
        const res = await fetch(`${API_URL}/usuarios/ordenes/${ordenID}/detalle`, { headers });
        if (!res.ok) {
          toast.error("Orden no encontrada o no autorizada");
          nav({ to: "/app/notificaciones" });
          return;
        }
        const data = await res.json();
        setOrden(data);
        if (data.YaCalificado > 0) setEnviado(true);
      } catch {
        toast.error("Error al cargar los datos");
        nav({ to: "/app/notificaciones" });
      } finally {
        setCargando(false);
      }
    };
    fetchOrden();
  }, [ordenID]);

  const handleEnviar = async () => {
    if (valoracion === 0) {
      toast.error("Seleccioná una valoración de 1 a 5 estrellas");
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch(`${API_URL}/usuarios/calificar/${ordenID}`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ valoracion, texto: comentario }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar");
      setEnviado(true);
      toast.success("¡Gracias por tu calificación!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4" aria-live="polite" aria-busy="true">
        <Loader2 className="animate-spin size-10 text-primary" aria-hidden="true" />
        <p className="text-muted-foreground animate-pulse">Cargando...</p>
      </div>
    );
  }

  if (!orden) return null;

  return (
    <div className="p-6 max-w-lg mx-auto space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="gap-2 text-muted-foreground hover:text-primary"
        onClick={() => nav({ to: "/app/notificaciones" })}
        aria-label="Volver a la página de notificaciones"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Volver a notificaciones
      </Button>

      <Card className="p-6 shadow-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">Calificar compra</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Tu opinión ayuda a la comunidad TecHub
          </p>
        </div>

        {/* PRODUCTO + VENDEDOR */}
        <div className="flex items-center gap-4 p-4 bg-muted/40 rounded-xl border">
          <div className="size-16 rounded-lg bg-white border overflow-hidden flex-shrink-0 flex items-center justify-center">
            {orden.ImagenPath ? (
              <img
                src={getImageSrc(orden.ImagenPath)}
                alt={orden.NombreProducto}
                className="w-full h-full object-contain p-1"
              />
            ) : (
              <User className="size-7 text-muted-foreground opacity-30" aria-hidden="true" />
            )}
          </div>
          <div>
            <p className="font-bold text-gray-800 line-clamp-1">{orden.NombreProducto}</p>
            <p className="text-sm text-muted-foreground">
              Vendedor: {orden.VendedorNombre} {orden.VendedorApellidos}
            </p>
          </div>
        </div>

        {enviado ? (
          <div className="flex flex-col items-center gap-4 py-6" aria-live="polite">
            <CheckCircle className="size-16 text-green-500" aria-hidden="true" />
            <div className="text-center">
              <p className="font-bold text-gray-800 text-lg">¡Calificación enviada!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Gracias por ayudar a la comunidad TecHub
              </p>
            </div>
            <Button onClick={() => nav({ to: "/app" })} className="mt-2">
              Volver al inicio
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* ESTRELLAS */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                ¿Cómo calificás al vendedor?
              </Label>

              {/*
                [+] role="group" agrupa las estrellas como conjunto lógico
                [+] aria-live anuncia el cambio de selección a NVDA
              */}
              <div
                role="group"
                aria-label="Seleccionar valoración de 1 a 5 estrellas"
                className="flex justify-center gap-2 py-2"
              >
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setValoracion(i)}
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(0)}
                    // [+] NVDA leerá: "1 estrella: Muy malo, botón" y si está seleccionada "presionado"
                    aria-label={`${i} ${i === 1 ? "estrella" : "estrellas"}: ${etiquetasValoracion[i]}`}
                    aria-pressed={valoracion === i}
                    className="transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                  >
                    <Star
                      className={`size-10 transition-colors ${
                        i <= (hover || valoracion)
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-gray-200 text-gray-200"
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>

              {/* [+] aria-live anuncia la etiqueta al seleccionar */}
              <p
                className="text-center text-sm font-medium text-muted-foreground min-h-[1.25rem]"
                aria-live="polite"
                aria-atomic="true"
              >
                {(hover || valoracion) > 0
                  ? `${hover || valoracion} ${(hover || valoracion) === 1 ? "estrella" : "estrellas"}: ${etiquetasValoracion[hover || valoracion]}`
                  : ""}
              </p>
            </div>

            {/* COMENTARIO */}
            <div className="space-y-2">
              <Label htmlFor="comentario-vendedor" className="text-sm font-semibold">
                Comentario <span className="text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <textarea
                id="comentario-vendedor"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                placeholder="Contá tu experiencia con el vendedor..."
                maxLength={300}
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                aria-describedby="contador-vendedor"
              />
              {/* [+] aria-live para que NVDA anuncie el contador al escribir */}
              <p
                id="contador-vendedor"
                className="text-xs text-muted-foreground text-right"
                aria-live="polite"
                aria-atomic="true"
              >
                {comentario.length}/300 caracteres
              </p>
            </div>

            <Button
              className="w-full h-12 text-base gap-2"
              disabled={valoracion === 0 || enviando}
              onClick={handleEnviar}
              // [+] aria-label descriptivo con la valoración seleccionada
              aria-label={valoracion > 0
                ? `Enviar calificación de ${valoracion} ${valoracion === 1 ? "estrella" : "estrellas"} al vendedor ${orden.VendedorNombre}`
                : "Enviar calificación (seleccioná una valoración primero)"
              }
            >
              {enviando ? (
                <><Loader2 className="size-5 animate-spin" aria-hidden="true" /> Enviando...</>
              ) : (
                <><Star className="size-5" aria-hidden="true" /> Enviar calificación</>
              )}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
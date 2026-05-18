import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { API_URL } from "@/lib/config";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star, Loader2, ShoppingBag, Store, ShoppingCart } from "lucide-react";

export const Route = createFileRoute("/app/usuario/$id")({
  component: PerfilPublicoPage,
});

interface PerfilPublico {
  UsuarioID: number;
  Nombre: string;
  Apellidos: string;
  PromedioVendedor: number | null;
  PromedioComprador: number | null;
}

interface Comentario {
  ComentarioID: number;
  Comentario: string;
  Valoracion: number;
  Fecha: string;
  NombreProducto: string;
  CompradorNombre: string;
  CompradorApellidos: string;
}

function Estrellas({ promedio, size = "4" }: { promedio: number | null; size?: string }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`size-${size} ${
            promedio && i <= Math.round(promedio)
              ? "fill-yellow-400 text-yellow-400"
              : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

function PerfilPublicoPage() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const [perfil, setPerfil] = useState<PerfilPublico | null>(null);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [cargando, setCargando] = useState(true);

  const token = localStorage.getItem("techub_token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetchPerfil = async () => {
      setCargando(true);
      try {
        const [resPerfil, resComs] = await Promise.all([
          fetch(`${API_URL}/usuarios/perfil-publico/${id}`, { headers }),
          fetch(`${API_URL}/usuarios/perfil-publico/${id}/comentarios`, { headers }),
        ]);

        if (!resPerfil.ok) {
          toast.error("Usuario no encontrado");
          nav({ to: "/app/productos" });
          return;
        }

        setPerfil(await resPerfil.json());
        if (resComs.ok) setComentarios(await resComs.json());
      } catch {
        toast.error("Error al cargar el perfil");
      } finally {
        setCargando(false);
      }
    };
    fetchPerfil();
  }, [id]);

  const formatFecha = (fecha: string) =>
    new Date(fecha).toLocaleString("es-CR", {
      day: "numeric", month: "short", year: "numeric",
    });

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="animate-spin size-10 text-primary" />
        <p className="text-muted-foreground animate-pulse">Cargando perfil...</p>
      </div>
    );
  }

  if (!perfil) return null;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="gap-2 text-muted-foreground hover:text-primary"
        onClick={() => window.history.back()}
      >
        <ArrowLeft className="size-4" /> Volver
      </Button>

      {/* CARD PERFIL */}
      <Card className="p-6 shadow-sm space-y-5">
        {/* Nombre */}
        <div className="flex items-center gap-4">
          <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xl flex-shrink-0">
            {perfil.Nombre.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              {perfil.Nombre} {perfil.Apellidos}
            </h1>
            <p className="text-sm text-muted-foreground">Estudiante TEC</p>
          </div>
        </div>

        {/* Dos valoraciones */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
            <div className="flex items-center gap-1.5 mb-2">
              <Store className="size-3.5 text-yellow-600" />
              <p className="text-xs font-bold text-yellow-700 uppercase tracking-wide">Como vendedor</p>
            </div>
            <Estrellas promedio={perfil.PromedioVendedor} />
            <p className="text-sm font-bold text-gray-700 mt-1">
              {perfil.PromedioVendedor !== null
                ? <>{perfil.PromedioVendedor.toFixed(1)}<span className="text-muted-foreground font-normal"> / 5.0</span></>
                : <span className="text-muted-foreground font-normal text-xs">Sin valoraciones</span>}
            </p>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-1.5 mb-2">
              <ShoppingCart className="size-3.5 text-blue-600" />
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Como comprador</p>
            </div>
            <Estrellas promedio={perfil.PromedioComprador} />
            <p className="text-sm font-bold text-gray-700 mt-1">
              {perfil.PromedioComprador !== null
                ? <>{perfil.PromedioComprador.toFixed(1)}<span className="text-muted-foreground font-normal"> / 5.0</span></>
                : <span className="text-muted-foreground font-normal text-xs">Sin valoraciones</span>}
            </p>
          </div>
        </div>
      </Card>

      {/* RESEÑAS COMO VENDEDOR */}
      <div className="space-y-3">
        <h2 className="font-bold text-gray-800 border-b pb-3">
          Reseñas recibidas
          {comentarios.length > 0 && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({comentarios.length})
            </span>
          )}
        </h2>

        {comentarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 bg-white rounded-2xl border-2 border-dashed">
            <ShoppingBag className="size-12 text-muted-foreground/20" />
            <p className="text-muted-foreground text-sm">Este usuario aún no tiene reseñas</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {comentarios.map((c) => (
              <Card key={c.ComentarioID} className="p-4 shadow-sm bg-white">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-sm text-gray-800">
                      {c.CompradorNombre} {c.CompradorApellidos}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {c.NombreProducto} · {formatFecha(c.Fecha)}
                    </p>
                  </div>
                  <div className="flex gap-0.5 flex-shrink-0">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className={`size-3.5 ${i <= c.Valoracion ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`} />
                    ))}
                  </div>
                </div>
                {c.Comentario && (
                  <p className="text-sm text-gray-600 leading-relaxed">{c.Comentario}</p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
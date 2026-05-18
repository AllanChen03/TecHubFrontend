import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { API_URL } from "@/lib/config";
import { LayoutGrid, Image as ImageIcon, Loader2, Search } from "lucide-react";

export const Route = createFileRoute("/app/categorias")({
  component: CategoriasPage,
});

interface Categoria {
  CategoriaID: number;
  NombreCategoria: string;
  ImagenPath: string | null;
}

function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    const cargarCategorias = async () => {
      const token = localStorage.getItem('techub_token');
      try {
        const respuesta = await fetch(`${API_URL}/usuarios/categorias`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (respuesta.ok) {
          const data = await respuesta.json();
          setCategorias(data);
        } else {
          toast.error("Error al obtener las categorías");
        }
      } catch (error) {
        toast.error("No se pudo conectar con el servidor");
      } finally {
        setLoading(false);
      }
    };
    cargarCategorias();
  }, []);

  const filtradas = [...categorias]
    .sort((a, b) => a.NombreCategoria.localeCompare(b.NombreCategoria))
    .filter(c => c.NombreCategoria.toLowerCase().includes(busqueda.toLowerCase()));

  // ✅ Resuelve tanto URLs de Cloudinary como paths locales antiguos
  const getImageSrc = (path: string) =>
    path.startsWith("http") ? path : `${API_URL}${path}`;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="animate-spin size-10 text-primary" />
        <p className="text-muted-foreground animate-pulse">Cargando catálogo...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div className="flex items-center gap-3">
          <LayoutGrid className="size-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Categorías</h1>
            <p className="text-muted-foreground text-sm">Explora materiales por área de estudio</p>
          </div>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar categoría..."
            className="pl-9 bg-white"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      {/* CUADRÍCULA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filtradas.map((c) => (
          <Link
            key={c.CategoriaID}
            to="/app/productos"
            search={{ categoriaID: c.CategoriaID }}
            className="group"
          >
            <Card className="overflow-hidden flex flex-col h-full hover:shadow-xl hover:border-primary/50 transition-all duration-300 cursor-pointer border-muted bg-white">
              <div className="h-44 bg-muted relative overflow-hidden">
                {c.ImagenPath ? (
                  <img
                    src={getImageSrc(c.ImagenPath)}
                    alt={c.NombreCategoria}
                    className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-primary/5">
                    <ImageIcon className="size-12 opacity-20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              <div className="p-4 text-center">
                <h3 className="font-bold text-gray-700 group-hover:text-primary transition-colors truncate">
                  {c.NombreCategoria}
                </h3>
                <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0">
                  Ver productos
                </p>
              </div>
            </Card>
          </Link>
        ))}

        {filtradas.length === 0 && (
          <div className="col-span-full p-20 text-center bg-white rounded-2xl border-2 border-dashed">
            <Search className="size-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">
              {busqueda !== ""
                ? `No encontramos resultados para "${busqueda}"`
                : "No hay categorías disponibles."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
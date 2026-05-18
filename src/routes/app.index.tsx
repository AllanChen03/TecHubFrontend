import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, ShoppingBag, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "@/lib/config";

export const Route = createFileRoute("/app/")({
  component: HomePage,
});

const getImageSrc = (path: string) =>
  path.startsWith("http") ? path : `${API_URL}${path}`;

function HomePage() {
  const [categorias, setCategorias] = useState([]);
  const [productosBackend, setProductosBackend] = useState([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    const cargarDatos = async () => {
      const token = localStorage.getItem('techub_token');

      if (!token) {
        toast.error("No tienes sesión iniciada");
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      try {
        const resCategorias = await fetch(`${API_URL}/usuarios/categorias`, { headers });
        if (resCategorias.ok) {
          const dataCat = await resCategorias.json();
          setCategorias(dataCat);
        }

        const resProductos = await fetch(`${API_URL}/usuarios/productos`, { headers });
        if (resProductos.ok) {
          const dataProd = await resProductos.json();
          setProductosBackend(dataProd);
        }
      } catch (error) {
        console.error("Error al conectar con el servidor", error);
        toast.error("Error cargando el catálogo");
      }
    };

    cargarDatos();
  }, []);

  const productosFiltrados = useMemo(
    () => productosBackend.filter((p: any) =>
      p.NombreProducto?.toLowerCase().includes(q.toLowerCase())
    ),
    [productosBackend, q]
  );

  // Primeras 7 ordenadas por nombre, el 8vo slot es el botón "Ver todas"
  const categoriasOrdenadas = useMemo(() =>
    [...categorias]
      .sort((a: any, b: any) => a.NombreCategoria.localeCompare(b.NombreCategoria))
      .slice(0, 7),
    [categorias]
  );

  return (
    <div className="space-y-6">
      {/* BANNER */}
      <div className="bg-gradient-to-r from-primary to-primary-soft text-primary-foreground rounded-xl p-6 shadow-md">
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Bienvenido a TecHub</h1>
        <p className="opacity-90 text-sm md:text-base">Compra y vende materiales académicos dentro de la comunidad TEC.</p>
        <div className="relative mt-4 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar productos..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 bg-background text-foreground"
          />
        </div>
      </div>

      {/* CATEGORÍAS */}
      <section>
        <h2 className="font-semibold text-lg mb-3">Categorías</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {categoriasOrdenadas.map((c: any) => (
            <Link
              key={c.CategoriaID}
              to="/app/productos"
              search={{ categoriaID: c.CategoriaID }}
              className="bg-card border rounded-lg p-4 text-center hover:shadow-md hover:border-primary transition"
            >
              <div className="flex justify-center mb-2">
                {c.ImagenPath ? (
                  <img
                    src={getImageSrc(c.ImagenPath)}
                    alt={c.NombreCategoria}
                    className="w-12 h-12 object-contain"
                  />
                ) : (
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xl">
                    {c.NombreCategoria?.charAt(0)}
                  </div>
                )}
              </div>
              <div className="text-sm font-medium">{c.NombreCategoria}</div>
            </Link>
          ))}

          {/* Botón "Ver todas" ocupa el 8vo slot del grid */}
          <Link
            to="/app/categorias"
            className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center hover:bg-primary/10 hover:border-primary hover:shadow-md transition flex flex-col items-center justify-center gap-2"
          >
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <LayoutGrid className="size-5 text-primary" />
            </div>
            <div className="text-sm font-medium text-primary">Ver todas</div>
          </Link>
        </div>
      </section>

      {/* PRODUCTOS DESTACADOS */}
      <section>
        <h2 className="font-semibold text-lg mb-3">Productos destacados</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {productosFiltrados.map((p: any) => (
            <Link
              key={p.ProductoID}
              to="/app/productos/$id"
              params={{ id: String(p.ProductoID) }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition cursor-pointer h-full">
                <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                  {p.ImagenPath ? (
                    <img
                      src={getImageSrc(p.ImagenPath)}
                      alt={p.NombreProducto}
                      className="w-full h-full object-contain p-4"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-muted-foreground">
                      <ShoppingBag className="size-8 opacity-20" />
                      <span className="text-[10px] mt-1">Sin imagen</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="font-medium text-sm line-clamp-1">
                    {p.NombreProducto}
                  </div>
                  <div className="text-primary font-bold text-sm mt-1">
                    ₡{Number(p.Precio).toLocaleString()}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
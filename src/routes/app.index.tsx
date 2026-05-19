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
      if (!token) { toast.error("No tienes sesión iniciada"); return; }
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      try {
        const resCategorias = await fetch(`${API_URL}/usuarios/categorias`, { headers });
        if (resCategorias.ok) setCategorias(await resCategorias.json());

        const resProductos = await fetch(`${API_URL}/usuarios/productos`, { headers });
        if (resProductos.ok) setProductosBackend(await resProductos.json());
      } catch (error) {
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
        <p className="opacity-90 text-sm md:text-base">
          Compra y vende materiales académicos dentro de la comunidad TEC.
        </p>
        <div className="relative mt-4 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder="Buscar productos..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 bg-background text-foreground"
            // [+] NVDA sabe qué hace el campo y cuántos resultados hay
            aria-label="Buscar productos por nombre"
            aria-describedby="resultados-productos-inicio"
          />
        </div>
        {/* [+] Anuncia cuántos productos coinciden al escribir */}
        <p
          id="resultados-productos-inicio"
          className="sr-only"
          aria-live="polite"
          aria-atomic="true"
        >
          {q
            ? `${productosFiltrados.length} ${productosFiltrados.length === 1 ? "producto encontrado" : "productos encontrados"} para "${q}"`
            : ""
          }
        </p>
      </div>

      {/* CATEGORÍAS */}
      {/* [+] aria-labelledby conecta el <section> con el <h2> — NVDA anuncia "Categorías, región" */}
      <section aria-labelledby="titulo-categorias">
        <h2 id="titulo-categorias" className="font-semibold text-lg mb-3">Categorías</h2>

        {/* [+] ul/li para que NVDA anuncie cuántas categorías hay */}
        <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3 list-none p-0">
          {categoriasOrdenadas.map((c: any) => (
            <li key={c.CategoriaID}>
              <Link
                to="/app/productos"
                search={{ categoriaID: c.CategoriaID }}
                className="bg-card border rounded-lg p-4 text-center hover:shadow-md hover:border-primary transition block"
                // [+] NVDA leerá: "Calculadora, ver productos de esta categoría, vínculo"
                aria-label={`${c.NombreCategoria}, ver productos de esta categoría`}
              >
                <div className="flex justify-center mb-2">
                  {c.ImagenPath ? (
                    <img
                      src={getImageSrc(c.ImagenPath)}
                      alt=""
                      aria-hidden="true"
                      className="w-12 h-12 object-contain"
                    />
                  ) : (
                    <div
                      className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xl"
                      aria-hidden="true"
                    >
                      {c.NombreCategoria?.charAt(0)}
                    </div>
                  )}
                </div>
                {/* aria-hidden porque el aria-label del Link ya lo anuncia */}
                <div className="text-sm font-medium" aria-hidden="true">
                  {c.NombreCategoria}
                </div>
              </Link>
            </li>
          ))}

          {/* Botón "Ver todas" */}
          <li>
            <Link
              to="/app/categorias"
              className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center hover:bg-primary/10 hover:border-primary hover:shadow-md transition flex flex-col items-center justify-center gap-2 h-full"
              aria-label="Ver todas las categorías disponibles"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <LayoutGrid className="size-5 text-primary" aria-hidden="true" />
              </div>
              <div className="text-sm font-medium text-primary" aria-hidden="true">Ver todas</div>
            </Link>
          </li>
        </ul>
      </section>

      {/* PRODUCTOS DESTACADOS */}
      {/* [+] aria-labelledby conecta el <section> con el <h2> */}
      <section aria-labelledby="titulo-productos">
        <h2 id="titulo-productos" className="font-semibold text-lg mb-3">
          {q ? `Resultados para "${q}"` : "Productos destacados"}
        </h2>

        {productosFiltrados.length === 0 && q && (
          <p className="text-muted-foreground text-sm p-6 text-center bg-white rounded-xl border border-dashed">
            No se encontraron productos para "{q}"
          </p>
        )}

        {/* [+] ul/li para que NVDA anuncie cuántos productos hay */}
        <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 list-none p-0">
          {productosFiltrados.map((p: any) => (
            <li key={p.ProductoID}>
              <Link
                to="/app/productos/$id"
                params={{ id: String(p.ProductoID) }}
                className="block h-full"
                // [+] NVDA leerá: "Casio FX-5800P, precio 14,000 colones, vínculo"
                aria-label={`${p.NombreProducto}, precio ${Number(p.Precio).toLocaleString()} colones`}
              >
                <Card className="overflow-hidden hover:shadow-lg transition cursor-pointer h-full">
                  <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                    {p.ImagenPath ? (
                      <img
                        src={getImageSrc(p.ImagenPath)}
                        alt=""
                        aria-hidden="true"
                        className="w-full h-full object-contain p-4"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-muted-foreground">
                        <ShoppingBag className="size-8 opacity-20" aria-hidden="true" />
                        <span className="text-[10px] mt-1" aria-hidden="true">Sin imagen</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    {/* aria-hidden porque el aria-label del Link ya lo anuncia */}
                    <div className="font-medium text-sm line-clamp-1" aria-hidden="true">
                      {p.NombreProducto}
                    </div>
                    <div className="text-primary font-bold text-sm mt-1" aria-hidden="true">
                      ₡{Number(p.Precio).toLocaleString()}
                    </div>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
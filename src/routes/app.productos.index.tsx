import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useRef } from "react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  Search,
  ShoppingBag,
  FilterX,
  Loader2,
  Package,
  MapPin
} from "lucide-react";

import { API_URL } from "@/lib/config";

export const Route = createFileRoute("/app/productos/")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      categoriaID: search.categoriaID
        ? Number(search.categoriaID)
        : undefined,
    };
  },
  component: ProductosCatalogPage,
});

interface Sede {
  SedeID: number;
  NombreSede: string;
}

function ProductosCatalogPage() {

  const { categoriaID } = Route.useSearch();

  const [productos, setProductos] = useState([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [sedeSeleccionada, setSedeSeleccionada] = useState<number | "">("");
  const [loading, setLoading] = useState(true);
  const [mensajeBusqueda, setMensajeBusqueda] = useState("");

  const buscadorRef = useRef<HTMLInputElement>(null);
  const tituloRef = useRef<HTMLHeadingElement>(null);

  const token = localStorage.getItem("techub_token");
  const headers = { Authorization: `Bearer ${token}` };

  // ==========================================
  // CARGAR DATOS
  // ==========================================
  useEffect(() => {
    const fetchDatos = async () => {
      try {
        const [resProductos, resSedes] = await Promise.all([
          fetch(`${API_URL}/usuarios/productos`, { headers }),
          fetch(`${API_URL}/usuarios/sedes`, { headers }),
        ]);
        if (resProductos.ok) setProductos(await resProductos.json());
        if (resSedes.ok) setSedes(await resSedes.json());
      } catch (error) {
        console.error("Error cargando productos", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDatos();
  }, []);

  // ==========================================
  // MOVER FOCO AL TÍTULO AL MONTAR
  // ==========================================
  useEffect(() => {
    const timer = setTimeout(() => {
      tituloRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // ==========================================
  // FILTRAR PRODUCTOS
  // ==========================================
  const productosFiltrados = useMemo(() => {
    return productos.filter((p: any) => {
      const cumpleCategoria = categoriaID
        ? Number(p.CategoriaID) === categoriaID
        : true;
      const cumpleBusqueda = p.NombreProducto
        ?.toLowerCase()
        .includes(busqueda.toLowerCase());
      const cumpleSede = sedeSeleccionada !== ""
        ? Number(p.SedeID) === Number(sedeSeleccionada)
        : true;
      return cumpleCategoria && cumpleBusqueda && cumpleSede;
    });
  }, [productos, categoriaID, busqueda, sedeSeleccionada]);

  // ==========================================
  // MENSAJES PARA NVDA — con debounce
  // ─────────────────────────────────────────
  // Sin debounce: NVDA recibe un mensaje nuevo
  // por cada letra escrita y los cancela entre
  // sí antes de terminar de leerlos.
  //
  // Con 600ms: el mensaje se anuncia solo cuando
  // el usuario deja de escribir, o al instante
  // si cambia la sede (no hay debounce en ese
  // caso porque no hay escritura continua).
  // ==========================================
  useEffect(() => {
    if (loading) return;

    const timer = setTimeout(() => {

      // Sin filtros activos → silencio
      if (busqueda.trim() === "" && sedeSeleccionada === "" && !categoriaID) {
        setMensajeBusqueda("");
        return;
      }

      // Con filtros → anunciar resultado
      if (productosFiltrados.length === 0) {
        setMensajeBusqueda("No se encontraron productos con esos filtros.");
      } else {
        const n = productosFiltrados.length;
        setMensajeBusqueda(
          `${n} producto${n === 1 ? "" : "s"} encontrado${n === 1 ? "" : "s"}.`
        );
      }

    }, 600); // esperar 600ms después de la última pulsación

    return () => clearTimeout(timer); // cancelar si el usuario sigue escribiendo

  }, [productosFiltrados, busqueda, sedeSeleccionada, categoriaID, loading]);

  // ==========================================
  // LIMPIAR FILTROS
  // ==========================================
  const limpiarFiltros = () => {
    setBusqueda("");
    setSedeSeleccionada("");
    setTimeout(() => {
      buscadorRef.current?.focus();
    }, 100);
  };

  const hayFiltros =
    categoriaID || sedeSeleccionada !== "" || busqueda.trim() !== "";

  // ==========================================
  // LOADING
  // ==========================================
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="animate-spin size-10 text-primary" />
        <p className="text-muted-foreground animate-pulse">
          Cargando productos...
        </p>
      </div>
    );
  }

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">

      {/* CABECERA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">

        {/* TITULO */}
        <div className="flex items-center gap-3">

          <Package className="size-8 text-primary" aria-hidden="true" />

          <div>
            <h1
              ref={tituloRef}
              tabIndex={-1}
              className="text-3xl font-bold text-gray-800 outline-none"
            >
              Productos
            </h1>

            <p className="text-muted-foreground text-sm">
              {categoriaID
                ? "Filtrando por la categoría seleccionada"
                : "Explora todos los artículos de la comunidad"}
            </p>
          </div>

        </div>

        {/* FILTROS */}
        <div
          role="search"
          aria-label="Buscar y filtrar productos"
          className="flex flex-wrap items-center gap-2 w-full md:w-auto"
        >

          {/* BUSCADOR */}
          <div className="relative w-full md:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              ref={buscadorRef}
              aria-label="Buscar productos por nombre"
              placeholder="¿Qué estás buscando hoy?"
              className="pl-9 bg-white"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          {/* FILTRO SEDE */}
          <div className="relative">
            <MapPin
              className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            />
            <select
              aria-label="Filtrar productos por sede"
              className="h-10 pl-9 pr-4 rounded-md border border-input bg-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
              value={sedeSeleccionada}
              onChange={(e) =>
                setSedeSeleccionada(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
            >
              <option value="">Todas las sedes</option>
              {sedes.map((s) => (
                <option key={s.SedeID} value={s.SedeID}>
                  {s.NombreSede}
                </option>
              ))}
            </select>
          </div>

          {/* BOTON LIMPIAR */}
          {hayFiltros && (
            <Button
              aria-label="Limpiar filtros de búsqueda"
              variant="outline"
              className="whitespace-nowrap gap-1.5"
              onClick={limpiarFiltros}
            >
              <FilterX className="size-4" aria-hidden="true" />
              Limpiar
            </Button>
          )}

        </div>

      </div>

      {/*
       * [ACCESIBILIDAD] aria-live + aria-atomic
       * ─────────────────────────────────────────
       * aria-live="polite" → NVDA espera a que
       * el usuario termine de leer lo actual
       * antes de anunciar el nuevo mensaje.
       *
       * aria-atomic="true" → NVDA lee el mensaje
       * completo, no solo la parte que cambió.
       * Sin esto podría leer solo el número.
       *
       * sr-only → invisible visualmente pero
       * presente en el árbol de accesibilidad.
       */}
      <div
        aria-live="polite"
        aria-atomic="true"
        role="status"
        className="sr-only"
      >
        {mensajeBusqueda}
      </div>

      {/* GRID PRODUCTOS */}
      <ul
        aria-label={
          productosFiltrados.length > 0
            ? `${productosFiltrados.length} productos disponibles`
            : "Sin resultados"
        }
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 list-none p-0 m-0"
      >

        {productosFiltrados.length > 0 ? (

          productosFiltrados.map((p: any) => (
            <li key={p.ProductoID} className="contents">
              <Link
                to="/app/productos/$id"
                params={{ id: String(p.ProductoID) }}
                className="group"
                aria-label={`${p.NombreProducto}, precio ₡${Number(p.Precio).toLocaleString()}, estado ${p.EstadoProducto || "no especificado"}, sede ${p.NombreSede || "no especificada"}`}
              >
                <Card className="overflow-hidden flex flex-col h-full hover:shadow-xl hover:border-primary/50 transition-all duration-300 cursor-pointer border-muted bg-white">

                  {/* IMAGEN */}
                  <div className="h-44 bg-muted relative overflow-hidden">
                    {p.ImagenPath ? (
                      <img
                        src={
                          p.ImagenPath?.startsWith("http")
                            ? p.ImagenPath
                            : `${API_URL}${p.ImagenPath}`
                        }
                        alt=""
                        className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-muted-foreground bg-primary/5"
                        aria-hidden="true"
                      >
                        <ShoppingBag className="size-12 opacity-20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  {/* INFO visual — aria-hidden porque el Link ya lo anuncia */}
                  <div className="p-4 flex flex-col gap-1" aria-hidden="true">
                    <h3 className="font-bold text-gray-700 group-hover:text-primary transition-colors line-clamp-1">
                      {p.NombreProducto}
                    </h3>
                    <p className="text-primary font-black text-lg">
                      ₡{Number(p.Precio).toLocaleString()}
                    </p>
                    <div className="flex flex-col gap-0.5 mt-1">
                      <span className="text-xs text-muted-foreground">
                        <span className="font-semibold text-gray-500">Estado:</span>{" "}
                        {p.EstadoProducto || "—"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        <span className="font-semibold text-gray-500">Sede:</span>{" "}
                        {p.NombreSede || "—"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        <span className="font-semibold text-gray-500">Categoría:</span>{" "}
                        {p.NombreCategoria || "—"}
                      </span>
                    </div>
                    <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0">
                      Ver detalles →
                    </p>
                  </div>

                </Card>
              </Link>
            </li>
          ))

        ) : (

          <li className="col-span-full py-20 text-center bg-white rounded-2xl border-2 border-dashed">
            <FilterX
              className="size-12 mx-auto mb-4 text-muted-foreground/20"
              aria-hidden="true"
            />
            <p className="text-muted-foreground font-medium">
              No encontramos productos con esos filtros.
              Prueba limpiando filtros en el botón "Limpiar"
              o realizando otra búsqueda.
            </p>
          </li>

        )}

      </ul>

    </div>
  );
}

export default ProductosCatalogPage;
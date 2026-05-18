import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { API_URL } from "@/lib/config";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Package, Search, Loader2, Image as ImageIcon } from "lucide-react";

export const Route = createFileRoute("/admin/ordenes")({
  component: AdminOrdenes,
});

interface Orden {
  OrdenID: number;
  Fecha: string;
  PrecioTotal: number;
  EstadoID: number;
  NombreEstado: string;
  NombreProducto: string;
  ImagenPath: string | null;
  CompradorNombre: string;
  CompradorApellidos: string;
  VendedorNombre: string;
  VendedorApellidos: string;
}

const getImageSrc = (path: string) =>
  path.startsWith("http") ? path : `${API_URL}${path}`;

const estadoConfig: Record<number, { label: string; clase: string }> = {
  1: { label: "Pendiente",  clase: "bg-yellow-100 text-yellow-800" },
  2: { label: "Completada", clase: "bg-green-100  text-green-800"  },
  3: { label: "Cancelada",  clase: "bg-red-100    text-red-800"    },
};

function AdminOrdenes() {
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  const headers = { Authorization: `Bearer ${localStorage.getItem("techub_token")}` };

  useEffect(() => { cargarOrdenes(); }, []);

  const cargarOrdenes = async () => {
    setCargando(true);
    try {
      const res = await fetch(`${API_URL}/admin/ordenes`, { headers });
      if (!res.ok) throw new Error("Error al obtener órdenes");
      setOrdenes(await res.json());
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCargando(false);
    }
  };

  const formatFecha = (fecha: string) =>
    new Date(fecha).toLocaleString("es-CR", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true,
    });

  const filtradas = ordenes.filter(o =>
    o.NombreProducto.toLowerCase().includes(busqueda.toLowerCase()) ||
    `${o.CompradorNombre} ${o.CompradorApellidos}`.toLowerCase().includes(busqueda.toLowerCase()) ||
    `${o.VendedorNombre} ${o.VendedorApellidos}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Package className="size-8 text-primary" />
          <h1 className="text-3xl font-bold text-gray-800">Gestión de Órdenes</h1>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            placeholder="Buscar por producto, comprador o vendedor..."
            className="pl-9 bg-white"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      {/* TABLA */}
      <Card className="p-0 overflow-hidden shadow-sm">
        {cargando ? (
          <div className="flex justify-center p-20">
            <Loader2 className="animate-spin size-10 text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="p-4 font-semibold text-gray-600">ID</th>
                  <th className="p-4 font-semibold text-gray-600">Producto</th>
                  <th className="p-4 font-semibold text-gray-600">Comprador</th>
                  <th className="p-4 font-semibold text-gray-600">Vendedor</th>
                  <th className="p-4 font-semibold text-gray-600 text-right">Total</th>
                  <th className="p-4 font-semibold text-gray-600 text-center">Estado</th>
                  <th className="p-4 font-semibold text-gray-600">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtradas.map(o => {
                  const estado = estadoConfig[o.EstadoID] ?? { label: o.NombreEstado, clase: "bg-gray-100 text-gray-700" };
                  return (
                    <tr key={o.OrdenID} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-gray-500">#{o.OrdenID}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="size-9 rounded-lg bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center border">
                            {o.ImagenPath ? (
                              <img src={getImageSrc(o.ImagenPath)} alt={o.NombreProducto} className="w-full h-full object-contain p-1" />
                            ) : (
                              <ImageIcon className="size-4 text-muted-foreground opacity-30" />
                            )}
                          </div>
                          <span className="font-medium text-gray-900 line-clamp-1 max-w-[140px]">{o.NombreProducto}</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-600">{o.CompradorNombre} {o.CompradorApellidos}</td>
                      <td className="p-4 text-gray-600">{o.VendedorNombre} {o.VendedorApellidos}</td>
                      <td className="p-4 text-right font-bold text-primary">
                        ₡{Number(o.PrecioTotal).toLocaleString()}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${estado.clase}`}>
                          {estado.label}
                        </span>
                      </td>
                      <td className="p-4 text-gray-500 text-sm">{formatFecha(o.Fecha)}</td>
                    </tr>
                  );
                })}
                {filtradas.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      {busqueda ? `No se encontraron órdenes con "${busqueda}"` : "No hay órdenes registradas."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
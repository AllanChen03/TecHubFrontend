import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/publicaciones/editar/$id")({
  component: EditarPublicacion,
});

function EditarPublicacion() {
  const { id } = useParams({ from: "/app/publicaciones/editar/$id" });
  const { db, setDB } = useAuth();
  const nav = useNavigate();
  const prod = db.products.find((p) => p.id === id);
  const [f, setF] = useState(prod ? {
    nombre: prod.nombre, precio: String(prod.precio), estado: prod.estado,
    categoria: prod.categoria, descripcion: prod.descripcion,
  } : null);

  if (!prod || !f) return <div>Producto no encontrado</div>;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setDB((prev) => ({
      ...prev,
      products: prev.products.map((p) => p.id === id ? { ...p, nombre: f.nombre, precio: Number(f.precio), estado: f.estado, categoria: f.categoria, descripcion: f.descripcion } : p),
    }));
    toast.success("Cambios guardados");
    nav({ to: "/app/publicaciones" });
  };

  return (
    <Card className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-primary text-center mb-6">Editar Producto</h1>
      <form onSubmit={submit} className="space-y-3">
        <div><Label>Nombre</Label><Input value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Precio</Label><Input type="number" value={f.precio} onChange={(e) => setF({ ...f, precio: e.target.value })} /></div>
          <div>
            <Label>Estado</Label>
            <Select value={f.estado} onValueChange={(v) => setF({ ...f, estado: v as "Nuevo" | "Usado" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Nuevo">Nuevo</SelectItem>
                <SelectItem value="Usado">Usado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label>Categoría</Label>
          <Select value={f.categoria} onValueChange={(v) => setF({ ...f, categoria: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {db.categories.map((c) => <SelectItem key={c.id} value={c.nombre}>{c.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div><Label>Descripción</Label><Textarea value={f.descripcion} onChange={(e) => setF({ ...f, descripcion: e.target.value })} /></div>
        <div className="flex gap-2 pt-3">
          <Button type="button" variant="outline" className="flex-1" onClick={() => nav({ to: "/app/publicaciones" })}>Volver</Button>
          <Button type="submit" className="flex-1">Guardar cambios</Button>
        </div>
      </form>
    </Card>
  );
}

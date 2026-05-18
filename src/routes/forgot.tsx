import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { KeyRound, Mail, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "@/lib/config";

export const Route = createFileRoute("/forgot")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const nav = useNavigate();
  const [step, setStep] = useState(1); // 1: Pedir Correo, 2: Poner Código y Nueva Contraseña
  
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // PASO 1: Enviar correo
  const onSolicitar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const res = await fetch(`${API_URL}/usuarios/recuperarContrasena`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(data.mensaje);
        setStep(2);
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error("Error al conectar con el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  // PASO 2: Restablecer
  const onRestablecer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      return toast.error("Las nuevas contraseñas no coinciden");
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/usuarios/restablecerContrasena`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, codigo, nuevaPassword: newPassword })
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(data.mensaje);
        nav({ to: "/login" }); // Lo mandamos al login para que entre con su nueva clave
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error("Error al procesar el cambio.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8 shadow-lg border-t-4 border-t-primary">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-primary/10 p-3 rounded-full mb-3">
            {step === 1 ? <Mail className="size-8 text-primary" /> : <KeyRound className="size-8 text-primary" />}
          </div>
          <h1 className="text-2xl font-bold">
            {step === 1 ? "Recuperar Contraseña" : "Crear Nueva Contraseña"}
          </h1>
          <p className="text-sm text-muted-foreground text-center mt-1">
            {step === 1 
              ? "Ingresa tu correo institucional y te enviaremos un código." 
              : `Ingresa el código enviado a ${email}`}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={onSolicitar} className="space-y-4">
            <div className="space-y-2">
              <Label>Correo Institucional</Label>
              <Input 
                type="email" 
                placeholder="usuario@estudiantec.cr" 
                required 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Enviando..." : "Enviar Código"}
            </Button>
          </form>
        ) : (
          <form onSubmit={onRestablecer} className="space-y-4">
            <div className="space-y-2">
              <Label>Código de Verificación</Label>
              <Input 
                placeholder="000000" 
                className="text-center text-2xl tracking-[0.5em]" 
                maxLength={6} 
                required 
                value={codigo} 
                onChange={e => setCodigo(e.target.value)} 
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label>Nueva Contraseña</Label>
              <div className="relative">
                <Input type={showNew ? "text" : "password"} required value={newPassword} onChange={e => setNewPassword(e.target.value)} disabled={isLoading} className="pr-10" />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gray-700">
                  {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Confirmar Nueva Contraseña</Label>
              <div className="relative">
                <Input type={showConfirm ? "text" : "password"} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} disabled={isLoading} className="pr-10" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gray-700">
                  {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full mt-2" disabled={isLoading}>
              {isLoading ? "Actualizando..." : "Restablecer Contraseña"}
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              className="w-full text-xs" 
              onClick={() => setStep(1)}
              disabled={isLoading}
            >
              Probar con otro correo
            </Button>
          </form>
        )}
        
        <div className="mt-8 text-center text-sm border-t pt-4">
          <Link to="/login" className="text-muted-foreground hover:text-primary flex items-center justify-center gap-2">
            <ArrowLeft className="size-4"/> Volver al inicio de sesión
          </Link>
        </div>
      </Card>
    </div>
  );
}
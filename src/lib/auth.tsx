import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { API_URL } from "@/lib/config";

// 1. Definimos exactamente qué datos vamos a manejar
interface User {
  id: string | number;
  email: string;
  nombre?: string;
  Nombre?: string; 
  apellidos?: string;
  Apellidos?: string;
  telefono?: string;
  Telefono?: string;
  rol: string;
}

interface AuthCtx {
  user: User | null;
  token: string | null;
  login: (newToken: string, userData: User) => void;
  logout: () => void;
  updateUser: (id: string | number, newData: any) => Promise<void>;
  deleteUser: (id: string | number) => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false); // Para evitar pantallazos en blanco

  useEffect(() => {
    // Cuando la app inicia, leemos lo que hay guardado
    const savedToken = localStorage.getItem('techub_token');
    const savedUser = localStorage.getItem('techub_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        // Convertimos el texto guardado de vuelta a un objeto usable
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Error al leer el usuario guardado");
        localStorage.removeItem('techub_user');
      }
    }
    setIsReady(true);
  }, []);

  // Función que se llama desde login.tsx
  const login = (newToken: string, userData: User) => {
    localStorage.setItem('techub_token', newToken);
    localStorage.setItem('techub_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  // Función para cerrar sesión
  const logout = () => {
    localStorage.removeItem('techub_token');
    localStorage.removeItem('techub_user');
    setToken(null);
    setUser(null);
  };

  // Función para actualizar los datos en la memoria y en el backend
  const updateUser = async (id: string | number, newData: any) => {
    const savedToken = localStorage.getItem('techub_token');
    
    const res = await fetch(`${API_URL}/usuarios/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${savedToken}` 
      },
      body: JSON.stringify(newData)
    });

    if (!res.ok) {
      // Intentamos leer el JSON del error, si no se puede, mandamos un error genérico
      const errorData = await res.json().catch(() => ({})); 
      throw new Error(errorData.error || "Error al actualizar los datos en el servidor");
    }

    // Si todo sale bien, actualizamos el estado de React y el localStorage
    const updatedUser = { ...user, ...newData };
    setUser(updatedUser);
    localStorage.setItem('techub_user', JSON.stringify(updatedUser));
  };

  const deleteUser = async (id: string | number) => {
    const savedToken = localStorage.getItem('techub_token');
    
    const res = await fetch(`${API_URL}/usuarios/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${savedToken}`
      }
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({})); 
      throw new Error(errorData.error || "Error al eliminar la cuenta en el servidor");
    }
    
    // Si sale bien, el perfil se encargará de hacer el logout y redirigir
  };

  // Mientras lee el localStorage, no renderizamos nada para que no haya errores
  if (!isReady) return null; 

  return (
    <Ctx.Provider value={{ user, token, login, logout, updateUser, deleteUser }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(Ctx);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
};
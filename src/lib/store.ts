// Mock data store for TecHub frontend prototype.
// Persists to localStorage so demo data survives reloads.

export type Role = "admin" | "vendedor" | "comprador";

export interface User {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  password: string;
  rol: Role;
  comentarios?: Comment[];
}

export interface Category {
  id: string;
  nombre: string;
  icon: string;
}

export interface Comment {
  id: string;
  autor: string;
  rating: number;
  texto: string;
}

export interface Product {
  id: string;
  nombre: string;
  precio: number;
  estado: "Nuevo" | "Usado";
  categoria: string;
  descripcion: string;
  ubicacion: string;
  vendedorId: string;
  vendedorNombre: string;
  imagen: string;
  comentarios: Comment[];
}

export interface Order {
  id: string;
  productoId: string;
  productoNombre: string;
  vendedor: string;
  comprador: string;
  estado: "Pendiente" | "Completado" | "Cancelado";
  precio: number;
  categoria: string;
  descripcion: string;
  ubicacion: string;
  imagen: string;
}

export interface Notification {
  id: string;
  userId: string;
  titulo: string;
  mensaje: string;
  fecha: string;
  leido: boolean;
}

const KEY = "techub-data-v1";

const defaultCategories: Category[] = [
  { id: "c1", nombre: "Electrodomésticos", icon: "🔌" },
  { id: "c2", nombre: "Ropa", icon: "👕" },
  { id: "c3", nombre: "Libros", icon: "📚" },
  { id: "c4", nombre: "Servicios", icon: "🛠️" },
  { id: "c5", nombre: "Útiles Técnicos", icon: "📐" },
  { id: "c6", nombre: "Tablets", icon: "📱" },
  { id: "c7", nombre: "Periféricos", icon: "🖱️" },
  { id: "c8", nombre: "Matemáticas", icon: "🧮" },
];

const defaultUsers: User[] = [
  { id: "u1", nombre: "Admin", apellidos: "TecHub", email: "admin@tec.cr", password: "admin123", rol: "admin", comentarios: [] },
  { id: "u2", nombre: "Natalia", apellidos: "Rodríguez", email: "nrodriguez@tec.cr", password: "123456", rol: "vendedor", comentarios: [] },
  { id: "u3", nombre: "Edgar", apellidos: "Silva", email: "esilva@tec.cr", password: "123456", rol: "vendedor", comentarios: [
    { id: "cm1", autor: "Carlos Duarte", rating: 5, texto: "Excelente vendedor, muy responsable y puntual." },
    { id: "cm2", autor: "Esteban Vásquez", rating: 4, texto: "Buena comunicación, el producto llegó en perfectas condiciones." },
  ] },
  { id: "u4", nombre: "José", apellidos: "Santamaría", email: "jose@tec.cr", password: "123456", rol: "comprador", comentarios: [] },
];

const defaultProducts: Product[] = [
  {
    id: "p1",
    nombre: "Calculadora Casio FX-991LAX",
    precio: 12000,
    estado: "Usado",
    categoria: "Matemáticas",
    descripcion: "Calculadora científica en excelente estado, ideal para los cursos de matemática.",
    ubicacion: "Campus Cartago",
    vendedorId: "u3",
    vendedorNombre: "Edgar Silva",
    imagen: "📟",
    comentarios: [
      { id: "cm1", autor: "Carlos Duarte", rating: 5, texto: "Excelente calculadora, súper útil para Cálculo y Álgebra." },
      { id: "cm2", autor: "Esteban Vásquez", rating: 4, texto: "Muy buena, llegó en perfectas condiciones." },
    ],
  },
  {
    id: "p2",
    nombre: "Cuaderno 100 hojas",
    precio: 1500,
    estado: "Nuevo",
    categoria: "Útiles Técnicos",
    descripcion: "Cuaderno cuadriculado, sin uso.",
    ubicacion: "Campus San José",
    vendedorId: "u2",
    vendedorNombre: "Natalia Rodríguez",
    imagen: "📓",
    comentarios: [],
  },
  {
    id: "p3",
    nombre: "Pinturas Acrílicas",
    precio: 8000,
    estado: "Nuevo",
    categoria: "Útiles Técnicos",
    descripcion: "Set de pinturas acrílicas con 12 colores.",
    ubicacion: "Campus Cartago",
    vendedorId: "u2",
    vendedorNombre: "Natalia Rodríguez",
    imagen: "🎨",
    comentarios: [],
  },
  {
    id: "p4",
    nombre: "Bata de laboratorio",
    precio: 7500,
    estado: "Usado",
    categoria: "Ropa",
    descripcion: "Bata talla M, en buen estado.",
    ubicacion: "Campus Cartago",
    vendedorId: "u2",
    vendedorNombre: "Natalia Rodríguez",
    imagen: "🥼",
    comentarios: [],
  },
  {
    id: "p5",
    nombre: "Libro Física I",
    precio: 18000,
    estado: "Usado",
    categoria: "Libros",
    descripcion: "Libro de Física Universitaria, con anotaciones útiles.",
    ubicacion: "Campus Cartago",
    vendedorId: "u3",
    vendedorNombre: "Edgar Silva",
    imagen: "📖",
    comentarios: [],
  },
];

const defaultOrders: Order[] = [
  {
    id: "12341",
    productoId: "p1",
    productoNombre: "Calculadora Casio FX-991LAX",
    vendedor: "Edgar Silva",
    comprador: "José Santamaría",
    estado: "Pendiente",
    precio: 12000,
    categoria: "Matemáticas",
    descripcion: "Calculadora científica en excelente estado.",
    ubicacion: "Campus Cartago",
    imagen: "📟",
  },
  {
    id: "12347",
    productoId: "p5",
    productoNombre: "Libro Física I",
    vendedor: "Edgar Silva",
    comprador: "Alfredo Mercury",
    estado: "Completado",
    precio: 18000,
    categoria: "Libros",
    descripcion: "Libro de Física Universitaria.",
    ubicacion: "Campus Cartago",
    imagen: "📖",
  },
];

const defaultNotifications: Notification[] = [
  { id: "n1", userId: "u3", titulo: "Ana Cruz", mensaje: "Quiero comprar 'Calculadora Casio'", fecha: "27-02-2026", leido: false },
  { id: "n2", userId: "u3", titulo: "Carlos Vásquez", mensaje: "Acepto la oferta, comprare $...", fecha: "26-02-2026", leido: true },
];

export interface DB {
  users: User[];
  categories: Category[];
  products: Product[];
  orders: Order[];
  notifications: Notification[];
  currentUserId: string | null;
}

function seed(): DB {
  return {
    users: defaultUsers,
    categories: defaultCategories,
    products: defaultProducts,
    orders: defaultOrders,
    notifications: defaultNotifications,
    currentUserId: null,
  };
}

export function loadDB(): DB {
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const s = seed();
      localStorage.setItem(KEY, JSON.stringify(s));
      return s;
    }
    return JSON.parse(raw) as DB;
  } catch {
    return seed();
  }
}

export function saveDB(db: DB) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(db));
}

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

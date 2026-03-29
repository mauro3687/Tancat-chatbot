// src/data/mockData.js

export const reservas = [
  { id: "R-001", cliente: "Ana Gómez", servicio: "Alquiler cabañas", fecha: "17/03/2026", monto: "$12.500", estado: "Confirmada" },
  { id: "R-002", cliente: "Carlos Ruiz", servicio: "Paquete familiar", fecha: "18/03/2026", monto: "$8.200", estado: "Pendiente" },
  { id: "R-003", cliente: "Lucía Pérez", servicio: "Día de campo", fecha: "19/03/2026", monto: "$4.600", estado: "Confirmada" },
  { id: "R-004", cliente: "Martín López", servicio: "Alquiler cabañas", fecha: "20/03/2026", monto: "$12.500", estado: "Cancelada" },
  { id: "R-005", cliente: "Sofía Díaz", servicio: "Paquete fin de semana", fecha: "21/03/2026", monto: "$18.000", estado: "Confirmada" },
  { id: "R-006", cliente: "Diego Herrera", servicio: "Día de campo", fecha: "22/03/2026", monto: "$4.600", estado: "Pendiente" },
  { id: "R-007", cliente: "Valentina Cruz", servicio: "Paquete familiar", fecha: "23/03/2026", monto: "$8.200", estado: "Confirmada" },
  { id: "R-008", cliente: "Tomás Vega", servicio: "Alquiler cabañas", fecha: "24/03/2026", monto: "$12.500", estado: "Pendiente" },
  { id: "R-009", cliente: "Camila Ríos", servicio: "Día de campo", fecha: "25/03/2026", monto: "$4.600", estado: "Confirmada" },
  { id: "R-010", cliente: "Nicolás Mora", servicio: "Paquete fin de semana", fecha: "26/03/2026", monto: "$18.000", estado: "Cancelada" },
];

export const stock = [
  { nombre: "Leña", cantidad: 80, max: 100 },
  { nombre: "Bebidas", cantidad: 45, max: 200 },
  { nombre: "Ropa de cama", cantidad: 60, max: 80 },
  { nombre: "Toallas", cantidad: 15, max: 60 },
  { nombre: "Artículos de limpieza", cantidad: 8, max: 50 },
  { nombre: "Provisiones cocina", cantidad: 30, max: 100 },
  { nombre: "Carbón", cantidad: 22, max: 80 },
  { nombre: "Repelentes", cantidad: 5, max: 40 },
];

export const ventasSemanas = {
  labels: ["Sem 1", "Sem 2", "Sem 3", "Sem 4", "Sem 5", "Sem 6"],
  reservas: [18, 22, 15, 28, 24, 31],
  ventas: [28, 34, 22, 42, 38, 48],
};

export const metricas = {
  reservasHoy: 24,
  ventasMes: "$182K",
  clientesActivos: 341,
  productosBajos: 5,
};

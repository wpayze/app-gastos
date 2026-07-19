import type { User } from "../types";

/** Usuario con sesión iniciada en el entorno MOCK */
export const CURRENT_USER_ID = "u-wil";

export const USERS: User[] = [
  {
    id: "u-wil",
    nombre: "Wil Payze",
    email: "wil@ejemplo.com",
    iniciales: "WP",
    color: "#1c5e41",
  },
  {
    id: "u-marta",
    nombre: "Marta García",
    email: "marta@ejemplo.com",
    iniciales: "MG",
    color: "#7c4a9c",
  },
  {
    id: "u-diego",
    nombre: "Diego Fernández",
    email: "diego@ejemplo.com",
    iniciales: "DF",
    color: "#1f5f8b",
  },
  {
    id: "u-lucia",
    nombre: "Lucía Ortiz",
    email: "lucia@ejemplo.com",
    iniciales: "LO",
    color: "#a6720d",
  },
  {
    id: "u-andres",
    nombre: "Andrés Rojas",
    email: "andres@ejemplo.com",
    iniciales: "AR",
    color: "#5a6b5f",
  },
  {
    id: "u-carolina",
    nombre: "Carolina Núñez",
    email: "carolina@ejemplo.com",
    iniciales: "CN",
    color: "#a23b45",
  },
];

export function getUser(id: string): User {
  return USERS.find((u) => u.id === id) ?? USERS[0];
}

/** Rollar — server va brauzer tomonida bir xil ishlatiladi. */

export type Rol = "oquvchi" | "ustoz" | "admin";

export const ROL_NOMI: Record<Rol, string> = {
  oquvchi: "O‘quvchi",
  ustoz: "Ustoz",
  admin: "Administrator",
};

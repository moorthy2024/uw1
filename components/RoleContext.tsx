"use client";
import { createContext, useContext } from "react";

export type UserRole = "underwriter" | "manager";

export const RoleContext = createContext<UserRole>("underwriter");

export function useRole() {
  return useContext(RoleContext);
}


"use client";

import { AuthProvider } from "../context/AuthContext";
import SecurityGuard from "../components/SecurityGuard";

export default function LayoutClient({ children }) {
  return (
    <AuthProvider>
      <SecurityGuard />
      {children}
    </AuthProvider>
  );
}

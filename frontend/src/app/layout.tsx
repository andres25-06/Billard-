import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Billar Chamo · PC de Control",
  description: "Sistema de Control de Mesas, Tiempos, Pedidos y Caja",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

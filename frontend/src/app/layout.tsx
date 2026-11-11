import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Billar Club · PC de Control",
  description: "Sistema de Control de Mesas, Tiempos, Pedidos y Caja",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="w-full h-full m-0 p-0 overflow-hidden">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="w-full h-full m-0 p-0 overflow-hidden antialiased select-none font-['Urbanist',sans-serif]">
        {children}
      </body>
    </html>
  );
}

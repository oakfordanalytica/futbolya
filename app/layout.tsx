// app/layout.tsx

import "./globals.css"; // Make sure globals are imported here

// Este layout se ejecuta antes del middleware y no debe tener providers
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased transition-colors duration-300">
        <main>{children}</main>
      </body>
    </html>
  );
}
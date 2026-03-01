import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-100 text-gray-900 antialiased min-h-screen">
        <nav className="w-full border-b border-gray-200 bg-white px-6 py-4 shadow-sm relative flex items-center justify-end">
          
          {/* Centered Brand */}
          <a
            href="/"
            className="absolute left-1/2 -translate-x-1/2 text-2xl font-bold tracking-tight text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            🧠 Curiosity Engine
          </a>

          {/* Right-side Navigation */}
          <div className="flex gap-6 text-sm font-medium">
            <a href="/dashboard" className="hover:text-indigo-600 transition-colors">
              Dashboard
            </a>
            <a href="/curiosity/add" className="hover:text-indigo-600 transition-colors">
              Add
            </a>
            <a href="/curiosity/vault" className="hover:text-indigo-600 transition-colors">
              Vault
            </a>
          </div>

        </nav>

        <main>{children}</main>
      </body>
    </html>
  );
}
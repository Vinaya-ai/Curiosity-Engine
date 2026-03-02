import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased bg-gray-100 text-gray-900 dark:bg-gray-950 dark:text-gray-100 transition-colors duration-300">
        
        {/* Navigation */}
        <nav className="w-full border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-4 shadow-sm relative flex items-center justify-end">
          

          {/* Right-side Navigation */}
          <div className="flex gap-6 text-sm font-medium text-gray-700 dark:text-gray-300">
            <a href="/dashboard" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Dashboard
            </a>
            <a href="/curiosity/add" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Add
            </a>
            <a href="/curiosity/vault" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Vault
            </a>
          </div>

        </nav>

        <main>{children}</main>
      </body>
    </html>
  );
}
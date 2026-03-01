export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center text-center min-h-[80vh] px-6">

      <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-indigo-600 dark:text-indigo-400">
        🧠 Curiosity Engine
      </h1>

      <p className="mt-6 text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl">
        A structured way to manage your curiosity.
      </p>

      <p className="mt-2 text-md text-gray-500 dark:text-gray-500">
        Save ideas. Tag them intelligently. Get time-aware suggestions.
      </p>

    </div>
  );
}
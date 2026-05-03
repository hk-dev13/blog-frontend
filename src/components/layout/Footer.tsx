export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-8 mt-auto">
      <div className="container mx-auto px-4 text-center text-slate-500 dark:text-slate-400">
        <p className="font-serif text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
          Envoyou.
        </p>
        <p className="text-sm">
          &copy; {currentYear} Envoyou Blog. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

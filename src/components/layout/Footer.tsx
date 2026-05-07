import Image from 'next/image';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-8 mt-auto">
      <div className="container mx-auto px-4 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
        <Image 
          src="/logo.svg" 
          alt="Envoyou Logo" 
          width={36} 
          height={36} 
          className="h-8 w-8 object-contain mb-4 opacity-80"
        />
        <p className="text-sm">
          &copy; {currentYear} Envoyou Blog. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

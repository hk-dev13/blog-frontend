import Image from 'next/image';
import NewsletterForm from '@/components/shared/NewsletterForm';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-12 mt-auto">
      <div className="container mx-auto px-4 flex flex-col items-center justify-center gap-8">
        {/* Newsletter */}
        <NewsletterForm />

        {/* Divider */}
        <div className="w-16 h-px bg-slate-200 dark:bg-slate-800" />

        {/* Brand + Copyright */}
        <div className="flex flex-col items-center gap-3">
          <Image
            src="/logo.svg"
            alt="Envoyou Logo"
            width={36}
            height={36}
            className="h-8 w-8 object-contain opacity-80"
          />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            &copy; {currentYear} Envoyou. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

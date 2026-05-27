import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

interface AdminSessionExpiredProps {
  title?: string;
}

export default function AdminSessionExpired({
  title = 'Your session has expired. Please sign in again.',
}: AdminSessionExpiredProps) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-900 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-100">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="space-y-2">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-sm text-amber-800/90 dark:text-amber-200/90">
            For security reasons, we could not load this admin data.
          </p>
          <Link
            href="/admin/login"
            className="inline-flex items-center rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
          >
            Sign in again
          </Link>
        </div>
      </div>
    </div>
  );
}

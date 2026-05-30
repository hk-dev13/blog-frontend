import { Lora } from 'next/font/google';

const lora = Lora({
  variable: '--font-serif',
  subsets: ['latin'],
});

export default function PostLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className={lora.variable}>{children}</div>;
}

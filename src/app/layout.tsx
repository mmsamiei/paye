import type { Metadata } from 'next';
import './style.css';

export const metadata: Metadata = { title: 'پایه', description: 'آدم‌ها و گفت‌وگوهای نزدیک به تو' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="fa" dir="rtl"><head><script src="https://telegram.org/js/telegram-web-app.js" /></head><body>{children}</body></html>;
}

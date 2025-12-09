// FitLog Layout

import { ReactNode } from 'react';
import Link from 'next/link';
import {
  Home,
  Dumbbell,
  History,
  FileText,
  Settings,
  Upload,
} from 'lucide-react';

interface FitLogLayoutProps {
  children: ReactNode;
  params: { locale: string };
}

export default function FitLogLayout({ children, params }: FitLogLayoutProps) {
  const { locale } = params;

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-neutral-200">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href={`/${locale}/fitlog`} className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-neutral-900">FitLog</span>
            </Link>
            <Link
              href={`/${locale}/fitlog/settings`}
              className="p-2 text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-20">
        <div className="max-w-lg mx-auto px-4">
          <div className="flex items-center justify-around py-2">
            <NavItem href={`/${locale}/fitlog`} icon={<Home />} label="Início" />
            <NavItem href={`/${locale}/fitlog/workout`} icon={<Dumbbell />} label="Treinos" />
            <NavItem href={`/${locale}/fitlog/history`} icon={<History />} label="Histórico" />
            <NavItem href={`/${locale}/fitlog/export`} icon={<Upload />} label="Export" />
            <NavItem href={`/${locale}/fitlog/plans`} icon={<FileText />} label="Planos" />
          </div>
        </div>
      </nav>
    </div>
  );
}

interface NavItemProps {
  href: string;
  icon: ReactNode;
  label: string;
}

function NavItem({ href, icon, label }: NavItemProps) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1 py-1 px-3 text-neutral-500 hover:text-primary transition-colors"
    >
      <span className="w-6 h-6">{icon}</span>
      <span className="text-xs">{label}</span>
    </Link>
  );
}

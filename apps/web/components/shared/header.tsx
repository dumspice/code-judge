'use client';

import { Button } from '@/components/ui/button';
import { Code2 } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { UserNav } from './user-nav';

export default function Header() {
  const { user, loading } = useAuthStore();

  return (
    <nav className="sticky top-0 z-40 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <Code2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">CodeJudge</span>
          </Link>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="/#features" className="text-sm hover:text-primary transition">
            Features
          </a>
          <a href="/#for-educators" className="text-sm hover:text-primary transition">
            For Educators
          </a>
          <a href="/#for-students" className="text-sm hover:text-primary transition">
            For Students
          </a>
          <a href="/#problems" className="text-sm hover:text-primary transition">
            Problems
          </a>
          <a href="/#contests" className="text-sm hover:text-primary transition">
            Contests
          </a>
          <a
            href="/admin"
            className="text-sm font-semibold text-primary hover:text-primary/80 transition"
          >
            Admin
          </a>
        </div>
        <div className="flex items-center gap-4">
          {!loading && (
            <>
              {user ? (
                <UserNav />
              ) : (
                <>
                  <Button variant="ghost" asChild>
                    <Link href="/login">Sign In</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/register">Get Started</Link>
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

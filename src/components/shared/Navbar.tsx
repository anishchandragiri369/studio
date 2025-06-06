"use client";

import Link from 'next/link';
import { ShoppingCart, Menu as MenuIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import Logo from './Logo';
import { NAV_LINKS } from '@/lib/constants';
import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';

const Navbar = () => {
  const { getItemCount } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const itemCount = mounted ? getItemCount() : 0;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Logo />
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition-colors hover:text-primary ${pathname === link.href ? 'text-primary font-semibold' : 'text-foreground/70'}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/cart" passHref>
            <Button variant="ghost" size="icon" aria-label="Shopping Cart">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {itemCount}
                </span>
              )}
            </Button>
          </Link>
          <div className="md:hidden">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <MenuIcon className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] p-6 bg-background">
                <div className="flex flex-col gap-6">
                  <div className="flex justify-between items-center">
                     <Logo />
                     <SheetClose asChild>
                        <Button variant="ghost" size="icon">
                            <X className="h-6 w-6" />
                        </Button>
                     </SheetClose>
                  </div>
                  <nav className="flex flex-col gap-4">
                    {NAV_LINKS.map(link => (
                      <SheetClose asChild key={link.href}>
                        <Link
                          href={link.href}
                          className={`text-lg font-medium transition-colors hover:text-primary ${pathname === link.href ? 'text-primary' : 'text-foreground/80'}`}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {link.label}
                        </Link>
                      </SheetClose>
                    ))}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

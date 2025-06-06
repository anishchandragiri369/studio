
"use client";

import Link from 'next/link';
import { ShoppingCart, Menu as MenuIcon, LogOut, UserCircle, LogInIcon, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/context/AuthContext';
import Logo from './Logo';
import { NAV_LINKS as DEFAULT_NAV_LINKS } from '@/lib/constants';
import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const { getItemCount } = useCart();
  const { user, logOut, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const itemCount = mounted ? getItemCount() : 0;

  const handleLogout = async () => {
    await logOut();
    router.push('/');
  };

  const navLinks = user 
    ? DEFAULT_NAV_LINKS.filter(link => link.href !== '/login' && link.href !== '/signup')
    : DEFAULT_NAV_LINKS;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Logo />
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition-colors hover:text-primary ${pathname === link.href ? 'text-primary font-semibold' : 'text-foreground/70'}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/cart" passHref legacyBehavior>
            <Button variant="ghost" size="icon" aria-label="Shopping Cart" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {itemCount}
                </span>
              )}
            </Button>
          </Link>

          {!authLoading && (
            <>
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="User Menu">
                      <UserCircle className="h-6 w-6 text-primary" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">My Account</p>
                        <p className="text-xs leading-none text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {/* <DropdownMenuItem onClick={() => router.push('/account')}>
                      <UserCircle className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem> */}
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Button variant="ghost" asChild>
                    <Link href="/login">
                       <LogInIcon className="mr-2 h-4 w-4" /> Login
                    </Link>
                  </Button>
                  <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                     <Link href="/signup">
                       <UserPlus className="mr-2 h-4 w-4" /> Sign Up
                    </Link>
                  </Button>
                </div>
              )}
            </>
          )}

          <div className="md:hidden">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <MenuIcon className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] p-6 bg-background">
                <SheetHeader className="mb-6 text-left">
                  <Logo />
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-4">
                  {navLinks.map(link => (
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
                  <hr className="my-2"/>
                  {!authLoading && (
                    <>
                      {user ? (
                        <SheetClose asChild>
                          <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-lg font-medium text-foreground/80 hover:text-primary">
                            <LogOut className="mr-2 h-5 w-5" /> Logout
                          </Button>
                        </SheetClose>
                      ) : (
                        <>
                          <SheetClose asChild>
                            <Link href="/login" className="text-lg font-medium text-foreground/80 hover:text-primary flex items-center" onClick={() => setIsMenuOpen(false)}>
                              <LogInIcon className="mr-2 h-5 w-5" /> Login
                            </Link>
                          </SheetClose>
                          <SheetClose asChild>
                            <Link href="/signup" className="text-lg font-medium text-foreground/80 hover:text-primary flex items-center" onClick={() => setIsMenuOpen(false)}>
                              <UserPlus className="mr-2 h-5 w-5" /> Sign Up
                            </Link>
                          </SheetClose>
                        </>
                      )}
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

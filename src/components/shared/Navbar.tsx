
"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { ShoppingCart, Menu as MenuIcon, LogOut, UserCircle, LogInIcon, UserPlus, AlertTriangle, Settings, PackagePlus } from 'lucide-react';
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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const Navbar = () => {
  const { getItemCount, clearCart } = useCart();
  const { user, logOut, loading: authLoading, isSupabaseConfigured, isAdmin } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // This effect handles redirection if a non-admin tries to access an admin page.
    // It should not prevent an admin from seeing the link itself.
    if (!authLoading && isSupabaseConfigured && pathname.startsWith('/admin') && user && !isAdmin) {
      router.push('/');
    }
  }, [authLoading, isSupabaseConfigured, pathname, isAdmin, user, router]);
  
  const itemCount = mounted ? getItemCount() : 0;

  const handleLogout = async () => {
    setIsMenuOpen(false); 
    await logOut();
    clearCart(); // Clear cart and show toast upon explicit logout
    router.push('/');
  };

  const navLinks = (user || !isSupabaseConfigured)
    ? DEFAULT_NAV_LINKS.filter(link => link.href !== '/login' && link.href !== '/signup')
    : DEFAULT_NAV_LINKS;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Logo />
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navLinks.map(link => (
            link.label === 'Subscriptions' && 'subLinks' in link ? (
              <DropdownMenu key={link.href}>
                <DropdownMenuTrigger className={`flex items-center transition-colors hover:text-primary ${pathname.startsWith(link.basePath || link.href) ? "text-primary font-semibold" : "text-foreground/70"}`}>
                  {link.label}
                  <ChevronDown className="ml-1 h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>{link.label}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {link.subLinks?.map(subLink => (
                    <DropdownMenuItem key={subLink.href} asChild>
                      <Link href={subLink.href} className={`cursor-pointer ${pathname === subLink.href ? 'text-primary font-semibold' : ''}`}>
                        {subLink.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors hover:text-primary ${
                  // Highlight if the current path exactly matches the link href
                  pathname === link.href ||
                  // Or if it's a base path match (for subscriptions dropdown)
                  ('basePath' in link && link.basePath && pathname.startsWith(link.basePath)) ||
                  // Or if it's a sub-link within a dropdown that matches the current path
                  ('subLinks' in link && link.subLinks?.some(subLink => pathname === subLink.href))
                    ? "text-primary font-semibold"
                    : "text-foreground/70"
                }`}
              >
                {link.label}
              </Link>
            )
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="icon" aria-label="Shopping Cart" className="relative" asChild>
            <Link href="/cart">
              <>
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    {itemCount < 100 ? itemCount : '99+'}
                  </span>
                )}
              </>
            </Link>
          </Button>

          {!authLoading && (
            <>
              {user && isSupabaseConfigured ? ( 
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="User Menu">
                      <UserCircle className="h-6 w-6 text-primary" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">Hello, {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}</p>
                        <p className="text-xs leading-none text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/account" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>My Account</span>
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin/add-product" className="cursor-pointer">
                          <PackagePlus className="mr-2 h-4 w-4" /> {/* Using PackagePlus for add product */}
                          <span>Add Product</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : isSupabaseConfigured ? (
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
              ) : (
                <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded-md bg-destructive/10 text-destructive text-xs" title="Supabase is not configured. Authentication features are disabled.">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Auth Disabled</span>
                </div>
              )}
            </>
          )}

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <MenuIcon className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] p-6 bg-background">
                <SheetHeader className="mb-6 text-left">
                  <SheetClose asChild><Logo /></SheetClose>
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
                  {!authLoading && isSupabaseConfigured && ( // Added missing !authLoading check here too
                    user ? (
                      <>
                         {isAdmin && (
                           <SheetClose asChild>
                             <Link href="/admin/add-product" className="text-lg font-medium text-foreground/80 hover:text-primary flex items-center" onClick={() => setIsMenuOpen(false)}>
                               <PackagePlus className="mr-2 h-5 w-5" /> Add Product
                             </Link>
                           </SheetClose>
                         )}
                        <SheetClose asChild>
                            <Link href="/account" className="text-lg font-medium text-foreground/80 hover:text-primary flex items-center" onClick={() => setIsMenuOpen(false)}>
                              <Settings className="mr-2 h-5 w-5" /> My Account
                            </Link>
                          </SheetClose>
                          <SheetClose asChild>
                            <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-lg font-medium text-foreground/80 hover:text-primary">
                              <LogOut className="mr-2 h-5 w-5" /> Logout
                            </Button>
                          </SheetClose>
                      </>
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
                     ) // Closing parenthesis for user ternary
                  )} {/* Closing parenthesis for !authLoading && isSupabaseConfigured */}
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

    
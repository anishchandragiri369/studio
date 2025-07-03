"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { ShoppingCart, Menu as MenuIcon, LogOut, UserCircle, LogInIcon, UserPlus, AlertTriangle, Settings, PackagePlus, BarChart, Shield, Ticket, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/context/AuthContext';
import Logo from './Logo';
import UserProfilePhoto from './UserProfilePhoto';
import { NAV_LINKS as DEFAULT_NAV_LINKS, TRADITIONAL_JUICE_CATEGORIES } from '@/lib/constants';
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
  const [isLoggingOut, setIsLoggingOut] = useState(false);
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
    console.log('[Navbar] Starting logout process...');
    setIsLoggingOut(true);
    setIsMenuOpen(false);
    
    try {
      // Clear cart and state immediately for instant feedback
      clearCart();
      
      // Start logout process
      await logOut();
      
      // Force a hard redirect to home page to ensure clean state
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      } else {
        router.push('/');
      }
      
      console.log('[Navbar] Logout completed successfully');
    } catch (error) {
      console.error('[Navbar] Error during logout:', error);
      // Even if logout fails, redirect to home
      router.push('/');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navLinks = (user || !isSupabaseConfigured)
    ? DEFAULT_NAV_LINKS.filter(link => link.href !== '/login' && link.href !== '/signup')
    : DEFAULT_NAV_LINKS;
  return (
    <header className="glass-nav sticky top-0 z-50 w-full border-b border-border/20 shadow-soft overflow-hidden mobile-nav">
      <div className="container mx-auto flex h-10 md:h-12 items-center justify-between px-2 sm:px-3 md:px-4 max-w-full overflow-hidden mobile-container">
        <div className="flex-shrink-0">
          <Logo />
        </div>        <nav className="hidden lg:flex items-center gap-2 xl:gap-3 text-sm font-medium flex-shrink min-w-0 overflow-hidden">
          {/* Categories Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center transition-colors hover:text-primary text-foreground/70 whitespace-nowrap">
              Categories
              <ChevronDown className="ml-1 h-3 w-3 xl:h-4 xl:w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Shop by Category</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {TRADITIONAL_JUICE_CATEGORIES.map(category => (
                <DropdownMenuItem key={category} asChild>
                  <Link href={`/menu?category=${encodeURIComponent(category)}`} className="cursor-pointer">
                    {category}
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/menu" className="cursor-pointer font-medium">
                  View All Products
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {navLinks.map(link => (
            link.label === 'Contact Us' ? (
              <React.Fragment key={link.href}>
                <div className="flex items-center gap-3">
                  <Link
                    href={link.href}
                    className={`transition-colors hover:text-primary ${
                      pathname === link.href ? "text-primary font-semibold" : "text-foreground/70"
                    }`}
                  >
                    {link.label}
                  </Link>
                  <a
                    href="https://instagram.com/elixr_healthy_sips"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="flex items-center justify-center"
                    style={{ lineHeight: 0 }}
                  >
                    <svg
                      width="36" height="36" viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8"
                    >
                      <defs>
                        <linearGradient id="ig-gradient" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#f58529" />
                          <stop offset="50%" stopColor="#dd2a7b" />
                          <stop offset="100%" stopColor="#515bd4" />
                        </linearGradient>
                      </defs>
                      <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ig-gradient)" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" fill="#fff"/>
                      <circle cx="17.5" cy="6.5" r="1.5" fill="#fff"/>
                    </svg>
                  </a>
                </div>
              </React.Fragment>
            ) : link.label === 'Subscriptions' && 'subLinks' in link ? (
              <DropdownMenu key={link.href}>
                <DropdownMenuTrigger className={`flex items-center transition-colors hover:text-primary ${pathname.startsWith(link.basePath || link.href) || pathname.startsWith('/fruit-bowls/subscriptions') ? "text-primary font-semibold" : "text-foreground/70"}`}>
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
                  pathname === link.href ||
                  ('basePath' in link && link.basePath && pathname.startsWith(link.basePath)) ||
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
        
        <div className="flex items-center gap-1 sm:gap-2 md:gap-4 flex-shrink-0">
          <Button variant="ghost" size="icon" aria-label="Shopping Cart" className="relative flex-shrink-0" asChild>
            <Link href="/cart">
              <>
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
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
                    <Button variant="ghost" className="flex-shrink-0 p-1 rounded-full" aria-label="User Menu">
                      <UserProfilePhoto size="sm" showName={false} showLoginPrompt={false} />
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
                    </DropdownMenuItem>                    {isAdmin && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="cursor-pointer">
                            <Shield className="mr-2 h-4 w-4" />
                            <span>Admin Dashboard</span>
                          </Link>
                        </DropdownMenuItem>                        <DropdownMenuItem asChild>
                          <Link href="/admin/analytics" className="cursor-pointer">
                            <BarChart className="mr-2 h-4 w-4" />
                            <span>Analytics</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/coupons" className="cursor-pointer">
                            <Ticket className="mr-2 h-4 w-4" />
                            <span>Coupons</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/add-product" className="cursor-pointer">
                            <PackagePlus className="mr-2 h-4 w-4" />
                            <span>Add Product</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/manage-stock" className="cursor-pointer">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Manage Stock</span>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer" disabled={isLoggingOut}>
                      {isLoggingOut ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <LogOut className="mr-2 h-4 w-4" />
                      )}
                      <span>{isLoggingOut ? 'Logging out...' : 'Log out'}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : isSupabaseConfigured ? (
                <div className="hidden lg:flex items-center gap-1 xl:gap-2 flex-shrink-0">
                  <Button variant="ghost" size="sm" asChild className="hidden xl:flex">
                    <Link href="/login">
                      <LogInIcon className="mr-1 h-4 w-4" /> 
                      <span className="hidden xl:inline">Login</span>
                    </Link>
                  </Button>
                  <Button size="sm" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground flex-shrink-0">
                     <Link href="/signup">
                       <UserPlus className="mr-1 h-4 w-4" /> 
                       <span className="hidden xl:inline">Sign Up</span>
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
          <div className="lg:hidden flex-shrink-0">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu" className="flex-shrink-0">
                  <MenuIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] p-6 bg-background overflow-y-auto">
                <SheetHeader className="mb-6 text-left">
                  <SheetClose asChild><Logo /></SheetClose>
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                </SheetHeader>                <nav className="flex flex-col gap-4">
                  {/* Categories Link for Mobile */}
                  <SheetClose asChild>
                    <Link
                      href="/categories"
                      className={`text-lg font-medium transition-colors hover:text-primary ${pathname === '/categories' ? 'text-primary' : 'text-foreground/80'}`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Categories
                    </Link>
                  </SheetClose>

                  {/* Navigation Links */}
                  {navLinks.map(link => 
                    link.label === 'Subscriptions' && 'subLinks' in link ? (
                      <SheetClose asChild key={link.href}>
                        <Link
                          href="/subscriptions"
                          className={`text-lg font-medium transition-colors hover:text-primary ${pathname.startsWith('/subscriptions') ? 'text-primary' : 'text-foreground/80'}`}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Subscriptions
                        </Link>
                      </SheetClose>
                    ) : link.label === 'Contact Us' ? (
                      <SheetClose asChild key={link.href}>
                        <Link
                          href={link.href}
                          className={`text-lg font-medium transition-colors hover:text-primary ${pathname === link.href ? 'text-primary' : 'text-foreground/80'}`}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {link.label}
                        </Link>
                      </SheetClose>
                    ) : (
                      <SheetClose asChild key={link.href}>
                        <Link
                          href={link.href}
                          className={`text-lg font-medium transition-colors hover:text-primary ${pathname === link.href ? 'text-primary' : 'text-foreground/80'}`}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {link.label}
                        </Link>
                      </SheetClose>
                    )
                  )}
                  
                  <hr className="my-2"/>
                  
                  {/* User Section */}
                  {!authLoading && isSupabaseConfigured && ( 
                    user ? (
                      <>
                         {/* Admin Section - Only for Admin Users */}
                         {isAdmin && (
                           <>
                             <div>
                               <h3 className="text-base font-semibold text-foreground mb-2">Admin</h3>
                               <div className="pl-3 space-y-2">
                                 <SheetClose asChild>
                                   <Link href="/admin" className="block text-sm text-foreground/70 hover:text-primary flex items-center transition-colors" onClick={() => setIsMenuOpen(false)}>
                                     <Shield className="mr-2 h-4 w-4" /> Dashboard
                                   </Link>
                                 </SheetClose>                                 <SheetClose asChild>
                                   <Link href="/admin/analytics" className="block text-sm text-foreground/70 hover:text-primary flex items-center transition-colors" onClick={() => setIsMenuOpen(false)}>
                                     <BarChart className="mr-2 h-4 w-4" /> Analytics
                                   </Link>
                                 </SheetClose>
                                 <SheetClose asChild>
                                   <Link href="/admin/coupons" className="block text-sm text-foreground/70 hover:text-primary flex items-center transition-colors" onClick={() => setIsMenuOpen(false)}>
                                     <Ticket className="mr-2 h-4 w-4" /> Coupons
                                   </Link>
                                 </SheetClose>
                                 <SheetClose asChild>
                                   <Link href="/admin/add-product" className="block text-sm text-foreground/70 hover:text-primary flex items-center transition-colors" onClick={() => setIsMenuOpen(false)}>
                                     <PackagePlus className="mr-2 h-4 w-4" /> Add Product
                                   </Link>
                                 </SheetClose>
                                 <SheetClose asChild>
                                   <Link href="/admin/manage-stock" className="block text-sm text-foreground/70 hover:text-primary flex items-center transition-colors" onClick={() => setIsMenuOpen(false)}>
                                     <Settings className="mr-2 h-4 w-4" /> Manage Stock
                                   </Link>
                                 </SheetClose>
                               </div>
                             </div>
                             <hr className="my-2"/>
                           </>
                         )}
                        <SheetClose asChild>
                            <Link href="/account" className="text-lg font-medium text-foreground/80 hover:text-primary flex items-center" onClick={() => setIsMenuOpen(false)}>
                              <Settings className="mr-2 h-5 w-5" /> My Account
                            </Link>
                          </SheetClose>
                          <SheetClose asChild>
                            <Button 
                              variant="ghost" 
                              onClick={handleLogout} 
                              className="w-full justify-start text-lg font-medium text-foreground/80 hover:text-primary"
                              disabled={isLoggingOut}
                            >
                              {isLoggingOut ? (
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              ) : (
                                <LogOut className="mr-2 h-5 w-5" />
                              )}
                              {isLoggingOut ? 'Logging out...' : 'Logout'}
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
                     ) 
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


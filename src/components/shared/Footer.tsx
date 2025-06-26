import Link from 'next/link';
import { Facebook, Instagram, Twitter } from 'lucide-react';
import Logo from './Logo';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-muted/50 border-t border-border/40 text-muted-foreground">
      <div className="container mx-auto px-4 py-8 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div className="flex flex-col items-center md:items-start">
            <Logo />
            <p className="mt-2 text-sm text-center md:text-left">Freshly pressed juices, delivered to you.</p>
          </div>
            <nav className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-6 text-sm">
            <Link href="/menu" className="hover:text-primary transition-colors">Menu</Link>
            <Link href="/subscriptions" className="hover:text-primary transition-colors">Subscriptions</Link>
            <Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link>
            <Link href="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link>
          </nav>

          <div className="flex justify-center md:justify-end items-center gap-4">
            <Link href="#" aria-label="Facebook" className="hover:text-primary transition-colors">
              <Facebook className="h-5 w-5" />
            </Link>
            <a
              href="https://instagram.com/elixr_healthy_sips"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="hover:text-primary transition-colors"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <Link href="#" aria-label="Twitter" className="hover:text-primary transition-colors">
              <Twitter className="h-5 w-5" />
            </Link>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-border text-center text-xs">
          <p>&copy; {currentYear} Elixr. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

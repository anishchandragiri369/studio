import Link from 'next/link';
import { Citrus } from 'lucide-react';

const Logo = () => {
  return (
    <Link href="/" className="flex items-center gap-2 text-2xl md:text-3xl font-headline font-bold text-primary hover:text-primary/90 transition-colors">
      <Citrus className="h-7 w-7 md:h-8 md:w-8" />
      <span>Elixir</span>
    </Link>
  );
};
export default Logo;

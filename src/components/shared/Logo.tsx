import Link from 'next/link';

const letterColors = [
  // W  O     R      L      D      (space) O      F      (space) E      L      I      X      I      R      S
  '#2e7d32', '#43a047', '#fb8c00', '#388e3c', '#fbc02d', '',    '#43a047', '#e53935', '',    '#388e3c', '#43a047', '#fb8c00', '#43a047', '#fbc02d', '#e53935'
];
const logoText = 'World of Elixrs';

const Logo = () => {
  return (
    <Link href="/" className="flex items-center gap-2 md:gap-4 text-xl md:text-2xl font-headline font-bold text-accent hover:text-accent/90 transition-colors navbar-logo">
      <img
        src="/images/elixr-logo.png"
        alt="Elixr Logo"
        className="h-8 w-auto md:h-12 object-contain"
        style={{ objectFit: 'contain', objectPosition: 'center', maxWidth: '120px', minWidth: '32px' }}
      />
      <span className="ml-1 md:ml-2 text-lg md:text-xl font-semibold whitespace-nowrap">
        {logoText.split('').map((char, i) =>
          char === ' ' ? (
            <span key={i}>&nbsp;</span>
          ) : (
            <span key={i} style={{ color: letterColors[i % letterColors.length] }}>{char}</span>
          )
        )}
      </span>
    </Link>
  );
};
export default Logo;

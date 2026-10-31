'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const NAV_LEFT  = [
  { href: '/encode', label: 'Encode' },
  { href: '/decode', label: 'Decode' },
];
const NAV_RIGHT = [
  { href: '/image-in-image', label: 'Image in Image' },
  { href: '/analysis', label: 'Analysis' },
];

function NavLink({ href, label, pathname }: { href: string; label: string; pathname: string }) {
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`nav-link${active ? ' active' : ''}`}
    >
      {label}
    </Link>
  );
}

export default function NavBar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`nav-root${scrolled ? ' scrolled' : ''}`}>
      <div className="nav-inner">

        {/* Left nav */}
        <nav className="nav-links" aria-label="Primary left">
          {NAV_LEFT.map(n => (
            <NavLink key={n.href} href={n.href} label={n.label} pathname={pathname} />
          ))}
        </nav>

        {/* Centered wordmark */}
        <Link href="/" className="nav-wordmark" aria-label="StealthDrop home">
          StealthDrop
        </Link>

        {/* Right nav */}
        <nav className="nav-links nav-links-right" aria-label="Primary right">
          {NAV_RIGHT.map(n => (
            <NavLink key={n.href} href={n.href} label={n.label} pathname={pathname} />
          ))}
        </nav>
      </div>
    </header>
  );
}

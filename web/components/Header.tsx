'use client';

import { cn } from '@/utils';
import { SearchBar } from './SearchBar';
import Image from 'next/image';

export default function Header() {
  return (
    <header
      className={cn(
        'flex items-center justify-center grow min-h-14 px-4 py-1',
        'border-b border-dark-secondary bg-mystery-purple',
      )}
      role="banner"
    >
      {/* Left section - placeholder for logo/branding */}
      <div className="lg:flex-1">
        <Image
          className={'max-sm:hidden'}
          width={150}
          height={100}
          src={'/images/white_rabbit_logo.svg'}
          alt={'brand_logo'}
          draggable={false}
        />
      </div>

      {/* Center section - Search Bar */}
      <nav
        role="search"
        aria-label="Global search"
        className="flex-1 flex justify-center"
      >
        <SearchBar />
      </nav>

      {/* Right section - placeholder for user actions */}
      <div className="lg:flex-1" />
    </header>
  );
}

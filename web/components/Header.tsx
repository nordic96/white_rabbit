'use client';

import { SearchBar } from './SearchBar';

export default function Header() {
  return (
    <header
      className="flex items-center justify-center grow min-h-14 px-4 border-b border-dark-secondary dark:bg-dark-secondary"
      role="banner"
    >
      {/* Left section - placeholder for logo/branding */}
      <div className="flex-1" />

      {/* Center section - Search Bar */}
      <nav
        className="flex-1 flex justify-center"
        role="search"
        aria-label="Global search"
      >
        <SearchBar />
      </nav>

      {/* Right section - placeholder for user actions */}
      <div className="flex-1" />
    </header>
  );
}

'use client';

import { useRef, useCallback, KeyboardEvent } from 'react';
import { HiSearch, HiX } from 'react-icons/hi';
import { SearchResultItem } from '@/types';
import { cn } from '@/utils';
import { useSearchStore } from '@/store';
import useClickOutside from '@/hooks/useClickOutside';
import { SearchDropdown } from './SearchDropdown';

export default function SearchBar() {
  const {
    query,
    results,
    isLoading,
    error,
    isOpen,
    activeIndex,
    setQuery,
    setIsOpen,
    setActiveIndex,
    navigateNext,
    navigatePrev,
    selectCurrent,
    clear,
    closeDropdown,
    selectSearchResult,
  } = useSearchStore();

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useClickOutside(containerRef, () => {
    closeDropdown();
  });

  const handleInputChange = (value: string) => {
    setQuery(value);
  };

  const handleClear = useCallback(() => {
    clear();
    inputRef.current?.focus();
  }, [clear]);

  const handleResultSelect = useCallback(
    (result: SearchResultItem) => {
      selectSearchResult(result);
      closeDropdown();
      setQuery('');
    },
    [closeDropdown, setQuery, selectSearchResult],
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) {
      if (e.key === 'Escape') {
        handleClear();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        navigateNext();
        break;
      case 'ArrowUp':
        e.preventDefault();
        navigatePrev();
        break;
      case 'Enter':
        e.preventDefault();
        const selected = selectCurrent();
        if (selected) {
          handleResultSelect(selected);
        }
        break;
      case 'Escape':
        e.preventDefault();
        closeDropdown();
        break;
    }
  };

  const handleFocus = () => {
    if (query.trim() && results.length > 0) {
      setIsOpen(true);
    }
  };

  const showDropdown = (isOpen &&
    (results.length > 0 || isLoading || error)) as boolean;

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-md"
      role="combobox"
      aria-controls="search-results-listbox"
      aria-expanded={showDropdown}
      aria-haspopup="listbox"
      aria-owns="search-results-listbox"
    >
      <div className="relative">
        {/* Search Icon */}
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <HiSearch
            className={cn(
              'w-5 h-5 transition-colors',
              isLoading
                ? 'text-blue-500 animate-pulse'
                : 'text-gray-400 dark:text-gray-500',
            )}
            aria-hidden="true"
          />
        </div>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder="Search mysteries, locations, time periods..."
          className={cn(
            'w-full py-1 pl-10 pr-10 text-sm',
            'bg-white dark:bg-dark-gray',
            'border border-gray-300 dark:border-gray-600',
            'rounded-full',
            'text-gray-900 dark:text-gray-100',
            'placeholder-gray-500 dark:placeholder-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'transition-all',
          )}
          role="searchbox"
          aria-label="Search"
          aria-autocomplete="list"
          aria-controls="search-results-listbox"
          aria-activedescendant={
            activeIndex >= 0 ? `search-result-${activeIndex}` : undefined
          }
        />

        {/* Clear Button */}
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className={cn(
              'absolute inset-y-0 right-0 flex items-center pr-3',
              'text-gray-400 dark:text-gray-500',
              'hover:text-gray-600 dark:hover:text-gray-300',
              'transition-colors',
            )}
            aria-label="Clear search"
          >
            <HiX className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {showDropdown && (
        <SearchDropdown
          results={results}
          isLoading={isLoading}
          error={error}
          activeIndex={activeIndex}
          onSelect={handleResultSelect}
          onHover={setActiveIndex}
        />
      )}
    </div>
  );
}

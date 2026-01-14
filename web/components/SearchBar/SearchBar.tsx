'use client';

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { HiSearch, HiX } from 'react-icons/hi';
import { SearchResponse, SearchResultItem } from '@/types';
import { cn } from '@/utils';
import { SearchDropdown } from './SearchDropdown';

const DEBOUNCE_MS = 300;

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchResults = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}&limit=20`,
      );
      if (!res.ok) {
        throw new Error('Search failed');
      }
      const data: SearchResponse = await res.json();
      setResults(data.results);
      setIsOpen(true);
      setActiveIndex(-1);
    } catch {
      setError('Failed to search. Please try again.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!value.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      fetchResults(value);
    }, DEBOUNCE_MS);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleResultSelect = (result: SearchResultItem) => {
    // TODO: Navigate to the selected result
    console.log('Selected:', result);
    setIsOpen(false);
    setQuery('');
  };

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
        setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < results.length) {
          handleResultSelect(results[activeIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const showDropdown = isOpen && (results.length > 0 || isLoading || error);

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
          onFocus={() => query.trim() && results.length > 0 && setIsOpen(true)}
          placeholder="Search mysteries, locations, time periods..."
          className={cn(
            'w-full py-2 pl-10 pr-10 text-sm',
            'bg-white dark:bg-dark-gray',
            'border border-gray-300 dark:border-gray-600',
            'rounded-lg',
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

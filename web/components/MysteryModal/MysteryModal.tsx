'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMysteryStore } from '@/store/mysteryStore';
import MysteryModalContent from './MysteryModalContent';

export default function MysteryModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const backdropRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const isUpdatingUrl = useRef(false);

  const { selectedId, cache, isLoading, error, setSelectedId, unSelect } =
    useMysteryStore();

  const isOpen = selectedId !== null;
  const mystery = selectedId ? cache[selectedId] : null;

  const handleClose = useCallback(() => {
    unSelect();
  }, [unSelect]);

  // URL sync: Read mystery param on mount only
  useEffect(() => {
    const mysteryParam = searchParams.get('mystery');
    // Only sync from URL to state on initial mount or external URL changes
    if (isUpdatingUrl.current) {
      isUpdatingUrl.current = false;
      return;
    }
    if (mysteryParam && mysteryParam !== selectedId) {
      setSelectedId(mysteryParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // URL sync: Update URL when selectedId changes (from user interaction)
  useEffect(() => {
    const mysteryParam = searchParams.get('mystery');
    if (selectedId && mysteryParam !== selectedId) {
      isUpdatingUrl.current = true;
      const params = new URLSearchParams(searchParams.toString());
      params.set('mystery', selectedId);
      router.replace(`?${params.toString()}`, { scroll: false });
    } else if (!selectedId && mysteryParam) {
      isUpdatingUrl.current = true;
      router.replace('/', { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      backdropRef.current?.focus();
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={backdropRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mystery-modal-title"
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div
        className="relative w-full max-w-3xl max-h-[85vh] bg-white dark:bg-gray-900 rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Loading State */}
        {isLoading && !mystery && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                Loading mystery details...
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !mystery && (
          <div className="flex flex-col items-center justify-center h-64 p-6">
            <div className="text-center">
              <svg
                className="w-16 h-16 text-red-500 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Error Loading Mystery
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        {mystery && (
          <MysteryModalContent mystery={mystery} onClose={handleClose} />
        )}
      </div>
    </div>
  );
}

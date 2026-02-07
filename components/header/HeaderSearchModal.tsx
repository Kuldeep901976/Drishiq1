'use client';

import React from 'react';
import { Search, X } from 'lucide-react';

interface HeaderSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export function HeaderSearchModal({
  isOpen,
  onClose,
  searchQuery,
  setSearchQuery,
  onSubmit,
  inputRef
}: HeaderSearchModalProps) {
  if (!isOpen) return null;
  return (
    <div className="search-overlay-wrapper" onClick={onClose}>
      <div className="search-modal-card" onClick={e => e.stopPropagation()}>
        <button className="search-close-button" onClick={onClose} aria-label="Close search">
          <X size={20} />
        </button>
        <form onSubmit={onSubmit} className="search-form-inline">
          <input
            ref={inputRef}
            type="text"
            className="search-input-field"
            placeholder="Search across DrishiQ website..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="search-submit-button">
            <Search size={22} />
          </button>
        </form>
      </div>
    </div>
  );
}

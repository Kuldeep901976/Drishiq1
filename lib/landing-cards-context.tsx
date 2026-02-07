"use client";

import React, { createContext, useContext, useState } from 'react';

interface LandingCard {
  id: string;
  title: string;
  description: string;
  image: string;
  link: string;
  iconId?: string;
}

interface LandingCardsContextType {
  cards: LandingCard[];
  loading: boolean;
  addCard: (card: LandingCard) => void;
  removeCard: (id: string) => void;
  updateCard: (id: string, card: Partial<LandingCard>) => void;
  getActiveCards: () => LandingCard[];
}

const LandingCardsContext = createContext<LandingCardsContextType | undefined>(undefined);

export function LandingCardsProvider({ children }: { children: React.ReactNode }) {
  const [cards, setCards] = useState<LandingCard[]>([]);
  const [loading, setLoading] = useState(false);

  const addCard = (card: LandingCard) => {
    setCards(prev => [...prev, card]);
  };

  const removeCard = (id: string) => {
    setCards(prev => prev.filter(card => card.id !== id));
  };

  const updateCard = (id: string, updates: Partial<LandingCard>) => {
    setCards(prev => prev.map(card => 
      card.id === id ? { ...card, ...updates } : card
    ));
  };

  const getActiveCards = () => cards.filter(card => card.id);

  return (
    <LandingCardsContext.Provider value={{ cards, loading, addCard, removeCard, updateCard, getActiveCards }}>
      {children}
    </LandingCardsContext.Provider>
  );
}

export function useLandingCards() {
  const context = useContext(LandingCardsContext);
  if (context === undefined) {
    throw new Error('useLandingCards must be used within a LandingCardsProvider');
  }
  return context;
}

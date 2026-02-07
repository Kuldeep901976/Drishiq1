"use client";

import { useState, useEffect } from 'react';

export function useUserProfile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock implementation
    setLoading(false);
  }, []);

  const profile = user ? {
    full_name: user.full_name || 'User',
    date_of_birth: user.date_of_birth || null,
    email: user.email || '',
    ...user
  } : null;

  return {
    user,
    profile,
    loading,
    updateProfile: () => {},
    signOut: () => {}
  };
}

export function getFirstName(name: string) {
  return name ? name.split(' ')[0] : '';
}

export function calculateAge(birthDate: string) {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

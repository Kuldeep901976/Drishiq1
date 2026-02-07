'use client';
// Shared nav link config for desktop and mobile header.

import React from 'react';
import {
  Hammer, Compass, RefreshCw, Heart, Link2, Users,
  PersonStanding, Flower2, Sparkles, Package, Ticket, Gift, Handshake
} from 'lucide-react';

export type NavItem = { href: string; icon: React.ReactNode; label: string };

export function getMeetYourselfItems(getText: (key: string, fallback: string) => string): NavItem[] {
  return [
    { href: '/meet-yourself/builder', icon: <Hammer size={16} />, label: getText('meet_yourself.types.builder', 'Builder') },
    { href: '/meet-yourself/seeker', icon: <Compass size={16} />, label: getText('meet_yourself.types.seeker', 'Seeker') },
    { href: '/meet-yourself/rebooter', icon: <RefreshCw size={16} />, label: getText('meet_yourself.types.rebooter', 'Rebooter') },
    { href: '/meet-yourself/giver', icon: <Heart size={16} />, label: getText('meet_yourself.types.giver', 'Giver') },
    { href: '/meet-yourself/connector', icon: <Link2 size={16} />, label: getText('meet_yourself.types.connector', 'Connector') },
    { href: '/meet-yourself/dependent', icon: <Users size={16} />, label: getText('meet_yourself.types.dependent', 'Dependent') },
    { href: '/meet-yourself/escaper', icon: <PersonStanding size={16} />, label: getText('meet_yourself.types.escaper', 'Escaper') },
    { href: '/meet-yourself/solo', icon: <Flower2 size={16} />, label: getText('meet_yourself.types.solo', 'Solo') },
    { href: '/meet-yourself/giving-beyond', icon: <Sparkles size={16} />, label: getText('meet_yourself.types.giving_beyond', 'Giving Beyond') },
    { href: '/meet-yourself/problem-carrier', icon: <Package size={16} />, label: getText('meet_yourself.types.problem_carrier', 'Problem Carrier') },
  ];
}

export function getYourPathItems(getText: (key: string, fallback: string) => string): NavItem[] {
  return [
    { href: '/priceplan#your-clarity-pass', icon: <Ticket size={16} />, label: getText('your_path.your_clarity_pass', 'Your Clarity pass') },
    { href: '/priceplan#clarity-pass', icon: <Sparkles size={16} />, label: getText('your_path.co_create', 'Co-create') },
    { href: '/priceplan#gift-section', icon: <Gift size={16} />, label: getText('your_path.gift_a_spark', 'Gift a Spark') },
    { href: '/priceplan#support-section', icon: <Handshake size={16} />, label: getText('your_path.fuel_a_journey', 'Fuel a Journey') },
  ];
}

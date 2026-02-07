'use client';

import React, { useState, useEffect, useRef } from 'react';

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD format
  onChange: (date: string) => void;
  maxDate?: string; // YYYY-MM-DD format (e.g., today's date)
  minDate?: string; // YYYY-MM-DD format (e.g., 1900-01-01)
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export default function CustomDatePicker({
  value,
  onChange,
  maxDate,
  minDate,
  placeholder = 'Select date',
  className = '',
  id,
  disabled = false
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [step, setStep] = useState<'year' | 'month' | 'day'>('year');
  const pickerRef = useRef<HTMLDivElement>(null);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const currentDay = new Date().getDate();

  // Parse value to extract year, month, day
  useEffect(() => {
    if (value) {
      const [year, month, day] = value.split('-').map(Number);
      if (year && month && day) {
        setSelectedYear(year);
        setSelectedMonth(month - 1); // 0-indexed
        setSelectedDay(day);
      }
    }
  }, [value]);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setStep('year');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const getDaysInMonth = (year: number, month: number) => {
    if (month === 1) { // February
      // Check for leap year
      return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0) ? 29 : 28;
    }
    return DAYS_IN_MONTH[month];
  };

  const generateYearRange = () => {
    const max = maxDate ? parseInt(maxDate.split('-')[0]) : currentYear;
    const min = minDate ? parseInt(minDate.split('-')[0]) : 1900;
    const years: number[] = [];
    for (let i = max; i >= min; i--) {
      years.push(i);
    }
    return years;
  };

  const getAvailableDays = () => {
    if (selectedYear === null || selectedMonth === null) return [];
    
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    const days: number[] = [];
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    setStep('month');
  };

  const handleMonthSelect = (month: number) => {
    setSelectedMonth(month);
    setStep('day');
  };

  const handleDaySelect = (day: number) => {
    setSelectedDay(day);
    
    if (selectedYear !== null && selectedMonth !== null) {
      const monthStr = String(selectedMonth + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const dateString = `${selectedYear}-${monthStr}-${dayStr}`;
      onChange(dateString);
      setIsOpen(false);
      setStep('year');
    }
  };

  const handleBack = () => {
    if (step === 'day') {
      setStep('month');
    } else if (step === 'month') {
      setStep('year');
    } else {
      setIsOpen(false);
    }
  };

  const formatDisplayValue = () => {
    if (value) {
      const [year, month, day] = value.split('-');
      if (year && month && day) {
        return `${day} ${MONTHS[parseInt(month) - 1]} ${year}`;
      }
    }
    return placeholder;
  };

  return (
    <div className="relative" ref={pickerRef}>
      <button
        type="button"
        id={id}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 text-left ${className} ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>
          {formatDisplayValue()}
        </span>
        <span className="float-right">📅</span>
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg w-full max-w-xs">
          {/* Header with back button */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <button
              type="button"
              onClick={handleBack}
              className="text-gray-600 hover:text-gray-800"
            >
              {step !== 'year' ? '← Back' : '✕'}
            </button>
            <h3 className="font-semibold text-gray-800">
              {step === 'year' && 'Select Year'}
              {step === 'month' && selectedYear && `Select Month - ${selectedYear}`}
              {step === 'day' && selectedYear && selectedMonth !== null && `Select Day - ${MONTHS[selectedMonth]} ${selectedYear}`}
            </h3>
            <div className="w-12"></div> {/* Spacer for centering */}
          </div>

          {/* Year Selection */}
          {step === 'year' && (
            <div className="max-h-64 overflow-y-auto p-3">
              <div className="grid grid-cols-4 gap-2">
                {generateYearRange().map((year) => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => handleYearSelect(year)}
                    className={`px-3 py-2 text-sm rounded hover:bg-green-50 transition-colors ${
                      selectedYear === year ? 'bg-green-600 text-white hover:bg-green-700' : 'text-gray-700'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Month Selection */}
          {step === 'month' && selectedYear !== null && (
            <div className="p-3">
              <div className="grid grid-cols-3 gap-2">
                {MONTHS.map((month, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleMonthSelect(index)}
                    className={`px-4 py-2 text-sm rounded hover:bg-green-50 transition-colors ${
                      selectedMonth === index ? 'bg-green-600 text-white hover:bg-green-700' : 'text-gray-700'
                    }`}
                  >
                    {month.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Day Selection */}
          {step === 'day' && selectedYear !== null && selectedMonth !== null && (
            <div className="p-3 max-h-64 overflow-y-auto">
              <div className="grid grid-cols-7 gap-1">
                {getAvailableDays().map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDaySelect(day)}
                    className={`px-3 py-2 text-sm rounded hover:bg-green-50 transition-colors ${
                      selectedDay === day ? 'bg-green-600 text-white hover:bg-green-700' : 'text-gray-700'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}




















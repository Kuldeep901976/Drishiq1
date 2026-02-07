'use client';

import React, { useState } from 'react';

interface UnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (confirmation: string) => Promise<boolean>;
}

export default function UnlockModal({ isOpen, onClose, onConfirm }: UnlockModalProps) {
  const [confirmation, setConfirmation] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (confirmation.toUpperCase() !== 'UNLOCK') {
      setError('Please type UNLOCK to confirm');
      return;
    }

    setIsProcessing(true);
    setError('');

    const success = await onConfirm(confirmation);
    
    setIsProcessing(false);

    if (success) {
      setConfirmation('');
      onClose();
    } else {
      setError('Unlock failed. Please try again or contact support.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Unlock Birth Data</h2>
        
        <div className="mb-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-800 font-semibold mb-2">⚠️ Security Check Required</p>
            <p className="text-sm text-red-700">
              To edit locked birth details, you must confirm your identity.
            </p>
          </div>

          <p className="text-sm text-gray-700 mb-3">
            Type <strong>UNLOCK</strong> to confirm you want to unlock your birth data for editing:
          </p>

          <input
            type="text"
            value={confirmation}
            onChange={(e) => {
              setConfirmation(e.target.value);
              setError('');
            }}
            placeholder="Type UNLOCK"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              error ? 'border-red-500' : 'border-gray-300 focus:ring-green-500'
            }`}
            autoFocus
            aria-label="Confirmation text"
          />

          {error && (
            <p className="text-xs text-red-500 mt-1">{error}</p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={isProcessing || confirmation.toUpperCase() !== 'UNLOCK'}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? 'Processing...' : 'Confirm Unlock'}
          </button>
          
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}


'use client';

import React from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';

interface HeaderQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrImageError: boolean;
  onQrImageError: () => void;
  getText: (key: string, fallback: string) => string;
}

export function HeaderQRModal({
  isOpen,
  onClose,
  qrImageError,
  onQrImageError,
  getText
}: HeaderQRModalProps) {
  if (!isOpen) return null;
  return (
    <div className="qr-modal-overlay" onClick={onClose}>
      <div className="qr-modal-content" onClick={e => e.stopPropagation()}>
        <button className="qr-modal-close" onClick={onClose} aria-label="Close QR code">
          <X size={20} />
        </button>
        <h3 className="qr-modal-title">{getText('profile.scan_to_sign_up', 'Scan to Sign Up')}</h3>
        {qrImageError ? (
          <div style={{
            width: '300px',
            height: '300px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f3f4f6',
            borderRadius: '8px',
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#6b7280'
          }}>
            QR Code
          </div>
        ) : (
          <Image
            src="/assets/images/QR.png"
            alt="QR Code for Sign Up"
            width={300}
            height={300}
            className="qr-modal-image"
            unoptimized
            onError={onQrImageError}
          />
        )}
        <p className="qr-modal-text">{getText('profile.qr_scan_instruction', 'Use your phone camera to scan this QR code')}</p>
      </div>
    </div>
  );
}

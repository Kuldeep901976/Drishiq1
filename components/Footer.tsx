'use client';

import React from 'react';
import { useLanguage } from '../lib/drishiq-i18n';

interface FooterProps {
  variant?: 'full' | 'minimal';
  userType?: 'guest' | 'enterprise' | 'authenticated';
}

const Footer: React.FC<FooterProps> = ({ variant = 'full', userType = 'guest' }) => {
  const { t } = useLanguage();

  return (
    <footer className="drishiq-footer">
     
      {/* Contact Info and Links */}
      <p className="footer-contact-info">
        {t('footer.contact')} |{' '}
        <a href="/terms" className="footer-link">
          {t('footer.terms')}
        </a>
      </p>

      {/* Copyright */}
      <p className="footer-copyright">
        {t('footer.copyright')}
      </p>
    </footer>
  );
};

export default Footer;

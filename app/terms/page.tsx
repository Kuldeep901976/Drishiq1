'use client';

import React from 'react';
import Footer from '@/components/Footer';
import { useLanguage } from '@/lib/drishiq-i18n';

const TermsPage: React.FC = () => {
  const { t } = useLanguage(['terms']);

  return (
    <div className="min-h-screen bg-gray-50">
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('terms.title')}
            </h1>
            <p className="text-gray-600">
              <strong>{t('terms.lastUpdated')}</strong> {t('terms.lastUpdatedText')}
            </p>
          </div>

          {/* Terms & Conditions Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-2">
              {t('terms.sections.terms.title')}
            </h2>

          <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('terms.sections.terms.userDefinition.title')}</h3>
                <p className="text-gray-700 leading-relaxed">
                  {t('terms.sections.terms.userDefinition.content')}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('terms.sections.terms.natureOfServices.title')}</h3>
                <p className="text-gray-700 leading-relaxed">
                  {t('terms.sections.terms.natureOfServices.content1')}
                </p>
                <p className="text-gray-700 leading-relaxed mt-2">
                  {t('terms.sections.terms.natureOfServices.content2')}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('terms.sections.terms.aiDisclosure.title')}</h3>
                <p className="text-gray-700 leading-relaxed">
                  {t('terms.sections.terms.aiDisclosure.content')}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('terms.sections.terms.generalDisclaimer.title')}</h3>
                <p className="text-gray-700 leading-relaxed">
                  {t('terms.sections.terms.generalDisclaimer.content')}
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-3">
                  <p className="text-yellow-800 text-sm">
                    <strong>{t('terms.sections.terms.generalDisclaimer.disclaimerBox.label')}</strong> {t('terms.sections.terms.generalDisclaimer.disclaimerBox.content')}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('terms.sections.terms.userExpectation.title')}</h3>
                <p className="text-gray-700 leading-relaxed">
                  {t('terms.sections.terms.userExpectation.content1')}
                </p>
                <p className="text-gray-700 leading-relaxed mt-2">
                  {t('terms.sections.terms.userExpectation.content2')}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('terms.sections.terms.sessionCharges.title')}</h3>
                <p className="text-gray-700 leading-relaxed">
                  {t('terms.sections.terms.sessionCharges.content')}
                </p>
                <ul className="list-disc list-inside text-gray-700 mt-3 space-y-1">
                  <li>{t('terms.sections.terms.sessionCharges.points.point1')}</li>
                  <li>{t('terms.sections.terms.sessionCharges.points.point2')}</li>
                  <li>{t('terms.sections.terms.sessionCharges.points.point3')}</li>
                  <li>{t('terms.sections.terms.sessionCharges.points.point4')}</li>
                  <li>{t('terms.sections.terms.sessionCharges.points.point5')}</li>
                  <li>{t('terms.sections.terms.sessionCharges.points.point6')}</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('terms.sections.terms.paidSubscriptions.title')}</h3>
                <p className="text-gray-700 leading-relaxed">
                  {t('terms.sections.terms.paidSubscriptions.content')}
                </p>
                <ul className="list-disc list-inside text-gray-700 mt-3 space-y-1">
                  <li>{t('terms.sections.terms.paidSubscriptions.points.point1')}</li>
                  <li>{t('terms.sections.terms.paidSubscriptions.points.point2')}</li>
                  <li>{t('terms.sections.terms.paidSubscriptions.points.point3')}</li>
                  <li>{t('terms.sections.terms.paidSubscriptions.points.point4')}</li>
                  <li>{t('terms.sections.terms.paidSubscriptions.points.point5')}</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('terms.sections.terms.dataRetention.title')}</h3>
                <p className="text-gray-700 leading-relaxed">
                  {t('terms.sections.terms.dataRetention.content')}
                </p>
                <ul className="list-disc list-inside text-gray-700 mt-3 space-y-1">
                  <li>{t('terms.sections.terms.dataRetention.points.point1')}</li>
                  <li>{t('terms.sections.terms.dataRetention.points.point2')}</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('terms.sections.terms.governingLaw.title')}</h3>
                <p className="text-gray-700 leading-relaxed">
                  {t('terms.sections.terms.governingLaw.content')}
                </p>
              </div>
            </div>
            </section>

          {/* Cookies Policy Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-2">
              {t('terms.sections.cookies.title')}
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('terms.sections.cookies.webAppCovered.title')}</h3>
                <p className="text-gray-700 leading-relaxed">
                  {t('terms.sections.cookies.webAppCovered.content')}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('terms.sections.cookies.whatAreCookies.title')}</h3>
                <p className="text-gray-700 leading-relaxed">
                  {t('terms.sections.cookies.whatAreCookies.content')}
                </p>
          </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('terms.sections.cookies.typesOfCookies.title')}</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>{t('terms.sections.cookies.typesOfCookies.points.point1')}</li>
                  <li>{t('terms.sections.cookies.typesOfCookies.points.point2')}</li>
                  <li>{t('terms.sections.cookies.typesOfCookies.points.point3')}</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('terms.sections.cookies.managingCookies.title')}</h3>
                <p className="text-gray-700 leading-relaxed">
                  {t('terms.sections.cookies.managingCookies.content')}
                </p>
              </div>
            </div>
              </section>

          {/* Privacy Policy Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-2">
              {t('terms.sections.privacy.title')}
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('terms.sections.privacy.scope.title')}</h3>
                <p className="text-gray-700 leading-relaxed">
                  {t('terms.sections.privacy.scope.content')}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('terms.sections.privacy.dataWeCollect.title')}</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>{t('terms.sections.privacy.dataWeCollect.points.point1')}</li>
                  <li>{t('terms.sections.privacy.dataWeCollect.points.point2')}</li>
                  <li>{t('terms.sections.privacy.dataWeCollect.points.point3')}</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('terms.sections.privacy.howWeUseData.title')}</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>{t('terms.sections.privacy.howWeUseData.points.point1')}</li>
                  <li>{t('terms.sections.privacy.howWeUseData.points.point2')}</li>
                  <li>{t('terms.sections.privacy.howWeUseData.points.point3')}</li>
                  <li>{t('terms.sections.privacy.howWeUseData.points.point4')}</li>
                  <li>{t('terms.sections.privacy.howWeUseData.points.point5')}</li>
                  <li>{t('terms.sections.privacy.howWeUseData.points.point6')}</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('terms.sections.privacy.dataStorage.title')}</h3>
                <p className="text-gray-700 leading-relaxed">
                  {t('terms.sections.privacy.dataStorage.content1')}
                </p>
                <p className="text-gray-700 leading-relaxed mt-2">
                  {t('terms.sections.privacy.dataStorage.content2')}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('terms.sections.privacy.yourRights.title')}</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>{t('terms.sections.privacy.yourRights.points.point1')}</li>
                  <li>{t('terms.sections.privacy.yourRights.points.point2')}</li>
                  <li>{t('terms.sections.privacy.yourRights.points.point3')}</li>
                  <li>{t('terms.sections.privacy.yourRights.points.point4')}</li>
                </ul>
                <p className="text-gray-700 mt-2">
                  {t('terms.sections.privacy.yourRights.contactText')} <a href="mailto:support@drishiq.com" className="text-emerald-600 hover:text-emerald-700 underline">support@drishiq.com</a>
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('terms.sections.privacy.childrenPrivacy.title')}</h3>
                <p className="text-gray-700 leading-relaxed">
                  {t('terms.sections.privacy.childrenPrivacy.content')}
                </p>
              </div>
            </div>
              </section>

          {/* Contact Section */}
          <section className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t('terms.sections.contact.title')}</h2>
            <p className="text-gray-700 mb-2">
              {t('terms.sections.contact.description')}
            </p>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="font-semibold text-gray-900">{t('terms.sections.contact.companyName')}</p>
              <p className="text-gray-700">
                {t('terms.sections.contact.emailLabel')} <a href="mailto:support@drishiq.com" className="text-emerald-600 hover:text-emerald-700 underline">support@drishiq.com</a>
              </p>
            </div>
              </section>
            </div>
      </main>

      <Footer />
      </div>
  );
};

export default TermsPage; 
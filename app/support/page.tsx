'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Footer from '../../components/Footer';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/drishiq-i18n';
import { motion } from 'framer-motion';
import { Flower2, Rocket, Waves, Heart, User, Lock, Sparkles, Mail, Phone, Target, Send, Lock as LockIcon, ArrowLeft } from 'lucide-react';

interface SupportForm {
  name: string;
  email: string;
  phone: string;
  amount: number;
  cause: string;
  message: string;
  anonymous: boolean;
}

export default function SupportDetailsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [formData, setFormData] = useState<SupportForm>({
    name: '',
    email: '',
    phone: '',
    amount: 249,
    cause: '',
    message: '',
    anonymous: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shareInstead, setShareInstead] = useState<boolean>(false);
  
  // User and location state
  const [userCountry, setUserCountry] = useState('IN');
  const [userId, setUserId] = useState('guest');
  const [userEmail, setUserEmail] = useState('guest@example.com');
  const [userName, setUserName] = useState('Guest User');
  const [userPhone, setUserPhone] = useState('9999999999');

  // Modern support options with better design
  const supportOptions = [
    {
      id: 'gentle-nudge',
      title: 'One Gentle Nudge',
      emotionLabel: 'Gift one quiet moment',
      amount: 249,
      sessions: '1 session',
      validity: '2 weeks',
      description: 'Perfect for someone who needs a gentle push toward clarity',
      icon: <Flower2 size={24} />,
      gradient: 'from-pink-500 to-rose-500',
      bgGradient: 'from-pink-50 to-rose-50',
      borderColor: 'border-pink-200',
      textColor: 'text-pink-700'
    },
    {
      id: 'shift-forward',
      title: 'A Shift Forward',
      emotionLabel: 'Support someone\'s next honest step',
      amount: 499,
      sessions: '2 sessions',
      validity: '1 month',
      description: 'Give someone the space to take their next meaningful step',
      icon: <Rocket size={24} />,
      gradient: 'from-blue-500 to-indigo-500',
      bgGradient: 'from-blue-50 to-indigo-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700'
    },
    {
      id: 'deeper-space',
      title: 'Deeper Space',
      emotionLabel: 'Let them sit with it longer',
      amount: 1249,
      sessions: '5 sessions',
      validity: '2 months',
      description: 'Create space for deeper exploration and understanding',
      icon: <Waves size={24} />,
      gradient: 'from-emerald-500 to-teal-500',
      bgGradient: 'from-emerald-50 to-teal-50',
      borderColor: 'border-emerald-200',
      textColor: 'text-emerald-700'
    },
    {
      id: 'heart',
      title: 'Heart Donation',
      emotionLabel: 'Give from the heart',
      amount: null,
      sessions: 'Flexible',
      validity: 'Flexible',
      description: 'Contribute any amount to help us keep DrishiQ accessible for everyone who needs it',
      icon: <Heart size={24} />,
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-700'
    }
  ];

  const [selectedSupport, setSelectedSupport] = useState<'gentle-nudge' | 'shift-forward' | 'deeper-space' | 'heart'>('gentle-nudge');
  const [customAmount, setCustomAmount] = useState<number>(0);

  // Detect user location and authentication
  useEffect(() => {
    const detectUserAndLocation = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUserId(session.user.id);
          setUserEmail(session.user.email || 'user@example.com');
          setUserName(session.user.user_metadata?.full_name || 'User');
          setUserPhone(session.user.user_metadata?.phone || '9999999999');
        }

        const storedCountry = localStorage.getItem('userCountry');
        if (storedCountry) {
          setUserCountry(storedCountry);
          return;
        }

        try {
          const ipResponse = await fetch('https://ipapi.co/json/');
          const ipData = await ipResponse.json();
          if (ipData.country_code) {
            const countryCode = ipData.country_code;
            setUserCountry(countryCode);
            localStorage.setItem('userCountry', countryCode);
            return;
          }
        } catch (ipError) {
          console.log('IP geolocation failed, using default');
        }

        setUserCountry('IN');
      } catch (error) {
        console.error('Error detecting user/location:', error);
        setUserCountry('IN');
      }
    };

    detectUserAndLocation();
  }, []);

  const handleSelectSupport = (id: 'gentle-nudge' | 'shift-forward' | 'deeper-space' | 'heart') => {
    setSelectedSupport(id);
    const option = supportOptions.find(o => o.id === id);
    if (!option) return;
    
    if (option.amount !== null) {
      const baseAmount = option.amount;
      const finalAmount = userCountry === 'IN' ? baseAmount : Math.round(baseAmount * 0.012);
      setFormData(prev => ({ ...prev, amount: finalAmount }));
    } else {
      setFormData(prev => ({ ...prev, amount: customAmount || 0 }));
    }
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value || 0);
    setCustomAmount(value);
    if (selectedSupport === 'heart') {
      const finalAmount = userCountry === 'IN' ? value : Math.round(value * 0.012);
      setFormData(prev => ({ ...prev, amount: finalAmount }));
    }
  };

  const redirectToPayment = (amount: number, description: string) => {
    try {
      const paymentUrl = `/payment?amount=${amount}&description=${encodeURIComponent(description)}&type=support`;
      router.push(paymentUrl);
    } catch (e) {
      window.location.href = `/payment?amount=${amount}&description=${encodeURIComponent(description)}&type=support`;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const creditTokens = selectedSupport === 'heart' ? Math.floor(formData.amount / 100) : 
        selectedSupport === 'gentle-nudge' ? 1 : 
        selectedSupport === 'shift-forward' ? 2 : 5;
      
      const { error: dbError } = await supabase
        .from('credits')
        .insert({
          user_id: userId !== 'guest' ? userId : null,
          email: formData.anonymous ? 'anonymous@drishiq.com' : formData.email,
          name: formData.anonymous ? 'Anonymous Supporter' : formData.name,
          phone: formData.anonymous ? null : formData.phone,
          support_type: 'financial',
          support_level: selectedSupport,
          amount_requested: formData.amount,
          amount_contributed: 0,
          currency: userCountry === 'IN' ? 'INR' : 'USD',
          credit_tokens: creditTokens,
          tokens_used: 0,
          description: formData.message || 'Support contribution',
          urgency_level: 'medium',
          location: userCountry,
          status: 'pending',
          payment_status: 'pending',
          priority_score: 0,
          requested_at: new Date().toISOString()
        });

      if (dbError) {
        throw dbError;
      }

      const selected = supportOptions.find(o => o.id === selectedSupport);
      const title = selected ? selected.title : 'Support Contribution';
      redirectToPayment(formData.amount, title);
    } catch (error) {
      console.error('Error storing support request:', error);
      alert('Error submitting your support details. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        {/* Modern Hero Section */}
        <section className="relative pt-24 pb-20 overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-emerald-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-40 right-20 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-gradient-to-br from-cyan-400/20 to-emerald-400/20 rounded-full blur-2xl animate-pulse delay-2000"></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              {/* Modern Badge */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 text-white text-sm font-semibold rounded-full mb-8 shadow-lg"
              >
                <div className="w-2 h-2 bg-white rounded-full mr-3 animate-pulse"></div>
                Support Details
              </motion.div>

              {/* Modern Title */}
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-6xl md:text-7xl lg:text-8xl font-black text-gray-900 mb-8 leading-tight"
              >
                Fuel a Session,{' '}
                <span className="bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Fuel a Life
                </span>
              </motion.h1>

              {/* Modern Subtitle */}
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-12 leading-relaxed"
              >
                {t('support.hero.subtitle')}
              </motion.p>
            </motion.div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Modern Form */}
            <div className="lg:col-span-2">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8"
              >
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">{t('support.form.heading.title')}</h2>
                  <p className="text-lg text-gray-600">{t('support.form.heading.subtitle')}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Modern Personal Info Section */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="bg-gradient-to-r from-emerald-50/50 to-blue-50/50 border-2 border-emerald-100 rounded-2xl p-8"
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl flex items-center justify-center">
                        <User className="text-white" size={24} />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">{t('support.form.personal_info.title')}</h3>
                    </div>
                    
                    {/* Modern Anonymous Toggle */}
                    <div className="mb-6">
                      <label className="flex items-center gap-4 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="checkbox"
                            name="anonymous"
                            checked={formData.anonymous}
                            onChange={handleInputChange}
                            className="sr-only"
                          />
                          <div className={`w-12 h-6 rounded-full transition-all duration-300 ${
                            formData.anonymous ? 'bg-emerald-500' : 'bg-gray-300'
                          }`}>
                            <div className={`w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform duration-300 ${
                              formData.anonymous ? 'translate-x-6' : 'translate-x-0.5'
                            } mt-0.5`}></div>
                          </div>
                        </div>
                        <span className="text-lg font-semibold text-gray-700 group-hover:text-gray-900 transition-colors flex items-center gap-2">
                          <Lock size={18} /> {t('support.form.personal_info.anonymous_toggle')}
                        </span>
                      </label>
                      <p className="text-sm text-gray-500 mt-2 ml-16">{t('support.form.personal_info.anonymous_hint')}</p>
                    </div>

                    {/* Modern Form Fields */}
                    {!formData.anonymous && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-sm font-bold text-gray-700">
                            <span className="flex items-center gap-2">
                              <Sparkles size={16} className="text-amber-500" />
                              {t('support.form.fields.full_name.label')} *
                            </span>
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-xl shadow-sm focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                            placeholder={t('support.form.fields.full_name.placeholder')}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-bold text-gray-700">
                            <span className="flex items-center gap-2">
                              <Mail size={16} className="text-blue-500" />
                              {t('support.form.fields.email.label')} *
                            </span>
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-xl shadow-sm focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                            placeholder={t('support.form.fields.email.placeholder')}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-bold text-gray-700">
                            <span className="flex items-center gap-2">
                              <Phone size={16} className="text-emerald-500" />
                              {t('support.form.fields.phone.label')}
                            </span>
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-xl shadow-sm focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                            placeholder={t('support.form.fields.phone.placeholder')}
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>

                  {/* Modern Cause Selection */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                    className="bg-gradient-to-r from-purple-50/50 to-pink-50/50 border-2 border-purple-100 rounded-2xl p-8"
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                        <Target className="text-white" size={24} />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">{t('support.cause.title')}</h3>
                    </div>
                    <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                      {t('support.cause.description')}
                    </p>
                    
                    <div className="flex items-center gap-4 mb-6 p-4 bg-white/60 rounded-xl border-2 border-gray-200 hover:border-purple-300 transition-all duration-200">
                      <input
                        id="share-instead-checkbox"
                        type="checkbox"
                        checked={shareInstead}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setShareInstead(checked);
                          if (checked) {
                            setFormData(prev => ({ ...prev, cause: 'General support (allocate where needed)' }));
                          } else {
                            setFormData(prev => ({ ...prev, cause: '' }));
                          }
                        }}
                        className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                      />
                      <label htmlFor="share-instead-checkbox" className="text-gray-700 font-medium cursor-pointer text-lg">
                        {t('support.cause.share_instead_label')}
                      </label>
                    </div>

                  </motion.div>

                  {/* Modern Message Section */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="bg-gradient-to-r from-yellow-50/50 to-orange-50/50 border-2 border-yellow-100 rounded-2xl p-8"
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center">
                        <Send className="text-white" size={24} />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">{t('support.message.title')}</h3>
                      <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{t('support.message.optional')}</span>
                    </div>
                    <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                      {t('support.message.hint')}
                    </p>
                    
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-xl shadow-sm focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 resize-none bg-white/50 backdrop-blur-sm"
                      placeholder={t('support.message.placeholder')}
                    />
                    <div className="flex justify-between items-center mt-3">
                      <p className="text-sm text-gray-500">{t('support.message.footer_hint')}</p>
                      <span className="text-sm text-gray-500">{formData.message.length}/500</span>
                    </div>
                  </motion.div>

                  {/* Modern Submit Buttons */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.9 }}
                    className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200"
                  >
                    <button
                      type="button"
                      onClick={() => router.push('/support-in-need')}
                      className="flex items-center gap-3 px-6 py-4 border-2 border-gray-300 bg-white/60 backdrop-blur-sm text-gray-700 rounded-2xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      <ArrowLeft size={20} />
                      {t('support.buttons.back_to_options')}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 ${
                        isSubmitting 
                          ? 'bg-gray-400 text-white cursor-not-allowed' 
                          : 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white hover:from-emerald-700 hover:to-blue-700'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                          {t('support.buttons.processing')}
                        </>
                      ) : (
                        <>
                          <Heart size={20} />
                          {t('support.buttons.complete_support')}
                        </>
                      )}
                    </button>
                  </motion.div>
                </form>
              </motion.div>
            </div>

            {/* Modern Sidebar */}
            <div className="space-y-8">
              {/* Modern Support Options */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8"
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">{t('support.options.title')}</h3>
                
                <div className="space-y-4">
                  {supportOptions.map((opt, index) => {
                    const baseAmount = opt.amount !== null ? opt.amount : customAmount || 0;
                    const finalAmount = userCountry === 'IN' ? baseAmount : Math.round(baseAmount * 0.012);
                    const currency = userCountry === 'IN' ? 'INR' : 'USD';
                    const symbol = currency === 'INR' ? '₹' : '$';
                    
                    return (
                      <motion.div
                        key={opt.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
                        className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                          selectedSupport === opt.id 
                            ? `border-emerald-500 bg-gradient-to-r ${opt.bgGradient} shadow-lg` 
                            : 'border-gray-200 hover:border-gray-300 bg-white/60'
                        }`}
                        onClick={() => handleSelectSupport(opt.id as any)}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${opt.gradient} flex items-center justify-center text-2xl`}>
                              {opt.icon}
                            </div>
                            <div>
                              <h4 className="text-lg font-bold text-gray-900">{opt.title}</h4>
                              <p className="text-sm text-gray-600">{opt.sessions}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {opt.amount !== null ? (
                              <div className="text-2xl font-bold text-gray-900">
                                {symbol}{finalAmount}
                              </div>
                            ) : (
                              <div className="text-2xl font-bold text-purple-600">
                                {t('support.options.custom')}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-4">{opt.description}</p>
                        
                        {opt.id === 'heart' && selectedSupport === 'heart' && (
                          <div className="mt-4">
                            <input
                              type="number"
                              min={1}
                              value={customAmount || ''}
                              onChange={handleCustomAmountChange}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                              placeholder={t('support.options.placeholder_enter_amount')}
                            />
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Modern Trust Indicators */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="bg-gradient-to-br from-emerald-600 to-blue-600 text-white rounded-3xl p-8 text-center shadow-2xl"
              >
                <div className="mb-4 flex justify-center">
                  <LockIcon size={48} />
                </div>
                <h3 className="text-2xl font-bold mb-3">{t('support.trust.secure_title')}</h3>
                <p className="text-emerald-100 mb-6 text-lg">{t('support.trust.secure_text')}</p>
                <div className="grid grid-cols-2 gap-6 text-center">
                  <div>
                    <div className="text-2xl font-bold">256-bit</div>
                    <div className="text-sm text-emerald-200">{t('support.trust.ssl_encryption')}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">100%</div>
                    <div className="text-sm text-emerald-200">{t('support.trust.transparent')}</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
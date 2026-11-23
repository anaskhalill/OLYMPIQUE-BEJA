'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Check } from 'lucide-react';

export default function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('gdpr_consent');
    if (!consent) {
      setShowConsent(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('gdpr_consent', 'true');
    setShowConsent(false);
  };

  const rejectCookies = () => {
    localStorage.setItem('gdpr_consent', 'false');
    setShowConsent(false);
  };

  return (
    <AnimatePresence>
      {showConsent && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 shadow-2xl"
        >
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <ShieldAlert className="w-6 h-6 text-primary shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  We value your privacy
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking &quot;Accept All&quot;, you consent to our use of cookies.
                  <a href="/privacy" className="text-primary hover:underline ml-1">Privacy Policy</a>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={rejectCookies}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg transition-colors"
              >
                Reject All
              </button>
              <button
                onClick={acceptCookies}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-red-700 rounded-lg transition-colors"
                style={{ backgroundColor: 'var(--primary, #E3000F)' }}
              >
                <Check className="w-4 h-4" />
                Accept All
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

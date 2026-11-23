'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AgeVerification() {
  const [showVerification, setShowVerification] = useState(false);
  const [notOfAge, setNotOfAge] = useState(false);

  useEffect(() => {
    const checkAgeVerification = () => {
      const isVerified = localStorage.getItem('age_verified');
      if (!isVerified) {
        // We only show it when hash changes to #shop or #tickets
        const hash = window.location.hash;
        if (hash === '#shop' || hash === '#tickets') {
          setShowVerification(true);
        }
      }
    };

    // check on mount
    checkAgeVerification();

    window.addEventListener('hashchange', checkAgeVerification);
    
    // observe mutations to catch clicks using href="#shop"
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      if (link && (link.getAttribute('href') === '#shop' || link.getAttribute('href') === '#tickets')) {
        const isVerified = localStorage.getItem('age_verified');
        if (!isVerified) {
          setShowVerification(true);
        }
      }
    };
    document.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('hashchange', checkAgeVerification);
      document.removeEventListener('click', handleClick);
    };
  }, []);

  const confirmAge = (isOfAge: boolean) => {
    if (isOfAge) {
      localStorage.setItem('age_verified', 'true');
      setNotOfAge(false);
      setShowVerification(false);
    } else {
      setNotOfAge(true);
      setShowVerification(false);
      window.location.hash = '#home'; // send them back to home
    }
  };

  return (
    <>
    {notOfAge && (
      <div
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[110] bg-red-600 text-white text-sm font-bold px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2"
        role="alert"
      >
        You must be 18 or older to access the shop and tickets.
        <button
          onClick={() => setNotOfAge(false)}
          className="ml-3 underline hover:opacity-80"
          aria-label="Dismiss message"
        >
          Close
        </button>
      </div>
    )}
    <AnimatePresence>
      {showVerification && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-8 text-center shadow-2xl border border-gray-200 dark:border-zinc-800"
          >
            <div className="w-20 h-20 mx-auto bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6">
              <span className="text-3xl font-black text-primary" style={{ color: 'var(--primary, #E3000F)' }}>18+</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Age Verification
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Are you 18 years of age or older? You must be of legal age to access our ticket sales and official merchandise shop.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => confirmAge(true)}
                className="w-full py-3.5 px-4 font-bold text-white rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                style={{ backgroundColor: 'var(--primary, #E3000F)' }}
              >
                Yes, I am 18 or older
              </button>
              <button
                onClick={() => confirmAge(false)}
                className="w-full py-3.5 px-4 font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-zinc-800 rounded-xl transition-all hover:bg-gray-200 dark:hover:bg-zinc-700"
              >
                No, I am under 18
              </button>
            </div>
            <p className="mt-6 text-xs text-gray-500 dark:text-gray-500">
              By entering this section, you agree to our <a href="/terms" className="underline hover:text-gray-700 dark:hover:text-gray-300">Terms of Service</a> and <a href="/privacy" className="underline hover:text-gray-700 dark:hover:text-gray-300">Privacy Policy</a>.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}

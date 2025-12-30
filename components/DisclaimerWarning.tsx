'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const VISITOR_ID_KEY = 'yates-visitor-id';

function generateVisitorId(): string {
  return 'visitor_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export default function DisclaimerWarning() {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(4);
  const [canClose, setCanClose] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkIfSeenWarning();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!showWarning) return;
    
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanClose(true);
    }
  }, [showWarning, countdown]);

  const checkIfSeenWarning = async () => {
    try {
      // Get or create visitor ID
      let visitorId = localStorage.getItem(VISITOR_ID_KEY);
      if (!visitorId) {
        visitorId = generateVisitorId();
        localStorage.setItem(VISITOR_ID_KEY, visitorId);
      }

      // Check if this visitor has seen the warning
      const { data, error } = await supabase
        .from('warning_seen')
        .select('id')
        .eq('visitor_id', visitorId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows found, which is expected for new visitors
        console.error('Error checking warning status:', error);
      }

      // If no record found, show the warning
      if (!data) {
        setShowWarning(true);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = async () => {
    if (!canClose) return;

    try {
      const visitorId = localStorage.getItem(VISITOR_ID_KEY);
      if (visitorId) {
        // Mark as seen in Supabase
        await supabase
          .from('warning_seen')
          .insert({ visitor_id: visitorId });
      }
    } catch (err) {
      console.error('Error saving warning status:', err);
    }

    setShowWarning(false);
  };

  if (isLoading || !showWarning) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="relative max-w-2xl w-full bg-gradient-to-br from-red-950 to-gray-900 rounded-2xl border-2 border-red-500/50 shadow-2xl overflow-hidden">
        {/* Warning Header */}
        <div className="bg-red-600 px-6 py-4 flex items-center gap-3">
          <span className="text-4xl">⚠️</span>
          <h1 className="text-2xl font-black text-white uppercase tracking-wide">
            IMPORTANT DISCLAIMER
          </h1>
        </div>

        {/* Warning Content */}
        <div className="p-6 space-y-4">
          <div className="space-y-3 text-gray-200">
            <p className="flex gap-3">
              <span className="text-red-400 font-bold text-xl">1.</span>
              <span>None of those items that you may find in the products section actually are ours, and we are <strong className="text-red-400">NOT</strong> selling ANY of them!</span>
            </p>
            
            <p className="flex gap-3">
              <span className="text-red-400 font-bold text-xl">2.</span>
              <span>SO <strong className="text-red-400">DO NOT EXPECT</strong> ANY OF THEM TO ARRIVE!!</span>
            </p>
            
            <p className="flex gap-3">
              <span className="text-red-400 font-bold text-xl">3.</span>
              <span>Also we have a billing section because it&apos;s cool, but <strong className="text-red-400">WE ARE NOT DELIVERING ANYTHING!</strong></span>
            </p>
            
            <p className="flex gap-3">
              <span className="text-red-400 font-bold text-xl">4.</span>
              <span>And lastly <strong className="text-red-400">WE DO NOT</strong> save any of your credit card, or address so the information <strong className="text-green-400">ISN&apos;T BEING SAVED!</strong> AND <strong className="text-green-400">NOT STOLEN!</strong></span>
            </p>
            
            <p className="flex gap-3">
              <span className="text-red-400 font-bold text-xl">5.</span>
              <span>Visit <a href="/tos" className="text-blue-400 hover:text-blue-300 underline font-bold">yates-inc/tos</a> to learn more.</span>
            </p>
          </div>
        </div>

        {/* Close Button Area */}
        <div className="px-6 pb-6 flex justify-center">
          <button
            onClick={handleClose}
            disabled={!canClose}
            className={`px-8 py-3 rounded-xl font-bold text-lg transition-all ${
              canClose
                ? 'bg-green-600 hover:bg-green-500 text-white cursor-pointer hover:scale-105'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {canClose ? (
              'I Understand'
            ) : (
              <span className="flex items-center gap-2">
                <span>Please wait...</span>
                <span className="bg-gray-600 px-2 py-0.5 rounded text-sm">{countdown}s</span>
              </span>
            )}
          </button>
        </div>

        {/* Animated Border */}
        <div className="absolute inset-0 pointer-events-none rounded-2xl animate-pulse-border" />
      </div>

      <style jsx>{`
        @keyframes pulse-border {
          0%, 100% {
            box-shadow: inset 0 0 20px rgba(239, 68, 68, 0.3);
          }
          50% {
            box-shadow: inset 0 0 40px rgba(239, 68, 68, 0.5);
          }
        }
        .animate-pulse-border {
          animation: pulse-border 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}


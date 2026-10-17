import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Compass,
  Sparkles,
  MapPin,
  Mail,
  ShieldCheck,
  Globe,
  ArrowRight
} from 'lucide-react';

export const Footer: React.FC = () => {
  const { setActiveTab, showToast, setIsAiConciergeOpen } = useApp();
  const [emailInput, setEmailInput] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    showToast('Subscribed to TripNest Global Dispatch.', 'success');
    setEmailInput('');
  };

  return (
    <footer id="main-footer" className="border-t border-[#E2C076]/20 bg-[#070B14] text-slate-400">
      {/* Top Brand Banner */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Brand Info */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D4A853] via-[#E2C076] to-[#C59B3F] text-[#070B14] shadow-md shadow-[#D4A853]/25">
                <Compass className="h-5 w-5 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-white block">
                  TripNest<span className="text-[#E2C076]">.</span>
                </span>
                <span className="text-[10px] text-[#E2C076] tracking-widest font-semibold uppercase block">
                  Luxury Tourism & Stays
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
              Discover, plan, and enjoy unforgettable journeys. Verified luxury stays, strictly calculated GPS proximity discovery radar, and real-time AI tourist intelligence.
            </p>

            <div className="flex items-center space-x-2 text-xs text-slate-300">
              <ShieldCheck className="h-4 w-4 text-[#E2C076]" />
              <span>Strict GPS Radius Tourism Radar</span>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="grid grid-cols-2 gap-8 lg:col-span-4 sm:grid-cols-2">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#E2C076]">
                Destinations & Stays
              </h4>
              <ul className="mt-3.5 space-y-2 text-xs">
                <li>
                  <button
                    onClick={() => setActiveTab('destinations')}
                    className="hover:text-[#E2C076] transition-colors"
                  >
                    Kashmir Dal Lake
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('destinations')}
                    className="hover:text-[#E2C076] transition-colors"
                  >
                    Bali Ubud
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('destinations')}
                    className="hover:text-[#E2C076] transition-colors"
                  >
                    Swiss Alps
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('hotels')}
                    className="hover:text-[#E2C076] transition-colors"
                  >
                    Hotels & Chalets
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('experiences')}
                    className="hover:text-[#E2C076] transition-colors"
                  >
                    Curated Experiences
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#E2C076]">
                Platform
              </h4>
              <ul className="mt-3.5 space-y-2 text-xs">
                <li>
                  <button
                    onClick={() => setActiveTab('radar')}
                    className="hover:text-white text-[#E2C076] font-semibold transition-colors"
                  >
                    Discovery Radar
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setIsAiConciergeOpen(true)}
                    className="hover:text-[#E2C076] transition-colors"
                  >
                    AI Concierge
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('planner')}
                    className="hover:text-[#E2C076] transition-colors"
                  >
                    Trip Planner
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('mytrips')}
                    className="hover:text-[#E2C076] transition-colors"
                  >
                    My Vouchers
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Newsletter & Private Dispatch */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center space-x-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#E2C076]" />
              <span>Global Dispatch</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Receive curated destination guides, seasonal updates, and priority booking access.
            </p>

            <form onSubmit={handleSubscribe} className="flex items-center space-x-2 pt-1">
              <div className="relative flex-1">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter your email..."
                  className="w-full rounded-full border border-[#E2C076]/25 bg-[#0E1726] pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:border-[#E2C076] focus:outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                className="rounded-full bg-gradient-to-r from-[#D4A853] to-[#E2C076] hover:from-[#C59B3F] hover:to-[#D4A853] px-4 py-2.5 text-xs font-bold text-[#070B14] active:scale-95 transition-all shadow-md shadow-[#D4A853]/20"
              >
                Join
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Sub-bar */}
        <div className="mt-14 flex flex-col sm:flex-row items-center justify-between border-t border-[#E2C076]/15 pt-6 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} TripNest Inc. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Designed with luxury precision for global travelers.</p>
        </div>
      </div>
    </footer>
  );
};


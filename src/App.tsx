import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { DestinationsGrid } from './components/DestinationsGrid';
import { DestinationsListingPage } from './components/DestinationsListingPage';
import { DestinationDetailPage } from './components/DestinationDetailPage';
import { HotelsSection } from './components/HotelsSection';
import { ExperiencesSection } from './components/ExperiencesSection';
import { InteractiveMap } from './components/InteractiveMap';
import { TripPlanner } from './components/TripPlanner';
import { BudgetAndExpensesPage } from './components/BudgetAndExpensesPage';
import { GroupTravelPage } from './components/GroupTravelPage';
import { VaultAndNotificationsPage } from './components/VaultAndNotificationsPage';
import { TravelerAnalyticsDashboard } from './components/TravelerAnalyticsDashboard';
import { AdminAnalyticsDashboard } from './components/AdminAnalyticsDashboard';
import { MyTrips } from './components/MyTrips';
import { TripDetailPage } from './components/TripDetailPage';
import { DestinationModal } from './components/DestinationModal';
import { BookingModal } from './components/BookingModal';
import { AiConciergeModal } from './components/AiConciergeModal';
import { AuthModal } from './components/AuthModal';
import { SignOutConfirmModal } from './components/SignOutConfirmModal';
import { ToastContainer } from './components/ToastContainer';
import { Footer } from './components/Footer';
import { Bot, Sparkles, ArrowUp } from 'lucide-react';

const MainContent: React.FC = () => {
  const { activeTab, setIsAiConciergeOpen } = useApp();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      if (window.scrollY > 350) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', checkScroll, { passive: true });
    return () => window.removeEventListener('scroll', checkScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col selection:bg-[#E2C076] selection:text-[#070B14] relative">
      {/* Immersive Global Tourism Scenic Backdrop */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-10 bg-cover bg-center bg-no-repeat z-0 mix-blend-screen"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2400&q=80')`
        }}
      />
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-[#070B14]/80 via-[#0B1322]/90 to-[#070B14] z-0" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[500px] bg-gradient-to-b from-[#E2C076]/10 via-[#38BDF8]/5 to-transparent blur-3xl pointer-events-none z-0" />

      {/* Sticky Luxury Navbar */}
      <div className="relative z-40">
        <Navbar />
      </div>

      {/* Dynamic Viewport Content with Smooth Entry Animation on Navigation */}
      <main className="flex-1 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {activeTab === 'explore' && (
              <>
                <Hero />
                <DestinationsGrid />
                <HotelsSection />
                <InteractiveMap />
              </>
            )}

            {activeTab === 'destinations' && (
              <DestinationsListingPage />
            )}

            {activeTab === 'destination-detail' && (
              <DestinationDetailPage />
            )}

            {activeTab === 'hotels' && (
              <div className="pt-4">
                <HotelsSection />
              </div>
            )}

            {activeTab === 'planner' && (
              <div className="pt-4">
                <TripPlanner />
              </div>
            )}

            {activeTab === 'budget-expenses' && (
              <div className="pt-4">
                <BudgetAndExpensesPage />
              </div>
            )}

            {activeTab === 'groups-split' && (
              <div className="pt-4">
                <GroupTravelPage />
              </div>
            )}

            {activeTab === 'vault-alerts' && (
              <div className="pt-4">
                <VaultAndNotificationsPage />
              </div>
            )}

            {activeTab === 'mytrips' && (
              <div className="pt-4">
                <MyTrips />
              </div>
            )}

            {activeTab === 'trip-detail' && (
              <TripDetailPage />
            )}

            {activeTab === 'analytics' && (
              <div className="pt-4">
                <TravelerAnalyticsDashboard />
              </div>
            )}

            {activeTab === 'admin' && (
              <div className="pt-4">
                <AdminAnalyticsDashboard />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating AI Concierge Trigger Bubble */}
      <button
        id="floating-ai-concierge-fab"
        onClick={() => setIsAiConciergeOpen(true)}
        className="fixed bottom-6 left-6 z-40 group flex items-center space-x-2.5 rounded-full bg-white text-black p-3.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-semibold shadow-2xl shadow-black/50 border border-white/20 hover:scale-105 active:scale-95 transition-all"
        title="Open 24/7 AI Tourist Concierge"
      >
        <div className="relative">
          <Bot className="h-4 w-4 transition-transform group-hover:scale-110" />
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>
        <span className="hidden sm:inline">AI Concierge</span>
        <Sparkles className="h-3.5 w-3.5 text-sky-500" />
      </button>

      {/* Smooth Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            id="scroll-to-top-btn"
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.25 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-40 flex items-center space-x-2 rounded-full bg-[#0E1726]/90 border border-[#E2C076]/40 p-3.5 text-[#E2C076] shadow-2xl backdrop-blur-xl hover:bg-[#E2C076] hover:text-[#070B14] hover:shadow-[#E2C076]/20 active:scale-95 transition-all duration-200"
            title="Scroll to top"
          >
            <ArrowUp className="h-4 w-4" />
            <span className="hidden md:inline text-xs font-bold tracking-tight">Top</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Modals & Overlays */}
      <AuthModal />
      <SignOutConfirmModal />
      <DestinationModal />
      <BookingModal />
      <AiConciergeModal />

      {/* Notifications */}
      <ToastContainer />

      {/* Luxury Footer */}
      <Footer />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}

export default App;

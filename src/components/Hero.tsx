import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search,
  Calendar,
  Users,
  MapPin,
  Sparkles,
  ArrowRight,
  Compass,
  Bot,
  Globe,
  Radio,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';

const HERO_DESTINATIONS = [
  {
    id: 'kashmir',
    name: 'Kashmir Valley',
    country: 'Himalayas',
    tagline: 'Snow-capped peaks, royal Shikaras & alpine sanctuaries',
    image: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=2000&q=85',
    tag: 'Mountain Sanctuary',
    priceUsd: 450,
    coords: '34.0837° N, 74.7973° E'
  },
  {
    id: 'bali',
    name: 'Bali Ubud',
    country: 'Indonesia',
    tagline: 'Emerald canopy retreats & sacred Ayung River wellness',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=2000&q=85',
    tag: 'Rainforest Estate',
    priceUsd: 520,
    coords: '8.5069° S, 115.2625° E'
  },
  {
    id: 'zermatt',
    name: 'Zermatt Alps',
    country: 'Switzerland',
    tagline: 'Matterhorn vistas & private timber chalets',
    image: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=2000&q=85',
    tag: 'Alpine Luxury',
    priceUsd: 780,
    coords: '45.9765° N, 7.7491° E'
  },
  {
    id: 'maldives',
    name: 'Baa Atoll',
    country: 'Maldives',
    tagline: 'Suspended lagoon villas & UNESCO manta sanctuaries',
    image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=2000&q=85',
    tag: 'Private Atoll',
    priceUsd: 950,
    coords: '5.1092° N, 73.0298° E'
  }
];

export const Hero: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    activeTab,
    setActiveTab,
    openAiWithPrompt,
    formatPrice
  } = useApp();

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [guestCount, setGuestCount] = useState(2);
  const [travelDates, setTravelDates] = useState('Oct 12 - Oct 19');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % HERO_DESTINATIONS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const currentDest = HERO_DESTINATIONS[currentSlideIndex];

  const categories = [
    { id: 'All', label: 'All Sanctuaries' },
    { id: 'Mountain', label: 'Alpine & Snow' },
    { id: 'Island', label: 'Private Islands' },
    { id: 'Luxury', label: 'Heritage Estates' },
    { id: 'Cultural', label: 'Culture & Art' },
    { id: 'Nature', label: 'Rainforest & Lakes' }
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'explore') {
      const el = document.getElementById('destinations-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    setActiveTab('destinations');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section id="hero-section" className="relative w-full overflow-hidden bg-transparent">
      {/* Background Ambient Warm Golden Hour Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[550px] bg-gradient-to-b from-[#E2C076]/15 via-[#38BDF8]/10 to-transparent blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 pb-16 lg:pt-16 lg:pb-24">
        
        {/* Top Global Concierge Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#0E1726]/80 border border-[#E2C076]/30 backdrop-blur-xl text-xs text-slate-200 shadow-lg shadow-black/30">
            <Sparkles className="h-3.5 w-3.5 text-[#E2C076]" />
            <span className="font-semibold text-white">TripNest Global Concierge</span>
            <span className="text-[#E2C076]">•</span>
            <span className="text-slate-300">50+ Wonders & Heritage Stays</span>
          </div>
        </div>

        {/* Hero Title & Subtitle */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08]">
            Discover the World's{' '}
            <span className="bg-gradient-to-r from-[#E2C076] via-[#F6E05E] to-[#38BDF8] bg-clip-text text-transparent">
              Wonderous Journeys.
            </span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-2xl mx-auto">
            Plan, explore, and book handpicked 5-star retreats, bucket-list travel excursions, and day-by-day vacation itineraries worldwide.
          </p>
        </div>

        {/* Tourism Search Island */}
        <div className="max-w-4xl mx-auto mb-14">
          <form
            onSubmit={handleSearchSubmit}
            className="p-2 sm:p-2.5 rounded-3xl bg-[#0E1726]/90 border border-[#E2C076]/25 backdrop-blur-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] grid grid-cols-1 md:grid-cols-12 gap-2 items-center"
          >
            {/* Destination Input */}
            <div className="md:col-span-4 flex items-center px-3.5 py-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-transparent hover:border-[#E2C076]/30 transition-all">
              <MapPin className="h-4 w-4 text-[#E2C076] shrink-0 mr-2.5" />
              <div className="w-full text-left">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#E2C076]">
                  Destination / City
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Kashmir, Bali, Zermatt, Paris..."
                  className="w-full bg-transparent text-xs font-semibold text-white placeholder-slate-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Travel Dates */}
            <div className="md:col-span-3 flex items-center px-3.5 py-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-transparent hover:border-[#E2C076]/30 transition-all">
              <Calendar className="h-4 w-4 text-[#E2C076] shrink-0 mr-2.5" />
              <div className="w-full text-left">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#E2C076]">
                  Travel Dates
                </span>
                <input
                  type="text"
                  value={travelDates}
                  onChange={(e) => setTravelDates(e.target.value)}
                  className="w-full bg-transparent text-xs font-semibold text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Guests */}
            <div className="md:col-span-2 flex items-center px-3.5 py-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-transparent hover:border-[#E2C076]/30 transition-all">
              <Users className="h-4 w-4 text-[#E2C076] shrink-0 mr-2.5" />
              <div className="w-full text-left">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#E2C076]">
                  Travelers
                </span>
                <select
                  value={guestCount}
                  onChange={(e) => setGuestCount(Number(e.target.value))}
                  className="w-full bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
                >
                  <option value={1} className="bg-[#0E1726] text-white">1 Traveler</option>
                  <option value={2} className="bg-[#0E1726] text-white">2 Travelers (Couple)</option>
                  <option value={4} className="bg-[#0E1726] text-white">4 Family Suite</option>
                  <option value={6} className="bg-[#0E1726] text-white">6 Group Chalet</option>
                </select>
              </div>
            </div>

            {/* Search CTA */}
            <div className="md:col-span-3">
              <button
                type="submit"
                id="hero-search-submit-btn"
                className="w-full h-full min-h-[46px] flex items-center justify-center space-x-2 rounded-2xl bg-gradient-to-r from-[#D4A853] to-[#E2C076] hover:from-[#C59B3F] hover:to-[#D4A853] text-[#070B14] font-bold text-xs active:scale-[0.98] transition-all shadow-lg shadow-[#D4A853]/25"
              >
                <Search className="h-3.5 w-3.5" />
                <span>Search Holidays</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>

          {/* Quick AI Suggestions & Category Filters */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 px-2">
            <div className="flex items-center space-x-1.5 overflow-x-auto py-1">
              <span className="text-xs text-[#E2C076] font-semibold mr-1">Trending Destinations:</span>
              {HERO_DESTINATIONS.map((d, i) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    setCurrentSlideIndex(i);
                    setSearchQuery(d.name);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    currentSlideIndex === i
                      ? 'bg-[#E2C076] text-[#070B14] font-bold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {d.name}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => openAiWithPrompt('Plan a 5-day scenic vacation with luxury resort stays, sightseeing tours, and cultural experiences')}
              className="inline-flex items-center space-x-1.5 text-xs text-[#E2C076] hover:text-[#F6E05E] font-semibold transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Ask AI Travel Guide</span>
            </button>
          </div>
        </div>

        {/* Featured Showcase Interactive Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Main Cinematic Feature Slide (8 Cols) */}
          <div className="lg:col-span-8 relative overflow-hidden rounded-3xl border border-[#E2C076]/25 bg-[#0E1726] min-h-[440px] flex flex-col justify-between p-6 sm:p-10 group shadow-2xl shadow-black/60">
            {/* Background Image Carousel with Smooth Crossfade */}
            {HERO_DESTINATIONS.map((item, idx) => (
              <div
                key={item.id}
                className={`absolute inset-0 transition-all duration-1000 ease-out ${
                  idx === currentSlideIndex
                    ? 'opacity-70 scale-100'
                    : 'opacity-0 scale-105 pointer-events-none'
                }`}
                style={{
                  backgroundImage: `url(${item.image})`,
                  backgroundPosition: 'center',
                  backgroundSize: 'cover'
                }}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-[#070B14] via-[#070B14]/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#070B14]/80 via-transparent to-transparent" />

            {/* Top Card Badge */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#070B14]/75 border border-[#E2C076]/40 backdrop-blur-md text-xs font-semibold text-white">
                <span className="h-2 w-2 rounded-full bg-[#E2C076] animate-pulse" />
                <span className="text-[#E2C076] font-bold">Featured Sanctuary:</span>
                <span>{currentDest.tag}</span>
              </div>

              {/* Slide Dots Indicator */}
              <div className="flex items-center space-x-1.5 bg-[#070B14]/75 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                {HERO_DESTINATIONS.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    onClick={() => setCurrentSlideIndex(dotIdx)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      dotIdx === currentSlideIndex
                        ? 'w-6 bg-[#E2C076]'
                        : 'w-1.5 bg-white/30 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Bottom Content & Direct Action */}
            <div className="relative z-10 mt-auto pt-16">
              <span className="text-xs font-bold uppercase tracking-widest text-[#E2C076]">
                {currentDest.country} • World Heritage Destination
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mt-1 mb-2">
                {currentDest.name}
              </h2>
              <p className="text-slate-200 text-xs sm:text-sm font-medium max-w-xl leading-relaxed mb-6">
                {currentDest.tagline}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => {
                    setSearchQuery(currentDest.name);
                    if (activeTab === 'explore') {
                      const el = document.getElementById('hotels-section');
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        return;
                      }
                    }
                    setActiveTab('hotels');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#D4A853] to-[#E2C076] hover:from-[#C59B3F] hover:to-[#D4A853] text-[#070B14] font-bold text-xs transition-all active:scale-[0.98] flex items-center space-x-2 shadow-lg shadow-[#D4A853]/20"
                >
                  <span>Explore Stays & Resorts</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => {
                    setActiveTab('planner');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 backdrop-blur-md transition-all active:scale-[0.98]"
                >
                  Build Travel Itinerary
                </button>
                <div className="ml-auto text-right hidden sm:block">
                  <span className="block text-[10px] text-slate-300 uppercase tracking-wider">Starting From</span>
                  <span className="text-lg font-extrabold text-[#E2C076]">{formatPrice(currentDest.priceUsd)}/night</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Tourism Map & Sightseeing Guide (4 Cols) */}
          <div className="lg:col-span-4 rounded-3xl border border-[#E2C076]/25 bg-[#0E1726]/95 backdrop-blur-xl p-6 flex flex-col justify-between shadow-2xl shadow-black/50">
            {/* Top Tourism Guide Header */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-[#E2C076]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    Tourism Map & Sightseeing
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#E2C076]/15 border border-[#E2C076]/30 text-[10px] font-bold text-[#E2C076]">
                  Live Map
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Interactive tourism map pinpointing handpicked resorts, heritage monuments, and sightseeing tours within your destination.
              </p>

              {/* Coordinates Pill */}
              <div className="p-3 rounded-2xl bg-white/[0.04] border border-[#E2C076]/20 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">TOURIST REGION</span>
                  <span className="text-white font-bold">{currentDest.name}</span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1.5">
                  <span className="text-slate-400 font-medium">EXPLORATION RADIUS</span>
                  <span className="text-[#E2C076] font-bold">3 km – 50 km Sights</span>
                </div>
              </div>
            </div>

            {/* Tourism Map Visualizer Card */}
            <div
              onClick={() => {
                if (activeTab === 'explore') {
                  const el = document.getElementById('radar-map-module');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    return;
                  }
                }
                setActiveTab('radar');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="group cursor-pointer relative h-36 rounded-2xl bg-cover bg-center border border-[#E2C076]/25 flex items-center justify-center overflow-hidden my-2 shadow-inner"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80')`
              }}
            >
              <div className="absolute inset-0 bg-[#070B14]/60 group-hover:bg-[#070B14]/40 transition-all" />
              
              <div className="relative z-10 flex flex-col items-center text-center px-4">
                <div className="h-10 w-10 rounded-full bg-[#E2C076] text-[#070B14] flex items-center justify-center shadow-lg mb-1.5 group-hover:scale-110 transition-transform">
                  <Compass className="h-5 w-5 animate-spin-slow" />
                </div>
                <span className="text-xs font-bold text-white group-hover:text-[#E2C076] transition-colors">
                  Open Interactive Tourist Map
                </span>
                <span className="text-[10px] text-slate-200">
                  View Attractions, Hotels & Sights
                </span>
              </div>
            </div>

            {/* Quick AI Prompt Button */}
            <button
              onClick={() => openAiWithPrompt(`What are the top 5 tourist sights, best restaurants, and hidden gems in ${currentDest.name}?`)}
              className="mt-2 w-full p-2.5 rounded-2xl bg-white/[0.04] hover:bg-[#E2C076]/10 border border-white/10 hover:border-[#E2C076]/40 text-left text-xs text-slate-200 hover:text-white transition-all flex items-center space-x-2"
            >
              <Bot className="h-4 w-4 text-[#E2C076] shrink-0" />
              <span className="truncate">Ask AI Guide about {currentDest.name}</span>
              <ChevronRight className="h-3 w-3 ml-auto text-[#E2C076]" />
            </button>
          </div>

        </div>

        {/* Bottom Category Filter Strip */}
        <div className="mt-12 flex items-center justify-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-1.5 p-1.5 rounded-full bg-[#0E1726]/80 border border-[#E2C076]/20 backdrop-blur-xl">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  if (activeTab === 'explore') {
                    const el = document.getElementById('destinations-section');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      return;
                    }
                  }
                  setActiveTab('destinations');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-[#E2C076] text-[#070B14] shadow-md shadow-[#E2C076]/20'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Jump Navigation Bar */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="text-slate-400 font-medium mr-1 flex items-center gap-1.5">
            <Compass className="h-3.5 w-3.5 text-[#E2C076]" />
            <span>Quick Jump:</span>
          </span>
          <button
            onClick={() => {
              const el = document.getElementById('destinations-section');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              else { setActiveTab('destinations'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
            }}
            className="px-3.5 py-1.5 rounded-full bg-white/[0.04] hover:bg-[#E2C076]/15 hover:text-[#E2C076] text-slate-300 border border-white/10 hover:border-[#E2C076]/40 transition-all font-semibold flex items-center space-x-1"
          >
            <span>Curated Destinations</span>
            <span className="text-[#E2C076]">↓</span>
          </button>
          <button
            onClick={() => {
              const el = document.getElementById('hotels-section');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              else { setActiveTab('hotels'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
            }}
            className="px-3.5 py-1.5 rounded-full bg-white/[0.04] hover:bg-[#E2C076]/15 hover:text-[#E2C076] text-slate-300 border border-white/10 hover:border-[#E2C076]/40 transition-all font-semibold flex items-center space-x-1"
          >
            <span>5-Star Stays</span>
            <span className="text-[#E2C076]">↓</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('planner');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-3.5 py-1.5 rounded-full bg-white/[0.04] hover:bg-[#E2C076]/15 hover:text-[#E2C076] text-slate-300 border border-white/10 hover:border-[#E2C076]/40 transition-all font-semibold flex items-center space-x-1"
          >
            <span>AI Itinerary</span>
            <span className="text-[#E2C076]">→</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('groups-split');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-3.5 py-1.5 rounded-full bg-white/[0.04] hover:bg-[#E2C076]/15 hover:text-[#E2C076] text-slate-300 border border-white/10 hover:border-[#E2C076]/40 transition-all font-semibold flex items-center space-x-1"
          >
            <span>Group Travel</span>
            <span className="text-[#E2C076]">→</span>
          </button>
        </div>

      </div>
    </section>
  );
};


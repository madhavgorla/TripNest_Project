import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Destination } from '../types';
import {
  MapPin,
  Sparkles,
  Star,
  Compass,
  ArrowRight,
  Search,
  Filter,
  SlidersHorizontal,
  CloudSun,
  Calendar,
  Eye,
  BookOpen,
  ChevronRight,
  TrendingUp,
  Globe2,
  CheckCircle2,
  Loader2,
  Luggage,
  Navigation
} from 'lucide-react';

export const DestinationsListingPage: React.FC = () => {
  const {
    destinations,
    formatPrice,
    setSelectedDestinationModal,
    viewDestinationDetails,
    openAiWithPrompt,
    fetchAiDestinationGuide,
    isGeneratingAiDestination,
    setActiveTab,
    setCustomPlan
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'featured' | 'rating' | 'price-asc' | 'price-desc' | 'reviews'>('featured');
  const [customAiQuery, setCustomAiQuery] = useState('');

  // Extract unique regions and categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    destinations.forEach((d) => set.add(d.category));
    return ['All', ...Array.from(set)];
  }, [destinations]);

  const regions = useMemo(() => {
    const set = new Set<string>();
    destinations.forEach((d) => set.add(d.region));
    return ['All', ...Array.from(set)];
  }, [destinations]);

  // Filtered and sorted destinations
  const filteredDestinations = useMemo(() => {
    return destinations
      .filter((dest) => {
        const matchesQuery =
          !searchQuery.trim() ||
          dest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dest.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dest.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dest.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dest.highlights.some((h) => h.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCategory = selectedCategory === 'All' || dest.category === selectedCategory;
        const matchesRegion = selectedRegion === 'All' || dest.region === selectedRegion;

        return matchesQuery && matchesCategory && matchesRegion;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'price-asc') return a.startingPriceUsd - b.startingPriceUsd;
        if (sortBy === 'price-desc') return b.startingPriceUsd - a.startingPriceUsd;
        if (sortBy === 'reviews') return b.reviewCount - a.reviewCount;
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [destinations, searchQuery, selectedCategory, selectedRegion, sortBy]);

  const handleGenerateCustomDestination = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = customAiQuery.trim() || searchQuery.trim();
    if (!query) return;

    const generated = await fetchAiDestinationGuide(query, selectedCategory !== 'All' ? selectedCategory : undefined);
    if (generated) {
      viewDestinationDetails(generated);
      setCustomAiQuery('');
    }
  };

  return (
    <div id="destinations-listing-page" className="min-h-screen bg-[#070B14] text-white pb-20 pt-4">
      {/* Top Hero Banner */}
      <section className="relative overflow-hidden border-b border-[#E2C076]/15 bg-gradient-to-b from-[#0F172A] via-[#070B14] to-[#070B14] py-14 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#E2C076_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E2C076]/30 bg-[#E2C076]/10 px-3.5 py-1 text-xs font-medium text-[#E2C076]">
                <Globe2 className="h-3.5 w-3.5" />
                <span>Global Curated Destinations & Verified Attractions</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-serif text-white">
                World-Class <span className="text-[#E2C076]">Destinations</span> & Travel Guides
              </h1>
              <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
                Explore comprehensive travel guides, verified attractions, local etiquette, transit advice, and day-by-day itineraries. Powered by authentic local intelligence and real-time AI destination synthesis.
              </p>
            </div>

            {/* Quick Stats Banner */}
            <div className="flex items-center gap-4 sm:gap-6 bg-[#0B132B]/80 border border-[#E2C076]/20 rounded-2xl p-4 sm:p-5 backdrop-blur-md">
              <div className="text-center px-2 sm:px-4 border-r border-[#E2C076]/15">
                <div className="text-2xl sm:text-3xl font-bold text-[#E2C076]">{destinations.length}</div>
                <div className="text-xs text-gray-400 font-medium">Curated Guides</div>
              </div>
              <div className="text-center px-2 sm:px-4 border-r border-[#E2C076]/15">
                <div className="text-2xl sm:text-3xl font-bold text-emerald-400">100%</div>
                <div className="text-xs text-gray-400 font-medium">Verified Sights</div>
              </div>
              <div className="text-center px-2 sm:px-4">
                <div className="text-2xl sm:text-3xl font-bold text-amber-300 flex items-center justify-center gap-1">
                  <Sparkles className="h-5 w-5 text-[#E2C076]" />
                  <span>Live</span>
                </div>
                <div className="text-xs text-gray-400 font-medium">AI Generation</div>
              </div>
            </div>
          </div>

          {/* Search and AI Input Bar */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-8 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="destination-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by city, country, landscape (e.g. Kashmir, Swiss Alps, Bali, Paris, Dubai)..."
                className="w-full rounded-xl border border-[#E2C076]/25 bg-[#0B132B]/90 pl-12 pr-4 py-3.5 text-sm sm:text-base text-white placeholder-gray-400 focus:border-[#E2C076] focus:outline-none focus:ring-1 focus:ring-[#E2C076] transition shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white bg-gray-800/80 px-2 py-1 rounded"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="lg:col-span-4">
              <button
                id="ask-ai-destination-btn"
                type="button"
                onClick={() => {
                  if (searchQuery.trim()) {
                    handleGenerateCustomDestination({ preventDefault: () => {} } as any);
                  } else {
                    const prompt = window.prompt("Enter any city, island, or region in the world to synthesize an authentic travel guide & attractions (e.g. Kyoto, Amalfi Coast, Santorini, Reykjavik, Cape Town):");
                    if (prompt && prompt.trim()) {
                      fetchAiDestinationGuide(prompt.trim()).then(d => {
                        if (d) viewDestinationDetails(d);
                      });
                    }
                  }
                }}
                disabled={isGeneratingAiDestination}
                className="w-full h-full min-h-[50px] flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E2C076] to-[#D4AF37] px-5 py-3.5 text-sm sm:text-base font-semibold text-[#070B14] hover:opacity-95 transition shadow-lg shadow-[#E2C076]/20 disabled:opacity-50"
              >
                {isGeneratingAiDestination ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Synthesizing Guide...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    <span>{searchQuery.trim() ? `Synthesize "${searchQuery.trim()}" with AI` : 'Discover Any Place with AI'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        {/* Filters and Sorting Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#E2C076]/15 pb-6 mb-8">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-thin">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 mr-1 flex items-center gap-1">
              <Filter className="h-3.5 w-3.5" />
              Category:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                id={`cat-filter-${cat.toLowerCase()}`}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
                  selectedCategory === cat
                    ? 'bg-[#E2C076] text-[#070B14] shadow-md shadow-[#E2C076]/20'
                    : 'bg-[#0F172A] text-gray-300 hover:bg-[#1E293B] hover:text-white border border-gray-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Region & Sort Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Region Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Region:</span>
              <select
                id="region-filter-select"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="rounded-lg border border-gray-700 bg-[#0F172A] px-3 py-1.5 text-xs text-white focus:border-[#E2C076] focus:outline-none"
              >
                {regions.map((reg) => (
                  <option key={reg} value={reg}>
                    {reg}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Sort by:</span>
              <select
                id="sort-destinations-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-lg border border-gray-700 bg-[#0F172A] px-3 py-1.5 text-xs text-white focus:border-[#E2C076] focus:outline-none"
              >
                <option value="featured">Featured First</option>
                <option value="rating">Top Rated (4.9+)</option>
                <option value="price-asc">Tariff: Low to High</option>
                <option value="price-desc">Tariff: High to Low</option>
                <option value="reviews">Most Reviews</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-400">
            Showing <span className="font-semibold text-white">{filteredDestinations.length}</span> curated destination{filteredDestinations.length !== 1 ? 's' : ''}
            {selectedCategory !== 'All' && ` in ${selectedCategory}`}
            {selectedRegion !== 'All' && ` (${selectedRegion})`}
          </p>
        </div>

        {/* Destination Cards Grid */}
        {filteredDestinations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {filteredDestinations.map((dest) => {
              const attractionsCount = dest.attractions?.length || 4;
              const hasGuide = !!dest.travelGuide;

              return (
                <div
                  key={dest.id}
                  id={`destination-card-${dest.id}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-[#E2C076]/20 bg-[#0B132B]/90 transition-all duration-300 hover:-translate-y-1.5 hover:border-[#E2C076]/60 hover:shadow-2xl hover:shadow-[#E2C076]/10"
                >
                  {/* Card Image Container */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-900">
                    <img
                      src={dest.heroImage}
                      alt={dest.name}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B132B] via-transparent to-black/30" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <span className="rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-xs font-semibold text-[#E2C076] border border-[#E2C076]/30">
                        {dest.category}
                      </span>
                      <div className="flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 text-xs font-semibold text-white border border-white/10">
                        <CloudSun className="h-3.5 w-3.5 text-amber-400" />
                        <span>{dest.temperatureC}°C</span>
                      </div>
                    </div>

                    {/* Verified attractions chip on image bottom */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-md bg-[#070B14]/80 backdrop-blur-md px-2.5 py-1 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>{attractionsCount} Verified Attractions</span>
                      </span>
                      {hasGuide && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#070B14]/80 backdrop-blur-md px-2.5 py-1 text-[11px] font-medium text-[#E2C076] border border-[#E2C076]/20">
                          <BookOpen className="h-3 w-3" />
                          <span>Full Guide</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="flex flex-1 flex-col p-5 sm:p-6 justify-between space-y-4">
                    <div>
                      {/* Country and Region */}
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-[#E2C076]" />
                          {dest.country} • {dest.region}
                        </span>
                        <div className="flex items-center gap-1 text-amber-400 font-semibold">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <span>{dest.rating.toFixed(2)}</span>
                          <span className="text-gray-500 font-normal">({dest.reviewCount})</span>
                        </div>
                      </div>

                      {/* Destination Name */}
                      <h3
                        onClick={() => viewDestinationDetails(dest)}
                        className="text-xl font-bold font-serif text-white group-hover:text-[#E2C076] transition-colors cursor-pointer"
                      >
                        {dest.name}
                      </h3>

                      {/* Brief Description */}
                      <p className="mt-2 text-xs sm:text-sm text-gray-300 line-clamp-2 leading-relaxed">
                        {dest.description}
                      </p>

                      {/* Highlight Chips */}
                      <div className="mt-3.5 flex flex-wrap gap-1.5">
                        {dest.highlights.slice(0, 2).map((hl, i) => (
                          <span
                            key={i}
                            className="rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[11px] text-gray-300 line-clamp-1"
                          >
                            ✓ {hl}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Card Footer: Tariff & Action Buttons */}
                    <div className="pt-4 border-t border-gray-800/80">
                      <div className="flex items-baseline justify-between mb-3">
                        <div>
                          <span className="text-[11px] uppercase tracking-wider text-gray-400">Starting Tariff</span>
                          <div className="text-lg sm:text-xl font-extrabold text-[#E2C076]">
                            {formatPrice(dest.startingPriceUsd)}
                            <span className="text-xs font-normal text-gray-400"> / day</span>
                          </div>
                        </div>
                        <div className="text-right text-[11px] text-gray-400">
                          <span className="text-gray-300 font-medium">Best Season:</span>
                          <p className="text-[10px] text-gray-400 truncate max-w-[140px]">{dest.bestTimeToVisit.split('(')[0]}</p>
                        </div>
                      </div>

                      {/* Primary Actions */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          id={`btn-view-guide-${dest.id}`}
                          onClick={() => viewDestinationDetails(dest)}
                          className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#E2C076] to-[#D4AF37] px-3 py-2.5 text-xs font-bold text-[#070B14] hover:opacity-95 transition shadow-md shadow-[#E2C076]/10"
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          <span>View Details & Guide</span>
                        </button>

                        <button
                          id={`btn-quick-view-${dest.id}`}
                          onClick={() => setSelectedDestinationModal(dest)}
                          className="flex items-center justify-center gap-1 rounded-xl border border-[#E2C076]/30 bg-[#0F172A] px-3 py-2.5 text-xs font-medium text-white hover:bg-[#1E293B] hover:border-[#E2C076] transition"
                        >
                          <Eye className="h-3.5 w-3.5 text-[#E2C076]" />
                          <span>Quick Preview</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty Search Fallback with AI Generator Callout */
          <div className="rounded-2xl border border-[#E2C076]/20 bg-[#0B132B]/80 p-8 sm:p-12 text-center max-w-2xl mx-auto my-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#E2C076]/10 text-[#E2C076] mb-4">
              <Compass className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-white mb-2">
              Discover "{searchQuery}" with AI Concierge
            </h3>
            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              We don't have a pre-cached guide for "{searchQuery}" yet, but TripNest's Master AI can synthesize a verified, real-world travel guide with genuine attractions, live weather, cultural tips, and itineraries right now!
            </p>
            <button
              onClick={() => handleGenerateCustomDestination({ preventDefault: () => {} } as any)}
              disabled={isGeneratingAiDestination}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#E2C076] to-[#D4AF37] px-6 py-3 text-sm font-bold text-[#070B14] hover:opacity-95 transition shadow-lg shadow-[#E2C076]/20 disabled:opacity-50"
            >
              {isGeneratingAiDestination ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Synthesizing Real Guide & Attractions...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Generate Full Travel Guide for "{searchQuery}"</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Global Travel Inspiration Spotlight Banner */}
        <section className="mt-16 rounded-2xl border border-[#E2C076]/25 bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] p-6 sm:p-10 relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E2C076]/30 bg-[#E2C076]/10 px-3 py-1 text-xs font-medium text-[#E2C076]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Need Bespoke Guidance?</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-white">
              Can't Decide on Your Next Luxury Journey?
            </h2>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
              Consult our 24/7 AI Tourism Concierge to craft a multi-city route, recommend secluded romantic islands, or curate high-altitude Himalayan ski retreats tailored precisely to your preferences.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <button
                id="btn-ask-ai-concierge-listing"
                onClick={() => openAiWithPrompt("Recommend top 3 breathtaking destinations for my upcoming vacation with verified sights and luxury stays.")}
                className="inline-flex items-center gap-2 rounded-xl bg-[#E2C076] px-5 py-2.5 text-xs sm:text-sm font-bold text-[#070B14] hover:opacity-95 transition"
              >
                <Sparkles className="h-4 w-4" />
                <span>Ask AI Concierge</span>
              </button>
              <button
                id="btn-open-trip-planner"
                onClick={() => setActiveTab('planner')}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-xs sm:text-sm font-medium text-white hover:bg-white/10 transition"
              >
                <Calendar className="h-4 w-4 text-[#E2C076]" />
                <span>Open Bespoke Trip Planner</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

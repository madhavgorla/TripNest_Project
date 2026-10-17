import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { Destination } from '../types';
import {
  MapPin,
  Thermometer,
  Calendar,
  Star,
  Sparkles,
  Compass,
  ArrowRight
} from 'lucide-react';

export const DestinationsGrid: React.FC = () => {
  const {
    destinations,
    searchQuery,
    selectedCategory,
    setSelectedCategory,
    formatPrice,
    setSelectedDestinationModal,
    viewDestinationDetails,
    openAiWithPrompt
  } = useApp();

  const [activeTabFilter, setActiveTabFilter] = useState<string>('All');

  const categories = ['All', 'Mountain', 'Island', 'Luxury', 'Cultural', 'Nature'];

  const filteredDestinations = destinations.filter((dest) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      dest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dest.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dest.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dest.description.toLowerCase().includes(searchQuery.toLowerCase());

    const effectiveCat = selectedCategory !== 'All' ? selectedCategory : activeTabFilter;
    const matchesCategory = effectiveCat === 'All' || dest.category === effectiveCat;

    return matchesSearch && matchesCategory;
  });

  return (
    <motion.section
      id="destinations-section"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="w-full bg-transparent py-16 border-t border-[#E2C076]/15"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header & Category Filters */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#0E1726] border border-[#E2C076]/30 text-xs font-bold text-[#E2C076] mb-3 shadow-md">
              <Sparkles className="h-3.5 w-3.5" />
              <span>World Heritage & Iconic Wonders</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              Curated Destinations.
            </h2>
            <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-xl font-normal leading-relaxed">
              Explore royal mountain valleys, turquoise coral atolls, and historic heritage cities with verified vacation itineraries.
            </p>
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-full bg-[#0E1726]/90 border border-[#E2C076]/20 backdrop-blur-xl">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveTabFilter(cat);
                  setSelectedCategory(cat);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  (selectedCategory !== 'All' ? selectedCategory : activeTabFilter) === cat
                    ? 'bg-[#E2C076] text-[#070B14] shadow-md shadow-[#E2C076]/20'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDestinations.length === 0 ? (
            <div className="col-span-full rounded-3xl border border-[#E2C076]/20 bg-[#0E1726] p-12 text-center text-slate-300">
              <Compass className="mx-auto h-12 w-12 text-[#E2C076] mb-3 animate-spin-slow" />
              <h3 className="text-lg font-bold text-white">No Tourism Destinations Found</h3>
              <p className="text-xs text-slate-400 mt-1">
                Try searching another country, city, or vacation category.
              </p>
            </div>
          ) : (
            filteredDestinations.map((destination, index) => (
              <motion.div
                key={destination.id}
                id={`destination-card-${destination.id}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.08 }}
                transition={{ duration: 0.55, delay: (index % 6) * 0.07, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => viewDestinationDetails(destination)}
                className="group relative cursor-pointer overflow-hidden rounded-3xl border border-[#E2C076]/20 bg-[#0E1726]/90 transition-all duration-300 hover:border-[#E2C076]/50 hover:shadow-2xl hover:shadow-black/70 flex flex-col hover:-translate-y-1"
              >
                {/* Hero Image with Zoom and Badges */}
                <div className="relative h-64 w-full overflow-hidden">
                  <img
                    src={destination.heroImage}
                    alt={destination.name}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0E1726] via-transparent to-black/30" />

                  {/* Category Pill */}
                  <span className="absolute top-3.5 left-3.5 rounded-full bg-[#070B14]/80 border border-[#E2C076]/30 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#E2C076] backdrop-blur-md">
                    {destination.category}
                  </span>

                  {/* Rating Badge */}
                  <div className="absolute top-3.5 right-3.5 flex items-center space-x-1 rounded-full border border-white/15 bg-[#070B14]/80 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span>{destination.rating}</span>
                    <span className="text-[10px] text-slate-300 font-normal">
                      ({destination.reviewCount.toLocaleString()})
                    </span>
                  </div>

                  {/* Live Weather Indicator */}
                  <div className="absolute bottom-3.5 left-3.5 flex items-center space-x-1.5 rounded-full bg-[#070B14]/80 border border-white/15 px-3 py-1 text-xs text-slate-200 backdrop-blur-md">
                    <Thermometer className="h-3 w-3 text-[#38BDF8]" />
                    <span className="font-bold text-white">{destination.temperatureC}°C</span>
                    <span className="text-slate-300 text-[11px]">• {destination.weatherCondition}</span>
                  </div>

                  {/* Sights Badge */}
                  <div className="absolute bottom-3.5 right-3.5 flex items-center space-x-1 rounded-full bg-[#070B14]/90 border border-[#E2C076]/30 px-2.5 py-1 text-[11px] font-semibold text-[#E2C076] backdrop-blur-md">
                    <Compass className="h-3 w-3" />
                    <span>{destination.attractions?.length || 4} Sights</span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center space-x-1 text-xs font-semibold text-[#E2C076] mb-1">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{destination.region}, {destination.country}</span>
                    </div>

                    <h3 className="text-xl font-extrabold text-white group-hover:text-[#E2C076] transition-colors leading-tight">
                      {destination.name}
                    </h3>

                    <p className="mt-2 text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {destination.description}
                    </p>
                  </div>

                  <div>
                    {/* Best Time */}
                    <div className="mt-4 rounded-2xl bg-white/[0.04] border border-[#E2C076]/15 p-3 text-xs flex items-center text-slate-200">
                      <Calendar className="h-3.5 w-3.5 text-[#E2C076] mr-2 shrink-0" />
                      <span className="text-slate-400 mr-1.5 font-medium">Ideal Season:</span>
                      <span className="text-white font-semibold truncate">{destination.bestTimeToVisit}</span>
                    </div>

                    {/* Price & Action Button */}
                    <div className="mt-4 flex items-center justify-between border-t border-white/[0.08] pt-4">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Starting From
                        </span>
                        <p className="text-base font-extrabold text-[#E2C076]">
                          {formatPrice(destination.startingPriceUsd)}{' '}
                          <span className="text-xs text-slate-300 font-normal">/ day</span>
                        </p>
                      </div>

                      <div className="flex items-center space-x-1.5 text-xs font-bold text-white group-hover:text-[#E2C076] group-hover:translate-x-1 transition-all">
                        <span>View Guide</span>
                        <ArrowRight className="h-3.5 w-3.5 text-[#E2C076]" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </motion.section>
  );
};


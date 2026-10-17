import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { Hotel } from '../types';
import {
  Hotel as HotelIcon,
  Star,
  MapPin,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  SlidersHorizontal,
  Navigation
} from 'lucide-react';

export const HotelsSection: React.FC = () => {
  const {
    hotels,
    formatPrice,
    setSelectedHotelBooking,
    openAiWithPrompt
  } = useApp();

  const [selectedDestinationFilter, setSelectedDestinationFilter] = useState<string>('All');
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(2000);

  const destinationOptions = ['All', 'Kashmir', 'Bali', 'Paris', 'Dubai'];

  const filteredHotels = hotels.filter((hotel) => {
    const matchesDest =
      selectedDestinationFilter === 'All' ||
      hotel.destinationName.toLowerCase().includes(selectedDestinationFilter.toLowerCase()) ||
      hotel.city.toLowerCase().includes(selectedDestinationFilter.toLowerCase());

    const matchesPrice = hotel.pricePerNightUsd <= maxPriceFilter;

    return matchesDest && matchesPrice;
  });

  return (
    <motion.section
      id="hotels-section"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="w-full bg-transparent py-16 border-t border-[#E2C076]/15"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header & Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#0E1726] border border-[#E2C076]/30 text-xs font-bold text-[#E2C076] mb-3 shadow-md">
              <HotelIcon className="h-3.5 w-3.5" />
              <span>Verified 5-Star Sanctuaries</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              Exceptional Stays.
            </h2>
            <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-xl font-normal leading-relaxed">
              Heritage royal palaces, secluded rainforest pavilions, and suspended overwater villas in top tourism destinations.
            </p>
          </div>

          {/* Destination Selector Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-full bg-[#0E1726]/90 border border-[#E2C076]/20 backdrop-blur-xl">
            {destinationOptions.map((dest) => (
              <button
                key={dest}
                onClick={() => setSelectedDestinationFilter(dest)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedDestinationFilter === dest
                    ? 'bg-[#E2C076] text-[#070B14] shadow-md shadow-[#E2C076]/20'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {dest}
              </button>
            ))}
          </div>
        </div>

        {/* Hotels Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {filteredHotels.map((hotel, index) => (
            <motion.div
              key={hotel.id}
              id={`hotel-card-${hotel.id}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.08 }}
              transition={{ duration: 0.55, delay: (index % 4) * 0.09, ease: [0.22, 1, 0.36, 1] }}
              className="group overflow-hidden rounded-3xl border border-[#E2C076]/20 bg-[#0E1726]/90 hover:bg-[#121E32] hover:border-[#E2C076]/50 transition-all duration-300 shadow-xl flex flex-col hover:-translate-y-1"
            >
              <div className="grid grid-cols-1 sm:grid-cols-12 h-full">
                {/* Image Section */}
                <div className="relative sm:col-span-5 h-60 sm:h-full min-h-[240px] overflow-hidden">
                  <img
                    src={hotel.image}
                    alt={hotel.name}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent sm:hidden" />

                  {/* Stars Badge */}
                  <div className="absolute top-3 left-3 flex items-center space-x-1 rounded-full bg-[#070B14]/80 px-2.5 py-1 text-xs font-bold text-amber-300 backdrop-blur-md border border-[#E2C076]/30">
                    <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
                    <span>{hotel.stars} Star Luxury</span>
                  </div>

                  {/* Distance Indicator */}
                  <div className="absolute bottom-3 left-3 rounded-full bg-[#070B14]/80 px-3 py-1 text-[11px] font-semibold text-slate-200 backdrop-blur-md border border-white/10 flex items-center space-x-1.5">
                    <Navigation className="h-3 w-3 text-[#E2C076]" />
                    <span>{hotel.distanceFromCenterKm} km radius</span>
                  </div>
                </div>

                {/* Details Section */}
                <div className="p-6 sm:col-span-7 flex flex-col justify-between">
                  <div>
                    {/* Destination & Rating */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#E2C076]">
                        {hotel.city}, {hotel.country}
                      </span>
                      <div className="flex items-center space-x-1 text-xs font-bold text-white">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span>{hotel.rating}</span>
                        <span className="text-[11px] text-slate-400 font-normal">
                          ({hotel.reviewCount.toLocaleString()})
                        </span>
                      </div>
                    </div>

                    <h3 className="mt-1.5 text-lg sm:text-xl font-extrabold text-white group-hover:text-[#E2C076] transition-colors leading-snug">
                      {hotel.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      {hotel.tagline}
                    </p>

                    <p className="mt-2.5 text-xs text-slate-300 line-clamp-2 leading-relaxed font-normal">
                      {hotel.specialty}
                    </p>

                    {/* Amenities Chips */}
                    <div className="mt-3.5 flex flex-wrap gap-1.5">
                      {hotel.amenities.slice(0, 3).map((amenity, idx) => (
                        <span
                          key={idx}
                          className="rounded-full bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium text-slate-300 border border-white/[0.08]"
                        >
                          {amenity}
                        </span>
                      ))}
                      {hotel.amenities.length > 3 && (
                        <span className="rounded-full bg-white/[0.04] px-2 py-1 text-[10px] font-medium text-slate-400">
                          +{hotel.amenities.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom Price & Booking CTA */}
                  <div className="mt-6 border-t border-white/[0.08] pt-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                        Rate
                      </span>
                      <span className="text-lg font-extrabold text-[#E2C076]">
                        {formatPrice(hotel.pricePerNightUsd)}{' '}
                        <span className="text-xs text-slate-300 font-normal">/ night</span>
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <a
                        href={hotel.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E2C076]/30 bg-white/[0.04] text-slate-300 hover:bg-[#E2C076]/20 hover:text-[#E2C076] transition-all"
                        title="View Location on Google Maps"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <button
                        id={`reserve-hotel-btn-${hotel.id}`}
                        onClick={() => setSelectedHotelBooking(hotel)}
                        className="flex items-center space-x-1.5 rounded-full bg-gradient-to-r from-[#D4A853] to-[#E2C076] hover:from-[#C59B3F] hover:to-[#D4A853] px-4 py-2 text-xs font-bold text-[#070B14] active:scale-[0.98] transition-all shadow-md shadow-[#D4A853]/20"
                      >
                        <span>Reserve</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

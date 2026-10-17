import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  MapPin,
  Thermometer,
  Calendar,
  Star,
  Sparkles,
  CheckCircle2,
  Hotel,
  Compass,
  ArrowRight,
  ExternalLink,
  BookOpen
} from 'lucide-react';

export const DestinationModal: React.FC = () => {
  const {
    selectedDestinationModal,
    setSelectedDestinationModal,
    viewDestinationDetails,
    formatPrice,
    hotels,
    setSelectedHotelBooking,
    openAiWithPrompt
  } = useApp();

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (!selectedDestinationModal) return null;

  const dest = selectedDestinationModal;
  const linkedHotels = hotels.filter((h) => h.destinationId === dest.id);

  const handleOpenFullGuide = () => {
    setSelectedDestinationModal(null);
    viewDestinationDetails(dest);
  };

  return (
    <div
      id="destination-detail-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={() => setSelectedDestinationModal(null)}
    >
      <div
        id="destination-detail-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="relative my-8 w-full max-w-4xl overflow-hidden rounded-3xl border border-[#D4A853]/40 bg-[#111827] shadow-2xl shadow-black animate-in zoom-in-95 duration-200"
      >
        {/* Close Button */}
        <button
          onClick={() => setSelectedDestinationModal(null)}
          className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-slate-300 hover:bg-[#D4A853] hover:text-[#0B0F19] transition-all border border-slate-700"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Gallery Slider */}
        <div className="relative h-72 sm:h-96 w-full overflow-hidden">
          <img
            src={dest.gallery[activeImageIndex] || dest.heroImage}
            alt={dest.name}
            className="h-full w-full object-cover transition-all duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-black/40" />

          {/* Thumbnail Strip */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center space-x-2 overflow-x-auto pb-1">
            {dest.gallery.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImageIndex(i)}
                className={`h-12 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                  activeImageIndex === i
                    ? 'border-[#D4A853] scale-105 shadow-lg shadow-black'
                    : 'border-white/30 opacity-70 hover:opacity-100'
                }`}
              >
                <img src={img} alt="Thumbnail" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>

          {/* Rating Badge */}
          <div className="absolute top-4 left-4 flex items-center space-x-1.5 rounded-full border border-[#D4A853]/50 bg-[#0B0F19]/90 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
            <Star className="h-3.5 w-3.5 fill-[#D4A853] text-[#D4A853]" />
            <span>{dest.rating}</span>
            <span className="text-slate-400 font-normal">({dest.reviewCount} Reviews)</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Title and Weather */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold text-[#D4A853] uppercase tracking-wider">
                <MapPin className="h-3.5 w-3.5" />
                <span>{dest.region}, {dest.country}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white font-serif mt-1">
                {dest.name}
              </h2>
            </div>

            <div className="flex items-center space-x-3">
              <div className="rounded-xl border border-slate-700 bg-[#1E293B] p-2.5 text-center">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                  Climate
                </span>
                <span className="text-sm font-bold text-white flex items-center justify-center space-x-1">
                  <Thermometer className="h-3.5 w-3.5 text-[#D4A853]" />
                  <span>{dest.temperatureC}°C</span>
                </span>
              </div>

              <div className="rounded-xl border border-slate-700 bg-[#1E293B] p-2.5 text-center">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                  Starting Tariff
                </span>
                <span className="text-sm font-bold text-[#D4A853]">
                  {formatPrice(dest.startingPriceUsd)} <span className="text-xs text-slate-400 font-normal">/ day</span>
                </span>
              </div>
            </div>
          </div>

          {/* Description & Highlights */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
              About This Sanctuary
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed font-light">
              {dest.description}
            </p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {dest.highlights.map((hl, idx) => (
                <div key={idx} className="flex items-start space-x-2 rounded-xl bg-[#1E293B]/60 p-3 border border-slate-800">
                  <CheckCircle2 className="h-4 w-4 text-[#D4A853] shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-300 font-medium">{hl}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Attractions Preview */}
          {dest.attractions && dest.attractions.length > 0 && (
            <div className="border-t border-slate-800 pt-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Compass className="h-4 w-4 text-[#D4A853]" />
                  <span>Key Attractions & Sights ({dest.attractions.length})</span>
                </h3>
                <button
                  onClick={handleOpenFullGuide}
                  className="text-xs font-semibold text-[#D4A853] hover:underline flex items-center gap-1"
                >
                  <span>See all with maps</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dest.attractions.slice(0, 4).map((attr) => (
                  <div
                    key={attr.id}
                    className="flex gap-3 rounded-xl border border-slate-800 bg-[#0B0F19]/80 p-3"
                  >
                    <img
                      src={attr.image}
                      alt={attr.name}
                      className="h-16 w-16 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] text-[#D4A853] font-semibold block uppercase">
                        {attr.category}
                      </span>
                      <h4 className="text-xs font-bold text-white truncate">{attr.name}</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{attr.description}</p>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-emerald-400">
                        <span>{attr.admissionFee}</span>
                        <span className="text-slate-400">{attr.recommendedDuration}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Day-by-Day Sample Itinerary */}
          {dest.sampleItinerary && dest.sampleItinerary.length > 0 && (
            <div className="border-t border-slate-800 pt-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    VIP Day-by-Day Itinerary ({dest.sampleItinerary.length} Days)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Pre-curated bespoke itinerary designed for maximum luxury and discovery
                  </p>
                </div>
                <button
                  onClick={() =>
                    openAiWithPrompt(
                      `Create a customized 4-day luxury itinerary for ${dest.name} with fine dining and private transit.`
                    )
                  }
                  className="rounded-lg border border-[#D4A853]/40 bg-[#1E293B] px-3 py-1.5 text-xs font-semibold text-[#D4A853] hover:bg-[#D4A853] hover:text-[#0B0F19] transition-all flex items-center space-x-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Customize with AI</span>
                </button>
              </div>

              <div className="space-y-3">
                {dest.sampleItinerary.map((day) => (
                  <div
                    key={day.day}
                    className="rounded-2xl border border-slate-800 bg-[#0B0F19]/80 p-4 transition-all hover:border-slate-700"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#D4A853] text-xs font-bold text-[#0B0F19]">
                        {day.day}
                      </span>
                      <h4 className="text-sm font-bold text-white font-serif">{day.title}</h4>
                    </div>
                    <p className="mt-1 text-xs text-slate-400 italic pl-8">
                      {day.description}
                    </p>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 pl-8 text-xs text-slate-300">
                      <div className="rounded-lg bg-[#111827] p-2 border border-slate-800">
                        <span className="text-[10px] font-bold uppercase text-[#D4A853] block">Morning</span>
                        <span>{day.morning}</span>
                      </div>
                      <div className="rounded-lg bg-[#111827] p-2 border border-slate-800">
                        <span className="text-[10px] font-bold uppercase text-[#D4A853] block">Afternoon</span>
                        <span>{day.afternoon}</span>
                      </div>
                      <div className="rounded-lg bg-[#111827] p-2 border border-slate-800">
                        <span className="text-[10px] font-bold uppercase text-[#D4A853] block">Evening</span>
                        <span>{day.evening}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Linked 5-Star Hotels */}
          {linkedHotels.length > 0 && (
            <div className="border-t border-slate-800 pt-5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
                Featured 5-Star Accommodations in {dest.name}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {linkedHotels.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center space-x-3 rounded-xl border border-slate-800 bg-[#1E293B]/60 p-3 hover:border-[#D4A853]/50 transition-colors"
                  >
                    <img src={h.image} alt={h.name} className="h-16 w-16 rounded-lg object-cover" />
                    <div className="flex-1 overflow-hidden">
                      <h4 className="text-xs font-bold text-white truncate">{h.name}</h4>
                      <p className="text-[11px] text-[#D4A853] font-semibold mt-0.5">
                        {formatPrice(h.pricePerNightUsd)} / night
                      </p>
                      <button
                        onClick={() => {
                          setSelectedDestinationModal(null);
                          setSelectedHotelBooking(h);
                        }}
                        className="mt-1 text-[11px] font-bold text-[#38BDF8] hover:underline flex items-center space-x-1"
                      >
                        <span>Reserve Suite</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="border-t border-slate-800 bg-[#0B0F19] p-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <BookOpen className="h-4 w-4 text-[#D4A853]" />
            <span>Includes complete transit, etiquette, gastronomy & attraction guide</span>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => setSelectedDestinationModal(null)}
              className="flex-1 sm:flex-none rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
            >
              Close
            </button>
            <button
              onClick={handleOpenFullGuide}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D4A853] to-[#E2C076] px-5 py-2.5 text-xs font-bold text-[#0B0F19] hover:opacity-95 transition shadow-lg shadow-[#D4A853]/20"
            >
              <span>Explore Full Guide & Attractions Page</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

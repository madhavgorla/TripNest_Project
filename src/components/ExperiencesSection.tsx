import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { Experience } from '../types';
import {
  Ticket,
  Clock,
  Users,
  MapPin,
  Star,
  Sparkles,
  CheckCircle,
  ExternalLink,
  ArrowRight,
  Compass
} from 'lucide-react';

export const ExperiencesSection: React.FC = () => {
  const {
    experiences,
    formatPrice,
    setSelectedExperienceBooking,
    openAiWithPrompt
  } = useApp();

  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const categories = ['All', 'Cruise', 'Adventure', 'Wellness', 'VIP'];

  const filteredExperiences = experiences.filter((exp) => {
    return categoryFilter === 'All' || exp.category === categoryFilter;
  });

  return (
    <motion.section
      id="experiences-section"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="w-full bg-transparent py-16 border-t border-[#E2C076]/15"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#0E1726] border border-[#E2C076]/30 text-xs font-bold text-[#E2C076] mb-3 shadow-md">
              <Ticket className="h-3.5 w-3.5" />
              <span>Curated Tourism Expeditions & Tours</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              Exclusive Excursions.
            </h2>
            <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-xl font-normal leading-relaxed">
              Dawn Shikara photo safaris, alpine glacier ascents, holistic rainforest blessings, and manta ray snorkeling.
            </p>
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-full bg-[#0E1726]/90 border border-[#E2C076]/20 backdrop-blur-xl">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  categoryFilter === cat
                    ? 'bg-[#E2C076] text-[#070B14] shadow-md shadow-[#E2C076]/20'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Experiences Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredExperiences.map((exp, index) => (
            <motion.div
              key={exp.id}
              id={`experience-card-${exp.id}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.08 }}
              transition={{ duration: 0.55, delay: (index % 6) * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-[#E2C076]/20 bg-[#0E1726]/90 hover:bg-[#121E32] hover:border-[#E2C076]/50 transition-all duration-300 shadow-xl hover:-translate-y-1"
            >
              <div>
                {/* Image */}
                <div className="relative h-56 w-full overflow-hidden">
                  <img
                    src={exp.image}
                    alt={exp.title}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0E1726] via-transparent to-transparent" />

                  {/* Category Pill */}
                  <span className="absolute top-3 left-3 rounded-full bg-[#070B14]/80 px-3 py-1 text-[11px] font-bold text-[#E2C076] backdrop-blur-md border border-[#E2C076]/30">
                    {exp.category}
                  </span>

                  {/* Rating */}
                  <div className="absolute top-3 right-3 flex items-center space-x-1 rounded-full bg-[#070B14]/80 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-md border border-white/10">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span>{exp.rating}</span>
                    <span className="text-[10px] text-slate-300 font-normal">
                      ({exp.reviewCount})
                    </span>
                  </div>

                  {/* Duration & Max Group */}
                  <div className="absolute bottom-3 left-3 flex items-center space-x-2 rounded-full bg-[#070B14]/80 px-3 py-1 text-[11px] font-medium text-slate-200 backdrop-blur-md border border-white/10">
                    <Clock className="h-3 w-3 text-[#E2C076]" />
                    <span>{exp.duration}</span>
                    <span className="text-[#E2C076]">•</span>
                    <Users className="h-3 w-3 text-slate-300" />
                    <span>Max {exp.maxGroupSize}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#E2C076]">
                    {exp.destinationName}
                  </span>

                  <h3 className="mt-1 text-lg font-extrabold text-white group-hover:text-[#E2C076] transition-colors leading-snug">
                    {exp.title}
                  </h3>

                  <p className="mt-2 text-xs text-slate-300 line-clamp-2 leading-relaxed font-normal">
                    {exp.description}
                  </p>

                  {/* Inclusions checklist */}
                  <div className="mt-4 space-y-1.5 rounded-2xl bg-white/[0.04] p-3 border border-[#E2C076]/15 text-xs">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#E2C076] block mb-1">
                      Included Privileges:
                    </span>
                    {exp.includes.slice(0, 2).map((inc, i) => (
                      <div key={i} className="flex items-center text-xs text-slate-200">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-400 mr-2 shrink-0" />
                        <span className="truncate">{inc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer Price & Slot Booking CTA */}
              <div className="border-t border-white/[0.08] p-6 pt-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                    Tariff
                  </span>
                  <span className="text-lg font-extrabold text-[#E2C076]">
                    {formatPrice(exp.priceUsd)}{' '}
                    <span className="text-xs text-slate-300 font-normal">/ guest</span>
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <a
                    href={exp.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E2C076]/30 bg-white/[0.04] text-slate-300 hover:bg-[#E2C076]/20 hover:text-[#E2C076] transition-all"
                    title="View Meeting Point on Maps"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <button
                    id={`book-experience-btn-${exp.id}`}
                    onClick={() => setSelectedExperienceBooking(exp)}
                    className="flex items-center space-x-1.5 rounded-full bg-gradient-to-r from-[#D4A853] to-[#E2C076] hover:from-[#C59B3F] hover:to-[#D4A853] px-4 py-2 text-xs font-bold text-[#070B14] active:scale-[0.98] transition-all shadow-md shadow-[#D4A853]/20"
                  >
                    <span>Book Pass</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};


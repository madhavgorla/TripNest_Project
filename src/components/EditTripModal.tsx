import React, { useState, useEffect } from 'react';
import { Calendar, Users, FileText, X, Sparkles, Check } from 'lucide-react';
import { CustomTrip } from '../types';

interface EditTripModalProps {
  trip: CustomTrip | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    tripId: string,
    startDate: string,
    endDate: string,
    travelersCount: number,
    notes?: string
  ) => Promise<boolean>;
}

export const EditTripModal: React.FC<EditTripModalProps> = ({
  trip,
  isOpen,
  onClose,
  onSave
}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [travelersCount, setTravelersCount] = useState(1);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (trip) {
      setStartDate(trip.startDate || '');
      setEndDate(trip.endDate || '');
      setTravelersCount(trip.travelersCount || 1);
      setNotes(trip.notes || '');
      setErrorMessage('');
    }
  }, [trip]);

  if (!isOpen || !trip) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setErrorMessage('End date must be on or after start date.');
      return;
    }

    if (travelersCount < 1) {
      setErrorMessage('Number of travelers must be at least 1.');
      return;
    }

    setIsSubmitting(true);
    const success = await onSave(
      trip.id,
      startDate,
      endDate,
      Number(travelersCount),
      notes.trim()
    );
    setIsSubmitting(false);

    if (success) {
      onClose();
    }
  };

  return (
    <div
      id="edit-trip-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-700 bg-[#0F172A] p-6 sm:p-8 shadow-2xl text-slate-200">
        {/* Close Button */}
        <button
          id="close-edit-trip-modal"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-2 text-[#D4A853] mb-1">
          <Calendar className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Update Trip Details</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-white font-serif">
          Edit Dates & Guests
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Modifying <span className="text-amber-300 font-semibold">{trip.title}</span> ({trip.destination}).
        </p>

        {errorMessage && (
          <div className="mt-3 rounded-xl border border-rose-800/60 bg-rose-950/40 p-2.5 text-xs text-rose-300">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Start Date
              </label>
              <input
                id="edit-trip-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#D4A853] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                End Date
              </label>
              <input
                id="edit-trip-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#D4A853] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Number of Guests / Travelers
            </label>
            <div className="flex items-center space-x-3">
              <input
                id="edit-trip-travelers-count"
                type="number"
                min="1"
                max="50"
                value={travelersCount}
                onChange={(e) => setTravelersCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-32 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-[#D4A853] focus:outline-none"
              />
              <span className="text-xs text-slate-400">
                {travelersCount === 1 ? 'Individual VIP Traveler' : `${travelersCount} VIP Guests Traveling Together`}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Trip Notes / Special Requests (Optional)
            </label>
            <textarea
              id="edit-trip-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Dietary preferences, private airport transfer, preferred room floors..."
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-[#D4A853] focus:outline-none resize-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="mt-6 flex items-center justify-end space-x-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              id="edit-trip-save-btn"
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-gradient-to-r from-[#D4A853] to-[#B38936] px-5 py-2 text-xs font-bold text-[#0B0F19] hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[#D4A853]/20 flex items-center space-x-1.5"
            >
              {isSubmitting ? (
                <span>Saving Changes...</span>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Update Dates & Guests</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

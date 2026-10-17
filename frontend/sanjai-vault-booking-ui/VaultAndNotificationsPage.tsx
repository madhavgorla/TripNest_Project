import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import {
  TripNotification,
  NotificationType,
  MediaDocument,
  MediaDocType
} from '../types';
import {
  Bell,
  FileText,
  Upload,
  Ticket,
  Hotel,
  Camera,
  FolderLock,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Clock,
  Calendar,
  Sparkles,
  Download,
  Eye,
  Check,
  Search,
  Filter,
  RefreshCw,
  Share2,
  Lock,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';

const NOTIFICATION_ICONS: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  reminder: Clock,
  budget_alert: AlertTriangle,
  group_invitation: Sparkles,
  travel_update: Calendar,
  system: Bell
};

const MEDIA_TYPE_LABELS: Record<MediaDocType, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  ticket: { label: 'Flight & Rail Tickets', icon: Ticket, color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' },
  hotel_booking: { label: 'Hotel & Resort Vouchers', icon: Hotel, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  document: { label: 'Passports, Visas & Permits', icon: FileText, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  photo: { label: 'Travel Memories & Photos', icon: Camera, color: 'text-pink-400 bg-pink-500/10 border-pink-500/30' }
};

interface VaultAndNotificationsPageProps {
  initialTripId?: string;
  defaultTab?: 'notifications' | 'media';
}

export const VaultAndNotificationsPage: React.FC<VaultAndNotificationsPageProps> = ({
  initialTripId,
  defaultTab = 'notifications'
}) => {
  const { trips, userProfile, isAuthenticated, openAuthModal, showToast, unreadNotificationCount, setUnreadNotificationCount } = useApp();

  const [activeMainTab, setActiveMainTab] = useState<'notifications' | 'media'>(defaultTab);

  const [selectedTripId, setSelectedTripId] = useState<string>(() => {
    if (initialTripId) return initialTripId;
    if (trips.length > 0) return trips[0].id;
    return 'trip-1789736347651-alzwl';
  });

  // Notifications State
  const [notifications, setNotifications] = useState<TripNotification[]>([]);
  const [notifFilter, setNotifFilter] = useState<string>('all');
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [newReminderForm, setNewReminderForm] = useState({
    title: '',
    message: '',
    type: 'reminder' as NotificationType,
    priority: 'normal' as 'normal' | 'high' | 'urgent'
  });

  // Media & Documents State
  const [mediaDocs, setMediaDocs] = useState<MediaDocument[]>([]);
  const [mediaTypeFilter, setMediaTypeFilter] = useState<string>('all');
  const [mediaSearch, setMediaSearch] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<MediaDocument | null>(null);
  const [uploadMode, setUploadMode] = useState<'device' | 'url'>('device');
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [uploadForm, setUploadForm] = useState({
    name: '',
    type: 'ticket' as MediaDocType,
    fileUrl: '',
    notes: '',
    tag: '',
    flightOrBookingId: '',
    expirationDate: ''
  });

  const [isLoading, setIsLoading] = useState(true);

  // Load Data
  const loadData = async () => {
    if (!userProfile?.email) {
      setIsLoading(false);
      setNotifications([]);
      setMediaDocs([]);
      return;
    }
    setIsLoading(true);
    const email = userProfile.email;
    try {
      const [nRes, mRes] = await Promise.all([
        fetch(`/api/notifications?userEmail=${encodeURIComponent(email)}`),
        fetch(`/api/media?tripId=${encodeURIComponent(selectedTripId)}&userEmail=${encodeURIComponent(email)}`)
      ]);
      const [nData, mData] = await Promise.all([nRes.json(), mRes.json()]);

      if (nData.success && Array.isArray(nData.notifications)) {
        setNotifications(nData.notifications);
        if (typeof nData.unreadCount === 'number') {
          setUnreadNotificationCount(nData.unreadCount);
        }
      }
      if (mData.success && Array.isArray(mData.documents)) {
        setMediaDocs(mData.documents);
      }
    } catch (err) {
      console.error('Error loading vault and notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedTripId, userProfile?.email]);

  // Mark Single Notification as Read
  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadNotificationCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  // Mark All Notifications as Read
  const handleMarkAllRead = async () => {
    if (!userProfile?.email) return;
    const email = userProfile.email;
    try {
      await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: email })
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadNotificationCount(0);
      showToast('All notifications marked as read', 'info');
    } catch (err) {
      console.error(err);
    }
  };

  // Dismiss / Delete Notification
  const handleDeleteNotification = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => n.id !== id));
      showToast('Notification dismissed', 'info');
    } catch (err) {
      console.error(err);
    }
  };

  // Create Reminder / Notification
  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.email) {
      showToast('Please sign in to create a reminder', 'error');
      return;
    }
    const email = userProfile.email;
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: email,
          tripId: selectedTripId,
          type: newReminderForm.type,
          title: newReminderForm.title,
          message: newReminderForm.message,
          priority: newReminderForm.priority
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Travel reminder created successfully!', 'success');
        setIsReminderModalOpen(false);
        setNewReminderForm({ title: '', message: '', type: 'reminder', priority: 'normal' });
        loadData();
      } else {
        showToast(data.error || 'Failed to create reminder', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error creating reminder', 'error');
    }
  };

  // Add / Upload Media Document
  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.email) {
      showToast('Please sign in to upload documents to vault', 'error');
      return;
    }
    if (!uploadForm.fileUrl) {
      showToast('Please attach a file from your device or enter a document URL', 'error');
      return;
    }

    setIsUploading(true);
    const email = userProfile.email;
    try {
      const docName = uploadForm.name.trim() || 'Travel Document';
      const res = await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: selectedTripId || 'general-vault',
          userEmail: email,
          type: uploadForm.type,
          name: docName,
          fileUrl: uploadForm.fileUrl,
          notes: uploadForm.notes,
          metadata: {
            tag: uploadForm.tag,
            flightNumber: uploadForm.flightOrBookingId,
            hotelBookingId: uploadForm.flightOrBookingId,
            expirationDate: uploadForm.expirationDate
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Document "${docName}" stored safely in Vault!`, 'success');
        setIsUploadModalOpen(false);
        setUploadForm({
          name: '',
          type: 'ticket',
          fileUrl: '',
          notes: '',
          tag: '',
          flightOrBookingId: '',
          expirationDate: ''
        });
        if (data.document) {
          setMediaDocs(prev => [data.document, ...prev.filter(d => d.id !== data.document.id)]);
        }
        loadData();
      } else {
        showToast(data.error || 'Failed to save document', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error uploading document', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeviceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsReadingFile(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setUploadForm(prev => ({
        ...prev,
        fileUrl: dataUrl,
        name: prev.name ? prev.name : file.name.replace(/\.[^/.]+$/, '')
      }));
      setIsReadingFile(false);
      showToast(`Selected "${file.name}" from device with instant preview!`, 'success');
    };
    reader.onerror = () => {
      setIsReadingFile(false);
      showToast('Failed to read image/file from device', 'error');
    };
    reader.readAsDataURL(file);
  };

  // Delete Media Document - Immediate optimistic deletion with zero lag
  const handleDeleteMedia = async (id: string, name: string) => {
    // Instant optimistic UI update
    setMediaDocs(prev => prev.filter(m => m.id !== id));
    showToast(`Removed "${name}" from vault`, 'info');
    try {
      const res = await fetch(`/api/media/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) {
        showToast(data.error || 'Failed to delete document', 'error');
        loadData();
      }
    } catch (err: any) {
      showToast(err.message || 'Error deleting document', 'error');
      loadData();
    }
  };

  // Filtered Notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (notifFilter === 'unread') return !n.isRead;
      if (notifFilter === 'reminders') return n.type === 'reminder';
      if (notifFilter === 'alerts') return n.type === 'budget_alert';
      if (notifFilter === 'updates') return n.type === 'travel_update' || n.type === 'group_invitation';
      return true;
    });
  }, [notifications, notifFilter]);

  // Filtered Media Documents
  const filteredMedia = useMemo(() => {
    return mediaDocs.filter(d => {
      if (mediaTypeFilter !== 'all' && d.type !== mediaTypeFilter) return false;
      if (mediaSearch.trim()) {
        const q = mediaSearch.toLowerCase();
        const matchName = d.name.toLowerCase().includes(q);
        const matchNotes = (d.notes || '').toLowerCase().includes(q);
        if (!matchName && !matchNotes) return false;
      }
      return true;
    });
  }, [mediaDocs, mediaTypeFilter, mediaSearch]);

  if (!isAuthenticated || !userProfile?.email) {
    return (
      <div id="vault-notifications-page" className="min-h-screen pt-20 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="border-b border-white/10 pb-6 mb-10 text-left">
          <div className="inline-flex items-center space-x-2 text-[#E2C076] text-xs uppercase tracking-widest font-bold mb-1.5">
            <FolderLock className="h-4 w-4" />
            <span>Digital Document Vault & Realtime Travel Alerts</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight text-left">
            Notifications & Media Document Vault
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl text-left">
            Store verified airline tickets, hotel vouchers, and ID credentials alongside real-time activity reminders and budget alerts.
          </p>
        </div>

        <div className="max-w-xl mx-auto my-12 p-8 sm:p-10 rounded-3xl bg-[#0E1726]/90 border border-[#E2C076]/30 backdrop-blur-2xl text-center shadow-2xl">
          <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-[#E2C076]/15 border border-[#E2C076]/30 flex items-center justify-center text-[#E2C076]">
            <Lock className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-extrabold text-white mb-2">Sign In Required</h3>
          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed mb-6">
            Private travel documents, passports, boarding passes, and flight alerts are securely encrypted and bound to your account. Please sign in to access your digital travel vault.
          </p>
          <button
            onClick={() => openAuthModal()}
            className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-[#E2C076] to-[#D4A853] text-[#070B14] font-extrabold text-sm hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[#E2C076]/20 inline-flex items-center justify-center space-x-2"
          >
            <FolderLock className="h-4 w-4" />
            <span>Sign In to Access Vault</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="vault-notifications-page" className="min-h-screen pt-20 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8 border-b border-white/10 pb-6 text-left">
        <div className="text-left">
          <div className="inline-flex items-center space-x-2 text-[#E2C076] text-xs uppercase tracking-widest font-bold mb-1.5">
            <FolderLock className="h-4 w-4" />
            <span>Digital Document Vault & Realtime Travel Alerts</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight text-left">
            Notifications & Media Document Vault
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl text-left">
            Store verified airline tickets, hotel vouchers, and ID credentials alongside real-time activity reminders and budget alerts.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          {activeMainTab === 'notifications' ? (
            <button
              onClick={() => setIsReminderModalOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4A853] to-[#E2C076] text-[#070B14] text-xs font-extrabold shadow-md active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Create Reminder</span>
            </button>
          ) : (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4A853] to-[#E2C076] text-[#070B14] text-xs font-extrabold shadow-md active:scale-95 transition-all"
            >
              <Upload className="h-4 w-4" />
              <span>Upload Document</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Switcher Tabs (Notifications vs Vault) */}
      <div className="flex items-center space-x-3 border-b border-white/10 pb-4 mb-8">
        <button
          onClick={() => setActiveMainTab('notifications')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeMainTab === 'notifications'
              ? 'bg-[#E2C076] text-[#070B14] shadow-md shadow-[#E2C076]/20'
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Bell className="h-4 w-4" />
          <span>Notification Center & Reminders</span>
          {unreadNotificationCount > 0 && (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeMainTab === 'notifications' ? 'bg-[#070B14] text-[#E2C076]' : 'bg-rose-500 text-white'
            }`}>
              {unreadNotificationCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveMainTab('media')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeMainTab === 'media'
              ? 'bg-[#E2C076] text-[#070B14] shadow-md shadow-[#E2C076]/20'
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <FolderLock className="h-4 w-4" />
          <span>Travel Media & Document Vault</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
            activeMainTab === 'media' ? 'bg-[#070B14]/20 text-[#070B14]' : 'bg-white/10 text-neutral-300'
          }`}>
            {mediaDocs.length}
          </span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* NOTIFICATION CENTER & REMINDERS */}
      {/* ===================================================================== */}
      {activeMainTab === 'notifications' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0E1726]/80 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'all', label: 'All Alerts' },
                { id: 'unread', label: 'Unread Only' },
                { id: 'reminders', label: 'Trip Reminders' },
                { id: 'alerts', label: 'Budget Alerts' },
                { id: 'updates', label: 'Travel Updates' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setNotifFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    notifFilter === f.id
                      ? 'bg-white/10 text-white font-bold border border-white/20'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {unreadNotificationCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-[#E2C076] hover:text-white font-semibold transition-colors flex items-center space-x-1"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Mark All Read</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="bg-[#0E1726]/80 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
            {filteredNotifications.length === 0 ? (
              <div className="py-16 text-center text-neutral-500">
                <Bell className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-bold text-white">No notifications in this filter</p>
                <p className="text-xs text-neutral-400 mt-1">You are all caught up on alerts and reminders.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.06]">
                {filteredNotifications.map((notif) => {
                  const Icon = NOTIFICATION_ICONS[notif.type] || Bell;

                  return (
                    <div
                      key={notif.id}
                      onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
                      className={`p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer transition-colors ${
                        notif.isRead ? 'hover:bg-white/[0.02]' : 'bg-[#E2C076]/[0.03] hover:bg-[#E2C076]/[0.06]'
                      }`}
                    >
                      <div className="flex items-start space-x-3.5 min-w-0">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          notif.type === 'budget_alert'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : notif.type === 'reminder'
                            ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                            : 'bg-[#E2C076]/15 text-[#E2C076] border border-[#E2C076]/30'
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className={`text-sm font-bold truncate ${notif.isRead ? 'text-neutral-200' : 'text-white'}`}>
                              {notif.title}
                            </h4>
                            {!notif.isRead && (
                              <span className="h-2 w-2 rounded-full bg-[#E2C076] flex-shrink-0" />
                            )}
                            {notif.priority === 'urgent' && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                Urgent
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                            {notif.message}
                          </p>
                          <span className="block text-[10px] text-neutral-500 mt-1.5">
                            {new Date(notif.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNotification(notif.id);
                          }}
                          className="p-1.5 text-neutral-500 hover:text-rose-400 transition-colors"
                          title="Dismiss Alert"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TRAVEL MEDIA & DOCUMENT VAULT */}
      {/* ===================================================================== */}
      {activeMainTab === 'media' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Controls Bar: Search & Category Chips */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-[#0E1726]/80 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                value={mediaSearch}
                onChange={(e) => setMediaSearch(e.target.value)}
                placeholder="Search documents by title, ticket code, or tag..."
                className="w-full bg-[#070B14] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#E2C076]"
              />
            </div>

            {/* Type Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'all', label: 'All Items' },
                { id: 'ticket', label: 'Tickets' },
                { id: 'hotel_booking', label: 'Stays' },
                { id: 'document', label: 'Official ID / Visas' },
                { id: 'photo', label: 'Travel Photos' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setMediaTypeFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    mediaTypeFilter === f.id
                      ? 'bg-[#E2C076] text-[#070B14] font-bold'
                      : 'bg-[#070B14] text-neutral-300 border border-white/10 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Documents Grid */}
          {filteredMedia.length === 0 ? (
            <div className="py-20 text-center bg-[#0E1726]/80 border border-white/10 rounded-3xl p-8">
              <FolderLock className="h-12 w-12 text-neutral-600 mx-auto mb-3" />
              <h4 className="text-base font-bold text-white">No travel documents in this category</h4>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto mt-1 mb-4">
                Upload your flight confirmation e-tickets, hotel booking PDFs, or visa permits to keep them safe offline.
              </p>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#E2C076] text-[#070B14] text-xs font-bold hover:bg-[#D4A853]"
              >
                Upload First Document
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredMedia.map((doc) => {
                const config = MEDIA_TYPE_LABELS[doc.type] || MEDIA_TYPE_LABELS.document;
                const Icon = config.icon;

                return (
                  <div
                    key={doc.id}
                    className="rounded-3xl bg-[#0E1726]/90 border border-white/10 overflow-hidden hover:border-[#E2C076]/40 transition-all flex flex-col group"
                  >
                    {/* Thumbnail / Image Preview */}
                    <div
                      onClick={() => setPreviewDoc(doc)}
                      className="h-44 w-full bg-cover bg-center cursor-pointer relative overflow-hidden"
                      style={{ backgroundImage: `url('${doc.fileUrl}')` }}
                    >
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
                      <div className="absolute top-3 left-3">
                        <span className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border backdrop-blur-md ${config.color}`}>
                          <Icon className="h-3 w-3" />
                          <span>{config.label.split(' ')[0]}</span>
                        </span>
                      </div>
                      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="p-2 rounded-xl bg-black/70 text-white backdrop-blur-md flex items-center justify-center">
                          <Eye className="h-4 w-4 text-[#E2C076]" />
                        </span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white line-clamp-1">{doc.name}</h4>
                        {doc.notes && (
                          <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{doc.notes}</p>
                        )}
                        {doc.metadata?.tag && (
                          <span className="inline-block mt-2 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-semibold text-[#E2C076]">
                            {doc.metadata.tag}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/[0.06] text-xs">
                        <span className="text-[10px] text-neutral-500">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </span>

                        <div className="flex items-center space-x-1.5">
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-white/5 text-neutral-300 hover:text-white"
                            title="Open full resolution"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                          <button
                            onClick={() => handleDeleteMedia(doc.id, doc.name)}
                            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-300 hover:text-rose-200"
                            title="Delete Document"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CREATE REMINDER MODAL */}
      <AnimatePresence>
        {isReminderModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0E1726] border border-[#E2C076]/30 rounded-3xl p-6 sm:p-8 text-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-[#E2C076]" />
                  <span>Create Activity Reminder</span>
                </h3>
                <button onClick={() => setIsReminderModalOpen(false)} className="text-neutral-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleCreateReminder} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Reminder Title *</label>
                  <input
                    type="text"
                    required
                    value={newReminderForm.title}
                    onChange={(e) => setNewReminderForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="E.g. Dal Lake Sunset Shikara Charter"
                    className="w-full bg-[#070B14] border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#E2C076]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Message & Instructions *</label>
                  <textarea
                    rows={3}
                    required
                    value={newReminderForm.message}
                    onChange={(e) => setNewReminderForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="E.g. Meet private boatman at Ghat #7. Bring warm jackets for evening temperature drop."
                    className="w-full bg-[#070B14] border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#E2C076]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">Alert Type</label>
                    <select
                      value={newReminderForm.type}
                      onChange={(e) => setNewReminderForm(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full bg-[#070B14] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E2C076]"
                    >
                      <option value="reminder">Trip Activity Reminder</option>
                      <option value="travel_update">Travel / Weather Update</option>
                      <option value="budget_alert">Budget Notification</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">Priority</label>
                    <select
                      value={newReminderForm.priority}
                      onChange={(e) => setNewReminderForm(prev => ({ ...prev, priority: e.target.value as any }))}
                      className="w-full bg-[#070B14] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E2C076]"
                    >
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/10">
                  <button type="button" onClick={() => setIsReminderModalOpen(false)} className="text-xs text-neutral-400 hover:text-white">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-[#E2C076] text-[#070B14] text-xs font-bold">
                    Schedule Reminder
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* UPLOAD DOCUMENT MODAL */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#0E1726] border border-[#E2C076]/30 rounded-3xl p-6 sm:p-8 text-white shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Upload className="h-5 w-5 text-[#E2C076]" />
                  <span>Upload Document to Vault</span>
                </h3>
                <button onClick={() => setIsUploadModalOpen(false)} className="text-neutral-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleUploadDocument} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Document Name *</label>
                  <input
                    type="text"
                    required
                    value={uploadForm.name}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="E.g. Swiss Air Flight LX-160 E-Ticket"
                    className="w-full bg-[#070B14] border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#E2C076]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">Classification Type *</label>
                    <select
                      value={uploadForm.type}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, type: e.target.value as MediaDocType }))}
                      className="w-full bg-[#070B14] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E2C076]"
                    >
                      <option value="ticket">Airline / Train Ticket</option>
                      <option value="hotel_booking">Hotel Booking Voucher</option>
                      <option value="document">Passport / Visa / Permit</option>
                      <option value="photo">Travel Memory Photo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">Flight or Confirmation #</label>
                    <input
                      type="text"
                      value={uploadForm.flightOrBookingId}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, flightOrBookingId: e.target.value }))}
                      placeholder="E.g. AI-825 / CONF-9812"
                      className="w-full bg-[#070B14] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E2C076]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-neutral-300">File & Document Attachment *</label>
                    <div className="inline-flex rounded-lg bg-white/5 p-0.5 border border-white/10 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setUploadMode('device')}
                        className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                          uploadMode === 'device'
                            ? 'bg-[#E2C076] text-[#070B14] shadow-sm'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        📁 From Device
                      </button>
                      <button
                        type="button"
                        onClick={() => setUploadMode('url')}
                        className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                          uploadMode === 'url'
                            ? 'bg-[#E2C076] text-[#070B14] shadow-sm'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        🔗 Web Link
                      </button>
                    </div>
                  </div>

                  {uploadMode === 'device' ? (
                    <div className="space-y-2">
                      <label className="border-2 border-dashed border-[#E2C076]/40 hover:border-[#E2C076] bg-[#070B14]/80 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-white/[0.02]">
                        <Upload className="h-6 w-6 text-[#E2C076] mb-1.5" />
                        <span className="text-xs font-bold text-white">Click to Select Photo / Document from Device</span>
                        <span className="text-[10px] text-neutral-400 mt-0.5">Supports PNG, JPG, WEBP, and PDF documents</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleDeviceFileUpload}
                          className="hidden"
                        />
                      </label>
                      {isReadingFile && (
                        <p className="text-[11px] text-[#E2C076] text-center animate-pulse">Reading file from device...</p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <input
                        type="url"
                        value={uploadForm.fileUrl}
                        onChange={(e) => setUploadForm(prev => ({ ...prev, fileUrl: e.target.value }))}
                        placeholder="https://images.unsplash.com/... or cloud document link"
                        className="w-full bg-[#070B14] border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#E2C076]"
                      />
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-[10px] text-neutral-400">Quick Samples:</span>
                        <button
                          type="button"
                          onClick={() => setUploadForm(prev => ({ ...prev, fileUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80' }))}
                          className="text-[10px] text-[#E2C076] hover:underline"
                        >
                          Sample Boarding Pass
                        </button>
                        <button
                          type="button"
                          onClick={() => setUploadForm(prev => ({ ...prev, fileUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80' }))}
                          className="text-[10px] text-[#E2C076] hover:underline"
                        >
                          Sample Hotel Voucher
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Instant Live Photo / Document Preview */}
                  {uploadForm.fileUrl ? (
                    <div className="mt-3 p-3 rounded-2xl bg-[#070B14] border border-[#E2C076]/40 flex items-center justify-between gap-3">
                      <div className="flex items-center space-x-3 overflow-hidden">
                        {uploadForm.fileUrl.startsWith('data:image') || uploadForm.fileUrl.includes('image') || uploadForm.fileUrl.includes('unsplash') ? (
                          <img
                            src={uploadForm.fileUrl}
                            alt="Document Preview"
                            className="h-14 w-14 rounded-xl object-cover border border-white/20 flex-shrink-0"
                          />
                        ) : (
                          <div className="h-14 w-14 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 flex-shrink-0">
                            <FileText className="h-7 w-7" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[9px] font-extrabold uppercase tracking-wider mb-0.5">
                            <Check className="h-2.5 w-2.5" />
                            <span>Preview Ready</span>
                          </div>
                          <p className="text-xs font-bold text-white truncate">{uploadForm.name || 'Attached File'}</p>
                          <p className="text-[10px] text-neutral-400 truncate max-w-xs">{uploadForm.fileUrl.slice(0, 45)}...</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUploadForm(prev => ({ ...prev, fileUrl: '' }))}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 text-[10px] font-bold transition-all border border-rose-500/30 flex-shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  ) : null}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Special Notes / Expiration</label>
                  <textarea
                    rows={2}
                    value={uploadForm.notes}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="E.g. Seat 4A, Terminal 3, check-in 2 hours prior..."
                    className="w-full bg-[#070B14] border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#E2C076]"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    disabled={isUploading}
                    className="text-xs text-neutral-400 hover:text-white transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4A853] to-[#E2C076] hover:from-[#C59B3F] hover:to-[#D4A853] text-[#070B14] text-xs font-bold tracking-wide transition-all shadow-md shadow-[#D4A853]/25 active:scale-95 disabled:opacity-50 flex items-center space-x-1.5"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Saving to Vault...</span>
                      </>
                    ) : (
                      <span>Save to Vault</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LIGHTBOX PREVIEW MODAL */}
      <AnimatePresence>
        {previewDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl bg-[#0E1726] border border-white/20 rounded-3xl overflow-hidden shadow-2xl text-white"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">{previewDoc.name}</h4>
                  <p className="text-[11px] text-neutral-400">{previewDoc.notes}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <a
                    href={previewDoc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
                    title="Open Full Size"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <button onClick={() => setPreviewDoc(null)} className="p-2 text-neutral-400 hover:text-white">
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-4 bg-black flex items-center justify-center max-h-[70vh] overflow-hidden">
                <img
                  src={previewDoc.fileUrl}
                  alt={previewDoc.name}
                  className="max-h-[65vh] w-auto object-contain rounded-xl"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import {
  TravelGroup,
  TravelGroupMember,
  GroupDiscussionMessage,
  GroupSharedExpensesData,
  SettlementRecord,
  TripExpense
} from '../types';
import {
  Users,
  UserPlus,
  Shield,
  MessageSquare,
  DollarSign,
  ArrowRight,
  CheckCircle,
  Copy,
  Plus,
  Send,
  Trash2,
  Edit2,
  Calendar,
  CreditCard,
  Check,
  RefreshCw,
  Share2,
  KeyRound,
  ExternalLink,
  ChevronDown,
  Mail,
  Lock,
  Upload,
  Camera,
  Paperclip,
  Image as ImageIcon
} from 'lucide-react';

interface GroupTravelPageProps {
  initialTripId?: string;
}

export const GroupTravelPage: React.FC<GroupTravelPageProps> = ({ initialTripId }) => {
  const { trips, userProfile, isAuthenticated, openAuthModal, showToast } = useApp();

  const [selectedTripId, setSelectedTripId] = useState<string>(() => {
    if (initialTripId) return initialTripId;
    if (trips.length > 0) return trips[0].id;
    return 'trip-1789736347651-alzwl';
  });

  const [activeTab, setActiveTab] = useState<'members' | 'discussions' | 'shared-expenses' | 'settlements'>('members');

  // Groups State
  const [groups, setGroups] = useState<TravelGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Group Details
  const [discussions, setDiscussions] = useState<GroupDiscussionMessage[]>([]);
  const [sharedData, setSharedData] = useState<GroupSharedExpensesData | null>(null);

  // Message Input & Recipient Email Options
  const [newMessageText, setNewMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [recipientMode, setRecipientMode] = useState<'all' | 'direct'>('all');
  const [selectedRecipientEmail, setSelectedRecipientEmail] = useState<string>('');
  const [sendEmailNotification, setSendEmailNotification] = useState<boolean>(true);

  // Modals
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isJoinCodeModalOpen, setIsJoinCodeModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<SettlementRecord | null>(null);
  const [settleTransactionRef, setSettleTransactionRef] = useState('');

  // Form States
  const [newGroupForm, setNewGroupForm] = useState({
    name: '',
    description: '',
    coverImage: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=1200&q=80'
  });
  const [groupPhotoUploadMode, setGroupPhotoUploadMode] = useState<'device' | 'url'>('device');
  const [isReadingGroupPhoto, setIsReadingGroupPhoto] = useState(false);
  const [isEditPhotoModalOpen, setIsEditPhotoModalOpen] = useState(false);
  const [editPhotoInput, setEditPhotoInput] = useState('');
  const [chatAttachedPhoto, setChatAttachedPhoto] = useState<string>('');
  const [isReadingChatPhoto, setIsReadingChatPhoto] = useState(false);

  const [inviteForm, setInviteForm] = useState({
    userEmail: '',
    name: '',
    role: 'Member' as 'Admin' | 'Editor' | 'Viewer' | 'Member',
    allocatedBudget: 25000
  });

  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinEmailInput, setJoinEmailInput] = useState('');
  const [joinNameInput, setJoinNameInput] = useState('');
  const [joinedGroupSuccess, setJoinedGroupSuccess] = useState<TravelGroup | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [memberFilter, setMemberFilter] = useState<'all' | 'code' | 'invited'>('all');

  // Member Management Modals
  const [memberToDelete, setMemberToDelete] = useState<TravelGroupMember | null>(null);
  const [isDeletingMember, setIsDeletingMember] = useState(false);
  const [budgetModalMember, setBudgetModalMember] = useState<TravelGroupMember | null>(null);
  const [memberBudgetAmount, setMemberBudgetAmount] = useState<number>(25000);
  const [isSavingMemberBudget, setIsSavingMemberBudget] = useState(false);
  const [inviteWelcomeInfo, setInviteWelcomeInfo] = useState<{
    email: string;
    name: string;
    role: string;
    code: string;
    allocatedBudget: number;
  } | null>(null);

  const activeGroup = useMemo(() => {
    return groups.find(g => g.id === selectedGroupId) || groups[0] || null;
  }, [groups, selectedGroupId]);

  // Is Current Logged-in User an Admin of the active group?
  const isCurrentUserAdmin = useMemo(() => {
    if (!activeGroup || !userProfile?.email) return false;
    const email = userProfile.email.toLowerCase();
    const isCreator = (activeGroup.createdByEmail || '').toLowerCase() === email;
    const isMemberAdmin = (activeGroup.members || []).some(
      m => (m.userEmail || '').toLowerCase() === email && m.role === 'Admin'
    );
    return isCreator || isMemberAdmin;
  }, [activeGroup, userProfile?.email]);

  // Load Groups (Only for authenticated user)
  const loadGroups = async (overrideEmail?: string) => {
    if (!userProfile?.email && !overrideEmail) {
      setIsLoading(false);
      setGroups([]);
      setSelectedGroupId('');
      return;
    }
    setIsLoading(true);
    const email = overrideEmail || userProfile.email;
    try {
      // Query all groups belonging to the user across trips so groups are always visible
      const res = await fetch(`/api/groups?userEmail=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.groups)) {
        setGroups(data.groups);
        if (data.groups.length > 0) {
          if (!selectedGroupId || !data.groups.some(g => g.id === selectedGroupId)) {
            setSelectedGroupId(data.groups[0].id);
          }
        } else {
          setSelectedGroupId('');
        }
      }
    } catch (err) {
      console.error('Error loading travel groups:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load Group Discussions & Shared Expenses
  const loadGroupDetails = async (groupId: string) => {
    if (!userProfile?.email) return;
    try {
      const email = userProfile.email;
      const [discRes, sharedRes] = await Promise.all([
        fetch(`/api/groups/${encodeURIComponent(groupId)}/discussions?userEmail=${encodeURIComponent(email)}`),
        fetch(`/api/groups/${encodeURIComponent(groupId)}/shared-expenses?tripId=${encodeURIComponent(selectedTripId)}`)
      ]);
      const [dData, sData] = await Promise.all([discRes.json(), sharedRes.json()]);

      if (dData.success && Array.isArray(dData.discussions)) {
        setDiscussions(dData.discussions);
      }
      if (sData.success && sData.data) {
        setSharedData(sData.data);
      }
    } catch (err) {
      console.error('Error loading group details:', err);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [selectedTripId, userProfile?.email]);

  useEffect(() => {
    if (activeGroup?.id) {
      loadGroupDetails(activeGroup.id);
    }
  }, [activeGroup?.id]);

  // Photo selection from device for group creation
  const handleGroupPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsReadingGroupPhoto(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setNewGroupForm(prev => ({ ...prev, coverImage: dataUrl }));
      setIsReadingGroupPhoto(false);
      showToast('Photo selected from device with instant preview!', 'success');
    };
    reader.onerror = () => {
      setIsReadingGroupPhoto(false);
      showToast('Error reading photo from device', 'error');
    };
    reader.readAsDataURL(file);
  };

  // Chat photo attachment from device
  const handleChatPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsReadingChatPhoto(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setChatAttachedPhoto(dataUrl);
      setIsReadingChatPhoto(false);
      showToast('Photo attached with preview!', 'success');
    };
    reader.onerror = () => {
      setIsReadingChatPhoto(false);
      showToast('Error reading chat photo', 'error');
    };
    reader.readAsDataURL(file);
  };

  // Device upload for changing existing group cover photo
  const handleEditPhotoDeviceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsReadingGroupPhoto(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setEditPhotoInput(dataUrl);
      setIsReadingGroupPhoto(false);
      showToast('Photo selected from device with instant preview!', 'success');
    };
    reader.onerror = () => {
      setIsReadingGroupPhoto(false);
      showToast('Error reading photo from device', 'error');
    };
    reader.readAsDataURL(file);
  };

  // Save updated group cover photo to database
  const handleSaveGroupPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroup || !editPhotoInput) return;
    try {
      const res = await fetch(`/api/groups/${activeGroup.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coverImage: editPhotoInput })
      });
      const data = await res.json();
      if (data.success && data.group) {
        showToast('Group cover photo updated successfully!', 'success');
        setGroups(prev => prev.map(g => g.id === activeGroup.id ? { ...g, coverImage: editPhotoInput } : g));
        setIsEditPhotoModalOpen(false);
      } else {
        showToast(data.error || 'Failed to update cover photo', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating cover photo', 'error');
    }
  };

  // Create Group
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.email) {
      showToast('Please sign in to create a travel group', 'error');
      return;
    }
    const email = userProfile.email;
    const name = userProfile.name || userProfile.email.split('@')[0];
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: selectedTripId,
          name: newGroupForm.name,
          description: newGroupForm.description,
          createdByEmail: email,
          creatorName: name,
          coverImage: newGroupForm.coverImage
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Created travel group "${data.group.name}"!`, 'success');
        setIsCreateGroupModalOpen(false);
        setNewGroupForm({ name: '', description: '', coverImage: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=1200&q=80' });
        await loadGroups();
        if (data.group?.id) setSelectedGroupId(data.group.id);
      } else {
        showToast(data.error || 'Failed to create group', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error creating group', 'error');
    }
  };

  // Invite Member with Welcome Message & Join Code Save to DB
  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroup) return;
    try {
      const res = await fetch(`/api/groups/${activeGroup.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...inviteForm,
          inviterName: userProfile?.name || 'Group Admin'
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Added ${inviteForm.name} to the group with join code ${activeGroup.inviteCode}!`, 'success');
        setInviteWelcomeInfo({
          email: inviteForm.userEmail,
          name: inviteForm.name,
          role: inviteForm.role,
          code: activeGroup.inviteCode,
          allocatedBudget: Number(inviteForm.allocatedBudget || 0)
        });
        setIsInviteModalOpen(false);
        setInviteForm({ userEmail: '', name: '', role: 'Member', allocatedBudget: 25000 });
        loadGroups();
      } else {
        showToast(data.error || 'Failed to invite member', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error inviting member', 'error');
    }
  };

  // Delete / Remove Member from Group by Admin (Instant UI sync & DB delete)
  const handleDeleteMemberConfirm = async () => {
    if (!activeGroup || !memberToDelete) return;
    setIsDeletingMember(true);
    try {
      const res = await fetch(`/api/groups/${activeGroup.id}/members/${memberToDelete.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showToast(`${memberToDelete.name} was removed from the group!`, 'success');
        // Immediately update local group members state so UI reflects the deletion without needing page refresh
        setGroups(prev => prev.map(g => {
          if (g.id !== activeGroup.id) return g;
          return {
            ...g,
            members: (g.members || []).filter(m => m.id !== memberToDelete.id && m.userEmail.toLowerCase() !== memberToDelete.userEmail.toLowerCase())
          };
        }));
        setMemberToDelete(null);
        await loadGroups();
        if (activeGroup.id) {
          loadGroupDetails(activeGroup.id);
        }
      } else {
        showToast(data.error || 'Failed to remove member', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error removing member', 'error');
    } finally {
      setIsDeletingMember(false);
    }
  };

  // Allocate / Update Expense Budget for Group Member by Admin
  const handleSaveMemberBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroup || !budgetModalMember) return;
    setIsSavingMemberBudget(true);
    try {
      const res = await fetch(`/api/groups/${activeGroup.id}/members/${budgetModalMember.id}/budget`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allocatedBudget: Number(memberBudgetAmount)
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Allocated spending budget of ₹${Number(memberBudgetAmount).toLocaleString()} to ${budgetModalMember.name} saved!`, 'success');
        setBudgetModalMember(null);
        await loadGroups();
      } else {
        showToast(data.error || 'Failed to allocate budget', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating member budget', 'error');
    } finally {
      setIsSavingMemberBudget(false);
    }
  };

  // Join Group via Code
  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = (joinEmailInput || userProfile?.email || '').trim();
    const name = (joinNameInput || userProfile?.name || email.split('@')[0] || 'Travel Companion').trim();
    const code = joinCodeInput.trim().toUpperCase();

    if (!code) {
      showToast('Please enter your group invite code from your email.', 'error');
      return;
    }
    if (!email) {
      showToast('Please enter your email address to verify invitation.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteCode: code,
          userEmail: email,
          name,
          avatar: userProfile?.avatar
        })
      });
      const data = await res.json();
      if (data.success && data.group) {
        showToast(`🎉 Success! You have officially joined "${data.group.name}" with code ${code}!`, 'success');
        setIsJoinCodeModalOpen(false);
        setJoinCodeInput('');
        setJoinEmailInput('');
        setJoinNameInput('');
        setJoinedGroupSuccess(data.group);
        await loadGroups(email);
        if (data.group?.id) setSelectedGroupId(data.group.id);
      } else {
        showToast(data.error || 'Invalid invite code. Check your email notification and enter correctly.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error joining group', 'error');
    }
  };

  // Send Discussion Message (Broadcast to Everyone or Direct to Person)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessageText.trim() && !chatAttachedPhoto) || !activeGroup) return;
    if (!userProfile?.email) {
      showToast('Please sign in to send messages', 'error');
      return;
    }
    setIsSendingMessage(true);
    const email = userProfile.email;
    const name = userProfile.name || userProfile.email.split('@')[0];
    const avatar = userProfile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80';

    const isDirect = recipientMode === 'direct' && Boolean(selectedRecipientEmail) && selectedRecipientEmail !== 'all';
    const targetMember = isDirect
      ? (activeGroup.members || []).find(m => m.userEmail.toLowerCase() === selectedRecipientEmail.toLowerCase())
      : null;

    const attachments = chatAttachedPhoto ? [{ url: chatAttachedPhoto, name: 'Photo' }] : [];

    try {
      const res = await fetch(`/api/groups/${activeGroup.id}/discussions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderEmail: email,
          senderName: name,
          senderAvatar: avatar,
          recipientEmail: isDirect ? selectedRecipientEmail : 'all',
          recipientName: isDirect ? (targetMember?.name || selectedRecipientEmail) : 'Everyone',
          isDirect,
          sendEmailNotification: Boolean(sendEmailNotification),
          message: newMessageText.trim() || 'Attached a photo',
          attachments
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(isDirect ? `Direct message sent to ${targetMember?.name || selectedRecipientEmail} & email dispatched!` : 'Broadcast message sent to all group members!', 'success');
        setNewMessageText('');
        setChatAttachedPhoto('');
        loadGroupDetails(activeGroup.id);
      } else {
        showToast(data.error || 'Failed to post message', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error sending message', 'error');
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Mark Settlement as Settled
  const handleSettlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSettlement || !activeGroup) return;

    try {
      const res = await fetch(`/api/groups/${activeGroup.id}/settlements/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settlementId: selectedSettlement.id,
          transactionRef: settleTransactionRef || `UPI-TXN-${Date.now()}`
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Settlement of ₹${selectedSettlement.amount.toLocaleString()} marked as Settled!`, 'success');
        setIsSettleModalOpen(false);
        setSelectedSettlement(null);
        setSettleTransactionRef('');
        loadGroupDetails(activeGroup.id);
      } else {
        showToast(data.error || 'Failed to settle debt', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error settling payment', 'error');
    }
  };

  // Copy Invite Code
  const handleCopyInviteCode = () => {
    if (!activeGroup?.inviteCode) return;
    navigator.clipboard.writeText(activeGroup.inviteCode);
    setCopiedCode(true);
    showToast(`Invite code ${activeGroup.inviteCode} copied to clipboard!`, 'info');
    setTimeout(() => setCopiedCode(false), 2500);
  };

  if (!isAuthenticated || !userProfile?.email) {
    return (
      <div id="group-travel-page" className="min-h-screen pt-20 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="border-b border-white/10 pb-6 mb-10 text-left">
          <div className="inline-flex items-center space-x-2 text-[#E2C076] text-xs uppercase tracking-widest font-bold mb-1.5">
            <Users className="h-4 w-4" />
            <span>Group Travel & Shared Financial Settlement</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight text-left">
            Group Collaboration & Shared Expenses
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl text-left">
            Create travel parties, manage member roles, collaborate in live group discussions, and calculate automated expense debt settlements.
          </p>
        </div>

        <div className="max-w-xl mx-auto my-12 p-8 sm:p-10 rounded-3xl bg-[#0E1726]/90 border border-[#E2C076]/30 backdrop-blur-2xl text-center shadow-2xl">
          <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-[#E2C076]/15 border border-[#E2C076]/30 flex items-center justify-center text-[#E2C076]">
            <Lock className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-extrabold text-white mb-2">Sign In Required</h3>
          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed mb-6">
            Travel groups, companion rosters, live itinerary chats, and split expense balances are private to registered members. Please sign in to view and join your travel groups.
          </p>
          <button
            onClick={() => openAuthModal()}
            className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-[#E2C076] to-[#D4A853] text-[#070B14] font-extrabold text-sm hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[#E2C076]/20 inline-flex items-center justify-center space-x-2"
          >
            <Users className="h-4 w-4" />
            <span>Sign In to Access Groups</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="group-travel-page" className="min-h-screen pt-20 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8 border-b border-white/10 pb-6 text-left">
        <div className="text-left">
          <div className="inline-flex items-center space-x-2 text-[#E2C076] text-xs uppercase tracking-widest font-bold mb-1.5">
            <Users className="h-4 w-4" />
            <span>Group Travel & Shared Financial Settlement</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight text-left">
            Group Collaboration & Shared Expenses
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl text-left">
            Create travel parties, manage member roles, collaborate in live group discussions, and calculate automated expense debt settlements.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Join with Invite Code Button */}
          <button
            onClick={() => setIsJoinCodeModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-neutral-300 hover:text-white text-xs font-semibold hover:bg-white/[0.08] transition-all"
          >
            <KeyRound className="h-3.5 w-3.5 text-[#E2C076]" />
            <span>Join via Code</span>
          </button>

          {/* Create Group Button */}
          <button
            onClick={() => setIsCreateGroupModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4A853] to-[#E2C076] hover:from-[#C59B3F] hover:to-[#D4A853] text-[#070B14] text-xs font-extrabold transition-all shadow-md shadow-[#D4A853]/25 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Create Travel Group</span>
          </button>
        </div>
      </div>

      {/* Group Selector Card (if multiple groups exist) */}
      {groups.length > 1 && (
        <div className="flex items-center space-x-2 mb-6 overflow-x-auto pb-2">
          {groups.map(g => (
            <button
              key={g.id}
              onClick={() => setSelectedGroupId(g.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedGroupId === g.id
                  ? 'bg-[#E2C076] text-[#070B14] shadow-md shadow-[#E2C076]/20'
                  : 'bg-[#0E1726] border border-white/10 text-neutral-300 hover:text-white'
              }`}
            >
              <span>{g.name}</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/20">
                {g.membersCount || g.members?.length || 1} members
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Active Group Hero Header */}
      {activeGroup ? (
        <div className="relative rounded-3xl overflow-hidden border border-white/10 mb-8 bg-[#0E1726]/90 backdrop-blur-2xl">
          <div
            className="h-44 sm:h-52 w-full bg-cover bg-center relative"
            style={{ backgroundImage: `url('${activeGroup.coverImage}')` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#0E1726] via-[#0E1726]/60 to-transparent" />
            <div className="absolute top-4 right-4 flex items-center space-x-2">
              <button
                onClick={() => {
                  setEditPhotoInput(activeGroup.coverImage || '');
                  setIsEditPhotoModalOpen(true);
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-black/60 border border-white/20 text-white text-xs font-semibold backdrop-blur-md hover:bg-black/80 transition-all hover:border-[#E2C076]"
                title="Change Group Cover Photo (Device upload or link)"
              >
                <Camera className="h-3.5 w-3.5 text-[#E2C076]" />
                <span>Change Photo</span>
              </button>
              <button
                onClick={handleCopyInviteCode}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-black/60 border border-white/20 text-white text-xs font-semibold backdrop-blur-md hover:bg-black/80 transition-all"
                title="Copy Invite Code"
              >
                {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-[#E2C076]" />}
                <span>Invite Code: <strong className="text-[#E2C076]">{activeGroup.inviteCode}</strong></span>
              </button>
            </div>
          </div>

          <div className="p-6 sm:p-8 -mt-16 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                  {activeGroup.name}
                </h2>
                <p className="text-xs sm:text-sm text-neutral-300 mt-1 max-w-xl">
                  {activeGroup.description || 'Collaborative luxury travel itinerary and shared expense management.'}
                </p>
                <div className="flex items-center space-x-4 mt-3 text-xs text-neutral-400">
                  <span>Host: <strong className="text-neutral-200">{activeGroup.createdByEmail}</strong></span>
                  <span>•</span>
                  <span>{activeGroup.members?.length || 1} active travelers</span>
                </div>
              </div>

              <button
                onClick={() => setIsInviteModalOpen(true)}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#070B14] border border-[#E2C076]/40 hover:border-[#E2C076] text-[#E2C076] text-xs font-bold transition-all self-start sm:self-auto"
              >
                <UserPlus className="h-4 w-4" />
                <span>Invite Member</span>
              </button>
            </div>

            {/* Sub-Nav Tabs for Group Travel */}
            <div className="flex items-center space-x-2 border-t border-white/10 mt-6 pt-4 overflow-x-auto">
              <button
                onClick={() => setActiveTab('members')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'members'
                    ? 'bg-[#E2C076] text-[#070B14]'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                <span>Members & Roles ({activeGroup.members?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('discussions')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'discussions'
                    ? 'bg-[#E2C076] text-[#070B14]'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Group Discussions ({discussions.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('shared-expenses')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'shared-expenses'
                    ? 'bg-[#E2C076] text-[#070B14]'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <CreditCard className="h-3.5 w-3.5" />
                <span>Shared Expenses ({sharedData?.expenses.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('settlements')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'settlements'
                    ? 'bg-[#E2C076] text-[#070B14]'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <DollarSign className="h-3.5 w-3.5" />
                <span>Settlements Matrix ({sharedData?.settlements.length || 0})</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-20 text-center bg-[#0E1726]/80 border border-white/10 rounded-3xl p-8 mb-8">
          <Users className="h-12 w-12 text-neutral-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No travel groups found</h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto mt-1 mb-4">
            Start a travel party with your companions or join an existing trip using an invite code.
          </p>
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={() => setIsCreateGroupModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#E2C076] text-[#070B14] text-xs font-bold hover:bg-[#D4A853]"
            >
              Create Group
            </button>
            <button
              onClick={() => setIsJoinCodeModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/20"
            >
              Enter Code
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 10. GROUP COLLABORATION: MEMBERS, ROLES, ALLOCATED BUDGETS & CODE STATUS */}
      {/* ===================================================================== */}
      {activeGroup && activeTab === 'members' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-[#0E1726]/80 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5 mb-6">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <span>Group Member Roster & Expense Allowances</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/10 text-neutral-300 font-normal">
                    {activeGroup.members?.length || 0} travelers
                  </span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Admins manage member spending limits, invite companions, track join codes, and remove travelers.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Filter by Joined via Code vs Direct Invite */}
                <div className="flex items-center bg-[#070B14] p-1 rounded-xl border border-white/10 text-xs">
                  <button
                    onClick={() => setMemberFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      memberFilter === 'all' ? 'bg-[#E2C076] text-[#070B14] font-bold' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    All ({activeGroup.members?.length || 0})
                  </button>
                  <button
                    onClick={() => setMemberFilter('code')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center space-x-1 ${
                      memberFilter === 'code' ? 'bg-[#E2C076] text-[#070B14] font-bold' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <KeyRound className="h-3 w-3" />
                    <span>With Code ({(activeGroup.members || []).filter(m => m.joinedViaCode || m.joinedCode).length})</span>
                  </button>
                  <button
                    onClick={() => setMemberFilter('invited')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      memberFilter === 'invited' ? 'bg-[#E2C076] text-[#070B14] font-bold' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Invited ({(activeGroup.members || []).filter(m => !m.joinedViaCode && !m.joinedCode).length})
                  </button>
                </div>

                <button
                  onClick={() => setIsInviteModalOpen(true)}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#E2C076] hover:bg-[#D4A853] text-[#070B14] text-xs font-bold transition-all shadow-md shadow-[#E2C076]/20"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Invite Member</span>
                </button>
              </div>
            </div>

            {/* Member Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(activeGroup.members || [])
                .filter(m => {
                  if (memberFilter === 'code') return Boolean(m.joinedViaCode || m.joinedCode);
                  if (memberFilter === 'invited') return !m.joinedViaCode && !m.joinedCode;
                  return true;
                })
                .map((member) => {
                  const allocated = Number(member.allocatedBudget || 0);
                  const spent = Number(member.spentAmount || 0);
                  const percentSpent = allocated > 0 ? Math.min(100, Math.round((spent / allocated) * 100)) : (spent > 0 ? 100 : 0);
                  const isOverBudget = allocated > 0 && spent > allocated;

                  return (
                    <div
                      key={member.id}
                      className="p-5 rounded-2xl bg-[#0A101D] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-4"
                    >
                      {/* Top Header: Avatar, Name, Badges & Delete */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center space-x-3.5 min-w-0">
                          <img
                            src={member.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                            alt={member.name}
                            className="h-12 w-12 rounded-full object-cover border-2 border-[#E2C076]/30 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center space-x-2">
                              <p className="text-xs font-bold text-white truncate">{member.name}</p>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                                member.role === 'Admin'
                                  ? 'bg-[#E2C076]/20 text-[#E2C076] border border-[#E2C076]/40'
                                  : member.role === 'Editor'
                                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                                  : 'bg-neutral-500/20 text-neutral-300 border border-neutral-500/40'
                              }`}>
                                {member.role}
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-400 truncate mt-0.5">{member.userEmail}</p>

                            {/* Joined Status Badge */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              {member.joinedViaCode || member.joinedCode ? (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                  <KeyRound className="h-2.5 w-2.5" />
                                  <span>Active Member (Code Verified: {member.joinedCode || activeGroup.inviteCode})</span>
                                </span>
                              ) : member.status === 'Invited' ? (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                  <span>⏳ Invited via Email (Awaiting Code Verification)</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#E2C076]/15 text-[#E2C076] border border-[#E2C076]/30">
                                  <span>Active Member</span>
                                </span>
                              )}
                              <span className="text-[10px] text-neutral-500">
                                {new Date(member.joinedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Admin Action: Delete / Remove Member Button - Only visible to Group Admin */}
                        {isCurrentUserAdmin && member.userEmail.toLowerCase() !== (userProfile?.email || '').toLowerCase() && (
                          <button
                            onClick={() => setMemberToDelete(member)}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 transition-all border border-rose-500/25 flex items-center space-x-1.5 flex-shrink-0"
                            title="Admin: Remove member from travel party"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                            <span className="text-[11px] font-bold">Remove</span>
                          </button>
                        )}
                      </div>

                      {/* Middle: Allocated Expense Spending Allowance by Admin */}
                      <div className="bg-[#070B14]/80 border border-white/5 rounded-xl p-3.5 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-neutral-400 flex items-center space-x-1">
                            <DollarSign className="h-3.5 w-3.5 text-[#E2C076]" />
                            <span>Allocated Expense Limit:</span>
                          </span>
                          <span className="font-extrabold text-[#E2C076]">
                            {allocated > 0 ? `₹${allocated.toLocaleString()}` : 'No limit set'}
                          </span>
                        </div>

                        {/* Progress Bar of Spending */}
                        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isOverBudget
                                ? 'bg-rose-500'
                                : percentSpent > 80
                                ? 'bg-amber-400'
                                : 'bg-emerald-400'
                            }`}
                            style={{ width: `${allocated > 0 ? Math.min(100, (spent / allocated) * 100) : 0}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-0.5">
                          <span>Spent: <strong className="text-white">₹{spent.toLocaleString()}</strong></span>
                          <span>
                            {allocated > 0 ? (
                              isOverBudget ? (
                                <span className="text-rose-400 font-bold">Over by ₹{(spent - allocated).toLocaleString()}</span>
                              ) : (
                                <span className="text-emerald-400">Remaining: ₹{(allocated - spent).toLocaleString()}</span>
                              )
                            ) : (
                              <span>Open budget</span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Footer: Admin Action to Allocate or Adjust Spending Budget */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-neutral-500">
                          {allocated > 0 ? `${percentSpent}% of allowance used` : 'Admin can assign allowance'}
                        </span>
                        <button
                          onClick={() => {
                            setBudgetModalMember(member);
                            setMemberBudgetAmount(member.allocatedBudget || 25000);
                          }}
                          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-[#E2C076] hover:border-[#E2C076]/40 transition-all"
                        >
                          <Edit2 className="h-3 w-3" />
                          <span>{allocated > 0 ? 'Edit Allowance' : 'Allocate Budget'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 10. GROUP DISCUSSIONS: LIVE CHAT & ITINERARY CHAT */}
      {/* ===================================================================== */}
      {activeGroup && activeTab === 'discussions' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-[#0E1726]/90 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl flex flex-col h-[650px]">
            <div className="border-b border-white/10 pb-4 mb-4">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <MessageSquare className="h-4 w-4 text-[#E2C076]" />
                <span>Group Discussion & Realtime Travel Feed</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Coordinate itinerary check-ins, split decisions, and meeting points.
              </p>
            </div>

            {/* Messages Thread Container */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {discussions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-neutral-500">
                  <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-xs">No discussion messages yet. Say hello to your travel group!</p>
                </div>
              ) : (
                discussions
                  .filter((msg) => {
                    const isDirect = Boolean(msg.isDirect && msg.recipientEmail && msg.recipientEmail !== 'all');
                    if (!isDirect) return true; // Broadcast message: visible to everybody in the group
                    const currentEmail = (userProfile?.email || 'ffdhanush806@gmail.com').toLowerCase();
                    const isSender = msg.senderEmail.toLowerCase() === currentEmail;
                    const isRecipient = (msg.recipientEmail || '').toLowerCase() === currentEmail;
                    // Personal direct message: ONLY visible to sender and receiver!
                    return isSender || isRecipient;
                  })
                  .map((msg) => {
                    const isMe = msg.senderEmail.toLowerCase() === (userProfile?.email || 'ffdhanush806@gmail.com').toLowerCase();

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start space-x-3 ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}
                    >
                      <img
                        src={msg.senderAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                        alt={msg.senderName}
                        className="h-8 w-8 rounded-full object-cover border border-[#E2C076]/30 flex-shrink-0"
                      />
                      <div className={`max-w-md rounded-2xl p-3.5 text-xs ${
                        isMe
                          ? 'bg-[#E2C076] text-[#070B14] font-medium rounded-tr-none'
                          : 'bg-[#0A101D] border border-white/10 text-neutral-200 rounded-tl-none'
                      }`}>
                        <div className="flex items-center justify-between space-x-3 mb-1 text-[10px] opacity-80">
                          <span className="font-bold">{msg.senderName}</span>
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        {msg.isDirect && msg.recipientEmail && msg.recipientEmail !== 'all' ? (
                          <div className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold mb-1.5 ${
                            isMe ? 'bg-[#070B14]/20 text-[#070B14]' : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          }`}>
                            <Mail className="h-3 w-3" />
                            <span>Direct Email to: {msg.recipientName || msg.recipientEmail}</span>
                          </div>
                        ) : (
                          <div className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold mb-1.5 ${
                            isMe ? 'bg-[#070B14]/20 text-[#070B14]' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            <Users className="h-3 w-3" />
                            <span>Broadcast to Everyone • Email Delivered</span>
                          </div>
                        )}
                        <p className="leading-relaxed">{msg.message}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Message Composer Bar with Recipient Selector & Email Dispatch */}
            <form onSubmit={handleSendMessage} className="mt-4 pt-4 border-t border-white/10 space-y-3">
              {/* Recipient Selection Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-[#070B14] p-2.5 rounded-2xl border border-white/10">
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-bold text-neutral-400 pl-1">Send Mode:</span>
                  <div className="inline-flex rounded-xl bg-white/5 p-0.5 border border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        setRecipientMode('all');
                        setSelectedRecipientEmail('');
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        recipientMode === 'all'
                          ? 'bg-[#E2C076] text-[#070B14] shadow-sm'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      📢 Broadcast to All
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRecipientMode('direct');
                        const otherMember = (activeGroup.members || []).find(m => m.userEmail.toLowerCase() !== (userProfile?.email || '').toLowerCase());
                        if (otherMember) setSelectedRecipientEmail(otherMember.userEmail);
                        else if (activeGroup.members && activeGroup.members.length > 0) setSelectedRecipientEmail(activeGroup.members[0].userEmail);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        recipientMode === 'direct'
                          ? 'bg-sky-500 text-white shadow-sm'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      ✉️ Direct Email to Person
                    </button>
                  </div>
                </div>

                {recipientMode === 'direct' && (
                  <div className="flex items-center space-x-2">
                    <label className="text-[11px] font-semibold text-sky-400">Select Member:</label>
                    <select
                      value={selectedRecipientEmail}
                      onChange={(e) => setSelectedRecipientEmail(e.target.value)}
                      className="bg-[#0E1726] border border-sky-500/40 text-white text-xs rounded-xl px-3 py-1 focus:outline-none focus:border-sky-400"
                    >
                      {(activeGroup.members || []).map((m) => (
                        <option key={m.id} value={m.userEmail}>
                          {m.name} ({m.userEmail}) • {m.role}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <label className="flex items-center space-x-1.5 text-[11px] font-medium text-emerald-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendEmailNotification}
                    onChange={(e) => setSendEmailNotification(e.target.checked)}
                    className="rounded text-[#E2C076] focus:ring-0"
                  />
                  <span>Dispatch Instant Email</span>
                </label>
              </div>

              {/* Message text and send button */}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  placeholder={
                    recipientMode === 'direct'
                      ? `Type a direct email message to ${activeGroup.members?.find(m => m.userEmail === selectedRecipientEmail)?.name || selectedRecipientEmail || 'selected companion'}...`
                      : "Broadcast a message & email notification to all group companions..."
                  }
                  className="flex-1 bg-[#070B14] border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#E2C076]"
                />
                <button
                  type="submit"
                  disabled={isSendingMessage || !newMessageText.trim()}
                  className="px-4 py-2.5 rounded-xl bg-[#E2C076] hover:bg-[#D4A853] text-[#070B14] disabled:opacity-50 transition-all font-bold flex items-center space-x-1.5 text-xs flex-shrink-0"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{isSendingMessage ? 'Sending...' : 'Send Message & Email'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 11. SHARED EXPENSES: CONTRIBUTIONS & SPLITS */}
      {/* ===================================================================== */}
      {activeGroup && activeTab === 'shared-expenses' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Member Contributions Summary Grid */}
          <div className="bg-[#0E1726]/80 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl">
            <h3 className="text-base font-bold text-white mb-1">
              Member Contributions & Split Balances
            </h3>
            <p className="text-xs text-neutral-400 mb-6">
              Total funds paid upfront by each traveler vs their allocated share of shared experiences.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(sharedData?.memberContributions || []).map((contrib) => (
                <div
                  key={contrib.memberId}
                  className="bg-[#0A101D] border border-white/10 rounded-2xl p-4"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <img
                      src={contrib.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                      alt={contrib.name}
                      className="h-9 w-9 rounded-full object-cover border border-[#E2C076]/30"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{contrib.name}</p>
                      <span className={`text-[10px] font-bold ${contrib.netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {contrib.netBalance >= 0 ? `+₹${contrib.netBalance.toLocaleString()} to receive` : `-₹${Math.abs(contrib.netBalance).toLocaleString()} owes`}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-[11px] pt-2 border-t border-white/[0.06]">
                    <div className="flex justify-between text-neutral-400">
                      <span>Total Paid Upfront:</span>
                      <span className="font-bold text-white">₹{contrib.totalPaid.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Assigned Share:</span>
                      <span className="font-bold text-neutral-300">₹{contrib.totalOwed.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shared Expenses Listing */}
          <div className="bg-[#0E1726]/80 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl">
            <h3 className="text-base font-bold text-white mb-4">
              Shared Expense Line Items ({sharedData?.expenses.length || 0})
            </h3>

            <div className="divide-y divide-white/[0.06]">
              {(sharedData?.expenses || []).map((exp) => (
                <div key={exp.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-white">{exp.title}</h4>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Paid by <strong className="text-[#E2C076]">{exp.paidByName || 'Member'}</strong> on {exp.date} • {exp.category}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-white">
                      ₹{exp.amount.toLocaleString()}
                    </span>
                    <span className="block text-[10px] text-neutral-400">
                      Split equally ({activeGroup.members?.length || 1} ways)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 11. SETTLEMENTS MATRIX: WHO OWES WHOM & SETTLE ACTION */}
      {/* ===================================================================== */}
      {activeGroup && activeTab === 'settlements' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-[#0E1726]/80 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-emerald-400" />
                  <span>Settlement Matrix & Debt Simplification</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Calculated using smart debt consolidation to minimize transactions between group members.
                </p>
              </div>
            </div>

            {(!sharedData?.settlements || sharedData.settlements.length === 0) ? (
              <div className="py-12 text-center text-neutral-400">
                <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-white">All balances are completely settled!</p>
                <p className="text-xs mt-1">No outstanding group debts remain.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sharedData.settlements.map((settle) => (
                  <div
                    key={settle.id}
                    className="p-5 rounded-2xl bg-[#0A101D] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400">
                        ₹
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 text-xs font-bold text-white">
                          <span>{settle.fromMemberName}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-neutral-400" />
                          <span className="text-[#E2C076]">{settle.toMemberName}</span>
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          Direct debt settlement for shared group expenditures
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <span className="text-base font-extrabold text-white">
                          ₹{settle.amount.toLocaleString()}
                        </span>
                        <span className={`block text-[10px] font-bold uppercase tracking-wider ${
                          settle.status === 'Settled' ? 'text-emerald-400' : 'text-amber-400'
                        }`}>
                          {settle.status}
                        </span>
                      </div>

                      {settle.status !== 'Settled' && (
                        <button
                          onClick={() => {
                            setSelectedSettlement(settle);
                            setIsSettleModalOpen(true);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all"
                        >
                          Settle Now
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* EMPTY STATE (when user has no groups yet) */}
      {!isLoading && !activeGroup && (
        <div className="bg-[#0E1726]/80 border border-white/10 rounded-3xl p-8 sm:p-12 backdrop-blur-2xl text-center max-w-xl mx-auto my-8 space-y-5">
          <div className="h-16 w-16 rounded-3xl bg-[#E2C076]/10 border border-[#E2C076]/30 flex items-center justify-center mx-auto text-[#E2C076]">
            <Users className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-white">No Travel Groups Yet</h3>
            <p className="text-xs sm:text-sm text-neutral-400 mt-2 max-w-md mx-auto leading-relaxed">
              Create your own collaborative travel group for your upcoming expedition, or enter the invite code received via email to activate your membership.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setIsJoinCodeModalOpen(true)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-bold transition-all flex items-center justify-center space-x-2"
            >
              <KeyRound className="h-4 w-4 text-[#E2C076]" />
              <span>Join with Invite Code</span>
            </button>
            <button
              onClick={() => setIsCreateGroupModalOpen(true)}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D4A853] to-[#E2C076] hover:from-[#C59B3F] hover:to-[#D4A853] text-[#070B14] text-xs font-extrabold transition-all shadow-lg shadow-[#D4A853]/25 flex items-center justify-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Create Travel Group</span>
            </button>
          </div>
        </div>
      )}

      {/* CREATE GROUP MODAL */}
      <AnimatePresence>
        {isCreateGroupModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0E1726] border border-[#E2C076]/30 rounded-3xl p-6 sm:p-8 text-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Users className="h-5 w-5 text-[#E2C076]" />
                  <span>Create Travel Group</span>
                </h3>
                <button onClick={() => setIsCreateGroupModalOpen(false)} className="text-neutral-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Group Name *</label>
                  <input
                    type="text"
                    required
                    value={newGroupForm.name}
                    onChange={(e) => setNewGroupForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="E.g. Swiss Alps Ski Party 2026"
                    className="w-full bg-[#070B14] border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#E2C076]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Trip Mission Description</label>
                  <textarea
                    rows={2}
                    value={newGroupForm.description}
                    onChange={(e) => setNewGroupForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="E.g. Group itinerary for glacier expeditions, mountain lodges, and scenic train transfers..."
                    className="w-full bg-[#070B14] border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#E2C076]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Group Cover Photo *</label>
                  <div className="flex items-center space-x-2 mb-2.5">
                    <button
                      type="button"
                      onClick={() => setGroupPhotoUploadMode('device')}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        groupPhotoUploadMode === 'device'
                          ? 'bg-[#E2C076] text-[#070B14]'
                          : 'bg-white/5 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Camera className="h-3.5 w-3.5" />
                      <span>Upload from Device</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setGroupPhotoUploadMode('url')}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        groupPhotoUploadMode === 'url'
                          ? 'bg-[#E2C076] text-[#070B14]'
                          : 'bg-white/5 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                      <span>Image URL Link</span>
                    </button>
                  </div>

                  {groupPhotoUploadMode === 'device' ? (
                    <div>
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#E2C076]/40 hover:border-[#E2C076] rounded-2xl p-4 bg-[#070B14] cursor-pointer transition-all">
                        <Upload className="h-6 w-6 text-[#E2C076] mb-1.5 animate-pulse" />
                        <span className="text-xs font-bold text-white">
                          {isReadingGroupPhoto ? 'Processing Photo...' : 'Click to Browse Photo from Device'}
                        </span>
                        <span className="text-[10px] text-neutral-400 mt-0.5">PNG, JPG, WEBP • Instant preview & storage</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleGroupPhotoSelect}
                          className="hidden"
                        />
                      </label>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="url"
                        value={newGroupForm.coverImage}
                        onChange={(e) => setNewGroupForm(prev => ({ ...prev, coverImage: e.target.value }))}
                        placeholder="https://images.unsplash.com/... or image link"
                        className="w-full bg-[#070B14] border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#E2C076]"
                      />
                    </div>
                  )}

                  {/* Instant Live Photo Preview */}
                  {newGroupForm.coverImage && (
                    <div className="mt-2.5 p-2 rounded-2xl bg-[#070B14] border border-[#E2C076]/30 flex items-center space-x-3">
                      <img
                        src={newGroupForm.coverImage}
                        alt="Group Cover Preview"
                        className="h-14 w-20 rounded-xl object-cover border border-white/20 flex-shrink-0"
                      />
                      <div className="overflow-hidden">
                        <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[9px] font-extrabold uppercase tracking-wider mb-0.5">
                          <Check className="h-2.5 w-2.5" />
                          <span>Preview Ready</span>
                        </div>
                        <p className="text-[11px] text-neutral-300 truncate font-semibold">Group Cover Preview</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/10">
                  <button type="button" onClick={() => setIsCreateGroupModalOpen(false)} className="text-xs text-neutral-400 hover:text-white">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-[#E2C076] text-[#070B14] text-xs font-bold">
                    Create Group
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT GROUP COVER PHOTO MODAL */}
      <AnimatePresence>
        {isEditPhotoModalOpen && activeGroup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0E1726] border border-[#E2C076]/30 rounded-3xl p-6 sm:p-8 text-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Camera className="h-5 w-5 text-[#E2C076]" />
                  <span>Update Group Cover Photo</span>
                </h3>
                <button onClick={() => setIsEditPhotoModalOpen(false)} className="text-neutral-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleSaveGroupPhoto} className="space-y-4">
                <p className="text-xs text-neutral-300">
                  Select a new photo from your device or paste a web URL. The photo preview updates instantly and will be saved in PostgreSQL.
                </p>

                {/* Upload from Device Box */}
                <div>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#E2C076]/40 hover:border-[#E2C076] rounded-2xl p-4 bg-[#070B14] cursor-pointer transition-all mb-3">
                    <Upload className="h-6 w-6 text-[#E2C076] mb-1.5 animate-pulse" />
                    <span className="text-xs font-bold text-white">
                      {isReadingGroupPhoto ? 'Reading Device Photo...' : 'Choose Photo from Device'}
                    </span>
                    <span className="text-[10px] text-neutral-400 mt-0.5">Instant preview & verified</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditPhotoDeviceUpload}
                      className="hidden"
                    />
                  </label>

                  <div className="flex items-center space-x-2 mb-1.5">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Or enter image URL:</span>
                  </div>
                  <input
                    type="url"
                    value={editPhotoInput}
                    onChange={(e) => setEditPhotoInput(e.target.value)}
                    placeholder="https://images.unsplash.com/... or image link"
                    className="w-full bg-[#070B14] border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#E2C076]"
                  />
                </div>

                {/* Live Preview */}
                {editPhotoInput && (
                  <div className="p-3 rounded-2xl bg-[#070B14] border border-[#E2C076]/30">
                    <div className="text-[10px] font-bold text-[#E2C076] uppercase tracking-wider mb-2 flex items-center space-x-1">
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span>Instant Preview</span>
                    </div>
                    <img
                      src={editPhotoInput}
                      alt="Cover Preview"
                      className="h-32 w-full object-cover rounded-xl border border-white/10"
                    />
                  </div>
                )}

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/10">
                  <button type="button" onClick={() => setIsEditPhotoModalOpen(false)} className="text-xs text-neutral-400 hover:text-white">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!editPhotoInput}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#E2C076] to-[#D4A853] text-[#070B14] text-xs font-extrabold disabled:opacity-50"
                  >
                    Save & Update Photo
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* INVITE MEMBER MODAL */}
      <AnimatePresence>
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0E1726] border border-[#E2C076]/30 rounded-3xl p-6 sm:p-8 text-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <UserPlus className="h-5 w-5 text-[#E2C076]" />
                  <span>Invite Traveler to Group</span>
                </h3>
                <button onClick={() => setIsInviteModalOpen(false)} className="text-neutral-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleInviteMember} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Companion Full Name *</label>
                  <input
                    type="text"
                    required
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="E.g. Siddharth Verma"
                    className="w-full bg-[#070B14] border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#E2C076]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={inviteForm.userEmail}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, userEmail: e.target.value }))}
                    placeholder="siddharth@gmail.com"
                    className="w-full bg-[#070B14] border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#E2C076]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Role & Permissions</label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value as any }))}
                    className="w-full bg-[#070B14] border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#E2C076]"
                  >
                    <option value="Editor">Editor (Can log expenses & edit days)</option>
                    <option value="Viewer">Viewer (View-only permissions)</option>
                    <option value="Admin">Admin (Full co-management)</option>
                    <option value="Member">Member (Standard participant)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Allocated Expense Budget Allowance (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    value={inviteForm.allocatedBudget}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, allocatedBudget: parseFloat(e.target.value) || 0 }))}
                    placeholder="25000"
                    className="w-full bg-[#070B14] border border-[#E2C076]/40 rounded-xl px-3.5 py-2 text-xs text-[#E2C076] font-bold focus:outline-none focus:border-[#E2C076]"
                  />
                  <p className="text-[10px] text-neutral-400 mt-1">
                    Group admin sets the maximum spending allowance for this traveler.
                  </p>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/10">
                  <button type="button" onClick={() => setIsInviteModalOpen(false)} className="text-xs text-neutral-400 hover:text-white">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-[#E2C076] text-[#070B14] text-xs font-bold hover:bg-[#D4A853]">
                    Send Welcome & Invite
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WELCOME MESSAGE & JOIN CODE CONFIRMATION MODAL */}
      <AnimatePresence>
        {inviteWelcomeInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0E1726] border border-[#E2C076]/50 rounded-3xl p-6 sm:p-8 text-white shadow-2xl space-y-4"
            >
              <div className="flex items-center space-x-3 border-b border-white/10 pb-4">
                <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Traveler Added to Group!</h3>
                  <p className="text-xs text-neutral-400">Welcome message & Join Code confirmed</p>
                </div>
              </div>

              <div className="bg-[#070B14] border border-white/10 rounded-2xl p-4 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Traveler Name:</span>
                  <span className="font-bold text-white">{inviteWelcomeInfo.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Email Address:</span>
                  <span className="font-mono text-[#E2C076]">{inviteWelcomeInfo.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Assigned Role:</span>
                  <span className="font-bold text-sky-400">{inviteWelcomeInfo.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Allocated Expense Budget:</span>
                  <span className="font-extrabold text-[#E2C076]">₹{inviteWelcomeInfo.allocatedBudget.toLocaleString()}</span>
                </div>
              </div>

              {/* Join Code Highlight Box */}
              <div className="bg-[#E2C076]/10 border border-[#E2C076]/30 rounded-2xl p-4 text-center">
                <p className="text-[11px] text-neutral-300 font-medium mb-1">
                  Official Travel Group Join Code:
                </p>
                <div className="text-xl font-mono font-extrabold text-[#E2C076] tracking-widest my-1">
                  {inviteWelcomeInfo.code}
                </div>
                <p className="text-[10px] text-neutral-400">
                  A welcome email with this join code and group instructions was sent to {inviteWelcomeInfo.email}.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(inviteWelcomeInfo.code);
                    showToast(`Join code ${inviteWelcomeInfo.code} copied!`, 'info');
                  }}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center space-x-1.5 transition-all"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Code</span>
                </button>
                <button
                  onClick={() => setInviteWelcomeInfo(null)}
                  className="px-5 py-2 rounded-xl bg-[#E2C076] hover:bg-[#D4A853] text-[#070B14] text-xs font-bold transition-all"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ALLOCATE EXPENSE BUDGET MODAL FOR GROUP ADMIN */}
      <AnimatePresence>
        {budgetModalMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0E1726] border border-[#E2C076]/40 rounded-3xl p-6 sm:p-8 text-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-[#E2C076]" />
                  <span>Allocate Expense Spending Limit</span>
                </h3>
                <button onClick={() => setBudgetModalMember(null)} className="text-neutral-400 hover:text-white">✕</button>
              </div>

              <div className="flex items-center space-x-3 mb-5 p-3 rounded-2xl bg-[#0A101D] border border-white/10">
                <img
                  src={budgetModalMember.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                  alt={budgetModalMember.name}
                  className="h-10 w-10 rounded-full object-cover border border-[#E2C076]/30"
                />
                <div>
                  <p className="text-xs font-bold text-white">{budgetModalMember.name}</p>
                  <p className="text-[11px] text-neutral-400">{budgetModalMember.userEmail}</p>
                </div>
              </div>

              <form onSubmit={handleSaveMemberBudget} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Spending Allowance Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    value={memberBudgetAmount}
                    onChange={(e) => setMemberBudgetAmount(parseFloat(e.target.value) || 0)}
                    placeholder="30000"
                    className="w-full bg-[#070B14] border border-[#E2C076]/40 rounded-xl px-4 py-2.5 text-base text-[#E2C076] font-bold focus:outline-none"
                  />
                  <p className="text-[11px] text-neutral-400 mt-1">
                    As group admin, you set how much this companion can spend during this trip.
                  </p>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-2 pt-1">
                  {[10000, 25000, 50000, 75000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setMemberBudgetAmount(preset)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                        memberBudgetAmount === preset
                          ? 'bg-[#E2C076] text-[#070B14] border-[#E2C076] font-bold'
                          : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
                      }`}
                    >
                      ₹{(preset / 1000).toFixed(0)}k
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/10">
                  <button type="button" onClick={() => setBudgetModalMember(null)} className="text-xs text-neutral-400 hover:text-white">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingMemberBudget}
                    className="px-5 py-2 rounded-xl bg-[#E2C076] hover:bg-[#D4A853] text-[#070B14] text-xs font-bold transition-all disabled:opacity-50"
                  >
                    {isSavingMemberBudget ? 'Saving...' : 'Save Allocation'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE / REMOVE MEMBER CONFIRMATION MODAL */}
      <AnimatePresence>
        {memberToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0E1726] border border-rose-500/40 rounded-3xl p-6 sm:p-8 text-white shadow-2xl space-y-4"
            >
              <div className="flex items-center space-x-3 border-b border-white/10 pb-4">
                <div className="h-10 w-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Remove Group Member</h3>
                  <p className="text-xs text-neutral-400">Updates party roster immediately</p>
                </div>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed">
                Are you sure you want to remove <strong className="text-white">{memberToDelete.name}</strong> ({memberToDelete.userEmail}) from this travel party?
              </p>

              <div className="p-3.5 rounded-xl bg-[#0A101D] border border-white/10 text-xs text-neutral-400 space-y-1">
                <div>• Status: <span className="text-neutral-200">{memberToDelete.status}</span></div>
                <div>• Joined: <span className="text-neutral-200">{memberToDelete.joinedViaCode || memberToDelete.joinedCode ? 'With Code' : 'Direct Invitation'}</span></div>
                <div>• Member permissions and shared trip access will be revoked.</div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMemberToDelete(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeletingMember}
                  onClick={handleDeleteMemberConfirm}
                  className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center space-x-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>{isDeletingMember ? 'Removing...' : 'Confirm Remove'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* JOIN VIA CODE MODAL */}
      <AnimatePresence>
        {isJoinCodeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0E1726] border border-[#E2C076]/40 rounded-3xl p-6 sm:p-8 text-white shadow-2xl space-y-4"
            >
              <div className="flex items-center space-x-3 border-b border-white/10 pb-4">
                <div className="h-10 w-10 rounded-2xl bg-[#E2C076]/15 border border-[#E2C076]/30 flex items-center justify-center text-[#E2C076]">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Join Group via Invite Code</h3>
                  <p className="text-xs text-neutral-400">Enter code received in email notification</p>
                </div>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed">
                If the group administrator invited you by email, enter the exact invite code from your email notification. Only when entered correctly will you be activated as a full group member.
              </p>

              <form onSubmit={handleJoinByCode} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Group Invite Code *</label>
                  <input
                    type="text"
                    required
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    placeholder="E.G. KASHMIR-2026"
                    className="w-full text-center uppercase tracking-widest font-mono font-extrabold bg-[#070B14] border border-[#E2C076]/50 rounded-xl px-4 py-3 text-base text-[#E2C076] focus:outline-none focus:border-[#E2C076]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">Your Email *</label>
                    <input
                      type="email"
                      required
                      value={joinEmailInput}
                      onChange={(e) => setJoinEmailInput(e.target.value)}
                      placeholder={userProfile?.email || "your.email@example.com"}
                      className="w-full bg-[#070B14] border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#E2C076]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">Your Full Name</label>
                    <input
                      type="text"
                      value={joinNameInput}
                      onChange={(e) => setJoinNameInput(e.target.value)}
                      placeholder={userProfile?.name || "Traveler"}
                      className="w-full bg-[#070B14] border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#E2C076]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsJoinCodeModalOpen(false);
                      setJoinCodeInput('');
                    }}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4A853] to-[#E2C076] hover:from-[#C59B3F] hover:to-[#D4A853] text-[#070B14] text-xs font-extrabold shadow-md shadow-[#D4A853]/25 transition-all"
                  >
                    Verify & Join Group
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* JOINED GROUP SUCCESS CELEBRATION MODAL */}
      <AnimatePresence>
        {joinedGroupSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md bg-[#0E1726] border border-emerald-500/50 rounded-3xl p-6 sm:p-8 text-white shadow-2xl text-center space-y-4"
            >
              <div className="h-16 w-16 rounded-3xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle className="h-8 w-8" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
                  Membership Verified & Activated
                </span>
                <h3 className="text-xl font-extrabold text-white mt-2">Welcome to {joinedGroupSuccess.name}!</h3>
                <p className="text-xs text-neutral-300 mt-1 max-w-sm mx-auto leading-relaxed">
                  Your invite code has been verified. You now have full access to group discussions, member rosters, shared budgets, and expense settlements.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#070B14] border border-white/10 text-xs text-left space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Group Name:</span>
                  <span className="font-bold text-white">{joinedGroupSuccess.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Host Email:</span>
                  <span className="font-medium text-[#E2C076]">{joinedGroupSuccess.createdByEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Membership Status:</span>
                  <span className="font-bold text-emerald-400">Active (Joined via Code)</span>
                </div>
              </div>

              <button
                onClick={() => setJoinedGroupSuccess(null)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D4A853] to-[#E2C076] text-[#070B14] font-extrabold text-xs shadow-lg shadow-[#D4A853]/25"
              >
                Enter Group Workspace →
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SETTLEMENT PAYMENT RECORD MODAL */}
      <AnimatePresence>
        {isSettleModalOpen && selectedSettlement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0E1726] border border-emerald-500/40 rounded-3xl p-6 text-white shadow-2xl"
            >
              <h3 className="text-base font-bold text-white mb-1 flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                <span>Mark Debt as Settled</span>
              </h3>
              <p className="text-xs text-neutral-400 mb-4">
                Confirm settlement of ₹{selectedSettlement.amount.toLocaleString()} from {selectedSettlement.fromMemberName} to {selectedSettlement.toMemberName}.
              </p>

              <form onSubmit={handleSettlePayment} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    UPI / Bank Transaction Reference (Optional)
                  </label>
                  <input
                    type="text"
                    value={settleTransactionRef}
                    onChange={(e) => setSettleTransactionRef(e.target.value)}
                    placeholder="E.g. UPI-REF-981247812"
                    className="w-full bg-[#070B14] border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-white/10">
                  <button type="button" onClick={() => setIsSettleModalOpen(false)} className="text-xs text-neutral-400 hover:text-white px-3 py-2">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-bold">
                    Confirm Settled
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

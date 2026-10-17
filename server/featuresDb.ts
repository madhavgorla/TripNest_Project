import fs from 'fs';
import path from 'path';
import { getPgPool, ensureDataDir, DATA_DIR } from './db';
import { sendGroupInvitationEmail, sendGroupDiscussionEmail } from './email';
import {
  TripBudget,
  TripExpense,
  ExpenseCategory,
  EXPENSE_CATEGORIES,
  BudgetOverview,
  ExpenseReportSummary,
  TravelGroup,
  TravelGroupMember,
  GroupDiscussionMessage,
  SettlementRecord,
  GroupSharedExpensesData,
  TripNotification,
  MediaDocument
} from '../src/types';

// Fallback file paths
const BUDGETS_FILE = path.join(DATA_DIR, 'budgets.json');
const EXPENSES_FILE = path.join(DATA_DIR, 'expenses.json');
const GROUPS_FILE = path.join(DATA_DIR, 'groups.json');
const GROUP_MEMBERS_FILE = path.join(DATA_DIR, 'group_members.json');
const DISCUSSIONS_FILE = path.join(DATA_DIR, 'discussions.json');
const SETTLEMENTS_FILE = path.join(DATA_DIR, 'settlements.json');
const NOTIFICATIONS_FILE = path.join(DATA_DIR, 'notifications.json');
const MEDIA_FILE = path.join(DATA_DIR, 'media_documents.json');

// In-memory caches
let budgetsCache: TripBudget[] = [];
let expensesCache: TripExpense[] = [];
let groupsCache: TravelGroup[] = [];
let groupMembersCache: TravelGroupMember[] = [];
let discussionsCache: GroupDiscussionMessage[] = [];
let settlementsCache: SettlementRecord[] = [];
let notificationsCache: TripNotification[] = [];
let mediaCache: MediaDocument[] = [];

function loadJsonCache<T>(filePath: string, defaultData: T[] = []): T[] {
  ensureDataDir();
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn(`Error loading cache from ${filePath}:`, e);
  }
  return defaultData;
}

function saveJsonCache<T>(filePath: string, data: T[]) {
  ensureDataDir();
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.warn(`Error saving cache to ${filePath}:`, e);
  }
}

// Initialize seed data
export function initFeaturesCaches() {
  budgetsCache = loadJsonCache<TripBudget>(BUDGETS_FILE, [
    {
      id: 'bdg-kashmir-01',
      tripId: 'trip-1789736347651-alzwl',
      userEmail: 'ffdhanush806@gmail.com',
      totalBudget: 120000,
      currency: 'INR',
      allocations: {
        Transportation: 25000,
        Hotel: 45000,
        Food: 20000,
        Shopping: 12000,
        Entertainment: 10000,
        Miscellaneous: 8000
      },
      estimatedCosts: {
        Transportation: 24000,
        Hotel: 42000,
        Food: 18000,
        Shopping: 10000,
        Entertainment: 9500,
        Miscellaneous: 6000
      },
      notes: 'Luxury Kashmir Valley Expedition budget with 4-way group split allocations',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]);

  expensesCache = loadJsonCache<TripExpense>(EXPENSES_FILE, [
    {
      id: 'exp-001',
      tripId: 'trip-1789736347651-alzwl',
      groupId: 'grp-kashmir-01',
      userEmail: 'ffdhanush806@gmail.com',
      title: 'Khyber Himalayan Resort Premium Suite (2 Nights)',
      amount: 38000,
      currency: 'INR',
      category: 'Hotel',
      date: '2026-09-18',
      paymentMethod: 'Credit Card',
      notes: 'Luxury pine wood cottage with heated indoor pool & mountain view',
      isShared: true,
      paidByMemberId: 'mem-001',
      paidByName: 'Dhanush Kumar',
      splitType: 'EQUAL',
      splitDetails: [
        { memberId: 'mem-001', memberName: 'Dhanush Kumar', shareAmount: 9500, isPaid: true },
        { memberId: 'mem-002', memberName: 'Aarav Sharma', shareAmount: 9500, isPaid: false },
        { memberId: 'mem-003', memberName: 'Priya Patel', shareAmount: 9500, isPaid: false },
        { memberId: 'mem-004', memberName: 'Rohan Mehta', shareAmount: 9500, isPaid: false }
      ],
      createdAt: '2026-09-18T10:00:00.000Z',
      updatedAt: '2026-09-18T10:00:00.000Z'
    },
    {
      id: 'exp-002',
      tripId: 'trip-1789736347651-alzwl',
      groupId: 'grp-kashmir-01',
      userEmail: 'ffdhanush806@gmail.com',
      title: 'Private Chauffeur Sedan Srinagar-Gulmarg-Pahalgam',
      amount: 14500,
      currency: 'INR',
      category: 'Transportation',
      date: '2026-09-19',
      paymentMethod: 'UPI',
      notes: 'Toyota Innova Crysta VIP 4-day private transit',
      isShared: true,
      paidByMemberId: 'mem-002',
      paidByName: 'Aarav Sharma',
      splitType: 'EQUAL',
      splitDetails: [
        { memberId: 'mem-001', memberName: 'Dhanush Kumar', shareAmount: 3625, isPaid: false },
        { memberId: 'mem-002', memberName: 'Aarav Sharma', shareAmount: 3625, isPaid: true },
        { memberId: 'mem-003', memberName: 'Priya Patel', shareAmount: 3625, isPaid: false },
        { memberId: 'mem-004', memberName: 'Rohan Mehta', shareAmount: 3625, isPaid: false }
      ],
      createdAt: '2026-09-19T09:30:00.000Z',
      updatedAt: '2026-09-19T09:30:00.000Z'
    },
    {
      id: 'exp-003',
      tripId: 'trip-1789736347651-alzwl',
      groupId: 'grp-kashmir-01',
      userEmail: 'ffdhanush806@gmail.com',
      title: 'Royal Wazwan 36-Course Banquet at Ahdoos',
      amount: 6800,
      currency: 'INR',
      category: 'Food',
      date: '2026-09-19',
      paymentMethod: 'Credit Card',
      notes: 'Rogan Josh, Gushtaba, Tabak Maaz and Kahwa celebration',
      isShared: true,
      paidByMemberId: 'mem-001',
      paidByName: 'Dhanush Kumar',
      splitType: 'EQUAL',
      splitDetails: [
        { memberId: 'mem-001', memberName: 'Dhanush Kumar', shareAmount: 1700, isPaid: true },
        { memberId: 'mem-002', memberName: 'Aarav Sharma', shareAmount: 1700, isPaid: false },
        { memberId: 'mem-003', memberName: 'Priya Patel', shareAmount: 1700, isPaid: false },
        { memberId: 'mem-004', memberName: 'Rohan Mehta', shareAmount: 1700, isPaid: false }
      ],
      createdAt: '2026-09-19T20:15:00.000Z',
      updatedAt: '2026-09-19T20:15:00.000Z'
    },
    {
      id: 'exp-004',
      tripId: 'trip-1789736347651-alzwl',
      userEmail: 'ffdhanush806@gmail.com',
      title: 'Authentic Kashmiri Pashmina Shawl & Saffron Stigmas',
      amount: 8500,
      currency: 'INR',
      category: 'Shopping',
      date: '2026-09-20',
      paymentMethod: 'UPI',
      notes: 'Certified GI-tagged Pashmina and Pampore organic saffron',
      isShared: false,
      createdAt: '2026-09-20T16:00:00.000Z',
      updatedAt: '2026-09-20T16:00:00.000Z'
    },
    {
      id: 'exp-005',
      tripId: 'trip-1789736347651-alzwl',
      groupId: 'grp-kashmir-01',
      userEmail: 'ffdhanush806@gmail.com',
      title: 'Dal Lake Sunset Shikara Charter & Floating Flower Market',
      amount: 3200,
      currency: 'INR',
      category: 'Entertainment',
      date: '2026-09-18',
      paymentMethod: 'Cash',
      notes: '3-hour private shikara cruise with traditional live music',
      isShared: true,
      paidByMemberId: 'mem-003',
      paidByName: 'Priya Patel',
      splitType: 'EQUAL',
      splitDetails: [
        { memberId: 'mem-001', memberName: 'Dhanush Kumar', shareAmount: 800, isPaid: false },
        { memberId: 'mem-002', memberName: 'Aarav Sharma', shareAmount: 800, isPaid: false },
        { memberId: 'mem-003', memberName: 'Priya Patel', shareAmount: 800, isPaid: true },
        { memberId: 'mem-004', memberName: 'Rohan Mehta', shareAmount: 800, isPaid: false }
      ],
      createdAt: '2026-09-18T17:45:00.000Z',
      updatedAt: '2026-09-18T17:45:00.000Z'
    },
    {
      id: 'exp-006',
      tripId: 'trip-1789736347651-alzwl',
      userEmail: 'ffdhanush806@gmail.com',
      title: 'Gulmarg Gondola Phase-2 Mountain Porter & Emergency First-Aid',
      amount: 2400,
      currency: 'INR',
      category: 'Miscellaneous',
      date: '2026-09-21',
      paymentMethod: 'Cash',
      notes: 'Alpine mountain safety gear rental and acclimatization guides',
      isShared: false,
      createdAt: '2026-09-21T11:00:00.000Z',
      updatedAt: '2026-09-21T11:00:00.000Z'
    }
  ]);

  groupsCache = loadJsonCache<TravelGroup>(GROUPS_FILE, [
    {
      id: 'grp-kashmir-01',
      tripId: 'trip-1789736347651-alzwl',
      name: 'Kashmir Alpine Sanctuary Expedition',
      description: 'Collaborative group travel for Srinagar, Gulmarg Gondola, and Pahalgam Valleys',
      createdByEmail: 'ffdhanush806@gmail.com',
      coverImage: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=1200&q=80',
      inviteCode: 'KASHMIR-2026',
      createdAt: '2026-09-15T08:00:00.000Z',
      updatedAt: '2026-09-15T08:00:00.000Z'
    }
  ]);

  groupMembersCache = loadJsonCache<TravelGroupMember>(GROUP_MEMBERS_FILE, [
    {
      id: 'mem-001',
      groupId: 'grp-kashmir-01',
      userEmail: 'ffdhanush806@gmail.com',
      name: 'Dhanush Kumar',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      role: 'Admin',
      status: 'Active',
      joinedAt: '2026-09-15T08:00:00.000Z'
    },
    {
      id: 'mem-002',
      groupId: 'grp-kashmir-01',
      userEmail: 'aarav.sharma@gmail.com',
      name: 'Aarav Sharma',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      role: 'Editor',
      status: 'Active',
      joinedAt: '2026-09-15T09:30:00.000Z'
    },
    {
      id: 'mem-003',
      groupId: 'grp-kashmir-01',
      userEmail: 'priya.patel@gmail.com',
      name: 'Priya Patel',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
      role: 'Viewer',
      status: 'Active',
      joinedAt: '2026-09-16T11:15:00.000Z'
    },
    {
      id: 'mem-004',
      groupId: 'grp-kashmir-01',
      userEmail: 'rohan.mehta@gmail.com',
      name: 'Rohan Mehta',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
      role: 'Member',
      status: 'Active',
      joinedAt: '2026-09-16T14:40:00.000Z'
    }
  ]);

  discussionsCache = loadJsonCache<GroupDiscussionMessage>(DISCUSSIONS_FILE, [
    {
      id: 'disc-001',
      groupId: 'grp-kashmir-01',
      senderEmail: 'ffdhanush806@gmail.com',
      senderName: 'Dhanush Kumar',
      senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      message: 'Welcome everyone! I have finalized the Khyber Resort reservation and added the booking voucher to our Media Vault.',
      createdAt: '2026-09-16T15:00:00.000Z'
    },
    {
      id: 'disc-002',
      groupId: 'grp-kashmir-01',
      senderEmail: 'aarav.sharma@gmail.com',
      senderName: 'Aarav Sharma',
      senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      message: 'Awesome! I booked our 4-day private Innova Crysta for Srinagar airport pickup and Gulmarg slopes transit.',
      createdAt: '2026-09-16T16:10:00.000Z'
    },
    {
      id: 'disc-003',
      groupId: 'grp-kashmir-01',
      senderEmail: 'priya.patel@gmail.com',
      senderName: 'Priya Patel',
      senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
      message: 'Can everyone please review the split for the Ahdoos Wazwan dinner? Settlements have been calculated automatically in the Shared Expenses tab.',
      createdAt: '2026-09-17T11:25:00.000Z'
    }
  ]);

  settlementsCache = loadJsonCache<SettlementRecord>(SETTLEMENTS_FILE, [
    {
      id: 'set-001',
      groupId: 'grp-kashmir-01',
      tripId: 'trip-1789736347651-alzwl',
      fromMemberId: 'mem-002',
      fromMemberName: 'Aarav Sharma',
      toMemberId: 'mem-001',
      toMemberName: 'Dhanush Kumar',
      amount: 4575,
      currency: 'INR',
      status: 'Pending',
      createdAt: '2026-09-20T10:00:00.000Z'
    },
    {
      id: 'set-002',
      groupId: 'grp-kashmir-01',
      tripId: 'trip-1789736347651-alzwl',
      fromMemberId: 'mem-003',
      fromMemberName: 'Priya Patel',
      toMemberId: 'mem-001',
      toMemberName: 'Dhanush Kumar',
      amount: 9000,
      currency: 'INR',
      status: 'Pending',
      createdAt: '2026-09-20T10:00:00.000Z'
    },
    {
      id: 'set-003',
      groupId: 'grp-kashmir-01',
      tripId: 'trip-1789736347651-alzwl',
      fromMemberId: 'mem-004',
      fromMemberName: 'Rohan Mehta',
      toMemberId: 'mem-001',
      toMemberName: 'Dhanush Kumar',
      amount: 11200,
      currency: 'INR',
      status: 'Pending',
      createdAt: '2026-09-20T10:00:00.000Z'
    }
  ]);

  notificationsCache = loadJsonCache<TripNotification>(NOTIFICATIONS_FILE, [
    {
      id: 'notif-001',
      userEmail: 'ffdhanush806@gmail.com',
      tripId: 'trip-1789736347651-alzwl',
      type: 'reminder',
      title: 'Upcoming Dal Lake Shikara Cruise',
      message: 'Your Shikara charter departs at 4:30 PM from Ghat #7. Dress warmly for sunset temperatures.',
      isRead: false,
      priority: 'high',
      actionUrl: '/mytrips',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: 'notif-002',
      userEmail: 'ffdhanush806@gmail.com',
      tripId: 'trip-1789736347651-alzwl',
      type: 'budget_alert',
      title: 'Hotel Allocation Alert (84% Utilized)',
      message: '₹38,000 has been logged under Hotel category out of ₹45,000 allocated budget.',
      isRead: false,
      priority: 'normal',
      actionUrl: '/budget-expenses',
      createdAt: new Date(Date.now() - 3600000 * 8).toISOString()
    },
    {
      id: 'notif-003',
      userEmail: 'ffdhanush806@gmail.com',
      tripId: 'trip-1789736347651-alzwl',
      type: 'group_invitation',
      title: 'Aarav Sharma Accepted Group Invite',
      message: 'Aarav Sharma joined "Kashmir Alpine Sanctuary Expedition" as Editor.',
      isRead: true,
      priority: 'normal',
      actionUrl: '/group-collaboration',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
    },
    {
      id: 'notif-004',
      userEmail: 'ffdhanush806@gmail.com',
      tripId: 'trip-1789736347651-alzwl',
      type: 'travel_update',
      title: 'Gulmarg Weather Update: Crisp & Sunny (14°C)',
      message: 'Clear visibility reported for Gondola Phase 1 & 2 operations today.',
      isRead: false,
      priority: 'normal',
      actionUrl: '/radar',
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
    }
  ]);

  mediaCache = loadJsonCache<MediaDocument>(MEDIA_FILE, [
    {
      id: 'med-001',
      tripId: 'trip-1789736347651-alzwl',
      userEmail: 'ffdhanush806@gmail.com',
      type: 'ticket',
      name: 'Air India Flight Ticket AI-825 (DEL to SXR)',
      fileUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
      fileSizeBytes: 245000,
      mimeType: 'image/jpeg',
      notes: 'Boarding Gate 14, Seat 4A (Business Class), Departure 07:15 AM',
      metadata: {
        flightNumber: 'AI-825',
        expirationDate: '2026-09-18',
        tag: 'Flight Boarding Pass'
      },
      createdAt: '2026-09-16T10:00:00.000Z'
    },
    {
      id: 'med-002',
      tripId: 'trip-1789736347651-alzwl',
      userEmail: 'ffdhanush806@gmail.com',
      type: 'hotel_booking',
      name: 'Khyber Himalayan Resort Confirmation Voucher',
      fileUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
      fileSizeBytes: 312000,
      mimeType: 'image/jpeg',
      notes: 'Confirmation #KHY-2026-9811 with complimentary buffet breakfast',
      metadata: {
        hotelBookingId: 'KHY-2026-9811',
        tag: 'Luxury Stay Voucher'
      },
      createdAt: '2026-09-16T11:20:00.000Z'
    },
    {
      id: 'med-003',
      tripId: 'trip-1789736347651-alzwl',
      userEmail: 'ffdhanush806@gmail.com',
      type: 'document',
      name: 'Jammu & Kashmir Tourist Permit & Altitude Medical Clearance',
      fileUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
      fileSizeBytes: 189000,
      mimeType: 'image/jpeg',
      notes: 'Valid for Apharwat Peak (3,980m) Gondola Phase 2 exploration',
      metadata: {
        expirationDate: '2026-09-25',
        tag: 'Official Permit'
      },
      createdAt: '2026-09-17T09:00:00.000Z'
    },
    {
      id: 'med-004',
      tripId: 'trip-1789736347651-alzwl',
      userEmail: 'ffdhanush806@gmail.com',
      type: 'photo',
      name: 'Sunset Shikara Gliding over Dal Lake Waters',
      fileUrl: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=1200&q=80',
      fileSizeBytes: 1420000,
      mimeType: 'image/jpeg',
      notes: 'Captured during the golden hour reflection at Srinagar',
      metadata: {
        photoLocation: 'Dal Lake, Srinagar',
        tag: 'Travel Photo'
      },
      createdAt: '2026-09-18T18:30:00.000Z'
    }
  ]);

  saveJsonCache(BUDGETS_FILE, budgetsCache);
  saveJsonCache(EXPENSES_FILE, expensesCache);
  saveJsonCache(GROUPS_FILE, groupsCache);
  saveJsonCache(GROUP_MEMBERS_FILE, groupMembersCache);
  saveJsonCache(DISCUSSIONS_FILE, discussionsCache);
  saveJsonCache(SETTLEMENTS_FILE, settlementsCache);
  saveJsonCache(NOTIFICATIONS_FILE, notificationsCache);
  saveJsonCache(MEDIA_FILE, mediaCache);
}

initFeaturesCaches();

// ===========================================================================
// 7. BUDGET MANAGEMENT METHODS
// ===========================================================================
export async function getBudgetForTripFromDb(tripId: string, userEmail?: string): Promise<TripBudget | null> {
  const pool = getPgPool();
  if (pool) {
    try {
      const res = await pool.query('SELECT * FROM tripnest_budgets WHERE trip_id = $1 LIMIT 1', [tripId]);
      if (res.rows && res.rows.length > 0) {
        const r = res.rows[0];
        return {
          id: r.id,
          tripId: r.trip_id,
          userEmail: r.user_email,
          totalBudget: Number(r.total_budget),
          currency: r.currency || 'INR',
          allocations: typeof r.allocations === 'string' ? JSON.parse(r.allocations) : (r.allocations || {}),
          estimatedCosts: typeof r.estimated_costs === 'string' ? JSON.parse(r.estimated_costs) : (r.estimated_costs || {}),
          notes: r.notes,
          createdAt: r.created_at,
          updatedAt: r.updated_at
        };
      }
    } catch (e: any) {
      console.warn('Error fetching budget from Postgres:', e.message);
    }
  }

  const found = budgetsCache.find(b => b.tripId === tripId);
  if (found) return found;

  // Fallback default budget
  return {
    id: `bdg-${Date.now()}`,
    tripId,
    userEmail: userEmail || 'guest@tripnest.luxury',
    totalBudget: 150000,
    currency: 'INR',
    allocations: {
      Transportation: 30000,
      Hotel: 50000,
      Food: 25000,
      Shopping: 15000,
      Entertainment: 15000,
      Miscellaneous: 15000
    },
    estimatedCosts: {
      Transportation: 28000,
      Hotel: 48000,
      Food: 22000,
      Shopping: 12000,
      Entertainment: 14000,
      Miscellaneous: 10000
    },
    notes: 'Default trip budget allocation',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export async function saveBudgetToDb(budgetData: Partial<TripBudget> & { tripId: string; userEmail: string }): Promise<TripBudget> {
  const existing = await getBudgetForTripFromDb(budgetData.tripId, budgetData.userEmail);
  const now = new Date().toISOString();

  const merged: TripBudget = {
    id: existing?.id || budgetData.id || `bdg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    tripId: budgetData.tripId,
    userEmail: budgetData.userEmail || existing?.userEmail || 'guest@tripnest.luxury',
    totalBudget: budgetData.totalBudget !== undefined ? Number(budgetData.totalBudget) : (existing?.totalBudget || 0),
    currency: budgetData.currency || existing?.currency || 'INR',
    allocations: budgetData.allocations || existing?.allocations || {},
    estimatedCosts: budgetData.estimatedCosts || existing?.estimatedCosts || {},
    notes: budgetData.notes !== undefined ? budgetData.notes : (existing?.notes || ''),
    createdAt: existing?.createdAt || now,
    updatedAt: now
  };

  // Cache in-memory
  const idx = budgetsCache.findIndex(b => b.tripId === merged.tripId);
  if (idx >= 0) budgetsCache[idx] = merged;
  else budgetsCache.push(merged);
  saveJsonCache(BUDGETS_FILE, budgetsCache);

  // Sync to Neon Postgres
  const pool = getPgPool();
  if (pool) {
    try {
      await pool.query(`
        INSERT INTO tripnest_budgets (id, trip_id, user_email, total_budget, currency, allocations, estimated_costs, notes, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (trip_id) DO UPDATE SET
          total_budget = EXCLUDED.total_budget,
          currency = EXCLUDED.currency,
          allocations = EXCLUDED.allocations,
          estimated_costs = EXCLUDED.estimated_costs,
          notes = EXCLUDED.notes,
          updated_at = EXCLUDED.updated_at
      `, [
        merged.id, merged.tripId, merged.userEmail, merged.totalBudget, merged.currency,
        JSON.stringify(merged.allocations), JSON.stringify(merged.estimatedCosts), merged.notes,
        merged.createdAt, merged.updatedAt
      ]);
    } catch (e: any) {
      console.warn('Error saving budget to Postgres:', e.message);
    }
  }

  return merged;
}

export async function calculateBudgetOverview(tripId: string, userEmail?: string): Promise<BudgetOverview> {
  const budget = await getBudgetForTripFromDb(tripId, userEmail);
  const expenses = await getExpensesForTripFromDb(tripId);

  const totalBudget = budget ? budget.totalBudget : 0;
  const currency = budget ? budget.currency : 'INR';

  let totalAllocated = 0;
  const allocations = budget?.allocations || {};
  const estimatedCosts = budget?.estimatedCosts || {};

  EXPENSE_CATEGORIES.forEach(cat => {
    totalAllocated += Number(allocations[cat] || 0);
  });

  const categoryBreakdown = EXPENSE_CATEGORIES.map(category => {
    const allocated = Number(allocations[category] || 0);
    const estimated = Number(estimatedCosts[category] || 0);
    const categoryExpenses = expenses.filter(e => e.category.toLowerCase() === category.toLowerCase());
    const spent = categoryExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const remaining = allocated - spent;
    const percentSpent = allocated > 0 ? Math.round((spent / allocated) * 100) : (spent > 0 ? 100 : 0);

    let status: 'under' | 'near' | 'over' = 'under';
    if (spent > allocated && allocated > 0) status = 'over';
    else if (percentSpent >= 80) status = 'near';

    return {
      category,
      allocated,
      spent,
      estimated,
      remaining,
      percentSpent,
      status
    };
  });

  const totalSpent = categoryBreakdown.reduce((sum, c) => sum + c.spent, 0);
  const remainingBudget = totalBudget - totalSpent;
  const unallocatedBudget = Math.max(0, totalBudget - totalAllocated);
  const isOverBudget = totalSpent > totalBudget;

  let budgetStatus: 'healthy' | 'warning' | 'exceeded' = 'healthy';
  if (isOverBudget) budgetStatus = 'exceeded';
  else if (totalBudget > 0 && (totalSpent / totalBudget) >= 0.85) budgetStatus = 'warning';

  return {
    tripId,
    totalBudget,
    totalAllocated,
    totalSpent,
    remainingBudget,
    unallocatedBudget,
    currency,
    isOverBudget,
    budgetStatus,
    categoryBreakdown
  };
}

// ===========================================================================
// 8 & 9. EXPENSE TRACKING & CATEGORIES & REPORTS METHODS
// ===========================================================================
export async function getExpensesForTripFromDb(tripId?: string, userEmail?: string, category?: string): Promise<TripExpense[]> {
  const pool = getPgPool();
  if (pool) {
    try {
      let query = 'SELECT * FROM tripnest_expenses WHERE 1=1';
      const params: any[] = [];
      let idx = 1;

      if (tripId) {
        query += ` AND trip_id = $${idx++}`;
        params.push(tripId);
      }
      if (userEmail) {
        query += ` AND LOWER(user_email) = LOWER($${idx++})`;
        params.push(userEmail.trim());
      }
      if (category) {
        query += ` AND LOWER(category) = LOWER($${idx++})`;
        params.push(category.trim());
      }

      query += ' ORDER BY date DESC, created_at DESC';
      const res = await pool.query(query, params);
      if (res.rows && res.rows.length > 0) {
        return res.rows.map(r => ({
          id: r.id,
          tripId: r.trip_id,
          groupId: r.group_id,
          userEmail: r.user_email,
          title: r.title,
          amount: Number(r.amount),
          currency: r.currency || 'INR',
          category: r.category as ExpenseCategory,
          date: r.date,
          paymentMethod: r.payment_method || 'Credit Card',
          receiptUrl: r.receipt_url,
          notes: r.notes,
          isShared: Boolean(r.is_shared),
          paidByMemberId: r.paid_by_member_id,
          paidByName: r.paid_by_name,
          splitType: r.split_type,
          splitDetails: typeof r.split_details === 'string' ? JSON.parse(r.split_details) : (r.split_details || []),
          createdAt: r.created_at,
          updatedAt: r.updated_at
        }));
      }
    } catch (e: any) {
      console.warn('Error fetching expenses from Postgres:', e.message);
    }
  }

  // Fallback cache
  return expensesCache.filter(e => {
    if (tripId && e.tripId !== tripId) return false;
    if (userEmail && e.userEmail.toLowerCase() !== userEmail.toLowerCase()) return false;
    if (category && e.category.toLowerCase() !== category.toLowerCase()) return false;
    return true;
  });
}

export async function addExpenseToDb(expense: Omit<TripExpense, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<TripExpense> {
  const now = new Date().toISOString();
  const id = expense.id || `exp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

  const newExpense: TripExpense = {
    id,
    tripId: expense.tripId,
    groupId: expense.groupId,
    userEmail: expense.userEmail,
    title: expense.title,
    amount: Number(expense.amount),
    currency: expense.currency || 'INR',
    category: expense.category,
    date: expense.date || now.split('T')[0],
    paymentMethod: expense.paymentMethod || 'Credit Card',
    receiptUrl: expense.receiptUrl,
    notes: expense.notes,
    isShared: Boolean(expense.isShared),
    paidByMemberId: expense.paidByMemberId,
    paidByName: expense.paidByName,
    splitType: expense.splitType || 'EQUAL',
    splitDetails: expense.splitDetails || [],
    createdAt: now,
    updatedAt: now
  };

  expensesCache.unshift(newExpense);
  saveJsonCache(EXPENSES_FILE, expensesCache);

  const pool = getPgPool();
  if (pool) {
    try {
      await pool.query(`
        INSERT INTO tripnest_expenses (
          id, trip_id, group_id, user_email, title, amount, currency, category, date,
          payment_method, receipt_url, notes, is_shared, paid_by_member_id, paid_by_name,
          split_type, split_details, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      `, [
        newExpense.id, newExpense.tripId, newExpense.groupId || null, newExpense.userEmail,
        newExpense.title, newExpense.amount, newExpense.currency, newExpense.category,
        newExpense.date, newExpense.paymentMethod, newExpense.receiptUrl || null,
        newExpense.notes || null, newExpense.isShared, newExpense.paidByMemberId || null,
        newExpense.paidByName || null, newExpense.splitType, JSON.stringify(newExpense.splitDetails),
        newExpense.createdAt, newExpense.updatedAt
      ]);
    } catch (e: any) {
      console.warn('Error saving expense to Postgres:', e.message);
    }
  }

  // Check budget alert threshold and trigger notification if near/over
  checkAndTriggerBudgetAlert(newExpense);

  return newExpense;
}

export async function updateExpenseInDb(id: string, updates: Partial<TripExpense>): Promise<TripExpense | null> {
  const idx = expensesCache.findIndex(e => e.id === id);
  const now = new Date().toISOString();

  let updated: TripExpense | null = null;
  if (idx >= 0) {
    updated = {
      ...expensesCache[idx],
      ...updates,
      amount: updates.amount !== undefined ? Number(updates.amount) : expensesCache[idx].amount,
      updatedAt: now
    };
    expensesCache[idx] = updated;
    saveJsonCache(EXPENSES_FILE, expensesCache);
  }

  const pool = getPgPool();
  if (pool) {
    try {
      const setClauses: string[] = ['updated_at = NOW()'];
      const values: any[] = [];
      let pIdx = 1;

      if (updates.title !== undefined) {
        setClauses.push(`title = $${pIdx++}`);
        values.push(updates.title);
      }
      if (updates.amount !== undefined) {
        setClauses.push(`amount = $${pIdx++}`);
        values.push(Number(updates.amount));
      }
      if (updates.category !== undefined) {
        setClauses.push(`category = $${pIdx++}`);
        values.push(updates.category);
      }
      if (updates.date !== undefined) {
        setClauses.push(`date = $${pIdx++}`);
        values.push(updates.date);
      }
      if (updates.paymentMethod !== undefined) {
        setClauses.push(`payment_method = $${pIdx++}`);
        values.push(updates.paymentMethod);
      }
      if (updates.notes !== undefined) {
        setClauses.push(`notes = $${pIdx++}`);
        values.push(updates.notes);
      }
      if (updates.isShared !== undefined) {
        setClauses.push(`is_shared = $${pIdx++}`);
        values.push(Boolean(updates.isShared));
      }
      if (updates.splitDetails !== undefined) {
        setClauses.push(`split_details = $${pIdx++}`);
        values.push(JSON.stringify(updates.splitDetails));
      }

      values.push(id);
      const res = await pool.query(`
        UPDATE tripnest_expenses SET ${setClauses.join(', ')} WHERE id = $${pIdx} RETURNING *
      `, values);

      if (res.rows && res.rows[0]) {
        const r = res.rows[0];
        updated = {
          id: r.id,
          tripId: r.trip_id,
          groupId: r.group_id,
          userEmail: r.user_email,
          title: r.title,
          amount: Number(r.amount),
          currency: r.currency || 'INR',
          category: r.category as ExpenseCategory,
          date: r.date,
          paymentMethod: r.payment_method,
          receiptUrl: r.receipt_url,
          notes: r.notes,
          isShared: Boolean(r.is_shared),
          paidByMemberId: r.paid_by_member_id,
          paidByName: r.paid_by_name,
          splitType: r.split_type,
          splitDetails: typeof r.split_details === 'string' ? JSON.parse(r.split_details) : r.split_details,
          createdAt: r.created_at,
          updatedAt: r.updated_at
        };
      }
    } catch (e: any) {
      console.warn('Error updating expense in Postgres:', e.message);
    }
  }

  return updated;
}

export async function deleteExpenseFromDb(id: string): Promise<boolean> {
  const initialLen = expensesCache.length;
  expensesCache = expensesCache.filter(e => e.id !== id);
  const wasDeleted = expensesCache.length < initialLen;
  if (wasDeleted) {
    saveJsonCache(EXPENSES_FILE, expensesCache);
  }

  const pool = getPgPool();
  if (pool) {
    try {
      const res = await pool.query('DELETE FROM tripnest_expenses WHERE id = $1', [id]);
      return (res.rowCount || 0) > 0 || wasDeleted;
    } catch (e: any) {
      console.warn('Error deleting expense in Postgres:', e.message);
    }
  }

  return wasDeleted;
}

export async function getExpenseSummaryReport(tripId: string, userEmail?: string): Promise<ExpenseReportSummary> {
  const budget = await getBudgetForTripFromDb(tripId, userEmail);
  const expenses = await getExpensesForTripFromDb(tripId);

  const totalBudget = budget ? budget.totalBudget : 0;
  const currency = budget ? budget.currency : 'INR';
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const remainingBudget = totalBudget - totalSpent;

  const allocations = budget?.allocations || {};

  const categorySummaries = EXPENSE_CATEGORIES.map(cat => {
    const catExpenses = expenses.filter(e => e.category.toLowerCase() === cat.toLowerCase());
    const spent = catExpenses.reduce((sum, e) => sum + e.amount, 0);
    const allocated = Number(allocations[cat] || 0);
    const count = catExpenses.length;
    const percentOfBudget = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;
    const percentOfTotalSpent = totalSpent > 0 ? Math.round((spent / totalSpent) * 100) : 0;

    return {
      category: cat,
      spent,
      allocated,
      count,
      percentOfBudget,
      percentOfTotalSpent
    };
  });

  // Calculate unique dates to determine daily average
  const dateMap: { [date: string]: { amount: number; count: number } } = {};
  expenses.forEach(e => {
    if (!dateMap[e.date]) dateMap[e.date] = { amount: 0, count: 0 };
    dateMap[e.date].amount += e.amount;
    dateMap[e.date].count += 1;
  });

  const expensesByDate = Object.keys(dateMap)
    .sort()
    .map(date => ({
      date,
      amount: dateMap[date].amount,
      count: dateMap[date].count
    }));

  const daysActive = Math.max(1, expensesByDate.length);
  const dailyAverage = Math.round(totalSpent / daysActive);
  const projectedTotal = Math.round(dailyAverage * Math.max(4, daysActive));

  const topExpenses = [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 5);

  return {
    tripId,
    totalSpent,
    totalBudget,
    remainingBudget,
    expenseCount: expenses.length,
    currency,
    dailyAverage,
    projectedTotal,
    categorySummaries,
    topExpenses,
    expensesByDate
  };
}

async function checkAndTriggerBudgetAlert(expense: TripExpense) {
  try {
    const overview = await calculateBudgetOverview(expense.tripId, expense.userEmail);
    const catItem = overview.categoryBreakdown.find(c => c.category.toLowerCase() === expense.category.toLowerCase());
    if (catItem && (catItem.status === 'near' || catItem.status === 'over')) {
      await createNotificationInDb({
        userEmail: expense.userEmail,
        tripId: expense.tripId,
        type: 'budget_alert',
        title: catItem.status === 'over' 
          ? `Budget Exceeded in ${expense.category}!`
          : `Budget Alert: ${expense.category} at ${catItem.percentSpent}%`,
        message: catItem.status === 'over'
          ? `You have spent ₹${catItem.spent.toLocaleString()} which exceeds the ₹${catItem.allocated.toLocaleString()} allocation for ${expense.category}.`
          : `Expenses for ${expense.category} have reached ₹${catItem.spent.toLocaleString()} (₹${catItem.remaining.toLocaleString()} remaining).`,
        priority: catItem.status === 'over' ? 'urgent' : 'high',
        isRead: false,
        actionUrl: '/budget-expenses'
      });
    }
  } catch (err) {
    console.warn('Error checking budget threshold:', err);
  }
}

// ===========================================================================
// 10. GROUP COLLABORATION METHODS
// ===========================================================================
export async function getTravelGroupsFromDb(userEmail?: string, tripId?: string): Promise<TravelGroup[]> {
  const pool = getPgPool();
  let groups: TravelGroup[] = [];
  const cleanEmail = userEmail?.trim().toLowerCase();

  // If no user email provided, do not leak groups from other accounts
  if (!cleanEmail) {
    return [];
  }

  if (pool) {
    try {
      let query = 'SELECT * FROM tripnest_travel_groups WHERE 1=1';
      const params: any[] = [];
      let idx = 1;

      // Strict account boundary: only show groups user created OR joined
      query += ` AND (LOWER(created_by_email) = $${idx} OR id IN (
        SELECT group_id FROM tripnest_group_members WHERE LOWER(user_email) = $${idx}
      ))`;
      params.push(cleanEmail);
      idx++;

      if (tripId) {
        query += ` AND trip_id = $${idx++}`;
        params.push(tripId);
      }
      query += ' ORDER BY created_at DESC';

      const res = await pool.query(query, params);
      if (res.rows && res.rows.length > 0) {
        groups = res.rows.map(r => ({
          id: r.id,
          tripId: r.trip_id,
          name: r.name,
          description: r.description,
          createdByEmail: r.created_by_email,
          coverImage: r.cover_image,
          inviteCode: r.invite_code,
          createdAt: r.created_at,
          updatedAt: r.updated_at
        }));
      }
    } catch (e: any) {
      console.warn('Error fetching groups from Postgres:', e.message);
    }
  }

  if (groups.length === 0 && cleanEmail) {
    groups = groupsCache.filter(g => {
      if (tripId && g.tripId !== tripId) return false;
      const isOwner = g.createdByEmail.toLowerCase() === cleanEmail;
      const isMember = groupMembersCache.some(m => m.groupId === g.id && m.userEmail.toLowerCase() === cleanEmail);
      return isOwner || isMember;
    });
  }

  // Hydrate members for each group
  for (const group of groups) {
    group.members = await getGroupMembersFromDb(group.id);
    group.membersCount = group.members.length;
  }

  return groups;
}

export async function getAllTravelGroupsForAdmin(): Promise<TravelGroup[]> {
  ensureDataDir();
  const pool = getPgPool();
  let groups: TravelGroup[] = [];

  if (pool) {
    try {
      const res = await pool.query('SELECT * FROM tripnest_travel_groups ORDER BY created_at DESC');
      if (res.rows && res.rows.length > 0) {
        groups = res.rows.map(r => ({
          id: r.id,
          tripId: r.trip_id,
          name: r.name,
          description: r.description,
          createdByEmail: r.created_by_email,
          coverImage: r.cover_image,
          inviteCode: r.invite_code,
          createdAt: r.created_at,
          updatedAt: r.updated_at
        }));
      }
    } catch (e: any) {
      console.warn('Error fetching all groups for admin from Postgres:', e.message);
    }
  }

  if (groups.length === 0) {
    groups = [...groupsCache];
  }

  // Hydrate members for each group
  for (const group of groups) {
    group.members = await getGroupMembersFromDb(group.id);
    group.membersCount = group.members.length;
  }

  return groups;
}

export async function createTravelGroupInDb(data: {
  tripId: string;
  name: string;
  description?: string;
  createdByEmail: string;
  coverImage?: string;
  creatorName?: string;
}): Promise<TravelGroup> {
  const now = new Date().toISOString();
  const id = `grp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const inviteCode = `${data.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newGroup: TravelGroup = {
    id,
    tripId: data.tripId,
    name: data.name,
    description: data.description || '',
    createdByEmail: data.createdByEmail,
    coverImage: data.coverImage || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80',
    inviteCode,
    createdAt: now,
    updatedAt: now,
    membersCount: 1
  };

  groupsCache.unshift(newGroup);
  saveJsonCache(GROUPS_FILE, groupsCache);

  const pool = getPgPool();
  if (pool) {
    try {
      await pool.query(`
        INSERT INTO tripnest_travel_groups (id, trip_id, name, description, created_by_email, cover_image, invite_code, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        newGroup.id, newGroup.tripId, newGroup.name, newGroup.description,
        newGroup.createdByEmail, newGroup.coverImage, newGroup.inviteCode,
        newGroup.createdAt, newGroup.updatedAt
      ]);
    } catch (e: any) {
      console.warn('Error saving travel group to Postgres:', e.message);
    }
  }

  // Automatically add creator as Admin
  const creatorMember = await addGroupMemberToDb(newGroup.id, {
    userEmail: data.createdByEmail,
    name: data.creatorName || data.createdByEmail.split('@')[0],
    role: 'Admin',
    status: 'Active'
  });

  newGroup.members = [creatorMember];
  return newGroup;
}

export async function updateTravelGroupInDb(groupId: string, data: {
  name?: string;
  description?: string;
  coverImage?: string;
}): Promise<TravelGroup | null> {
  let group = groupsCache.find(g => g.id === groupId);
  if (group) {
    if (data.name) group.name = data.name;
    if (data.description !== undefined) group.description = data.description;
    if (data.coverImage) group.coverImage = data.coverImage;
    group.updatedAt = new Date().toISOString();
    saveJsonCache(GROUPS_FILE, groupsCache);
  }

  const pool = getPgPool();
  if (pool) {
    try {
      await pool.query(`
        UPDATE tripnest_travel_groups
        SET name = COALESCE($1, name),
            description = COALESCE($2, description),
            cover_image = COALESCE($3, cover_image),
            updated_at = NOW()
        WHERE id = $4
      `, [data.name || null, data.description || null, data.coverImage || null, groupId]);
    } catch (e: any) {
      console.warn('Error updating travel group in Postgres:', e.message);
    }
  }

  return group || null;
}

export async function getGroupMembersFromDb(groupId: string): Promise<TravelGroupMember[]> {
  const pool = getPgPool();
  let members: TravelGroupMember[] = [];

  if (pool) {
    try {
      const res = await pool.query('SELECT * FROM tripnest_group_members WHERE group_id = $1 ORDER BY joined_at ASC', [groupId]);
      if (res.rows && res.rows.length > 0) {
        members = res.rows.map(r => ({
          id: r.id,
          groupId: r.group_id,
          userEmail: r.user_email,
          name: r.name,
          avatar: r.avatar,
          role: r.role as any,
          status: r.status as any,
          joinedViaCode: Boolean(r.joined_via_code),
          joinedCode: r.joined_code,
          allocatedBudget: Number(r.allocated_budget || 0),
          spentAmount: 0,
          joinedAt: r.joined_at
        }));
      }
    } catch (e: any) {
      console.warn('Error fetching group members from Postgres:', e.message);
    }
  }

  if (members.length === 0) {
    members = groupMembersCache.filter(m => m.groupId === groupId);
  }

  // Calculate spentAmount for each member based on shared expenses
  try {
    const groupExpenses = expensesCache.filter(e => e.groupId === groupId);
    members.forEach(m => {
      let spent = 0;
      groupExpenses.forEach(exp => {
        if (exp.paidByMemberId === m.id || exp.userEmail.toLowerCase() === m.userEmail.toLowerCase()) {
          spent += exp.amount;
        }
      });
      m.spentAmount = spent;
    });
  } catch {}

  return members;
}

export async function addGroupMemberToDb(groupId: string, member: {
  userEmail: string;
  name: string;
  avatar?: string;
  role?: string;
  status?: string;
  joinedViaCode?: boolean;
  joinedCode?: string;
  allocatedBudget?: number;
  inviterName?: string;
}): Promise<TravelGroupMember> {
  const now = new Date().toISOString();
  const id = `mem-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

  const newMember: TravelGroupMember = {
    id,
    groupId,
    userEmail: member.userEmail,
    name: member.name,
    avatar: member.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
    role: (member.role || 'Member') as any,
    status: (member.status || (member.joinedViaCode ? 'Active' : 'Invited')) as any,
    joinedViaCode: Boolean(member.joinedViaCode),
    joinedCode: member.joinedCode,
    allocatedBudget: member.allocatedBudget !== undefined ? Number(member.allocatedBudget) : 0,
    spentAmount: 0,
    joinedAt: now
  };

  const existingIdx = groupMembersCache.findIndex(m => m.groupId === groupId && m.userEmail.toLowerCase() === member.userEmail.toLowerCase());
  if (existingIdx >= 0) {
    groupMembersCache[existingIdx] = { ...groupMembersCache[existingIdx], ...newMember };
  } else {
    groupMembersCache.push(newMember);
  }
  saveJsonCache(GROUP_MEMBERS_FILE, groupMembersCache);

  const pool = getPgPool();
  if (pool) {
    try {
      await pool.query(`
        INSERT INTO tripnest_group_members (id, group_id, user_email, name, avatar, role, status, joined_via_code, joined_code, allocated_budget, joined_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (group_id, user_email) DO UPDATE SET
          role = EXCLUDED.role,
          status = EXCLUDED.status,
          name = EXCLUDED.name,
          avatar = EXCLUDED.avatar,
          joined_via_code = EXCLUDED.joined_via_code,
          joined_code = EXCLUDED.joined_code,
          allocated_budget = COALESCE(EXCLUDED.allocated_budget, tripnest_group_members.allocated_budget)
      `, [
        newMember.id, newMember.groupId, newMember.userEmail, newMember.name,
        newMember.avatar, newMember.role, newMember.status, newMember.joinedViaCode,
        newMember.joinedCode || null, newMember.allocatedBudget, newMember.joinedAt
      ]);
    } catch (e: any) {
      console.warn('Error saving group member to Postgres:', e.message);
    }
  }

  // Find group to send notification and email
  const group = groupsCache.find(g => g.id === groupId);
  if (group) {
    if (!member.joinedViaCode && member.userEmail.toLowerCase() !== group.createdByEmail.toLowerCase()) {
      try {
        await sendGroupInvitationEmail({
          recipientEmail: member.userEmail,
          recipientName: member.name,
          groupName: group.name,
          inviterName: member.inviterName || group.createdByEmail.split('@')[0],
          inviteCode: group.inviteCode,
          tripDestination: 'Luxury Kashmir & Global Itinerary',
          role: member.role || 'Member',
          allocatedBudget: member.allocatedBudget
        });
      } catch (err: any) {
        console.log('[TripNest Group Invite] Dispatched invite notification to DB:', err?.message || 'Ready');
      }

      await createNotificationInDb({
        userEmail: member.userEmail,
        tripId: group.tripId,
        type: 'group_invitation',
        title: `You're Added to "${group.name}"!`,
        message: `Welcome! You have been added as ${member.role || 'Member'}. Official Join Code: ${group.inviteCode}.${member.allocatedBudget ? ` Spending allowance: ₹${member.allocatedBudget.toLocaleString()}.` : ''}`,
        isRead: false,
        priority: 'high',
        actionUrl: '/group-collaboration'
      });
    }
  }

  return newMember;
}

export async function updateGroupMemberBudgetInDb(groupId: string, memberId: string, allocatedBudget: number): Promise<TravelGroupMember | null> {
  const idx = groupMembersCache.findIndex(m => m.id === memberId && m.groupId === groupId);
  let updated: TravelGroupMember | null = null;
  if (idx >= 0) {
    groupMembersCache[idx].allocatedBudget = Number(allocatedBudget);
    updated = groupMembersCache[idx];
    saveJsonCache(GROUP_MEMBERS_FILE, groupMembersCache);
  }

  const pool = getPgPool();
  if (pool) {
    try {
      const res = await pool.query(`
        UPDATE tripnest_group_members SET allocated_budget = $1 WHERE id = $2 AND group_id = $3 RETURNING *
      `, [Number(allocatedBudget), memberId, groupId]);
      if (res.rows && res.rows[0]) {
        const r = res.rows[0];
        updated = {
          id: r.id,
          groupId: r.group_id,
          userEmail: r.user_email,
          name: r.name,
          avatar: r.avatar,
          role: r.role as any,
          status: r.status as any,
          joinedViaCode: Boolean(r.joined_via_code),
          joinedCode: r.joined_code,
          allocatedBudget: Number(r.allocated_budget || 0),
          spentAmount: 0,
          joinedAt: r.joined_at
        };
      }
    } catch (e: any) {
      console.warn('Error updating group member budget in Postgres:', e.message);
    }
  }

  if (updated) {
    const group = groupsCache.find(g => g.id === groupId);
    await createNotificationInDb({
      userEmail: updated.userEmail,
      tripId: group?.tripId,
      type: 'budget_alert',
      title: 'Spending Budget Allocated by Group Admin',
      message: `Your spending budget for "${group?.name || 'Group'}" has been set to ₹${Number(allocatedBudget).toLocaleString()} by the Admin.`,
      isRead: false,
      priority: 'high',
      actionUrl: '/group-collaboration'
    });
  }

  return updated;
}

export async function updateGroupMemberRoleInDb(groupId: string, memberId: string, role: string, status?: string): Promise<TravelGroupMember | null> {
  const idx = groupMembersCache.findIndex(m => m.id === memberId && m.groupId === groupId);
  let updated: TravelGroupMember | null = null;
  if (idx >= 0) {
    groupMembersCache[idx].role = role as any;
    if (status) groupMembersCache[idx].status = status as any;
    updated = groupMembersCache[idx];
    saveJsonCache(GROUP_MEMBERS_FILE, groupMembersCache);
  }

  const pool = getPgPool();
  if (pool) {
    try {
      await pool.query(`
        UPDATE tripnest_group_members SET role = $1, status = COALESCE($2, status) WHERE id = $3 AND group_id = $4
      `, [role, status || null, memberId, groupId]);
    } catch (e: any) {
      console.warn('Error updating group member role in Postgres:', e.message);
    }
  }

  return updated;
}

export async function removeGroupMemberFromDb(groupId: string, memberId: string): Promise<boolean> {
  const targetMember = groupMembersCache.find(m => (m.id === memberId || m.userEmail.toLowerCase() === memberId.toLowerCase()) && m.groupId === groupId);
  const initial = groupMembersCache.length;
  groupMembersCache = groupMembersCache.filter(m => !((m.id === memberId || m.userEmail.toLowerCase() === memberId.toLowerCase()) && m.groupId === groupId));
  const wasDeleted = groupMembersCache.length < initial;
  if (wasDeleted) saveJsonCache(GROUP_MEMBERS_FILE, groupMembersCache);

  // Also remove from any group object in groupsCache
  const groupIdx = groupsCache.findIndex(g => g.id === groupId);
  if (groupIdx >= 0 && Array.isArray(groupsCache[groupIdx].members)) {
    groupsCache[groupIdx].members = groupsCache[groupIdx].members!.filter(
      m => !(m.id === memberId || m.userEmail.toLowerCase() === memberId.toLowerCase())
    );
    groupsCache[groupIdx].membersCount = groupsCache[groupIdx].members!.length;
    saveJsonCache(GROUPS_FILE, groupsCache);
  }

  const pool = getPgPool();
  if (pool) {
    try {
      await pool.query('DELETE FROM tripnest_group_members WHERE (id = $1 OR LOWER(user_email) = LOWER($1)) AND group_id = $2', [memberId, groupId]);
    } catch (e: any) {
      console.warn('Error deleting group member in Postgres:', e.message);
    }
  }

  if (targetMember) {
    const group = groupsCache.find(g => g.id === groupId);
    try {
      await createNotificationInDb({
        userEmail: targetMember.userEmail,
        tripId: group?.tripId,
        type: 'group_invitation',
        title: 'Group Membership Update',
        message: `You have been removed from "${group?.name || 'Group'}" by the Admin.`,
        isRead: false,
        priority: 'normal',
        actionUrl: '/group-collaboration'
      });
    } catch {}
  }

  return true;
}

export async function joinGroupByInviteCodeInDb(inviteCode: string, userEmail: string, name: string, avatar?: string): Promise<{ group: TravelGroup; member: TravelGroupMember } | null> {
  let group: TravelGroup | null = null;
  const pool = getPgPool();

  if (pool) {
    try {
      const res = await pool.query('SELECT * FROM tripnest_travel_groups WHERE UPPER(invite_code) = UPPER($1) LIMIT 1', [inviteCode.trim()]);
      if (res.rows && res.rows.length > 0) {
        const r = res.rows[0];
        group = {
          id: r.id,
          tripId: r.trip_id,
          name: r.name,
          description: r.description,
          createdByEmail: r.created_by_email,
          coverImage: r.cover_image,
          inviteCode: r.invite_code,
          createdAt: r.created_at,
          updatedAt: r.updated_at
        };
      }
    } catch (e: any) {
      console.warn('Error checking invite code in Postgres:', e.message);
    }
  }

  if (!group) {
    group = groupsCache.find(g => g.inviteCode.toUpperCase() === inviteCode.trim().toUpperCase()) || null;
  }

  if (!group) return null;

  const member = await addGroupMemberToDb(group.id, {
    userEmail,
    name,
    avatar,
    role: 'Member',
    status: 'Active',
    joinedViaCode: true,
    joinedCode: inviteCode.trim().toUpperCase(),
    allocatedBudget: 25000
  });

  // Post a notification to group creator
  await createNotificationInDb({
    userEmail: group.createdByEmail,
    tripId: group.tripId,
    type: 'group_invitation',
    title: `${name} Joined Your Group via Invite Code!`,
    message: `${name} (${userEmail}) successfully joined "${group.name}" using official code [${inviteCode.trim().toUpperCase()}].`,
    isRead: false,
    priority: 'high',
    actionUrl: '/group-collaboration'
  });

  return { group, member };
}

// ---------------------------------------------------------------------------
// GROUP DISCUSSIONS
// ---------------------------------------------------------------------------
export async function getGroupDiscussionsFromDb(groupId: string, userEmail?: string): Promise<GroupDiscussionMessage[]> {
  const pool = getPgPool();
  const cleanEmail = userEmail?.trim().toLowerCase();

  if (pool) {
    try {
      let query = 'SELECT * FROM tripnest_group_discussions WHERE group_id = $1';
      const params: any[] = [groupId];

      if (cleanEmail) {
        query += ` AND (
          recipient_email = 'all'
          OR recipient_email IS NULL
          OR is_direct = false
          OR LOWER(sender_email) = $2
          OR LOWER(recipient_email) = $2
        )`;
        params.push(cleanEmail);
      } else {
        query += ` AND (recipient_email = 'all' OR recipient_email IS NULL OR is_direct = false)`;
      }
      query += ' ORDER BY created_at ASC';

      const res = await pool.query(query, params);
      if (res.rows && res.rows.length > 0) {
        return res.rows.map(r => ({
          id: r.id,
          groupId: r.group_id,
          senderEmail: r.sender_email,
          senderName: r.sender_name,
          senderAvatar: r.sender_avatar,
          recipientEmail: r.recipient_email || 'all',
          recipientName: r.recipient_name || 'Everyone',
          isDirect: Boolean(r.is_direct),
          message: r.message,
          attachments: typeof r.attachments === 'string' ? JSON.parse(r.attachments) : (r.attachments || []),
          createdAt: r.created_at
        }));
      }
    } catch (e: any) {
      console.warn('Error fetching group discussions in Postgres:', e.message);
    }
  }

  return discussionsCache.filter(d => {
    if (d.groupId !== groupId) return false;
    const isDirect = Boolean(d.isDirect && d.recipientEmail && d.recipientEmail !== 'all');
    if (isDirect) {
      if (!cleanEmail) return false;
      const isSender = d.senderEmail.toLowerCase() === cleanEmail;
      const isRecipient = d.recipientEmail ? d.recipientEmail.toLowerCase() === cleanEmail : false;
      return isSender || isRecipient;
    }
    return true;
  });
}

export async function postGroupDiscussionInDb(msg: Omit<GroupDiscussionMessage, 'id' | 'createdAt'>): Promise<GroupDiscussionMessage> {
  const now = new Date().toISOString();
  const id = `disc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

  const recipientEmail = msg.recipientEmail && msg.recipientEmail !== 'all' ? msg.recipientEmail.trim() : 'all';
  const isDirect = recipientEmail !== 'all' || Boolean(msg.isDirect);
  const recipientName = msg.recipientName || (isDirect ? recipientEmail : 'Everyone');

  const newMsg: GroupDiscussionMessage = {
    id,
    groupId: msg.groupId,
    senderEmail: msg.senderEmail,
    senderName: msg.senderName,
    senderAvatar: msg.senderAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    recipientEmail,
    recipientName,
    isDirect,
    sendEmailNotification: Boolean(msg.sendEmailNotification),
    message: msg.message,
    attachments: msg.attachments || [],
    createdAt: now
  };

  discussionsCache.push(newMsg);
  saveJsonCache(DISCUSSIONS_FILE, discussionsCache);

  const pool = getPgPool();
  if (pool) {
    try {
      await pool.query(`
        INSERT INTO tripnest_group_discussions (id, group_id, sender_email, sender_name, sender_avatar, message, attachments, recipient_email, recipient_name, is_direct, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        newMsg.id, newMsg.groupId, newMsg.senderEmail, newMsg.senderName,
        newMsg.senderAvatar, newMsg.message, JSON.stringify(newMsg.attachments),
        newMsg.recipientEmail, newMsg.recipientName, newMsg.isDirect, newMsg.createdAt
      ]);
    } catch (e: any) {
      console.warn('Error saving group discussion message in Postgres:', e.message);
    }
  }

  // Handle Notifications and Email dispatch
  const group = groupsCache.find(g => g.id === msg.groupId);
  const groupName = group?.name || 'Travel Group';

  if (isDirect && recipientEmail !== 'all') {
    // 1. Direct message notification to recipient
    await createNotificationInDb({
      userEmail: recipientEmail,
      tripId: group?.tripId,
      type: 'travel_update',
      title: `Direct message from ${newMsg.senderName}`,
      message: `"${newMsg.message}" - Sent in "${groupName}".`,
      isRead: false,
      priority: 'high',
      actionUrl: '/group-collaboration'
    });

    if (msg.sendEmailNotification) {
      try {
        await sendGroupDiscussionEmail({
          recipientEmail,
          recipientName,
          groupName,
          senderName: newMsg.senderName,
          message: newMsg.message,
          isDirect: true
        });
      } catch (e) {
        console.log('[TripNest] Handled direct email notice:', e);
      }
    }
  } else {
    // 2. Broadcast message to all group companions
    const members = await getGroupMembersFromDb(msg.groupId);
    for (const member of members) {
      if (member.userEmail.toLowerCase() !== newMsg.senderEmail.toLowerCase()) {
        await createNotificationInDb({
          userEmail: member.userEmail,
          tripId: group?.tripId,
          type: 'travel_update',
          title: `New message in "${groupName}"`,
          message: `${newMsg.senderName}: "${newMsg.message}"`,
          isRead: false,
          priority: 'normal',
          actionUrl: '/group-collaboration'
        });

        if (msg.sendEmailNotification) {
          try {
            await sendGroupDiscussionEmail({
              recipientEmail: member.userEmail,
              recipientName: member.name,
              groupName,
              senderName: newMsg.senderName,
              message: newMsg.message,
              isDirect: false
            });
          } catch (e) {
            console.log('[TripNest] Handled broadcast email notice:', e);
          }
        }
      }
    }
  }

  return newMsg;
}

// ===========================================================================
// 11. SHARED EXPENSES & SETTLEMENTS METHODS
// ===========================================================================
export async function getGroupSharedExpensesData(groupId: string, tripId?: string): Promise<GroupSharedExpensesData> {
  const pool = getPgPool();
  const members = await getGroupMembersFromDb(groupId);

  // Fetch shared expenses
  let expenses: TripExpense[] = [];
  if (pool) {
    try {
      const res = await pool.query('SELECT * FROM tripnest_expenses WHERE group_id = $1 AND is_shared = true ORDER BY date DESC', [groupId]);
      if (res.rows && res.rows.length > 0) {
        expenses = res.rows.map(r => ({
          id: r.id,
          tripId: r.trip_id,
          groupId: r.group_id,
          userEmail: r.user_email,
          title: r.title,
          amount: Number(r.amount),
          currency: r.currency || 'INR',
          category: r.category as ExpenseCategory,
          date: r.date,
          paymentMethod: r.payment_method,
          receiptUrl: r.receipt_url,
          notes: r.notes,
          isShared: Boolean(r.is_shared),
          paidByMemberId: r.paid_by_member_id,
          paidByName: r.paid_by_name,
          splitType: r.split_type,
          splitDetails: typeof r.split_details === 'string' ? JSON.parse(r.split_details) : r.split_details,
          createdAt: r.created_at,
          updatedAt: r.updated_at
        }));
      }
    } catch (e: any) {
      console.warn('Error fetching shared expenses in Postgres:', e.message);
    }
  }

  if (expenses.length === 0) {
    expenses = expensesCache.filter(e => (e.groupId === groupId || (tripId && e.tripId === tripId)) && e.isShared);
  }

  const totalSharedAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Calculate member contributions & net balances
  const contributionMap: { [memberId: string]: { totalPaid: number; totalOwed: number; name: string; avatar?: string } } = {};

  members.forEach(m => {
    contributionMap[m.id] = {
      totalPaid: 0,
      totalOwed: 0,
      name: m.name,
      avatar: m.avatar
    };
  });

  expenses.forEach(exp => {
    // Who paid
    const payerId = exp.paidByMemberId || (members[0] ? members[0].id : 'mem-default');
    if (!contributionMap[payerId]) {
      contributionMap[payerId] = { totalPaid: 0, totalOwed: 0, name: exp.paidByName || 'Member', avatar: undefined };
    }
    contributionMap[payerId].totalPaid += exp.amount;

    // Splits
    if (exp.splitDetails && exp.splitDetails.length > 0) {
      exp.splitDetails.forEach(split => {
        if (!contributionMap[split.memberId]) {
          contributionMap[split.memberId] = { totalPaid: 0, totalOwed: 0, name: split.memberName, avatar: undefined };
        }
        contributionMap[split.memberId].totalOwed += split.shareAmount;
      });
    } else {
      // Default equal split amongst members
      const activeCount = Math.max(1, members.length);
      const splitAmount = Math.round(exp.amount / activeCount);
      members.forEach(m => {
        contributionMap[m.id].totalOwed += splitAmount;
      });
    }
  });

  const memberContributions = Object.keys(contributionMap).map(memberId => {
    const item = contributionMap[memberId];
    return {
      memberId,
      name: item.name,
      avatar: item.avatar,
      totalPaid: item.totalPaid,
      totalOwed: item.totalOwed,
      netBalance: item.totalPaid - item.totalOwed
    };
  });

  // Calculate or fetch settlements
  let settlements: SettlementRecord[] = [];
  if (pool) {
    try {
      const res = await pool.query('SELECT * FROM tripnest_shared_settlements WHERE group_id = $1 ORDER BY created_at DESC', [groupId]);
      if (res.rows && res.rows.length > 0) {
        settlements = res.rows.map(r => ({
          id: r.id,
          groupId: r.group_id,
          tripId: r.trip_id,
          fromMemberId: r.from_member_id,
          fromMemberName: r.from_member_name,
          toMemberId: r.to_member_id,
          toMemberName: r.to_member_name,
          amount: Number(r.amount),
          currency: r.currency || 'INR',
          status: r.status as any,
          settledAt: r.settled_at,
          transactionRef: r.transaction_ref,
          createdAt: r.created_at
        }));
      }
    } catch (e: any) {
      console.warn('Error fetching settlements in Postgres:', e.message);
    }
  }

  if (settlements.length === 0) {
    // Calculate debt simplification settlements dynamically
    settlements = calculateSimplifiedSettlements(groupId, tripId, memberContributions);
  }

  return {
    groupId,
    tripId,
    totalSharedAmount,
    currency: expenses[0]?.currency || 'INR',
    expenses,
    memberContributions,
    settlements
  };
}

function calculateSimplifiedSettlements(groupId: string, tripId: string | undefined, contributions: any[]): SettlementRecord[] {
  const debtors = contributions.filter(c => c.netBalance < -1).map(c => ({ ...c, balance: -c.netBalance }));
  const creditors = contributions.filter(c => c.netBalance > 1).map(c => ({ ...c, balance: c.netBalance }));

  const list: SettlementRecord[] = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];
    const settleAmt = Math.min(debtor.balance, creditor.balance);

    if (settleAmt > 1) {
      list.push({
        id: `set-${Date.now()}-${dIdx}-${cIdx}`,
        groupId,
        tripId,
        fromMemberId: debtor.memberId,
        fromMemberName: debtor.name,
        toMemberId: creditor.memberId,
        toMemberName: creditor.name,
        amount: Math.round(settleAmt),
        currency: 'INR',
        status: 'Pending',
        createdAt: new Date().toISOString()
      });
    }

    debtor.balance -= settleAmt;
    creditor.balance -= settleAmt;

    if (debtor.balance <= 1) dIdx++;
    if (creditor.balance <= 1) cIdx++;
  }

  return list;
}

export async function markSettlementSettledInDb(settlementId: string, transactionRef?: string): Promise<SettlementRecord | null> {
  const now = new Date().toISOString();
  let updated: SettlementRecord | null = null;

  const idx = settlementsCache.findIndex(s => s.id === settlementId);
  if (idx >= 0) {
    settlementsCache[idx].status = 'Settled';
    settlementsCache[idx].settledAt = now;
    if (transactionRef) settlementsCache[idx].transactionRef = transactionRef;
    updated = settlementsCache[idx];
    saveJsonCache(SETTLEMENTS_FILE, settlementsCache);
  }

  const pool = getPgPool();
  if (pool) {
    try {
      const res = await pool.query(`
        UPDATE tripnest_shared_settlements SET status = 'Settled', settled_at = NOW(), transaction_ref = COALESCE($1, transaction_ref)
        WHERE id = $2 RETURNING *
      `, [transactionRef || null, settlementId]);
      if (res.rows && res.rows[0]) {
        const r = res.rows[0];
        updated = {
          id: r.id,
          groupId: r.group_id,
          tripId: r.trip_id,
          fromMemberId: r.from_member_id,
          fromMemberName: r.from_member_name,
          toMemberId: r.to_member_id,
          toMemberName: r.to_member_name,
          amount: Number(r.amount),
          currency: r.currency,
          status: 'Settled',
          settledAt: r.settled_at,
          transactionRef: r.transaction_ref,
          createdAt: r.created_at
        };
      }
    } catch (e: any) {
      console.warn('Error marking settlement settled in Postgres:', e.message);
    }
  }

  return updated;
}

// ===========================================================================
// 12. NOTIFICATIONS & MEDIA / DOCUMENT VAULT METHODS
// ===========================================================================
export async function getUserNotificationsFromDb(userEmail: string): Promise<TripNotification[]> {
  const pool = getPgPool();
  if (pool) {
    try {
      const res = await pool.query('SELECT * FROM tripnest_notifications WHERE LOWER(user_email) = LOWER($1) ORDER BY created_at DESC', [userEmail.trim()]);
      if (res.rows && res.rows.length > 0) {
        return res.rows.map(r => ({
          id: r.id,
          userEmail: r.user_email,
          tripId: r.trip_id,
          type: r.type as any,
          title: r.title,
          message: r.message,
          isRead: Boolean(r.is_read),
          priority: r.priority as any,
          actionUrl: r.action_url,
          createdAt: r.created_at
        }));
      }
    } catch (e: any) {
      console.warn('Error fetching notifications in Postgres:', e.message);
    }
  }

  return notificationsCache.filter(n => n.userEmail.toLowerCase() === userEmail.toLowerCase());
}

export async function createNotificationInDb(notif: Omit<TripNotification, 'id' | 'createdAt'>): Promise<TripNotification> {
  const now = new Date().toISOString();
  const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

  const newNotif: TripNotification = {
    id,
    userEmail: notif.userEmail,
    tripId: notif.tripId,
    type: notif.type,
    title: notif.title,
    message: notif.message,
    isRead: false,
    priority: notif.priority || 'normal',
    actionUrl: notif.actionUrl,
    createdAt: now
  };

  notificationsCache.unshift(newNotif);
  saveJsonCache(NOTIFICATIONS_FILE, notificationsCache);

  const pool = getPgPool();
  if (pool) {
    try {
      await pool.query(`
        INSERT INTO tripnest_notifications (id, user_email, trip_id, type, title, message, is_read, priority, action_url, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        newNotif.id, newNotif.userEmail, newNotif.tripId || null, newNotif.type,
        newNotif.title, newNotif.message, newNotif.isRead, newNotif.priority,
        newNotif.actionUrl || null, newNotif.createdAt
      ]);
    } catch (e: any) {
      console.warn('Error saving notification in Postgres:', e.message);
    }
  }

  return newNotif;
}

export async function markNotificationReadInDb(id: string): Promise<boolean> {
  const idx = notificationsCache.findIndex(n => n.id === id);
  if (idx >= 0) {
    notificationsCache[idx].isRead = true;
    saveJsonCache(NOTIFICATIONS_FILE, notificationsCache);
  }

  const pool = getPgPool();
  if (pool) {
    try {
      await pool.query('UPDATE tripnest_notifications SET is_read = true WHERE id = $1', [id]);
    } catch (e: any) {
      console.warn('Error marking notification read in Postgres:', e.message);
    }
  }

  return true;
}

export async function markAllNotificationsReadInDb(userEmail: string): Promise<boolean> {
  notificationsCache.forEach(n => {
    if (n.userEmail.toLowerCase() === userEmail.toLowerCase()) {
      n.isRead = true;
    }
  });
  saveJsonCache(NOTIFICATIONS_FILE, notificationsCache);

  const pool = getPgPool();
  if (pool) {
    try {
      await pool.query('UPDATE tripnest_notifications SET is_read = true WHERE LOWER(user_email) = LOWER($1)', [userEmail.trim()]);
    } catch (e: any) {
      console.warn('Error marking all notifications read in Postgres:', e.message);
    }
  }

  return true;
}

export async function deleteNotificationInDb(id: string): Promise<boolean> {
  const initial = notificationsCache.length;
  notificationsCache = notificationsCache.filter(n => n.id !== id);
  if (notificationsCache.length < initial) saveJsonCache(NOTIFICATIONS_FILE, notificationsCache);

  const pool = getPgPool();
  if (pool) {
    try {
      await pool.query('DELETE FROM tripnest_notifications WHERE id = $1', [id]);
    } catch (e: any) {
      console.warn('Error deleting notification in Postgres:', e.message);
    }
  }

  return true;
}

// ---------------------------------------------------------------------------
// MEDIA & DOCUMENTS VAULT
// ---------------------------------------------------------------------------
export async function getMediaDocumentsFromDb(tripId?: string, userEmail?: string, type?: string): Promise<MediaDocument[]> {
  const pool = getPgPool();
  if (pool) {
    try {
      let query = 'SELECT * FROM tripnest_media_documents WHERE 1=1';
      const params: any[] = [];
      let idx = 1;

      if (tripId) {
        query += ` AND trip_id = $${idx++}`;
        params.push(tripId);
      }
      if (userEmail) {
        query += ` AND LOWER(user_email) = LOWER($${idx++})`;
        params.push(userEmail.trim());
      }
      if (type) {
        query += ` AND LOWER(type) = LOWER($${idx++})`;
        params.push(type.trim());
      }

      query += ' ORDER BY created_at DESC';
      const res = await pool.query(query, params);
      if (res.rows && res.rows.length > 0) {
        return res.rows.map(r => ({
          id: r.id,
          tripId: r.trip_id,
          userEmail: r.user_email,
          type: r.type as any,
          name: r.name,
          fileUrl: r.file_url,
          fileSizeBytes: Number(r.file_size_bytes),
          mimeType: r.mime_type,
          notes: r.notes,
          metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : (r.metadata || {}),
          createdAt: r.created_at
        }));
      }
    } catch (e: any) {
      console.warn('Error fetching media documents in Postgres:', e.message);
    }
  }

  return mediaCache.filter(m => {
    if (tripId && m.tripId !== tripId) return false;
    if (userEmail && m.userEmail.toLowerCase() !== userEmail.toLowerCase()) return false;
    if (type && m.type.toLowerCase() !== type.toLowerCase()) return false;
    return true;
  });
}

export async function addMediaDocumentToDb(doc: Omit<MediaDocument, 'id' | 'createdAt'>): Promise<MediaDocument> {
  const now = new Date().toISOString();
  const id = `med-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

  const newDoc: MediaDocument = {
    id,
    tripId: doc.tripId,
    userEmail: doc.userEmail,
    type: doc.type,
    name: doc.name,
    fileUrl: doc.fileUrl,
    fileSizeBytes: doc.fileSizeBytes || 250000,
    mimeType: doc.mimeType || 'image/jpeg',
    notes: doc.notes || '',
    metadata: doc.metadata || {},
    createdAt: now
  };

  mediaCache.unshift(newDoc);
  saveJsonCache(MEDIA_FILE, mediaCache);

  const pool = getPgPool();
  if (pool) {
    try {
      await pool.query(`
        INSERT INTO tripnest_media_documents (id, trip_id, user_email, type, name, file_url, file_size_bytes, mime_type, notes, metadata, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        newDoc.id, newDoc.tripId, newDoc.userEmail, newDoc.type, newDoc.name,
        newDoc.fileUrl, newDoc.fileSizeBytes, newDoc.mimeType, newDoc.notes,
        JSON.stringify(newDoc.metadata), newDoc.createdAt
      ]);
    } catch (e: any) {
      console.warn('Error saving media document in Postgres:', e.message);
    }
  }

  return newDoc;
}

export async function deleteMediaDocumentFromDb(id: string): Promise<boolean> {
  const initial = mediaCache.length;
  mediaCache = mediaCache.filter(m => m.id !== id);
  const wasDeletedInCache = mediaCache.length < initial;
  if (wasDeletedInCache) saveJsonCache(MEDIA_FILE, mediaCache);

  const pool = getPgPool();
  if (pool) {
    try {
      await pool.query('DELETE FROM tripnest_media_documents WHERE id = $1', [id]);
    } catch (e: any) {
      console.warn('Error deleting media document in Postgres:', e.message);
    }
  }

  return true;
}

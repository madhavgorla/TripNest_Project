export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'INR' | 'AED' | 'JPY';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  rate: number; // relative to USD
  label: string;
}

export interface RoomTier {
  id: string;
  name: string;
  pricePerNightUsd: number;
  capacity: string;
  bedType: string;
  sizeSqFt: number;
  amenities: string[];
  description: string;
  availableCount: number;
  image: string;
}

export interface Hotel {
  id: string;
  destinationId: string;
  destinationName: string;
  name: string;
  tagline: string;
  stars: number;
  rating: number;
  reviewCount: number;
  pricePerNightUsd: number;
  address: string;
  city: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  distanceFromCenterKm: number;
  drivingTimeMin: number;
  image: string;
  gallery: string[];
  amenities: string[];
  specialty: string;
  dining: string[];
  roomTiers: RoomTier[];
  googleMapsUrl: string;
  featured?: boolean;
}

export interface DestinationAttraction {
  id: string;
  name: string;
  category: 'Iconic Landmark' | 'Scenic Nature' | 'Historic Heritage' | 'Cultural Viewpoint' | 'Sacred Temple' | 'Art & Architecture';
  description: string;
  image: string;
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  admissionFee: string;
  openingHours: string;
  insiderTip: string;
  recommendedDuration: string;
  googleMapsUrl: string;
  bestTimeToVisit?: string;
  mustDoHighlight?: string;
}

export interface SeasonWeatherInfo {
  season: string;
  months: string;
  temp: string;
  weather: string;
  recommendation: string;
}

export interface TravelGuide {
  overview: string;
  bestTimeToVisit: {
    summary: string;
    peakSeason: string;
    shoulderSeason: string;
    offPeakSeason: string;
    weatherBySeason: SeasonWeatherInfo[];
  };
  cultureAndEtiquette: {
    dressCode: string;
    customs: string[];
    tippingNorms: string;
    photographyRules: string;
    languageTips: Array<{ phrase: string; meaning: string }>;
  };
  gettingAround: {
    summary: string;
    airportTransit: string;
    publicTransit: string;
    privateChauffeur: string;
    rentalAndDriving: string;
    recommendedApps: string[];
  };
  gastronomy: {
    culinaryDescription: string;
    mustTryDishes: Array<{
      name: string;
      description: string;
      type: 'Food' | 'Drink' | 'Dessert';
      isVegetarian?: boolean;
    }>;
    iconicDiningAreas: string[];
  };
  practicalInfo: {
    currency: string;
    cardAcceptance: string;
    connectivitySim: string;
    safetyRating: string;
    safetyTips: string[];
    emergencyNumbers: {
      police: string;
      ambulance: string;
      touristHelpline?: string;
    };
    visaInfo: string;
  };
}

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  morning: string;
  afternoon: string;
  evening: string;
  includedMeals: string[];
}

export interface Destination {
  id: string;
  name: string;
  country: string;
  region: string;
  category: 'Mountain' | 'Island' | 'Nature' | 'Cultural' | 'Luxury' | 'Safari';
  heroImage: string;
  gallery: string[];
  startingPriceUsd: number;
  rating: number;
  reviewCount: number;
  temperatureC: number;
  weatherCondition: string;
  bestTimeToVisit: string;
  description: string;
  highlights: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
  sampleItinerary: ItineraryDay[];
  featured?: boolean;
  attractions?: DestinationAttraction[];
  travelGuide?: TravelGuide;
  historicalFact?: string;
  timezone?: string;
  localCurrency?: string;
  plugType?: string;
  isAiGenerated?: boolean;
}

export interface Experience {
  id: string;
  destinationId: string;
  destinationName: string;
  title: string;
  category: 'Adventure' | 'Cruise' | 'Culinary' | 'Wellness' | 'Heritage' | 'VIP';
  priceUsd: number;
  duration: string;
  rating: number;
  reviewCount: number;
  image: string;
  description: string;
  includes: string[];
  meetingPoint: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  availableSlots: string[];
  maxGroupSize: number;
  googleMapsUrl: string;
}

export interface BookingVoucher {
  id: string;
  bookingCode: string;
  type: 'hotel' | 'experience' | 'custom_package';
  itemId: string;
  itemName: string;
  destinationName: string;
  roomTierName?: string;
  checkInDate: string;
  checkOutDate?: string;
  slotTime?: string;
  guestsCount: number;
  totalPriceUsd: number;
  paidCurrency: CurrencyCode;
  paidAmount: number;
  status: 'Confirmed' | 'Pending' | 'Cancelled';
  createdAt: string;
  guestName: string;
  guestEmail: string;
  specialRequests?: string;
  image: string;
  address?: string;
}

export interface CustomPlanItem {
  id: string;
  dayNumber: number;
  timeSlot: 'Morning' | 'Afternoon' | 'Evening';
  title: string;
  location: string;
  estimatedCostUsd: number;
  notes?: string;
  category: 'Stay' | 'Activity' | 'Dining' | 'Transit';
}

export interface CustomTripPlan {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  totalBudgetUsd: number;
  items: CustomPlanItem[];
  notes: string;
}

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'model' | 'ai';
  text: string;
  timestamp: string;
  groundingSources?: Array<{ title: string; url: string }>;
  sources?: Array<{ title: string; url: string }>;
  attachedPlaces?: Array<{
    id: string;
    name: string;
    type: 'hotel' | 'destination' | 'experience';
    priceUsd: number;
    rating: number;
    image: string;
    distanceKm?: number;
    googleMapsUrl?: string;
  }>;
}

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  membershipTier: 'Champagne Gold VIP' | 'Diamond Elite' | 'Platinum Member';
  points: number;
  avatar: string;
  isEmailVerified?: boolean;
  provider?: 'local' | 'google';
  role?: 'admin' | 'traveler';
  federationDetails?: {
    provider: 'google';
    sub: string;
    email: string;
    name: string;
    picture?: string;
    linkedAt: string;
    deviceName?: string;
  };
}

export type AuthPortalMode = 'login' | 'register' | 'forgot_password';

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isGuest: boolean;
}

export interface TripTimeSlotActivity {
  id?: string;
  time: string;
  activity: string;
}

export interface TripDayItinerary {
  day: number;
  date?: string;
  title?: string;
  theme?: string;
  description: string;
  activities?: TripTimeSlotActivity[];
}

export interface CustomTrip {
  id: string;
  userEmail: string;
  title: string;
  destination: string;
  startDate?: string;
  endDate?: string;
  budgetAmount?: number;
  budgetCurrency?: string;
  travelersCount?: number;
  status?: string;
  notes?: string;
  itinerary?: TripDayItinerary[];
  coverImage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DetailedBookingRecord {
  id: string;
  bookingCode: string;
  userEmail?: string;
  guestName: string;
  guestEmail: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  membershipTier?: string;
  type: string;
  itemId: string;
  itemName: string;
  destinationName: string;
  roomTierName?: string;
  checkInDate: string;
  checkOutDate?: string;
  guestsCount: number;
  totalPriceUsd: number;
  paidCurrency: string;
  paidAmount: number;
  status: 'Confirmed' | 'Pending' | 'Cancelled' | string;
  paymentMethod?: string;
  transactionId?: string;
  specialRequests?: string;
  image?: string;
  address?: string;
  createdAt: string;
  updatedAt?: string;
  durationNights?: number;
}

export interface DbUserRecord {
  id: string;
  fullName: string;
  email: string;
  isEmailVerified?: boolean;
  membershipTier?: string;
  points?: number;
  avatar?: string;
  provider?: string;
  googleId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface RoadmapStayInfo {
  hotelId: string;
  hotelName: string;
  roomTierName: string;
  pricePerNightUsd: number;
  address: string;
  highlights: string[];
  image: string;
}

export interface RoadmapLiveInfo {
  neighborhood: string;
  vibe: string;
  morningActivity: string;
  afternoonActivity: string;
  eveningDining: string;
  highlights: string[];
}

export interface RoadmapDay {
  day: number;
  title: string;
  theme: string;
  whereToStay: RoadmapStayInfo;
  whereToLive: RoadmapLiveInfo;
  transit?: string;
  includedMeals?: string[];
}

export interface DestinationRoadmap {
  id: string;
  destinationId: string;
  destinationName: string;
  userEmail?: string;
  daysCount: number;
  title: string;
  overview: string;
  days: RoadmapDay[];
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// 7. BUDGET MANAGEMENT TYPES
// ---------------------------------------------------------------------------
export type ExpenseCategory =
  | 'Transportation'
  | 'Hotel'
  | 'Food'
  | 'Shopping'
  | 'Entertainment'
  | 'Miscellaneous';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Transportation',
  'Hotel',
  'Food',
  'Shopping',
  'Entertainment',
  'Miscellaneous'
];

export interface CategoryBudgetMap {
  Transportation?: number;
  Hotel?: number;
  Food?: number;
  Shopping?: number;
  Entertainment?: number;
  Miscellaneous?: number;
  [key: string]: number | undefined;
}

export interface TripBudget {
  id: string;
  tripId: string;
  userEmail: string;
  totalBudget: number;
  currency: string;
  allocations: CategoryBudgetMap;
  estimatedCosts?: CategoryBudgetMap;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetOverview {
  tripId: string;
  totalBudget: number;
  totalAllocated: number;
  totalSpent: number;
  remainingBudget: number;
  unallocatedBudget: number;
  currency: string;
  isOverBudget: boolean;
  budgetStatus: 'healthy' | 'warning' | 'exceeded';
  categoryBreakdown: Array<{
    category: ExpenseCategory;
    allocated: number;
    spent: number;
    estimated: number;
    remaining: number;
    percentSpent: number;
    status: 'under' | 'near' | 'over';
  }>;
}

// ---------------------------------------------------------------------------
// 8 & 9. EXPENSE TRACKING & CATEGORIES & REPORTS TYPES
// ---------------------------------------------------------------------------
export type SplitType = 'EQUAL' | 'PERCENTAGE' | 'EXACT';

export interface SplitMemberDetail {
  memberId: string;
  memberName: string;
  memberEmail?: string;
  shareAmount: number;
  percentage?: number;
  isPaid?: boolean;
}

export interface TripExpense {
  id: string;
  tripId: string;
  groupId?: string;
  userEmail: string;
  title: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  date: string;
  paymentMethod: 'Credit Card' | 'UPI' | 'Cash' | 'Debit Card' | 'Bank Transfer' | string;
  receiptUrl?: string;
  notes?: string;
  isShared?: boolean;
  paidByMemberId?: string;
  paidByName?: string;
  splitType?: SplitType;
  splitDetails?: SplitMemberDetail[];
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseReportSummary {
  tripId: string;
  totalSpent: number;
  totalBudget: number;
  remainingBudget: number;
  expenseCount: number;
  currency: string;
  dailyAverage: number;
  projectedTotal: number;
  categorySummaries: Array<{
    category: ExpenseCategory;
    spent: number;
    allocated: number;
    count: number;
    percentOfBudget: number;
    percentOfTotalSpent: number;
  }>;
  topExpenses: TripExpense[];
  expensesByDate: Array<{ date: string; amount: number; count: number }>;
}

// ---------------------------------------------------------------------------
// 10. GROUP COLLABORATION TYPES
// ---------------------------------------------------------------------------
export type GroupMemberRole = 'Admin' | 'Editor' | 'Viewer' | 'Member';
export type GroupMemberStatus = 'Active' | 'Invited' | 'Declined';

export interface TravelGroupMember {
  id: string;
  groupId: string;
  userEmail: string;
  name: string;
  avatar?: string;
  role: GroupMemberRole;
  status: GroupMemberStatus;
  joinedAt: string;
  joinedViaCode?: boolean;
  joinedCode?: string;
  allocatedBudget?: number;
  spentAmount?: number;
}

export interface TravelGroup {
  id: string;
  tripId: string;
  name: string;
  description?: string;
  createdByEmail: string;
  coverImage?: string;
  inviteCode: string;
  createdAt: string;
  updatedAt: string;
  members?: TravelGroupMember[];
  membersCount?: number;
  sharedItinerarySummary?: {
    daysCount: number;
    destination: string;
    startDate?: string;
    endDate?: string;
  };
}

export interface GroupDiscussionMessage {
  id: string;
  groupId: string;
  senderEmail: string;
  senderName: string;
  senderAvatar?: string;
  recipientEmail?: string;
  recipientName?: string;
  isDirect?: boolean;
  sendEmailNotification?: boolean;
  message: string;
  attachments?: Array<{ name: string; url: string; type: string }>;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// 11. SHARED EXPENSES & SETTLEMENTS TYPES
// ---------------------------------------------------------------------------
export interface MemberContributionSummary {
  memberId: string;
  name: string;
  avatar?: string;
  totalPaid: number;
  totalOwed: number;
  netBalance: number; // positive = should receive, negative = owes
}

export interface SettlementRecord {
  id: string;
  groupId: string;
  tripId?: string;
  fromMemberId: string;
  fromMemberName: string;
  toMemberId: string;
  toMemberName: string;
  amount: number;
  currency: string;
  status: 'Pending' | 'Settled';
  settledAt?: string;
  transactionRef?: string;
  createdAt: string;
}

export interface GroupSharedExpensesData {
  groupId: string;
  tripId?: string;
  totalSharedAmount: number;
  currency: string;
  expenses: TripExpense[];
  memberContributions: MemberContributionSummary[];
  settlements: SettlementRecord[];
}

// ---------------------------------------------------------------------------
// 12. NOTIFICATIONS & MEDIA / DOCUMENT VAULT TYPES
// ---------------------------------------------------------------------------
export type NotificationType =
  | 'reminder'
  | 'budget_alert'
  | 'group_invitation'
  | 'travel_update'
  | 'system';

export interface TripNotification {
  id: string;
  userEmail: string;
  tripId?: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  priority: 'normal' | 'high' | 'urgent';
  actionUrl?: string;
  createdAt: string;
}

export type MediaDocType = 'ticket' | 'hotel_booking' | 'document' | 'photo';

export interface MediaDocument {
  id: string;
  tripId: string;
  userEmail: string;
  type: MediaDocType;
  name: string;
  fileUrl: string;
  fileSizeBytes?: number;
  mimeType?: string;
  notes?: string;
  metadata?: {
    flightNumber?: string;
    hotelBookingId?: string;
    expirationDate?: string;
    photoLocation?: string;
    tag?: string;
  };
  createdAt: string;
}

// ---------------------------------------------------------------------------
// 13. MILESTONE 4: ANALYTICS & REPORTS TYPES
// ---------------------------------------------------------------------------
export interface CategoryExpenseReportItem {
  category: string;
  count: number;
  spent: number;
  allocated: number;
  percentage: number;
}

export interface PlannedVsActualReportItem {
  category: string;
  planned: number;
  actual: number;
  difference: number;
  percentage: number;
  status: 'under' | 'on_track' | 'over';
}

export interface TimeSeriesTrendItem {
  period: string; // e.g. "2026-09", "2026-10"
  totalSpent: number;
  expenseCount: number;
  tripsCount?: number;
}

export interface AnalyticsReportsData {
  categoryExpenses: CategoryExpenseReportItem[];
  plannedVsActual: PlannedVsActualReportItem[];
  spendingTrends: TimeSeriesTrendItem[];
  tripActivityTrends: Array<{ period: string; tripsCount: number }>;
  currency: string;
}

export interface UpcomingTripSummary {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  budgetAmount: number;
  budgetCurrency: string;
  travelersCount: number;
  status: string;
  daysCount?: number;
  coverImage?: string;
}

export interface FavoriteDestinationSummary {
  destination: string;
  visitCount: number;
  rating?: number;
  image?: string;
  country?: string;
  totalSpent?: number;
}

export interface TravelerAnalyticsData {
  userEmail: string;
  upcomingTrips: UpcomingTripSummary[];
  budgetOverview: {
    totalBudget: number;
    totalSpent: number;
    remainingBudget: number;
    spentPercentage: number;
    currency: string;
  };
  expenseSummary: {
    totalExpensesCount: number;
    totalSpent: number;
    topCategory: string;
    averageExpenseAmount: number;
    currency: string;
    recentExpenses: Array<{
      id: string;
      title: string;
      amount: number;
      category: string;
      date: string;
      currency: string;
    }>;
  };
  travelStatistics: {
    totalTrips: number;
    upcomingTripsCount: number;
    completedTripsCount: number;
    totalDaysTraveled: number;
    favoriteDestinationsCount: number;
    totalSpendAcrossTrips: number;
    totalBookingsCount: number;
    groupsJoinedCount: number;
  };
  favoriteDestinations: FavoriteDestinationSummary[];
  reports: AnalyticsReportsData;
}

export interface AdminAnalyticsData {
  userAnalytics: {
    totalUsers: number;
    newSignupsOverTime: Array<{ period: string; count: number }>;
    activeUsersCount: number;
    inactiveUsersCount: number;
    activeRatePercentage: number;
    membershipTierBreakdown: Record<string, number>;
  };
  tripAnalytics: {
    totalTrips: number;
    tripsByStatus: Record<string, number>;
    averageTripLengthDays: number;
    averageGroupSize: number;
    tripsWithBudgetCount: number;
  };
  destinationAnalytics: {
    popularDestinations: Array<{
      destination: string;
      tripCount: number;
      bookingCount: number;
      popularityScore: number;
    }>;
    destinationTrends: Array<{
      destination: string;
      recentGrowthPercent: number;
      totalVisitors: number;
    }>;
  };
  platformMetrics: {
    totalTripsAcrossPlatform: number;
    totalBookingsRevenue: number;
    totalPlatformSpend: number;
    totalPlatformBudget: number;
    budgetAdherenceRate: number;
    totalGroupsCreated: number;
    totalExpensesLogged: number;
    currency: string;
  };
  reports: AnalyticsReportsData;
}

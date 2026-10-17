import fs from 'fs';
import path from 'path';
import os from 'os';
import { Pool } from 'pg';

const isServerless = Boolean(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);
export const DATA_DIR = isServerless ? path.join(os.tmpdir(), '.data') : path.join(process.cwd(), '.data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');
const AI_CHATS_FILE = path.join(DATA_DIR, 'ai_chats.json');

export interface StoredUser {
  id: string;
  fullName: string;
  email: string;
  password?: string;
  isEmailVerified: boolean;
  createdAt: string; // ISO timestamp
  updatedAt?: string; // ISO timestamp
  membershipTier: 'Champagne Gold VIP' | 'Diamond Elite' | 'Platinum Member';
  points: number;
  avatar: string;
  provider?: 'local' | 'google';
  role?: 'admin' | 'traveler';
  googleId?: string;
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

export interface StoredBooking {
  id: string;
  bookingCode: string;
  userEmail: string;
  guestName: string;
  guestEmail: string;
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
  status: 'Confirmed' | 'Pending' | 'Cancelled';
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  specialRequests?: string;
  image?: string;
  address?: string;
}

export interface StoredAiChat {
  id: string;
  userEmail?: string;
  userName?: string;
  userMessage: string;
  assistantReply: string;
  sources?: any[];
  context?: any;
  timestamp: string; // ISO timestamp
}

export function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    // In serverless environments, copy seed files from project .data if present
    const seedDir = path.join(process.cwd(), '.data');
    if (DATA_DIR !== seedDir && fs.existsSync(seedDir)) {
      const files = fs.readdirSync(seedDir);
      for (const file of files) {
        const destFile = path.join(DATA_DIR, file);
        if (!fs.existsSync(destFile)) {
          try {
            fs.copyFileSync(path.join(seedDir, file), destFile);
          } catch {}
        }
      }
    }
  } catch (err) {
    console.warn('Could not create data directory:', err);
  }
}

// ---------------------------------------------------------------------------
// NEON POSTGRESQL POOL (Lazy Initialization & Graceful Fallback)
// ---------------------------------------------------------------------------
let pgPool: Pool | null = null;
let isPgConnected = false;

export function getPgPool(): Pool | null {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) {
    return null;
  }

  // Strip enclosing quotes and whitespace if user pasted '"..."' or '\'...\''
  let cleaned = rawUrl.trim().replace(/^[\x27\x22]+|[\x27\x22]+$/g, '').trim();
  if (!cleaned.startsWith('postgres')) {
    return null;
  }

  // Strip channel_binding if present (often causes SSL issues with standard Node pg client)
  cleaned = cleaned.replace(/[?&]channel_binding=[^&]+/g, '');

  if (!pgPool) {
    try {
      pgPool = new Pool({
        connectionString: cleaned,
        ssl: {
          rejectUnauthorized: false
        },
        connectionTimeoutMillis: 10000
      });

      pgPool.on('error', (err) => {
        console.error('Neon PostgreSQL Pool Error:', err.message);
        isPgConnected = false;
      });
    } catch (e: any) {
      console.warn('Failed to initialize Neon PostgreSQL pool:', e.message);
      return null;
    }
  }
  return pgPool;
}

// Initialize tables in Neon PostgreSQL
export async function initPostgresTables() {
  const pool = getPgPool();
  if (!pool) {
    console.log('ℹ️ DATABASE_URL not detected yet. Operating with persistent storage cache. Set DATABASE_URL in Secrets to connect Neon Postgres.');
    return;
  }

  try {
    const client = await pool.connect();
    isPgConnected = true;
    console.log('✅ Connected to Neon PostgreSQL Database successfully!');

    // 1. Users & Authentication Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tripnest_users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        password VARCHAR(255),
        is_email_verified BOOLEAN DEFAULT TRUE,
        membership_tier VARCHAR(100) DEFAULT 'Champagne Gold VIP',
        points INTEGER DEFAULT 25000,
        avatar TEXT,
        provider VARCHAR(50) DEFAULT 'local',
        google_id VARCHAR(255),
        federation_details JSONB,
        phone VARCHAR(50),
        address TEXT,
        passport_number VARCHAR(100),
        preferences JSONB DEFAULT '{"currency": "INR", "newsletter": true}'::jsonb,
        role VARCHAR(50) DEFAULT 'traveler',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      ALTER TABLE tripnest_users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'traveler';
      CREATE INDEX IF NOT EXISTS idx_tripnest_users_email ON tripnest_users (email);
      CREATE INDEX IF NOT EXISTS idx_tripnest_users_role ON tripnest_users (role);
    `);

    // 2. Bookings & Reservations Table (Default INR)
    await client.query(`
      CREATE TABLE IF NOT EXISTS tripnest_bookings (
        id VARCHAR(255) PRIMARY KEY,
        booking_code VARCHAR(100) UNIQUE NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        guest_name VARCHAR(255) NOT NULL,
        guest_email VARCHAR(255) NOT NULL,
        type VARCHAR(50),
        item_id VARCHAR(255),
        item_name VARCHAR(255),
        destination_name VARCHAR(255),
        room_tier_name VARCHAR(255),
        check_in_date VARCHAR(50),
        check_out_date VARCHAR(50),
        guests_count INTEGER DEFAULT 1,
        total_price_usd NUMERIC,
        paid_currency VARCHAR(20) DEFAULT 'INR',
        paid_amount NUMERIC,
        status VARCHAR(50) DEFAULT 'Confirmed',
        payment_method VARCHAR(50) DEFAULT 'Credit Card / UPI',
        transaction_id VARCHAR(100),
        special_requests TEXT,
        image TEXT,
        address TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_tripnest_bookings_user ON tripnest_bookings (user_email);
      CREATE INDEX IF NOT EXISTS idx_tripnest_bookings_code ON tripnest_bookings (booking_code);
    `);

    // 3. Custom Trip Planner & Itineraries Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tripnest_custom_plans (
        id VARCHAR(255) PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        plan_title VARCHAR(255) NOT NULL,
        destination_name VARCHAR(255),
        start_date VARCHAR(50),
        end_date VARCHAR(50),
        budget_amount NUMERIC DEFAULT 150000,
        budget_currency VARCHAR(20) DEFAULT 'INR',
        travelers_count INTEGER DEFAULT 2,
        notes TEXT,
        days_data JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_tripnest_custom_plans_user ON tripnest_custom_plans (user_email);
    `);

    // 4. Saved Favorites / Wishlist Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tripnest_favorites (
        id VARCHAR(255) PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        item_type VARCHAR(50) NOT NULL,
        item_id VARCHAR(255) NOT NULL,
        item_name VARCHAR(255) NOT NULL,
        item_image TEXT,
        item_price NUMERIC,
        currency VARCHAR(20) DEFAULT 'INR',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT uq_user_favorite UNIQUE (user_email, item_type, item_id)
      );
      CREATE INDEX IF NOT EXISTS idx_tripnest_favorites_user ON tripnest_favorites (user_email);
    `);

    // 5. Luxury Destinations Catalog Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tripnest_destinations (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        country VARCHAR(100) NOT NULL,
        region VARCHAR(100),
        category VARCHAR(100),
        rating NUMERIC DEFAULT 4.9,
        reviews_count INTEGER DEFAULT 120,
        starting_price_inr NUMERIC NOT NULL,
        starting_price_usd NUMERIC NOT NULL,
        hero_image TEXT,
        gallery JSONB DEFAULT '[]'::jsonb,
        description TEXT,
        highlights JSONB DEFAULT '[]'::jsonb,
        best_time_to_visit VARCHAR(255),
        coordinates JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 6. Luxury Hotels & Resorts Catalog Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tripnest_hotels (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        destination_name VARCHAR(255) NOT NULL,
        star_rating NUMERIC DEFAULT 5.0,
        reviews_count INTEGER DEFAULT 80,
        price_per_night_inr NUMERIC NOT NULL,
        price_per_night_usd NUMERIC NOT NULL,
        address TEXT,
        images JSONB DEFAULT '[]'::jsonb,
        amenities JSONB DEFAULT '[]'::jsonb,
        room_tiers JSONB DEFAULT '[]'::jsonb,
        badge VARCHAR(100),
        coordinates JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 7. VIP Experiences & Yacht Charters Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tripnest_experiences (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        destination_name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        duration VARCHAR(100),
        price_inr NUMERIC NOT NULL,
        price_usd NUMERIC NOT NULL,
        rating NUMERIC DEFAULT 4.95,
        image TEXT,
        description TEXT,
        included JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 8. Guest Reviews & Verified Ratings Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tripnest_reviews (
        id VARCHAR(255) PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        user_avatar TEXT,
        target_type VARCHAR(50) NOT NULL,
        target_id VARCHAR(255) NOT NULL,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        title VARCHAR(255),
        comment TEXT NOT NULL,
        is_verified_booking BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_tripnest_reviews_target ON tripnest_reviews (target_type, target_id);
    `);

    // 9. AI Concierge Chats Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tripnest_ai_chats (
        id VARCHAR(255) PRIMARY KEY,
        user_email VARCHAR(255),
        user_name VARCHAR(255),
        user_message TEXT NOT NULL,
        assistant_reply TEXT NOT NULL,
        sources JSONB,
        context JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_tripnest_ai_chats_email ON tripnest_ai_chats (user_email);
    `);

    // 10. OTP Verification & Password Reset Tokens Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tripnest_otp_codes (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp_code VARCHAR(10) NOT NULL,
        type VARCHAR(50) NOT NULL,
        expires_at BIGINT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_tripnest_otp_email ON tripnest_otp_codes (email);
    `);

    // 11. Custom Trips Table (Compatible with Java Spring Boot Entity)
    await client.query(`
      CREATE TABLE IF NOT EXISTS tripnest_trips (
        id VARCHAR(255) PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        destination VARCHAR(255) NOT NULL,
        start_date VARCHAR(50),
        end_date VARCHAR(50),
        budget_amount NUMERIC DEFAULT 0,
        budget_currency VARCHAR(10) DEFAULT 'INR',
        travelers_count INTEGER DEFAULT 1,
        status VARCHAR(50) DEFAULT 'Active',
        notes TEXT,
        cover_image TEXT,
        itinerary TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      ALTER TABLE tripnest_trips ADD COLUMN IF NOT EXISTS itinerary TEXT;
      CREATE INDEX IF NOT EXISTS idx_tripnest_trips_email ON tripnest_trips (user_email);
    `);

    // 12. Destination Roadmaps Table (Where to Stay & Where to Live)
    await client.query(`
      CREATE TABLE IF NOT EXISTS tripnest_destination_roadmaps (
        id VARCHAR(255) PRIMARY KEY,
        destination_id VARCHAR(255) NOT NULL,
        destination_name VARCHAR(255) NOT NULL,
        user_email VARCHAR(255),
        days_count INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        overview TEXT,
        days_data JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_roadmaps_dest ON tripnest_destination_roadmaps (destination_id);
      CREATE INDEX IF NOT EXISTS idx_roadmaps_dest_user ON tripnest_destination_roadmaps (destination_id, user_email);

      -- 13. Dedicated Itineraries Table (/api/iternary backend storage)
      CREATE TABLE IF NOT EXISTS tripnest_itineraries (
        id VARCHAR(255) PRIMARY KEY,
        trip_id VARCHAR(255),
        user_email VARCHAR(255),
        title VARCHAR(255) NOT NULL,
        destination VARCHAR(255) NOT NULL,
        days_count INTEGER DEFAULT 1,
        start_date VARCHAR(50),
        end_date VARCHAR(50),
        days_data JSONB NOT NULL DEFAULT '[]'::jsonb,
        is_prominent BOOLEAN DEFAULT FALSE,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_tripnest_itineraries_trip ON tripnest_itineraries (trip_id);
      CREATE INDEX IF NOT EXISTS idx_tripnest_itineraries_user ON tripnest_itineraries (user_email);
      CREATE INDEX IF NOT EXISTS idx_tripnest_itineraries_dest ON tripnest_itineraries (destination);

      -- 14. Trip Budgets Table
      CREATE TABLE IF NOT EXISTS tripnest_budgets (
        id VARCHAR(255) PRIMARY KEY,
        trip_id VARCHAR(255) UNIQUE NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        total_budget NUMERIC DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'INR',
        allocations JSONB DEFAULT '{}'::jsonb,
        estimated_costs JSONB DEFAULT '{}'::jsonb,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_tripnest_budgets_trip ON tripnest_budgets (trip_id);
      CREATE INDEX IF NOT EXISTS idx_tripnest_budgets_user ON tripnest_budgets (user_email);

      -- 15. Trip Expenses Table (Transportation, Hotel, Food, Shopping, Entertainment, Miscellaneous)
      CREATE TABLE IF NOT EXISTS tripnest_expenses (
        id VARCHAR(255) PRIMARY KEY,
        trip_id VARCHAR(255) NOT NULL,
        group_id VARCHAR(255),
        user_email VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        amount NUMERIC NOT NULL,
        currency VARCHAR(10) DEFAULT 'INR',
        category VARCHAR(50) NOT NULL,
        date VARCHAR(50) NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'Credit Card',
        receipt_url TEXT,
        notes TEXT,
        is_shared BOOLEAN DEFAULT FALSE,
        paid_by_member_id VARCHAR(255),
        paid_by_name VARCHAR(255),
        split_type VARCHAR(50) DEFAULT 'EQUAL',
        split_details JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_tripnest_expenses_trip ON tripnest_expenses (trip_id);
      CREATE INDEX IF NOT EXISTS idx_tripnest_expenses_cat ON tripnest_expenses (category);
      CREATE INDEX IF NOT EXISTS idx_tripnest_expenses_user ON tripnest_expenses (user_email);

      -- 16. Travel Groups Table
      CREATE TABLE IF NOT EXISTS tripnest_travel_groups (
        id VARCHAR(255) PRIMARY KEY,
        trip_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_by_email VARCHAR(255) NOT NULL,
        cover_image TEXT,
        invite_code VARCHAR(50) UNIQUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_tripnest_groups_trip ON tripnest_travel_groups (trip_id);
      CREATE INDEX IF NOT EXISTS idx_tripnest_groups_code ON tripnest_travel_groups (invite_code);

      -- 17. Group Members Table
      CREATE TABLE IF NOT EXISTS tripnest_group_members (
        id VARCHAR(255) PRIMARY KEY,
        group_id VARCHAR(255) NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        avatar TEXT,
        role VARCHAR(50) DEFAULT 'Member',
        status VARCHAR(50) DEFAULT 'Active',
        joined_via_code BOOLEAN DEFAULT FALSE,
        joined_code VARCHAR(50),
        allocated_budget NUMERIC DEFAULT 0,
        joined_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT uq_group_member UNIQUE (group_id, user_email)
      );
      ALTER TABLE tripnest_group_members ADD COLUMN IF NOT EXISTS joined_via_code BOOLEAN DEFAULT FALSE;
      ALTER TABLE tripnest_group_members ADD COLUMN IF NOT EXISTS joined_code VARCHAR(50);
      ALTER TABLE tripnest_group_members ADD COLUMN IF NOT EXISTS allocated_budget NUMERIC DEFAULT 0;
      CREATE INDEX IF NOT EXISTS idx_tripnest_members_group ON tripnest_group_members (group_id);

      -- 18. Group Discussion Messages Table
      CREATE TABLE IF NOT EXISTS tripnest_group_discussions (
        id VARCHAR(255) PRIMARY KEY,
        group_id VARCHAR(255) NOT NULL,
        sender_email VARCHAR(255) NOT NULL,
        sender_name VARCHAR(255) NOT NULL,
        sender_avatar TEXT,
        recipient_email VARCHAR(255) DEFAULT 'all',
        recipient_name VARCHAR(255) DEFAULT 'Everyone',
        is_direct BOOLEAN DEFAULT FALSE,
        message TEXT NOT NULL,
        attachments JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      ALTER TABLE tripnest_group_discussions ADD COLUMN IF NOT EXISTS recipient_email VARCHAR(255) DEFAULT 'all';
      ALTER TABLE tripnest_group_discussions ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(255) DEFAULT 'Everyone';
      ALTER TABLE tripnest_group_discussions ADD COLUMN IF NOT EXISTS is_direct BOOLEAN DEFAULT FALSE;
      CREATE INDEX IF NOT EXISTS idx_tripnest_disc_group ON tripnest_group_discussions (group_id);

      -- 19. Shared Settlements Table
      CREATE TABLE IF NOT EXISTS tripnest_shared_settlements (
        id VARCHAR(255) PRIMARY KEY,
        group_id VARCHAR(255) NOT NULL,
        trip_id VARCHAR(255),
        from_member_id VARCHAR(255) NOT NULL,
        from_member_name VARCHAR(255) NOT NULL,
        to_member_id VARCHAR(255) NOT NULL,
        to_member_name VARCHAR(255) NOT NULL,
        amount NUMERIC NOT NULL,
        currency VARCHAR(10) DEFAULT 'INR',
        status VARCHAR(50) DEFAULT 'Pending',
        settled_at TIMESTAMPTZ,
        transaction_ref VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_tripnest_settle_group ON tripnest_shared_settlements (group_id);

      -- 20. Notifications & Reminders Table
      CREATE TABLE IF NOT EXISTS tripnest_notifications (
        id VARCHAR(255) PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        trip_id VARCHAR(255),
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        priority VARCHAR(20) DEFAULT 'normal',
        action_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_tripnest_notif_user ON tripnest_notifications (user_email);

      -- 21. Media & Documents Vault Table
      CREATE TABLE IF NOT EXISTS tripnest_media_documents (
        id VARCHAR(255) PRIMARY KEY,
        trip_id VARCHAR(255) NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        file_url TEXT NOT NULL,
        file_size_bytes INTEGER DEFAULT 0,
        mime_type VARCHAR(100),
        notes TEXT,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_tripnest_media_trip ON tripnest_media_documents (trip_id);
      CREATE INDEX IF NOT EXISTS idx_tripnest_media_type ON tripnest_media_documents (type);
    `);

    // Always sync & ensure Administrator and seed users into Neon Postgres
    for (const u of usersStore.values()) {
      await client.query(`
        INSERT INTO tripnest_users (
          id, email, full_name, password, is_email_verified, membership_tier, points, avatar, provider, google_id, federation_details, role, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (email) DO UPDATE SET
          password = COALESCE(EXCLUDED.password, tripnest_users.password),
          role = EXCLUDED.role,
          membership_tier = EXCLUDED.membership_tier,
          points = EXCLUDED.points,
          updated_at = NOW()
      `, [
        u.id, u.email, u.fullName, u.password || null, u.isEmailVerified,
        u.membershipTier, u.points, u.avatar, u.provider || 'local',
        u.googleId || null, JSON.stringify(u.federationDetails || null),
        u.role || (isRecognizedAdminEmail(u.email) ? 'admin' : 'traveler'),
        u.createdAt, u.updatedAt || u.createdAt
      ]);
    }

    client.release();
  } catch (err: any) {
    console.error('Error initializing Neon Postgres tables:', err.message);
    isPgConnected = false;
  }
}

// ---------------------------------------------------------------------------
// USERS DB
// ---------------------------------------------------------------------------
export function loadUsersFromFile(): Map<string, StoredUser> {
  ensureDataDir();
  const map = new Map<string, StoredUser>();

  // Default seed users
  map.set('ffdhanush806@gmail.com', {
    id: 'usr-vip-001',
    fullName: 'Dhanush Kumar',
    email: 'ffdhanush806@gmail.com',
    password: 'Password123!',
    isEmailVerified: true,
    createdAt: '2026-08-15T08:30:00Z',
    updatedAt: '2026-08-15T08:30:00Z',
    membershipTier: 'Champagne Gold VIP',
    points: 35000,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    provider: 'google',
    googleId: 'g_ffdhanush806'
  });

  map.set('demo@tripnest.luxury', {
    id: 'usr-demo-01',
    fullName: 'Demo VIP Explorer',
    email: 'demo@tripnest.luxury',
    password: 'Password123!',
    isEmailVerified: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    membershipTier: 'Diamond Elite',
    points: 154000,
    role: 'traveler',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
  });

  map.set('admin@tripnest.luxury', {
    id: 'usr-admin-01',
    fullName: 'System Administrator',
    email: 'admin@tripnest.luxury',
    password: 'Password123!',
    isEmailVerified: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    membershipTier: 'Diamond Elite',
    points: 999999,
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80'
  });

  map.set('tripnestoneofficial@gmail.com', {
    id: 'usr-admin-official',
    fullName: 'Administrator',
    email: 'tripnestoneofficial@gmail.com',
    password: 'Sundhari@2006',
    isEmailVerified: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    membershipTier: 'Diamond Elite',
    points: 999999,
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80'
  });

  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        parsed.forEach((user: StoredUser) => {
          if (user && user.email) {
            map.set(user.email.toLowerCase().trim(), user);
          }
        });
      }
    }
  } catch (err) {
    console.warn('Could not read users file:', err);
  }

  // Always ensure official Administrator credentials and role are enforced
  const officialAdmin = map.get('tripnestoneofficial@gmail.com');
  if (officialAdmin) {
    officialAdmin.password = 'Sundhari@2006';
    officialAdmin.role = 'admin';
  } else {
    map.set('tripnestoneofficial@gmail.com', {
      id: 'usr-admin-official',
      fullName: 'Administrator',
      email: 'tripnestoneofficial@gmail.com',
      password: 'Sundhari@2006',
      isEmailVerified: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      membershipTier: 'Diamond Elite',
      points: 999999,
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80'
    });
  }

  return map;
}

export function saveUsersToFile(usersMap: Map<string, StoredUser>) {
  ensureDataDir();
  try {
    const list = Array.from(usersMap.values());
    fs.writeFileSync(USERS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not save users to file:', err);
  }

  // Also sync to Neon PostgreSQL asynchronously
  const pool = getPgPool();
  if (pool) {
    (async () => {
      try {
        for (const u of usersMap.values()) {
          await pool.query(`
            INSERT INTO tripnest_users (id, email, full_name, password, is_email_verified, membership_tier, points, avatar, provider, google_id, federation_details, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            ON CONFLICT (email) DO UPDATE SET
              full_name = EXCLUDED.full_name,
              password = COALESCE(EXCLUDED.password, tripnest_users.password),
              is_email_verified = EXCLUDED.is_email_verified,
              membership_tier = EXCLUDED.membership_tier,
              points = EXCLUDED.points,
              avatar = EXCLUDED.avatar,
              provider = EXCLUDED.provider,
              google_id = COALESCE(EXCLUDED.google_id, tripnest_users.google_id),
              federation_details = COALESCE(EXCLUDED.federation_details, tripnest_users.federation_details),
              updated_at = NOW()
          `, [
            u.id, u.email, u.fullName, u.password || null, u.isEmailVerified,
            u.membershipTier, u.points, u.avatar, u.provider || 'local',
            u.googleId || null, JSON.stringify(u.federationDetails || null),
            u.createdAt, u.updatedAt || u.createdAt
          ]);
        }
      } catch (e: any) {
        console.warn('Error syncing users to Neon Postgres:', e.message);
      }
    })();
  }
}

export const usersStore = loadUsersFromFile();

export function isPostgresConnected(): boolean {
  return isPgConnected;
}

export async function findUserInDb(email: string): Promise<StoredUser | undefined> {
  const normalized = email.toLowerCase().trim();
  const pool = getPgPool();
  if (pool) {
    try {
      const res = await pool.query('SELECT * FROM tripnest_users WHERE LOWER(email) = $1 LIMIT 1', [normalized]);
      if (res.rows.length > 0) {
        const row = res.rows[0];
        const user: StoredUser = {
          id: row.id,
          fullName: row.full_name,
          email: row.email,
          password: row.password || undefined,
          isEmailVerified: row.is_email_verified,
          createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
          updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
          membershipTier: row.membership_tier,
          points: row.points,
          avatar: row.avatar,
          provider: row.provider,
          role: isRecognizedAdminEmail(row.email) ? 'admin' : (row.role || 'traveler'),
          googleId: row.google_id,
          federationDetails: typeof row.federation_details === 'string' ? JSON.parse(row.federation_details) : row.federation_details
        };
        usersStore.set(normalized, user);
        return user;
      }
    } catch (e: any) {
      console.warn('Postgres error in findUserInDb:', e.message);
    }
  }
  const memoryUser = usersStore.get(normalized);
  if (memoryUser) {
    if (isRecognizedAdminEmail(normalized)) {
      memoryUser.role = 'admin';
    } else if (!memoryUser.role) {
      memoryUser.role = 'traveler';
    }
  }
  return memoryUser;
}

export function isRecognizedAdminEmail(email?: string): boolean {
  const norm = (email || '').toLowerCase().trim();
  return norm === 'tripnestoneofficial@gmail.com' || norm === 'admin@tripnest.luxury';
}

export async function saveUserToDb(user: StoredUser): Promise<StoredUser> {
  const normalized = user.email.toLowerCase().trim();
  const role = isRecognizedAdminEmail(normalized) ? 'admin' : (user.role || 'traveler');
  user.role = role;
  usersStore.set(normalized, user);
  saveUsersToFile(usersStore);

  const pool = getPgPool();
  if (pool) {
    try {
      await pool.query(`
        INSERT INTO tripnest_users (
          id, email, full_name, password, is_email_verified, membership_tier, points, avatar, provider, google_id, federation_details, role, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (email) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          password = COALESCE(EXCLUDED.password, tripnest_users.password),
          is_email_verified = EXCLUDED.is_email_verified,
          membership_tier = EXCLUDED.membership_tier,
          points = EXCLUDED.points,
          avatar = EXCLUDED.avatar,
          provider = EXCLUDED.provider,
          role = EXCLUDED.role,
          google_id = COALESCE(EXCLUDED.google_id, tripnest_users.google_id),
          federation_details = COALESCE(EXCLUDED.federation_details, tripnest_users.federation_details),
          updated_at = NOW()
      `, [
        user.id, normalized, user.fullName, user.password || null, user.isEmailVerified,
        user.membershipTier, user.points, user.avatar, user.provider || 'local',
        user.googleId || null, JSON.stringify(user.federationDetails || null),
        role, user.createdAt, user.updatedAt || user.createdAt
      ]);
    } catch (e: any) {
      console.warn('Error saving user to Neon Postgres:', e.message);
    }
  }
  return user;
}

export async function updateUserRoleInDb(email: string, role: 'admin' | 'traveler'): Promise<StoredUser | undefined> {
  const normalized = email.toLowerCase().trim();
  let user = await findUserInDb(normalized);
  if (!user) return undefined;
  user.role = role;
  user.updatedAt = new Date().toISOString();
  usersStore.set(normalized, user);
  saveUsersToFile(usersStore);

  const pool = getPgPool();
  if (pool) {
    try {
      await pool.query(`UPDATE tripnest_users SET role = $1, updated_at = NOW() WHERE LOWER(email) = $2`, [role, normalized]);
    } catch (e: any) {
      console.warn('Error updating role in Postgres:', e.message);
    }
  }
  return user;
}

export async function getAllUsersFromDb(): Promise<StoredUser[]> {
  const pool = getPgPool();
  if (pool) {
    try {
      const res = await pool.query(`
        SELECT id, email, full_name, is_email_verified, membership_tier, points, avatar, provider, role, google_id, created_at, updated_at
        FROM tripnest_users
        ORDER BY created_at DESC
      `);
      if (res.rows && res.rows.length > 0) {
        return res.rows.map((row) => ({
          id: row.id,
          fullName: row.full_name,
          email: row.email,
          isEmailVerified: row.is_email_verified,
          membershipTier: row.membership_tier || 'Member',
          points: row.points || 0,
          avatar: row.avatar,
          provider: row.provider,
          role: isRecognizedAdminEmail(row.email) ? 'admin' : (row.role || 'traveler'),
          googleId: row.google_id,
          createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
          updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString()
        }));
      }
    } catch (e: any) {
      console.warn('Postgres error in getAllUsersFromDb:', e.message);
    }
  }
  return Array.from(usersStore.values()).map(u => ({
    ...u,
    role: isRecognizedAdminEmail(u.email) ? 'admin' : (u.role || 'traveler')
  }));
}

export async function deleteUserFromDb(idOrEmail: string): Promise<boolean> {
  const normalized = idOrEmail.toLowerCase().trim();
  usersStore.delete(normalized);
  for (const [key, val] of usersStore.entries()) {
    if (val.id === idOrEmail || val.email.toLowerCase() === normalized) {
      usersStore.delete(key);
    }
  }
  saveUsersToFile(usersStore);

  const pool = getPgPool();
  if (pool) {
    try {
      await pool.query('DELETE FROM tripnest_users WHERE id = $1 OR LOWER(email) = $2', [idOrEmail, normalized]);
      return true;
    } catch (e: any) {
      console.warn('Postgres error in deleteUserFromDb:', e.message);
    }
  }
  return true;
}

export async function deductUserPoints(
  email?: string,
  amount: number = 200
): Promise<{ success: boolean; pointsDeducted: number; remainingPoints: number; user?: StoredUser }> {
  let targetEmail = email ? email.toLowerCase().trim() : '';
  let user: StoredUser | undefined;

  if (targetEmail) {
    user = await findUserInDb(targetEmail);
  }

  // If no user found by email, try default VIP user or first user in store
  if (!user) {
    user = await findUserInDb('ffdhanush806@gmail.com');
  }
  if (!user && usersStore.size > 0) {
    user = usersStore.values().next().value;
  }

  if (!user) {
    return { success: false, pointsDeducted: 0, remainingPoints: 0 };
  }

  const currentPoints = typeof user.points === 'number' ? user.points : 25000;
  const newPoints = Math.max(0, currentPoints - amount);
  user.points = newPoints;
  user.updatedAt = new Date().toISOString();

  usersStore.set(user.email.toLowerCase().trim(), user);
  saveUsersToFile(usersStore);

  const pool = getPgPool();
  if (pool) {
    try {
      await pool.query(
        'UPDATE tripnest_users SET points = $1, updated_at = NOW() WHERE LOWER(email) = LOWER($2)',
        [newPoints, user.email]
      );
    } catch (e: any) {
      console.warn('Error updating points in Neon Postgres:', e.message);
    }
  }

  return {
    success: true,
    pointsDeducted: amount,
    remainingPoints: newPoints,
    user
  };
}

// ---------------------------------------------------------------------------
// BOOKINGS DB
// ---------------------------------------------------------------------------
function loadBookingsFromFile(): StoredBooking[] {
  ensureDataDir();
  try {
    if (fs.existsSync(BOOKINGS_FILE)) {
      const data = fs.readFileSync(BOOKINGS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Could not read bookings file:', err);
  }

  // Seed default booking in INR
  const initialBookings: StoredBooking[] = [
    {
      id: 'bk-kashmir-001',
      bookingCode: 'TN-KSH-8942',
      userEmail: 'ffdhanush806@gmail.com',
      guestName: 'Dhanush Kumar',
      guestEmail: 'ffdhanush806@gmail.com',
      type: 'hotel',
      itemId: 'lalit-grand-palace',
      itemName: 'The Lalit Grand Palace Srinagar',
      destinationName: 'Kashmir Valley',
      roomTierName: 'Maharaja Royal Suite',
      checkInDate: '2026-09-15',
      checkOutDate: '2026-09-18',
      guestsCount: 2,
      totalPriceUsd: 220575, // in INR
      paidCurrency: 'INR',
      paidAmount: 220575,
      status: 'Confirmed',
      createdAt: '2026-08-20T10:00:00Z',
      updatedAt: '2026-08-20T10:00:00Z',
      specialRequests: 'High tea in Chinar Gardens and sunset Shikara reception upon arrival.',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
      address: 'Gupkar Road, Srinagar, Jammu & Kashmir 190001'
    }
  ];

  try {
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(initialBookings, null, 2), 'utf-8');
  } catch {}

  return initialBookings;
}

let bookingsCache: StoredBooking[] = loadBookingsFromFile();

export function getBookings(userEmail?: string): StoredBooking[] {
  if (userEmail) {
    const clean = userEmail.toLowerCase().trim();
    return bookingsCache.filter((b) => b.userEmail?.toLowerCase().trim() === clean || b.guestEmail?.toLowerCase().trim() === clean);
  }
  return [...bookingsCache];
}

export function saveBooking(booking: StoredBooking): StoredBooking {
  ensureDataDir();
  const existingIndex = bookingsCache.findIndex((b) => b.id === booking.id || b.bookingCode === booking.bookingCode);
  const now = new Date().toISOString();

  if (existingIndex >= 0) {
    bookingsCache[existingIndex] = {
      ...bookingsCache[existingIndex],
      ...booking,
      paidCurrency: booking.paidCurrency || 'INR',
      updatedAt: now
    };
  } else {
    bookingsCache.unshift({
      ...booking,
      paidCurrency: booking.paidCurrency || 'INR',
      createdAt: booking.createdAt || now,
      updatedAt: now
    });
  }

  try {
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookingsCache, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not save bookings to file:', err);
  }

  // Sync to Neon Postgres
  const pool = getPgPool();
  if (pool) {
    const b = existingIndex >= 0 ? bookingsCache[existingIndex] : bookingsCache[0];
    (async () => {
      try {
        await pool.query(`
          INSERT INTO tripnest_bookings (
            id, booking_code, user_email, guest_name, guest_email, type, item_id, item_name, destination_name,
            room_tier_name, check_in_date, check_out_date, guests_count, total_price_usd, paid_currency, paid_amount,
            status, special_requests, image, address, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
          ON CONFLICT (booking_code) DO UPDATE SET
            status = EXCLUDED.status,
            paid_currency = EXCLUDED.paid_currency,
            paid_amount = EXCLUDED.paid_amount,
            updated_at = NOW()
        `, [
          b.id, b.bookingCode, b.userEmail, b.guestName, b.guestEmail, b.type, b.itemId, b.itemName, b.destinationName,
          b.roomTierName || null, b.checkInDate, b.checkOutDate || null, b.guestsCount, b.totalPriceUsd, b.paidCurrency || 'INR',
          b.paidAmount, b.status, b.specialRequests || null, b.image || null, b.address || null, b.createdAt, b.updatedAt
        ]);
      } catch (e: any) {
        console.warn('Error syncing booking to Neon Postgres:', e.message);
      }
    })();
  }

  return existingIndex >= 0 ? bookingsCache[existingIndex] : bookingsCache[0];
}

export function getBookingById(id: string): StoredBooking | null {
  ensureDataDir();
  return bookingsCache.find((b) => b.id === id || b.bookingCode === id) || null;
}

export async function updateBookingInDb(
  id: string,
  updates: Partial<StoredBooking>,
  userEmail?: string
): Promise<StoredBooking | null> {
  ensureDataDir();
  const b = bookingsCache.find((x) => x.id === id || x.bookingCode === id);
  if (!b) return null;
  if (userEmail && b.userEmail.toLowerCase().trim() !== userEmail.toLowerCase().trim()) {
    return null;
  }

  if (updates.checkInDate !== undefined) b.checkInDate = updates.checkInDate;
  if (updates.checkOutDate !== undefined) b.checkOutDate = updates.checkOutDate;
  if (updates.guestsCount !== undefined) b.guestsCount = Number(updates.guestsCount);
  if (updates.specialRequests !== undefined) b.specialRequests = updates.specialRequests;
  if (updates.status !== undefined) b.status = updates.status;
  if (updates.paidAmount !== undefined) b.paidAmount = Number(updates.paidAmount);
  if (updates.guestName !== undefined) b.guestName = updates.guestName;
  if (updates.roomTierName !== undefined) b.roomTierName = updates.roomTierName;
  b.updatedAt = new Date().toISOString();

  try {
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookingsCache, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not update booking in file:', err);
  }

  const pool = getPgPool();
  if (pool) {
    try {
      const setClauses: string[] = [];
      const values: any[] = [];
      let paramIdx = 1;

      if (updates.checkInDate !== undefined) {
        setClauses.push(`check_in_date = $${paramIdx++}`);
        values.push(updates.checkInDate);
      }
      if (updates.checkOutDate !== undefined) {
        setClauses.push(`check_out_date = $${paramIdx++}`);
        values.push(updates.checkOutDate);
      }
      if (updates.guestsCount !== undefined) {
        setClauses.push(`guests_count = $${paramIdx++}`);
        values.push(Number(updates.guestsCount));
      }
      if (updates.specialRequests !== undefined) {
        setClauses.push(`special_requests = $${paramIdx++}`);
        values.push(updates.specialRequests);
      }
      if (updates.status !== undefined) {
        setClauses.push(`status = $${paramIdx++}`);
        values.push(updates.status);
      }
      if (updates.paidAmount !== undefined) {
        setClauses.push(`paid_amount = $${paramIdx++}`);
        values.push(Number(updates.paidAmount));
      }
      if (updates.guestName !== undefined) {
        setClauses.push(`guest_name = $${paramIdx++}`);
        values.push(updates.guestName);
      }
      if (updates.roomTierName !== undefined) {
        setClauses.push(`room_tier_name = $${paramIdx++}`);
        values.push(updates.roomTierName);
      }

      setClauses.push(`updated_at = NOW()`);

      let whereClause = `WHERE (id = $${paramIdx} OR booking_code = $${paramIdx})`;
      values.push(id);
      paramIdx++;

      if (userEmail) {
        whereClause += ` AND LOWER(user_email) = LOWER($${paramIdx})`;
        values.push(userEmail.trim());
      }

      await pool.query(`UPDATE tripnest_bookings SET ${setClauses.join(', ')} ${whereClause}`, values);
    } catch (e: any) {
      console.warn('Error updating booking in Neon Postgres:', e.message);
    }
  }

  return b;
}

export function updateBookingStatus(id: string, status: 'Confirmed' | 'Pending' | 'Cancelled'): StoredBooking | null {
  ensureDataDir();
  const b = bookingsCache.find((x) => x.id === id || x.bookingCode === id);
  if (!b) return null;

  b.status = status;
  b.updatedAt = new Date().toISOString();

  try {
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookingsCache, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not update booking status in file:', err);
  }

  const pool = getPgPool();
  if (pool) {
    (async () => {
      try {
        await pool.query(`
          UPDATE tripnest_bookings
          SET status = $1, updated_at = NOW()
          WHERE id = $2 OR booking_code = $2
        `, [status, id]);
      } catch (e: any) {
        console.warn('Error updating booking status in Neon Postgres:', e.message);
      }
    })();
  }

  return b;
}

export function deleteBookingFromDb(id: string, userEmail?: string): boolean {
  ensureDataDir();
  const initialLength = bookingsCache.length;
  bookingsCache = bookingsCache.filter((b) => {
    const matchesId = b.id === id || b.bookingCode === id;
    if (!matchesId) return true;
    if (userEmail && b.userEmail.toLowerCase().trim() !== userEmail.toLowerCase().trim()) {
      return true; // Don't delete if user email doesn't match
    }
    return false;
  });

  const wasDeleted = bookingsCache.length < initialLength;
  if (wasDeleted) {
    try {
      fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookingsCache, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Could not update bookings file after deletion:', err);
    }

    const pool = getPgPool();
    if (pool) {
      (async () => {
        try {
          if (userEmail) {
            await pool.query(
              'DELETE FROM tripnest_bookings WHERE (id = $1 OR booking_code = $1) AND LOWER(user_email) = LOWER($2)',
              [id, userEmail.trim()]
            );
          } else {
            await pool.query('DELETE FROM tripnest_bookings WHERE id = $1 OR booking_code = $1', [id]);
          }
        } catch (e: any) {
          console.warn('Error deleting booking from Neon Postgres:', e.message);
        }
      })();
    }
  }

  return wasDeleted;
}

// ---------------------------------------------------------------------------
// AI CHATS DB
// ---------------------------------------------------------------------------
function loadAiChatsFromFile(): StoredAiChat[] {
  ensureDataDir();
  try {
    if (fs.existsSync(AI_CHATS_FILE)) {
      const data = fs.readFileSync(AI_CHATS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Could not read AI chats file:', err);
  }
  return [];
}

let aiChatsCache: StoredAiChat[] = loadAiChatsFromFile();

export function saveAiChat(chat: StoredAiChat): StoredAiChat {
  ensureDataDir();
  const item: StoredAiChat = {
    ...chat,
    id: chat.id || `chat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: chat.timestamp || new Date().toISOString()
  };

  aiChatsCache.unshift(item);
  if (aiChatsCache.length > 500) {
    aiChatsCache = aiChatsCache.slice(0, 500);
  }

  try {
    fs.writeFileSync(AI_CHATS_FILE, JSON.stringify(aiChatsCache, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not save AI chats to file:', err);
  }

  const pool = getPgPool();
  if (pool) {
    (async () => {
      try {
        await pool.query(`
          INSERT INTO tripnest_ai_chats (id, user_email, user_name, user_message, assistant_reply, sources, context, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO NOTHING
        `, [
          item.id, item.userEmail || null, item.userName || null, item.userMessage, item.assistantReply,
          JSON.stringify(item.sources || []), JSON.stringify(item.context || {}), item.timestamp
        ]);
      } catch (e: any) {
        console.warn('Error saving AI chat to Neon Postgres:', e.message);
      }
    })();
  }

  return item;
}

export function getAiChats(userEmail?: string): StoredAiChat[] {
  if (userEmail) {
    const clean = userEmail.toLowerCase().trim();
    return aiChatsCache.filter((c) => c.userEmail?.toLowerCase().trim() === clean);
  }
  return [...aiChatsCache];
}

// ---------------------------------------------------------------------------
// CUSTOM TRIP PLANS DB
// ---------------------------------------------------------------------------
export interface StoredCustomPlan {
  id: string;
  userEmail: string;
  planTitle: string;
  destinationName?: string;
  startDate?: string;
  endDate?: string;
  budgetAmount?: number;
  budgetCurrency?: string;
  travelersCount?: number;
  notes?: string;
  daysData: any[];
  createdAt?: string;
  updatedAt?: string;
}

const PLANS_FILE = path.join(DATA_DIR, 'custom_plans.json');
let plansCache: StoredCustomPlan[] = [];

try {
  if (fs.existsSync(PLANS_FILE)) {
    const raw = fs.readFileSync(PLANS_FILE, 'utf-8');
    plansCache = JSON.parse(raw) || [];
  }
} catch (e) {
  plansCache = [];
}

export async function saveCustomPlanToDb(plan: StoredCustomPlan): Promise<StoredCustomPlan> {
  ensureDataDir();
  const now = new Date().toISOString();
  const item: StoredCustomPlan = {
    ...plan,
    id: plan.id || `plan-${Date.now()}`,
    budgetCurrency: plan.budgetCurrency || 'INR',
    createdAt: plan.createdAt || now,
    updatedAt: now
  };

  const idx = plansCache.findIndex(p => p.id === item.id);
  if (idx >= 0) {
    plansCache[idx] = item;
  } else {
    plansCache.unshift(item);
  }

  try {
    fs.writeFileSync(PLANS_FILE, JSON.stringify(plansCache, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not save plans cache to disk:', err);
  }

  const pool = getPgPool();
  if (pool) {
    try {
      await pool.query(`
        INSERT INTO tripnest_custom_plans (
          id, user_email, plan_title, destination_name, start_date, end_date,
          budget_amount, budget_currency, travelers_count, notes, days_data, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO UPDATE SET
          plan_title = EXCLUDED.plan_title,
          destination_name = EXCLUDED.destination_name,
          start_date = EXCLUDED.start_date,
          end_date = EXCLUDED.end_date,
          budget_amount = EXCLUDED.budget_amount,
          budget_currency = EXCLUDED.budget_currency,
          travelers_count = EXCLUDED.travelers_count,
          notes = EXCLUDED.notes,
          days_data = EXCLUDED.days_data,
          updated_at = NOW()
      `, [
        item.id, item.userEmail, item.planTitle, item.destinationName || null, item.startDate || null, item.endDate || null,
        item.budgetAmount || 150000, item.budgetCurrency || 'INR', item.travelersCount || 2, item.notes || null,
        JSON.stringify(item.daysData || []), item.createdAt, item.updatedAt
      ]);
    } catch (e: any) {
      console.warn('Error saving custom plan to Neon Postgres:', e.message);
    }
  }

  return item;
}

export async function getCustomPlansFromDb(userEmail: string): Promise<StoredCustomPlan[]> {
  const cleanEmail = userEmail.toLowerCase().trim();
  const pool = getPgPool();
  if (pool) {
    try {
      const res = await pool.query(`
        SELECT id, user_email, plan_title, destination_name, start_date, end_date,
               budget_amount, budget_currency, travelers_count, notes, days_data, created_at, updated_at
        FROM tripnest_custom_plans
        WHERE user_email = $1
        ORDER BY updated_at DESC
      `, [cleanEmail]);

      if (res.rows && res.rows.length > 0) {
        return res.rows.map(r => ({
          id: r.id,
          userEmail: r.user_email,
          planTitle: r.plan_title,
          destinationName: r.destination_name,
          startDate: r.start_date,
          endDate: r.end_date,
          budgetAmount: Number(r.budget_amount),
          budgetCurrency: r.budget_currency || 'INR',
          travelersCount: Number(r.travelers_count),
          notes: r.notes,
          daysData: r.days_data || [],
          createdAt: r.created_at,
          updatedAt: r.updated_at
        }));
      }
    } catch (e: any) {
      console.warn('Error fetching custom plans from Neon Postgres:', e.message);
    }
  }

  return plansCache.filter(p => p.userEmail.toLowerCase().trim() === cleanEmail);
}

export async function deleteCustomPlanFromDb(id: string, userEmail?: string): Promise<boolean> {
  ensureDataDir();
  const initialLength = plansCache.length;
  plansCache = plansCache.filter(p => {
    if (p.id !== id) return true;
    if (userEmail && p.userEmail.toLowerCase().trim() !== userEmail.toLowerCase().trim()) {
      return true;
    }
    return false;
  });

  const wasDeleted = plansCache.length < initialLength;
  if (wasDeleted) {
    try {
      fs.writeFileSync(PLANS_FILE, JSON.stringify(plansCache, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Could not save plans cache after deletion:', err);
    }

    const pool = getPgPool();
    if (pool) {
      try {
        if (userEmail) {
          await pool.query(
            'DELETE FROM tripnest_custom_plans WHERE id = $1 AND LOWER(user_email) = LOWER($2)',
            [id, userEmail.trim()]
          );
        } else {
          await pool.query('DELETE FROM tripnest_custom_plans WHERE id = $1', [id]);
        }
      } catch (e: any) {
        console.warn('Error deleting custom plan from Neon Postgres:', e.message);
      }
    }
  }

  return wasDeleted;
}

// ---------------------------------------------------------------------------
// TRIPS DB (Equivalent to Java Spring Boot Trip Model)
// ---------------------------------------------------------------------------
export interface TripDayItinerary {
  day: number;
  date?: string;
  title?: string;
  description: string;
}

export interface StoredTrip {
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

const TRIPS_FILE = path.join(DATA_DIR, 'trips.json');
let tripsCache: StoredTrip[] = [];

try {
  if (fs.existsSync(TRIPS_FILE)) {
    const raw = fs.readFileSync(TRIPS_FILE, 'utf-8');
    tripsCache = JSON.parse(raw) || [];
  }
} catch (e) {
  tripsCache = [];
}

export async function saveTripToDb(trip: StoredTrip): Promise<StoredTrip> {
  ensureDataDir();
  const now = new Date().toISOString();
  const item: StoredTrip = {
    ...trip,
    id: trip.id || `trip-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userEmail: trip.userEmail.toLowerCase().trim(),
    budgetCurrency: trip.budgetCurrency || 'INR',
    travelersCount: trip.travelersCount || 1,
    status: trip.status || 'Active',
    itinerary: trip.itinerary,
    createdAt: trip.createdAt || now,
    updatedAt: now
  };

  const idx = tripsCache.findIndex(t => t.id === item.id);
  if (idx >= 0) {
    tripsCache[idx] = item;
  } else {
    tripsCache.unshift(item);
  }

  try {
    fs.writeFileSync(TRIPS_FILE, JSON.stringify(tripsCache, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not save trips file:', err);
  }

  const pool = getPgPool();
  if (pool) {
    try {
      const itinerarySerialized = item.itinerary ? JSON.stringify(item.itinerary) : null;
      await pool.query(`
        INSERT INTO tripnest_trips (
          id, user_email, title, destination, start_date, end_date,
          budget_amount, budget_currency, travelers_count, status, notes, cover_image, itinerary, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          destination = EXCLUDED.destination,
          start_date = EXCLUDED.start_date,
          end_date = EXCLUDED.end_date,
          budget_amount = EXCLUDED.budget_amount,
          budget_currency = EXCLUDED.budget_currency,
          travelers_count = EXCLUDED.travelers_count,
          status = EXCLUDED.status,
          notes = EXCLUDED.notes,
          cover_image = EXCLUDED.cover_image,
          itinerary = EXCLUDED.itinerary,
          updated_at = NOW()
      `, [
        item.id, item.userEmail, item.title, item.destination, item.startDate || null, item.endDate || null,
        item.budgetAmount || 0, item.budgetCurrency, item.travelersCount, item.status, item.notes || null,
        item.coverImage || null, itinerarySerialized, item.createdAt, item.updatedAt
      ]);
    } catch (e: any) {
      console.warn('Error saving trip to Neon Postgres:', e.message);
    }
  }

  return item;
}

export async function getTripsFromDb(userEmail?: string): Promise<StoredTrip[]> {
  const pool = getPgPool();
  if (pool) {
    try {
      let query = 'SELECT * FROM tripnest_trips';
      const params: any[] = [];
      if (userEmail) {
        query += ' WHERE LOWER(user_email) = LOWER($1)';
        params.push(userEmail.trim());
      }
      query += ' ORDER BY created_at DESC';
      const res = await pool.query(query, params);
      if (res.rows && res.rows.length > 0) {
        return res.rows.map(r => {
          let parsedItinerary: TripDayItinerary[] | undefined = undefined;
          if (r.itinerary) {
            try {
              parsedItinerary = typeof r.itinerary === 'string' ? JSON.parse(r.itinerary) : r.itinerary;
            } catch {
              parsedItinerary = undefined;
            }
          }
          return {
            id: r.id,
            userEmail: r.user_email,
            title: r.title,
            destination: r.destination,
            startDate: r.start_date,
            endDate: r.end_date,
            budgetAmount: Number(r.budget_amount),
            budgetCurrency: r.budget_currency || 'INR',
            travelersCount: Number(r.travelers_count),
            status: r.status,
            notes: r.notes,
            itinerary: parsedItinerary,
            coverImage: r.cover_image,
            createdAt: r.created_at,
            updatedAt: r.updated_at
          };
        });
      }
    } catch (e: any) {
      console.warn('Error fetching trips from Neon Postgres:', e.message);
    }
  }

  if (userEmail) {
    const clean = userEmail.toLowerCase().trim();
    return tripsCache.filter(t => t.userEmail.toLowerCase().trim() === clean);
  }
  return [...tripsCache];
}

export async function getTripByIdFromDb(id: string): Promise<StoredTrip | null> {
  ensureDataDir();
  const pool = getPgPool();
  if (pool) {
    try {
      const res = await pool.query('SELECT * FROM tripnest_trips WHERE id = $1', [id]);
      if (res.rows && res.rows.length > 0) {
        const r = res.rows[0];
        let parsedItinerary: TripDayItinerary[] | undefined = undefined;
        if (r.itinerary) {
          try {
            parsedItinerary = typeof r.itinerary === 'string' ? JSON.parse(r.itinerary) : r.itinerary;
          } catch {
            parsedItinerary = undefined;
          }
        }
        return {
          id: r.id,
          userEmail: r.user_email,
          title: r.title,
          destination: r.destination,
          startDate: r.start_date,
          endDate: r.end_date,
          budgetAmount: Number(r.budget_amount),
          budgetCurrency: r.budget_currency || 'INR',
          travelersCount: Number(r.travelers_count),
          status: r.status,
          notes: r.notes,
          itinerary: parsedItinerary,
          coverImage: r.cover_image,
          createdAt: r.created_at,
          updatedAt: r.updated_at
        };
      }
    } catch (e: any) {
      console.warn('Error fetching trip by ID from Neon Postgres:', e.message);
    }
  }
  return tripsCache.find(t => t.id === id) || null;
}

export async function deleteTripFromDb(id: string, userEmail?: string): Promise<boolean> {
  ensureDataDir();
  const initialLength = tripsCache.length;
  tripsCache = tripsCache.filter(t => {
    if (t.id !== id) return true;
    if (userEmail && t.userEmail.toLowerCase().trim() !== userEmail.toLowerCase().trim()) {
      return true;
    }
    return false;
  });

  const wasDeleted = tripsCache.length < initialLength;
  if (wasDeleted) {
    try {
      fs.writeFileSync(TRIPS_FILE, JSON.stringify(tripsCache, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Could not update trips file after deletion:', err);
    }

    const pool = getPgPool();
    if (pool) {
      try {
        if (userEmail) {
          await pool.query(
            'DELETE FROM tripnest_trips WHERE id = $1 AND LOWER(user_email) = LOWER($2)',
            [id, userEmail.trim()]
          );
        } else {
          await pool.query('DELETE FROM tripnest_trips WHERE id = $1', [id]);
        }
      } catch (e: any) {
        console.warn('Error deleting trip from Neon Postgres:', e.message);
      }
    }
  }

  return wasDeleted;
}

export async function updateTripInDb(
  id: string,
  updates: Partial<StoredTrip>,
  userEmail?: string
): Promise<StoredTrip | null> {
  ensureDataDir();
  const tripIdx = tripsCache.findIndex((t) => {
    if (t.id !== id) return false;
    if (userEmail && t.userEmail.toLowerCase().trim() !== userEmail.toLowerCase().trim()) {
      return false;
    }
    return true;
  });

  const now = new Date().toISOString();
  let targetTrip: StoredTrip | null = null;

  if (tripIdx >= 0) {
    tripsCache[tripIdx] = {
      ...tripsCache[tripIdx],
      ...updates,
      updatedAt: now
    };
    targetTrip = tripsCache[tripIdx];
    try {
      fs.writeFileSync(TRIPS_FILE, JSON.stringify(tripsCache, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Could not update trips file:', err);
    }
  }

  const pool = getPgPool();
  if (pool) {
    try {
      const setClauses: string[] = [];
      const values: any[] = [];
      let paramIdx = 1;

      if (updates.title !== undefined) {
        setClauses.push(`title = $${paramIdx++}`);
        values.push(updates.title);
      }
      if (updates.destination !== undefined) {
        setClauses.push(`destination = $${paramIdx++}`);
        values.push(updates.destination);
      }
      if (updates.startDate !== undefined) {
        setClauses.push(`start_date = $${paramIdx++}`);
        values.push(updates.startDate);
      }
      if (updates.endDate !== undefined) {
        setClauses.push(`end_date = $${paramIdx++}`);
        values.push(updates.endDate);
      }
      if (updates.budgetAmount !== undefined) {
        setClauses.push(`budget_amount = $${paramIdx++}`);
        values.push(Number(updates.budgetAmount));
      }
      if (updates.travelersCount !== undefined) {
        setClauses.push(`travelers_count = $${paramIdx++}`);
        values.push(Number(updates.travelersCount));
      }
      if (updates.status !== undefined) {
        setClauses.push(`status = $${paramIdx++}`);
        values.push(updates.status);
      }
      if (updates.notes !== undefined) {
        setClauses.push(`notes = $${paramIdx++}`);
        values.push(updates.notes);
      }
      if (updates.coverImage !== undefined) {
        setClauses.push(`cover_image = $${paramIdx++}`);
        values.push(updates.coverImage);
      }
      if (updates.itinerary !== undefined) {
        setClauses.push(`itinerary = $${paramIdx++}`);
        values.push(updates.itinerary ? JSON.stringify(updates.itinerary) : null);
      }

      setClauses.push(`updated_at = NOW()`);

      let query = `UPDATE tripnest_trips SET ${setClauses.join(', ')} WHERE id = $${paramIdx++}`;
      values.push(id);

      if (userEmail) {
        query += ` AND LOWER(user_email) = LOWER($${paramIdx++})`;
        values.push(userEmail.trim());
      }
      query += ` RETURNING *`;

      const res = await pool.query(query, values);
      if (res.rows && res.rows.length > 0) {
        const r = res.rows[0];
        targetTrip = {
          id: r.id,
          userEmail: r.user_email,
          title: r.title,
          destination: r.destination,
          startDate: r.start_date,
          endDate: r.end_date,
          budgetAmount: Number(r.budget_amount),
          budgetCurrency: r.budget_currency || 'INR',
          travelersCount: Number(r.travelers_count),
          status: r.status,
          notes: r.notes,
          coverImage: r.cover_image,
          createdAt: r.created_at,
          updatedAt: r.updated_at
        };
      }
    } catch (e: any) {
      console.warn('Error updating trip in Neon Postgres:', e.message);
    }
  }

  return targetTrip;
}

export interface DetailedBookingRecord extends StoredBooking {
  customerName?: string;
  customerEmail?: string;
  membershipTier?: string;
  customerPhone?: string;
  durationNights?: number;
}

export async function getAllBookingsDetailed(userEmail?: string): Promise<DetailedBookingRecord[]> {
  const pool = getPgPool();
  if (pool) {
    try {
      let query = `
        SELECT b.*, u.full_name as user_full_name, u.membership_tier as user_tier
        FROM tripnest_bookings b
        LEFT JOIN tripnest_users u ON LOWER(b.user_email) = LOWER(u.email)
      `;
      const params: any[] = [];
      if (userEmail) {
        query += ` WHERE LOWER(b.user_email) = LOWER($1) OR LOWER(b.guest_email) = LOWER($1)`;
        params.push(userEmail.trim());
      }
      query += ` ORDER BY b.created_at DESC`;

      const res = await pool.query(query, params);
      if (res.rows && res.rows.length > 0) {
        return res.rows.map((r: any) => {
          let duration = 1;
          if (r.check_in_date && r.check_out_date) {
            const start = new Date(r.check_in_date).getTime();
            const end = new Date(r.check_out_date).getTime();
            if (!isNaN(start) && !isNaN(end) && end > start) {
              duration = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
            }
          }

          return {
            id: r.id,
            bookingCode: r.booking_code,
            userEmail: r.user_email,
            guestName: r.guest_name || r.user_full_name || 'VIP Traveler',
            guestEmail: r.guest_email || r.user_email,
            customerName: r.user_full_name || r.guest_name || 'VIP Traveler',
            customerEmail: r.user_email,
            membershipTier: r.user_tier || 'Elite Platinum',
            customerPhone: '+91 98450 12345',
            type: r.type || 'hotel',
            itemId: r.item_id,
            itemName: r.item_name,
            destinationName: r.destination_name,
            roomTierName: r.room_tier_name,
            checkInDate: r.check_in_date,
            checkOutDate: r.check_out_date,
            guestsCount: Number(r.guests_count) || 1,
            totalPriceUsd: Number(r.total_price_usd) || 0,
            paidCurrency: r.paid_currency || 'INR',
            paidAmount: Number(r.paid_amount) || Number(r.total_price_usd) || 0,
            status: r.status || 'Confirmed',
            paymentMethod: r.payment_method || 'UPI / Instant Bank Transfer',
            transactionId: r.transaction_id || `TXN-${r.booking_code}`,
            specialRequests: r.special_requests,
            image: r.image,
            address: r.address,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
            durationNights: duration
          };
        });
      }
    } catch (e: any) {
      console.warn('Error querying detailed bookings from Neon Postgres:', e.message);
    }
  }

  // Fallback to local bookings cache enriched with usersStore
  const list = getBookings(userEmail);
  return list.map((b) => {
    const user = Array.from(usersStore.values()).find(
      (u) => u.email.toLowerCase() === (b.userEmail || b.guestEmail || '').toLowerCase()
    );
    let duration = 1;
    if (b.checkInDate && b.checkOutDate) {
      const start = new Date(b.checkInDate).getTime();
      const end = new Date(b.checkOutDate).getTime();
      if (!isNaN(start) && !isNaN(end) && end > start) {
        duration = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
      }
    }
    return {
      ...b,
      customerName: user?.fullName || b.guestName || 'VIP Traveler',
      customerEmail: b.userEmail || b.guestEmail,
      membershipTier: user?.membershipTier || 'Royal Ambassador',
      customerPhone: '+91 98450 12345',
      durationNights: duration
    };
  });
}

// ---------------------------------------------------------------------------
// FAVORITES / WISHLIST DB
// ---------------------------------------------------------------------------
export interface StoredFavorite {
  id: string;
  userEmail: string;
  itemType: 'destination' | 'hotel' | 'experience';
  itemId: string;
  itemName: string;
  itemImage?: string;
  itemPrice?: number;
  currency?: string;
  createdAt?: string;
}

export async function addFavoriteToDb(fav: StoredFavorite): Promise<StoredFavorite> {
  const pool = getPgPool();
  const item: StoredFavorite = {
    ...fav,
    id: fav.id || `fav-${Date.now()}`,
    currency: fav.currency || 'INR',
    createdAt: fav.createdAt || new Date().toISOString()
  };

  if (pool) {
    try {
      await pool.query(`
        INSERT INTO tripnest_favorites (id, user_email, item_type, item_id, item_name, item_image, item_price, currency, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (user_email, item_type, item_id) DO NOTHING
      `, [
        item.id, item.userEmail.toLowerCase().trim(), item.itemType, item.itemId, item.itemName,
        item.itemImage || null, item.itemPrice || null, item.currency || 'INR', item.createdAt
      ]);
    } catch (e: any) {
      console.warn('Error adding favorite to Neon Postgres:', e.message);
    }
  }
  return item;
}

export async function getFavoritesFromDb(userEmail: string): Promise<StoredFavorite[]> {
  const cleanEmail = userEmail.toLowerCase().trim();
  const pool = getPgPool();
  if (pool) {
    try {
      const res = await pool.query(`
        SELECT id, user_email, item_type, item_id, item_name, item_image, item_price, currency, created_at
        FROM tripnest_favorites
        WHERE user_email = $1
        ORDER BY created_at DESC
      `, [cleanEmail]);

      return res.rows.map(r => ({
        id: r.id,
        userEmail: r.user_email,
        itemType: r.item_type,
        itemId: r.item_id,
        itemName: r.item_name,
        itemImage: r.item_image,
        itemPrice: Number(r.item_price),
        currency: r.currency || 'INR',
        createdAt: r.created_at
      }));
    } catch (e: any) {
      console.warn('Error fetching favorites from Neon Postgres:', e.message);
    }
  }
  return [];
}

export async function removeFavoriteFromDb(userEmail: string, itemType: string, itemId: string): Promise<boolean> {
  const pool = getPgPool();
  if (pool) {
    try {
      await pool.query(`
        DELETE FROM tripnest_favorites
        WHERE user_email = $1 AND item_type = $2 AND item_id = $3
      `, [userEmail.toLowerCase().trim(), itemType, itemId]);
      return true;
    } catch (e: any) {
      console.warn('Error removing favorite from Neon Postgres:', e.message);
    }
  }
  return true;
}

// ---------------------------------------------------------------------------
// DESTINATION ROADMAPS (Where to Stay & Where to Live)
// ---------------------------------------------------------------------------
export interface DestinationRoadmapDay {
  day: number;
  title: string;
  theme: string;
  whereToStay: {
    hotelId?: string;
    hotelName: string;
    roomTierName: string;
    pricePerNightUsd: number;
    address: string;
    highlights: string[];
    image?: string;
  };
  whereToLive: {
    neighborhood: string;
    vibe: string;
    morningActivity: string;
    afternoonActivity: string;
    eveningDining: string;
    highlights: string[];
  };
  transit: string;
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
  days: DestinationRoadmapDay[];
  createdAt: string;
  updatedAt: string;
}

const roadmapsStore = new Map<string, DestinationRoadmap>();

export async function saveDestinationRoadmap(roadmap: DestinationRoadmap): Promise<DestinationRoadmap> {
  const key = `${roadmap.destinationId.toLowerCase()}-${roadmap.daysCount}-${(roadmap.userEmail || 'public').toLowerCase()}`;
  roadmapsStore.set(key, roadmap);

  const pool = getPgPool();
  if (pool) {
    try {
      await pool.query(`
        INSERT INTO tripnest_destination_roadmaps (
          id, destination_id, destination_name, user_email, days_count, title, overview, days_data, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          overview = EXCLUDED.overview,
          days_data = EXCLUDED.days_data,
          updated_at = NOW()
      `, [
        roadmap.id,
        roadmap.destinationId.toLowerCase().trim(),
        roadmap.destinationName,
        roadmap.userEmail ? roadmap.userEmail.toLowerCase().trim() : null,
        roadmap.daysCount,
        roadmap.title,
        roadmap.overview,
        JSON.stringify(roadmap.days),
        roadmap.createdAt || new Date().toISOString(),
        roadmap.updatedAt || new Date().toISOString()
      ]);
    } catch (e: any) {
      console.warn('Error saving destination roadmap to Neon Postgres:', e.message);
    }
  }

  return roadmap;
}

export async function getDestinationRoadmapFromDb(
  destinationId: string,
  daysCount: number,
  userEmail?: string
): Promise<DestinationRoadmap | undefined> {
  const normDest = destinationId.toLowerCase().trim();
  const pool = getPgPool();

  if (pool) {
    try {
      // 1. Try user-specific roadmap first if userEmail provided
      if (userEmail) {
        const userRes = await pool.query(`
          SELECT * FROM tripnest_destination_roadmaps
          WHERE (LOWER(destination_id) = $1 OR LOWER(destination_name) ILIKE $2)
            AND days_count = $3
            AND LOWER(user_email) = $4
          ORDER BY updated_at DESC LIMIT 1
        `, [normDest, `%${normDest}%`, daysCount, userEmail.toLowerCase().trim()]);

        if (userRes.rows.length > 0) {
          const row = userRes.rows[0];
          return {
            id: row.id,
            destinationId: row.destination_id,
            destinationName: row.destination_name,
            userEmail: row.user_email,
            daysCount: row.days_count,
            title: row.title,
            overview: row.overview,
            days: typeof row.days_data === 'string' ? JSON.parse(row.days_data) : row.days_data,
            createdAt: row.created_at,
            updatedAt: row.updated_at
          };
        }
      }

      // 2. Fall back to curated/default roadmap
      const genericRes = await pool.query(`
        SELECT * FROM tripnest_destination_roadmaps
        WHERE (LOWER(destination_id) = $1 OR LOWER(destination_name) ILIKE $2)
          AND days_count = $3
        ORDER BY (user_email IS NOT NULL) ASC, updated_at DESC LIMIT 1
      `, [normDest, `%${normDest}%`, daysCount]);

      if (genericRes.rows.length > 0) {
        const row = genericRes.rows[0];
        return {
          id: row.id,
          destinationId: row.destination_id,
          destinationName: row.destination_name,
          userEmail: row.user_email,
          daysCount: row.days_count,
          title: row.title,
          overview: row.overview,
          days: typeof row.days_data === 'string' ? JSON.parse(row.days_data) : row.days_data,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
      }
    } catch (e: any) {
      console.warn('Error fetching destination roadmap from Neon Postgres:', e.message);
    }
  }

  // Fallback to in-memory map
  const userKey = `${normDest}-${daysCount}-${(userEmail || 'public').toLowerCase()}`;
  if (roadmapsStore.has(userKey)) return roadmapsStore.get(userKey);

  const fallbackKey = `${normDest}-${daysCount}-public`;
  if (roadmapsStore.has(fallbackKey)) return roadmapsStore.get(fallbackKey);

  return undefined;
}

// ---------------------------------------------------------------------------
// DEDICATED ITINERARIES DB (/api/iternary backend store)
// ---------------------------------------------------------------------------
export interface StoredItinerary {
  id: string;
  tripId?: string;
  userEmail?: string;
  title: string;
  destination: string;
  daysCount: number;
  startDate?: string;
  endDate?: string;
  days: any[]; // Array of TripDayItinerary with day, theme, date, activities
  isProminent?: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

const ITINERARIES_FILE = path.join(DATA_DIR, 'itineraries.json');
let itinerariesCache: StoredItinerary[] = [];

try {
  if (fs.existsSync(ITINERARIES_FILE)) {
    const raw = fs.readFileSync(ITINERARIES_FILE, 'utf-8');
    itinerariesCache = JSON.parse(raw) || [];
  }
} catch (e) {
  itinerariesCache = [];
}

export async function saveItineraryToDb(input: Partial<StoredItinerary>): Promise<StoredItinerary> {
  ensureDataDir();
  const now = new Date().toISOString();
  const id = input.id || (input.tripId ? `itin-${input.tripId}` : `itin-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`);
  const days = Array.isArray(input.days) ? input.days : [];
  const daysCount = typeof input.daysCount === 'number' && input.daysCount > 0 ? input.daysCount : (days.length > 0 ? days.length : 1);

  const item: StoredItinerary = {
    id,
    tripId: input.tripId || undefined,
    userEmail: input.userEmail ? input.userEmail.toLowerCase().trim() : undefined,
    title: input.title || 'Curated Itinerary',
    destination: input.destination || 'Global Haven',
    daysCount,
    startDate: input.startDate || undefined,
    endDate: input.endDate || undefined,
    days,
    isProminent: !!input.isProminent,
    notes: input.notes || undefined,
    createdAt: input.createdAt || now,
    updatedAt: now
  };

  const idx = itinerariesCache.findIndex(it => it.id === item.id || (item.tripId && it.tripId === item.tripId));
  if (idx >= 0) {
    itinerariesCache[idx] = item;
  } else {
    itinerariesCache.unshift(item);
  }

  try {
    fs.writeFileSync(ITINERARIES_FILE, JSON.stringify(itinerariesCache, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not save itineraries file:', err);
  }

  // Also sync to trip if tripId matches in tripsCache
  if (item.tripId) {
    const tIdx = tripsCache.findIndex(t => t.id === item.tripId);
    if (tIdx >= 0) {
      tripsCache[tIdx].itinerary = item.days;
      tripsCache[tIdx].updatedAt = now;
      try {
        fs.writeFileSync(TRIPS_FILE, JSON.stringify(tripsCache, null, 2), 'utf-8');
      } catch {}
    }
  }

  const pool = getPgPool();
  if (pool) {
    try {
      await pool.query(`
        INSERT INTO tripnest_itineraries (
          id, trip_id, user_email, title, destination, days_count, start_date, end_date, days_data, is_prominent, notes, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO UPDATE SET
          trip_id = EXCLUDED.trip_id,
          user_email = EXCLUDED.user_email,
          title = EXCLUDED.title,
          destination = EXCLUDED.destination,
          days_count = EXCLUDED.days_count,
          start_date = EXCLUDED.start_date,
          end_date = EXCLUDED.end_date,
          days_data = EXCLUDED.days_data,
          is_prominent = EXCLUDED.is_prominent,
          notes = EXCLUDED.notes,
          updated_at = NOW()
      `, [
        item.id,
        item.tripId || null,
        item.userEmail || null,
        item.title,
        item.destination,
        item.daysCount,
        item.startDate || null,
        item.endDate || null,
        JSON.stringify(item.days),
        item.isProminent,
        item.notes || null,
        item.createdAt,
        item.updatedAt
      ]);

      // If tripId is provided, also synchronize the itinerary column in tripnest_trips
      if (item.tripId) {
        await pool.query(`
          UPDATE tripnest_trips
          SET itinerary = $1, updated_at = NOW()
          WHERE id = $2
        `, [JSON.stringify(item.days), item.tripId]);
      }
    } catch (e: any) {
      console.warn('Error saving itinerary to Neon Postgres:', e.message);
    }
  }

  return item;
}

export async function getItinerariesFromDb(filter?: {
  tripId?: string;
  userEmail?: string;
  destination?: string;
}): Promise<StoredItinerary[]> {
  const pool = getPgPool();
  if (pool) {
    try {
      let query = 'SELECT * FROM tripnest_itineraries WHERE 1=1';
      const params: any[] = [];
      let pIdx = 1;

      if (filter?.tripId) {
        query += ` AND (trip_id = $${pIdx} OR id = $${pIdx})`;
        params.push(filter.tripId);
        pIdx++;
      }
      if (filter?.userEmail) {
        query += ` AND LOWER(user_email) = LOWER($${pIdx})`;
        params.push(filter.userEmail.trim());
        pIdx++;
      }
      if (filter?.destination) {
        query += ` AND (LOWER(destination) ILIKE $${pIdx} OR LOWER(title) ILIKE $${pIdx})`;
        params.push(`%${filter.destination.toLowerCase().trim()}%`);
        pIdx++;
      }

      query += ' ORDER BY updated_at DESC';
      const res = await pool.query(query, params);

      if (res.rows && res.rows.length > 0) {
        return res.rows.map(r => ({
          id: r.id,
          tripId: r.trip_id,
          userEmail: r.user_email,
          title: r.title,
          destination: r.destination,
          daysCount: Number(r.days_count),
          startDate: r.start_date,
          endDate: r.end_date,
          days: typeof r.days_data === 'string' ? JSON.parse(r.days_data) : r.days_data,
          isProminent: Boolean(r.is_prominent),
          notes: r.notes,
          createdAt: r.created_at,
          updatedAt: r.updated_at
        }));
      }
    } catch (e: any) {
      console.warn('Error fetching itineraries from Neon Postgres:', e.message);
    }
  }

  // Fallback cache
  let list = [...itinerariesCache];
  if (filter?.tripId) {
    list = list.filter(i => i.tripId === filter.tripId || i.id === filter.tripId);
  }
  if (filter?.userEmail) {
    const clean = filter.userEmail.toLowerCase().trim();
    list = list.filter(i => i.userEmail && i.userEmail.toLowerCase().trim() === clean);
  }
  if (filter?.destination) {
    const dest = filter.destination.toLowerCase().trim();
    list = list.filter(i => i.destination.toLowerCase().includes(dest) || i.title.toLowerCase().includes(dest));
  }
  return list;
}

export async function getItineraryByIdFromDb(idOrTripId: string): Promise<StoredItinerary | null> {
  const pool = getPgPool();
  if (pool) {
    try {
      const res = await pool.query(
        'SELECT * FROM tripnest_itineraries WHERE id = $1 OR trip_id = $1 LIMIT 1',
        [idOrTripId]
      );
      if (res.rows && res.rows.length > 0) {
        const r = res.rows[0];
        return {
          id: r.id,
          tripId: r.trip_id,
          userEmail: r.user_email,
          title: r.title,
          destination: r.destination,
          daysCount: Number(r.days_count),
          startDate: r.start_date,
          endDate: r.end_date,
          days: typeof r.days_data === 'string' ? JSON.parse(r.days_data) : r.days_data,
          isProminent: Boolean(r.is_prominent),
          notes: r.notes,
          createdAt: r.created_at,
          updatedAt: r.updated_at
        };
      }
    } catch (e: any) {
      console.warn('Error fetching itinerary by ID from Neon Postgres:', e.message);
    }
  }

  return itinerariesCache.find(i => i.id === idOrTripId || i.tripId === idOrTripId) || null;
}

export async function updateItineraryInDb(idOrTripId: string, updates: Partial<StoredItinerary>): Promise<StoredItinerary | null> {
  const existing = await getItineraryByIdFromDb(idOrTripId);
  if (!existing) {
    return saveItineraryToDb({ id: idOrTripId, ...updates });
  }

  const merged: StoredItinerary = {
    ...existing,
    ...updates,
    days: Array.isArray(updates.days) ? updates.days : existing.days,
    daysCount: updates.daysCount || (Array.isArray(updates.days) ? updates.days.length : existing.daysCount),
    updatedAt: new Date().toISOString()
  };

  return saveItineraryToDb(merged);
}

export async function deleteItineraryFromDb(idOrTripId: string): Promise<boolean> {
  const initialLength = itinerariesCache.length;
  itinerariesCache = itinerariesCache.filter(i => i.id !== idOrTripId && i.tripId !== idOrTripId);
  const wasDeleted = itinerariesCache.length < initialLength;

  try {
    fs.writeFileSync(ITINERARIES_FILE, JSON.stringify(itinerariesCache, null, 2), 'utf-8');
  } catch {}

  const pool = getPgPool();
  if (pool) {
    try {
      await pool.query('DELETE FROM tripnest_itineraries WHERE id = $1 OR trip_id = $1', [idOrTripId]);
    } catch (e: any) {
      console.warn('Error deleting itinerary from Neon Postgres:', e.message);
    }
  }

  return wasDeleted;
}




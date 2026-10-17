import "dotenv/config";
import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { handleAiChat, generateAiItinerary } from "./server/ai";
import { sendOtpEmail, sendGoogleWelcomeEmail, otpStore, StoredUser } from "./server/email";
import { fetchLiveVerifiedPlaces } from "./server/places";
import {
  getBookings,
  saveBooking,
  updateBookingStatus,
  saveAiChat,
  getAiChats,
  StoredBooking,
  initPostgresTables,
  getPgPool,
  isPostgresConnected,
  findUserInDb,
  saveUserToDb,
  usersStore,
  saveUsersToFile,
  saveCustomPlanToDb,
  getCustomPlansFromDb,
  deleteCustomPlanFromDb,
  saveTripToDb,
  getTripsFromDb,
  getTripByIdFromDb,
  deleteTripFromDb,
  updateTripInDb,
  getAllBookingsDetailed,
  StoredTrip,
  getBookingById,
  updateBookingInDb,
  deleteBookingFromDb,
  getAllUsersFromDb,
  deleteUserFromDb,
  addFavoriteToDb,
  getFavoritesFromDb,
  removeFavoriteFromDb,
  deductUserPoints,
  saveDestinationRoadmap,
  getDestinationRoadmapFromDb,
  DestinationRoadmap,
  saveItineraryToDb,
  getItinerariesFromDb,
  getItineraryByIdFromDb,
  updateItineraryInDb,
  deleteItineraryFromDb,
  StoredItinerary,
  updateUserRoleInDb,
  isRecognizedAdminEmail
} from "./server/db";
import {
  getExpenseCategoryReport,
  getPlannedVsActualReport,
  getTrendsReport,
  getFullReportsData,
  getTravelerAnalytics,
  getAdminAnalytics
} from "./server/analyticsDb";
import {
  getBudgetForTripFromDb,
  saveBudgetToDb,
  calculateBudgetOverview,
  getExpensesForTripFromDb,
  addExpenseToDb,
  updateExpenseInDb,
  deleteExpenseFromDb,
  getExpenseSummaryReport,
  getTravelGroupsFromDb,
  createTravelGroupInDb,
  updateTravelGroupInDb,
  getGroupMembersFromDb,
  addGroupMemberToDb,
  updateGroupMemberRoleInDb,
  updateGroupMemberBudgetInDb,
  removeGroupMemberFromDb,
  joinGroupByInviteCodeInDb,
  getGroupDiscussionsFromDb,
  postGroupDiscussionInDb,
  getGroupSharedExpensesData,
  markSettlementSettledInDb,
  getUserNotificationsFromDb,
  createNotificationInDb,
  markNotificationReadInDb,
  markAllNotificationsReadInDb,
  deleteNotificationInDb,
  getMediaDocumentsFromDb,
  addMediaDocumentToDb,
  deleteMediaDocumentFromDb,
  getAllTravelGroupsForAdmin
} from "./server/featuresDb";
import { startJavaBackend, forwardToJava, getJavaStatus } from "./server/javaLauncher";
import { MASTER_DESTINATIONS, generateDestinationWithAi, generateProceduralDestination, getLiveWeather } from "./server/destinations";

// Standard Email Regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increased JSON and URL-encoded payload limit (50MB) for photo/document uploads & base64 attachments
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Graceful payload-too-large handler
  app.use((err: any, req: Request, res: Response, next: any) => {
    if (err?.type === "entity.too.large" || err?.status === 413 || err?.name === "PayloadTooLargeError") {
      return res.status(413).json({
        error: "Request payload is too large. Maximum upload size allowed is 50MB.",
        code: "PAYLOAD_TOO_LARGE"
      });
    }
    next(err);
  });

  // CORS & Security Headers
  app.use((req: Request, res: Response, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // Initialize Neon PostgreSQL tables if DATABASE_URL is configured
  await initPostgresTables();

  // Launch Java Spring Boot backend concurrently (if Java runtime is detected)
  startJavaBackend();

  // Java Spring Boot Backend Health & Readiness Diagnostic
  app.get("/api/java/status", (req: Request, res: Response) => {
    res.json(getJavaStatus());
  });

  // API Health Check
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({
      status: "ok",
      app: "TripNest",
      version: "1.0.0",
      aiModel: "gemini-2.5-flash",
      postgresConnected: isPostgresConnected(),
      time: new Date().toISOString()
    });
  });

  // Neon PostgreSQL Realtime Connection Status
  app.get("/api/db/status", async (req: Request, res: Response) => {
    const pool = getPgPool();
    if (!pool) {
      res.json({
        connected: false,
        driver: "Local High-Speed Cache + Disk Mirroring",
        message: "DATABASE_URL secret is ready to be configured. Enter your Neon PostgreSQL link in Settings > Secrets for instant cloud sync.",
        stats: {
          users: usersStore.size,
          bookings: getBookings().length,
          aiChats: getAiChats().length
        }
      });
      return;
    }

    try {
      const client = await pool.connect();
      const uRes = await client.query("SELECT COUNT(*) FROM tripnest_users");
      const bRes = await client.query("SELECT COUNT(*) FROM tripnest_bookings");
      const cRes = await client.query("SELECT COUNT(*) FROM tripnest_ai_chats");
      const pRes = await client.query("SELECT COUNT(*) FROM tripnest_custom_plans");
      const fRes = await client.query("SELECT COUNT(*) FROM tripnest_favorites");
      const dRes = await client.query("SELECT COUNT(*) FROM tripnest_destinations");
      const hRes = await client.query("SELECT COUNT(*) FROM tripnest_hotels");
      const eRes = await client.query("SELECT COUNT(*) FROM tripnest_experiences");
      const rRes = await client.query("SELECT COUNT(*) FROM tripnest_reviews");
      const oRes = await client.query("SELECT COUNT(*) FROM tripnest_otp_codes");
      const tRes = await client.query("SELECT COUNT(*) FROM tripnest_trips");
      let itinCount = 0;
      let budgetCount = 0;
      let expenseCount = 0;
      let groupCount = 0;
      let notifCount = 0;
      let mediaCount = 0;
      try {
        const iRes = await client.query("SELECT COUNT(*) FROM tripnest_itineraries");
        itinCount = parseInt(iRes.rows[0].count, 10);
      } catch {}
      try {
        const bdRes = await client.query("SELECT COUNT(*) FROM tripnest_budgets");
        budgetCount = parseInt(bdRes.rows[0].count, 10);
      } catch {}
      try {
        const expRes = await client.query("SELECT COUNT(*) FROM tripnest_expenses");
        expenseCount = parseInt(expRes.rows[0].count, 10);
      } catch {}
      try {
        const grpRes = await client.query("SELECT COUNT(*) FROM tripnest_travel_groups");
        groupCount = parseInt(grpRes.rows[0].count, 10);
      } catch {}
      try {
        const nRes = await client.query("SELECT COUNT(*) FROM tripnest_notifications");
        notifCount = parseInt(nRes.rows[0].count, 10);
      } catch {}
      try {
        const mRes = await client.query("SELECT COUNT(*) FROM tripnest_media_documents");
        mediaCount = parseInt(mRes.rows[0].count, 10);
      } catch {}
      client.release();

      res.json({
        connected: true,
        driver: "Neon PostgreSQL (Cloud Serverless)",
        message: "Complete enterprise database active with tables synchronized in Neon Postgres.",
        tables: [
          'tripnest_users', 'tripnest_bookings', 'tripnest_trips', 'tripnest_itineraries',
          'tripnest_budgets', 'tripnest_expenses', 'tripnest_travel_groups', 'tripnest_group_members',
          'tripnest_group_discussions', 'tripnest_shared_settlements', 'tripnest_notifications',
          'tripnest_media_documents', 'tripnest_custom_plans', 'tripnest_favorites',
          'tripnest_destinations', 'tripnest_hotels', 'tripnest_experiences',
          'tripnest_reviews', 'tripnest_ai_chats', 'tripnest_otp_codes'
        ],
        stats: {
          users: parseInt(uRes.rows[0].count, 10),
          bookings: parseInt(bRes.rows[0].count, 10),
          trips: parseInt(tRes.rows[0].count, 10),
          itineraries: itinCount,
          budgets: budgetCount,
          expenses: expenseCount,
          travelGroups: groupCount,
          notifications: notifCount,
          mediaDocuments: mediaCount,
          aiChats: parseInt(cRes.rows[0].count, 10),
          customPlans: parseInt(pRes.rows[0].count, 10),
          favorites: parseInt(fRes.rows[0].count, 10),
          destinations: parseInt(dRes.rows[0].count, 10),
          hotels: parseInt(hRes.rows[0].count, 10),
          experiences: parseInt(eRes.rows[0].count, 10),
          reviews: parseInt(rRes.rows[0].count, 10),
          otpCodes: parseInt(oRes.rows[0].count, 10)
        }
      });
    } catch (err: any) {
      res.json({
        connected: false,
        driver: "Neon PostgreSQL",
        error: err.message,
        message: "Connecting to Neon Postgres... Serving real-time local cache.",
        stats: {
          users: usersStore.size,
          bookings: getBookings().length,
          aiChats: getAiChats().length
        }
      });
    }
  });

  // DB Tables Schema & Metadata API (For Postman & DB Inspection)
  app.get("/api/db/tables", async (req: Request, res: Response) => {
    const tableDefinitions = [
      {
        name: "tripnest_bookings",
        description: "Customer bookings, hotel/experience reservations, prices, statuses, and timestamps",
        columns: [
          { name: "id", type: "VARCHAR(255)", key: "PRIMARY KEY" },
          { name: "booking_code", type: "VARCHAR(100)", key: "UNIQUE" },
          { name: "user_email", type: "VARCHAR(255)", key: "INDEX" },
          { name: "guest_name", type: "VARCHAR(255)" },
          { name: "guest_email", type: "VARCHAR(255)" },
          { name: "type", type: "VARCHAR(50)" },
          { name: "item_id", type: "VARCHAR(255)" },
          { name: "item_name", type: "VARCHAR(255)" },
          { name: "destination_name", type: "VARCHAR(255)" },
          { name: "room_tier_name", type: "VARCHAR(255)" },
          { name: "check_in_date", type: "VARCHAR(50)" },
          { name: "check_out_date", type: "VARCHAR(50)" },
          { name: "guests_count", type: "INTEGER DEFAULT 1" },
          { name: "total_price_usd", type: "NUMERIC" },
          { name: "paid_currency", type: "VARCHAR(20) DEFAULT 'INR'" },
          { name: "paid_amount", type: "NUMERIC" },
          { name: "status", type: "VARCHAR(50) DEFAULT 'Confirmed'" },
          { name: "payment_method", type: "VARCHAR(50)" },
          { name: "transaction_id", type: "VARCHAR(100)" },
          { name: "special_requests", type: "TEXT" },
          { name: "created_at", type: "TIMESTAMPTZ DEFAULT NOW()" },
          { name: "updated_at", type: "TIMESTAMPTZ DEFAULT NOW()" }
        ]
      },
      {
        name: "tripnest_trips",
        description: "Custom planned trips with dynamic day-by-day itineraries and budgets",
        columns: [
          { name: "id", type: "VARCHAR(255)", key: "PRIMARY KEY" },
          { name: "user_email", type: "VARCHAR(255)", key: "INDEX" },
          { name: "title", type: "VARCHAR(255)" },
          { name: "destination", type: "VARCHAR(255)" },
          { name: "start_date", type: "VARCHAR(50)" },
          { name: "end_date", type: "VARCHAR(50)" },
          { name: "budget_amount", type: "NUMERIC DEFAULT 0" },
          { name: "budget_currency", type: "VARCHAR(10) DEFAULT 'INR'" },
          { name: "travelers_count", type: "INTEGER DEFAULT 1" },
          { name: "status", type: "VARCHAR(50) DEFAULT 'Active'" },
          { name: "notes", type: "TEXT" },
          { name: "cover_image", type: "TEXT" },
          { name: "itinerary", type: "TEXT (JSON Array of Day Activities)" },
          { name: "created_at", type: "TIMESTAMPTZ DEFAULT NOW()" },
          { name: "updated_at", type: "TIMESTAMPTZ DEFAULT NOW()" }
        ]
      },
      {
        name: "tripnest_users",
        description: "Registered accounts, VIP membership tiers, loyalty points, and OAuth federation",
        columns: [
          { name: "id", type: "VARCHAR(255)", key: "PRIMARY KEY" },
          { name: "email", type: "VARCHAR(255)", key: "UNIQUE INDEX" },
          { name: "full_name", type: "VARCHAR(255)" },
          { name: "password", type: "VARCHAR(255)" },
          { name: "is_email_verified", type: "BOOLEAN DEFAULT TRUE" },
          { name: "membership_tier", type: "VARCHAR(50) DEFAULT 'Member'" },
          { name: "points", type: "INTEGER DEFAULT 1000" },
          { name: "provider", type: "VARCHAR(50) DEFAULT 'local'" },
          { name: "created_at", type: "TIMESTAMPTZ DEFAULT NOW()" },
          { name: "updated_at", type: "TIMESTAMPTZ DEFAULT NOW()" }
        ]
      },
      {
        name: "tripnest_custom_plans",
        description: "Curated multi-day itineraries and concierge planning sheets",
        columns: [
          { name: "id", type: "VARCHAR(255)", key: "PRIMARY KEY" },
          { name: "user_email", type: "VARCHAR(255)", key: "INDEX" },
          { name: "plan_title", type: "VARCHAR(255)" },
          { name: "destination_name", type: "VARCHAR(255)" },
          { name: "start_date", type: "VARCHAR(50)" },
          { name: "end_date", type: "VARCHAR(50)" },
          { name: "budget_amount", type: "NUMERIC" },
          { name: "days_data", type: "JSONB" },
          { name: "created_at", type: "TIMESTAMPTZ DEFAULT NOW()" }
        ]
      },
      {
        name: "tripnest_favorites",
        description: "Saved hotels, destinations, and experiences wishlist per user",
        columns: [
          { name: "id", type: "VARCHAR(255)", key: "PRIMARY KEY" },
          { name: "user_email", type: "VARCHAR(255)", key: "INDEX" },
          { name: "item_type", type: "VARCHAR(50)" },
          { name: "item_id", type: "VARCHAR(255)" },
          { name: "item_name", type: "VARCHAR(255)" },
          { name: "created_at", type: "TIMESTAMPTZ DEFAULT NOW()" }
        ]
      }
    ];

    res.json({
      success: true,
      count: tableDefinitions.length,
      database: isPostgresConnected() ? "Neon PostgreSQL (Cloud Serverless)" : "TripNest High-Performance Storage Engine",
      connected: isPostgresConnected(),
      tables: tableDefinitions
    });
  });

  // ==========================================
  // AUTHENTICATION & OTP ENDPOINTS
  // ==========================================

  // Check if an email is registered
  app.post("/api/auth/check-email", (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email || !EMAIL_REGEX.test(email.trim().toLowerCase())) {
      res.status(400).json({ error: "Please enter a valid email address format (e.g. name@domain.com)." });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = usersStore.get(normalizedEmail);
    if (existingUser) {
      const isFederated = !!(existingUser.provider === "google" || existingUser.googleId || existingUser.federationDetails);
      res.json({
        exists: true,
        isFederated,
        provider: existingUser.provider || (isFederated ? "google" : "local"),
        message: isFederated
          ? "This email is already registered via Google Sign-In. You cannot sign up again with this email. You can log in directly using Google or your account credentials."
          : "This email is already registered. You cannot sign up again with this email. You can log in directly with your user details."
      });
      return;
    }

    res.json({ exists: false });
  });

  // Request OTP for Registration or Password Reset
  app.post("/api/auth/send-otp", async (req: Request, res: Response) => {
    try {
      const { email, type = "register", fullName } = req.body;

      if (!email || !EMAIL_REGEX.test(email.trim().toLowerCase())) {
        res.status(400).json({ error: "Invalid email format. Please provide a valid email address." });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Check registration constraint
      if (type === "register") {
        const existingUser = usersStore.get(normalizedEmail);
        if (existingUser) {
          const isFederated = !!(existingUser.provider === "google" || existingUser.googleId || existingUser.federationDetails);
          if (isFederated) {
            res.status(400).json({
              error: "This email is already registered via Google Sign-In. You cannot sign up again with this email. You can log in directly using Google or your account credentials.",
              alreadyRegistered: true,
              isFederated: true,
              provider: "google",
              email: normalizedEmail
            });
            return;
          }
          res.status(400).json({
            error: "This email is already registered. You cannot sign up again with this email. You can log in directly with your user details.",
            alreadyRegistered: true,
            isFederated: false,
            email: normalizedEmail
          });
          return;
        }
      } else if (type === "reset") {
        if (!usersStore.has(normalizedEmail)) {
          res.status(404).json({
            error: "No account registered with this email address. Please check your email or create an account."
          });
          return;
        }
      }

      // Generate secure random 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 mins

      otpStore.set(normalizedEmail, {
        otp,
        expiresAt,
        type,
        fullName: fullName?.trim()
      });

      const dispatchResult = await sendOtpEmail({
        email: normalizedEmail,
        otp,
        type,
        fullName
      });

      res.json({
        success: true,
        message: dispatchResult.message,
        email: normalizedEmail,
        emailSent: dispatchResult.emailSent
      });
    } catch (err: any) {
      console.error("Error sending OTP:", err);
      res.status(500).json({ error: err.message || "Failed to generate and send OTP" });
    }
  });

  // Verify OTP
  app.post("/api/auth/verify-otp", (req: Request, res: Response) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
      res.status(400).json({ error: "Email and 6-digit OTP are required." });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const stored = otpStore.get(normalizedEmail);

    if (!stored) {
      res.status(400).json({ error: "No OTP was requested for this email or it has expired. Please request a new OTP." });
      return;
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(normalizedEmail);
      res.status(400).json({ error: "OTP has expired. Please request a new 6-digit code." });
      return;
    }

    if (stored.otp !== otp.trim()) {
      res.status(400).json({ error: "Incorrect 6-digit OTP. Please check your email and try again." });
      return;
    }

    res.json({
      success: true,
      message: "Email successfully verified!"
    });
  });

  // Register New Account
  app.post("/api/auth/register", (req: Request, res: Response) => {
    const { fullName, email, password, otp } = req.body;

    if (!fullName || fullName.trim().length < 2) {
      res.status(400).json({ error: "Please enter your full name (minimum 2 characters)." });
      return;
    }

    if (!email || !EMAIL_REGEX.test(email.trim().toLowerCase())) {
      res.status(400).json({ error: "Please enter a valid email address (e.g. name@domain.com)." });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = usersStore.get(normalizedEmail);
    if (existingUser) {
      const isFederated = !!(existingUser.provider === "google" || existingUser.googleId || existingUser.federationDetails);
      if (isFederated) {
        res.status(400).json({
          error: "This email is already registered via Google Sign-In. You cannot sign up again with this email. You can log in directly using Google or your account credentials.",
          alreadyRegistered: true,
          isFederated: true,
          provider: "google",
          email: normalizedEmail
        });
        return;
      }
      res.status(400).json({
        error: "This email is already registered. You cannot sign up again with this email. You can log in directly with your user details.",
        alreadyRegistered: true,
        isFederated: false,
        email: normalizedEmail
      });
      return;
    }

    if (!password || password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters long." });
      return;
    }

    // Verify OTP
    const stored = otpStore.get(normalizedEmail);
    if (!stored || stored.otp !== otp?.trim() || Date.now() > stored.expiresAt) {
      res.status(400).json({ error: "Invalid or expired OTP verification. Please verify your email first." });
      return;
    }

    // Create user record
    const newUser: StoredUser = {
      id: `usr-${Date.now()}`,
      fullName: fullName.trim(),
      email: normalizedEmail,
      password: password,
      isEmailVerified: true,
      createdAt: new Date().toISOString(),
      membershipTier: "Champagne Gold VIP",
      points: 25000,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
    };

    usersStore.set(normalizedEmail, newUser);
    saveUsersToFile(usersStore);
    otpStore.delete(normalizedEmail);

    res.json({
      success: true,
      message: "Account created and email verified successfully!",
      user: {
        id: newUser.id,
        name: newUser.fullName,
        email: newUser.email,
        membershipTier: newUser.membershipTier,
        points: newUser.points,
        avatar: newUser.avatar,
        role: newUser.role || 'traveler'
      }
    });
  });

  // Login
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !EMAIL_REGEX.test(email.trim().toLowerCase())) {
      res.status(400).json({ error: "Please enter a valid email format." });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    let user = usersStore.get(normalizedEmail);
    if (!user) {
      user = await findUserInDb(normalizedEmail);
    }

    // Always guarantee the official Administrator account can log in immediately
    if (!user && normalizedEmail === 'tripnestoneofficial@gmail.com') {
      user = {
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
      };
      usersStore.set(normalizedEmail, user);
      await saveUserToDb(user);
    }

    if (!user) {
      res.status(404).json({
        error: "No account matched with this email. Please register first."
      });
      return;
    }

    if (user.password !== password) {
      res.status(401).json({
        error: "Incorrect password. Please verify your passcode or click Forgot Password."
      });
      return;
    }

    const assignedRole = (isRecognizedAdminEmail(user.email) || user.role === 'admin') ? 'admin' : 'traveler';

    res.json({
      success: true,
      message: "Login successful!",
      user: {
        id: user.id,
        name: user.fullName,
        email: user.email,
        membershipTier: user.membershipTier,
        points: user.points,
        avatar: user.avatar,
        role: assignedRole
      }
    });
  });

  // Reset Password
  app.post("/api/auth/reset-password", (req: Request, res: Response) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !EMAIL_REGEX.test(email.trim().toLowerCase())) {
      res.status(400).json({ error: "Please enter a valid email format." });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = usersStore.get(normalizedEmail);

    if (!user) {
      res.status(404).json({
        error: "No account registered with this email address."
      });
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ error: "New password must be at least 6 characters long." });
      return;
    }

    // Verify OTP
    const stored = otpStore.get(normalizedEmail);
    if (!stored || stored.otp !== otp?.trim() || Date.now() > stored.expiresAt) {
      res.status(400).json({ error: "Invalid or expired OTP code. Please request a new OTP." });
      return;
    }

    // Update password
    user.password = newPassword;
    usersStore.set(normalizedEmail, user);
    saveUsersToFile(usersStore);
    otpStore.delete(normalizedEmail);

    res.json({
      success: true,
      message: "Password successfully updated! You are now logged in.",
      user: {
        id: user.id,
        name: user.fullName,
        email: user.email,
        membershipTier: user.membershipTier,
        points: user.points,
        avatar: user.avatar
      }
    });
  });

  // Google OAuth Config Endpoint
  app.get("/api/auth/google/config", (req: Request, res: Response) => {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const origin = process.env.APP_URL || `${protocol}://${host}`;
    const redirectUri = `${origin}/auth/google/callback`;
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.CLIENT_ID || '';
    const hasSecret = !!(process.env.GOOGLE_CLIENT_SECRET || process.env.CLIENT_SECRET);

    res.json({
      clientId: clientId || null,
      configured: !!clientId,
      hasSecret,
      redirectUri,
      origin
    });
  });

  // Google OAuth URL Generator
  app.get("/api/auth/google/url", (req: Request, res: Response) => {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const origin = process.env.APP_URL || `${protocol}://${host}`;
    const redirectUri = `${origin}/auth/google/callback`;

    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.CLIENT_ID || '';
    const intent = (req.query.intent as string) || 'login';

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      prompt: 'select_account',
      access_type: 'offline',
      state: intent
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    res.json({
      url: authUrl,
      configured: !!clientId,
      clientId: clientId || null,
      redirectUri,
      intent
    });
  });

  // Google OAuth Callback (Exchanges code for real Google User Profile)
  app.get(['/auth/google/callback', '/auth/google/callback/', '/auth/google', '/auth/google/'], async (req: Request, res: Response) => {
    const { code, error, state } = req.query;
    const intent = (state as string) || 'login';

    if (error || !code) {
      res.send(`
        <!DOCTYPE html>
        <html>
          <body style="font-family: sans-serif; background: #0B0F19; color: #fff; text-align: center; padding: 40px;">
            <p style="color: #ef4444; font-weight: bold; font-size: 16px;">Google Authentication Cancelled or Failed</p>
            <p style="color: #94a3b8; font-size: 13px;">${error || 'No authorization code was provided.'}</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: '${error || 'Authorization failed'}' }, '*');
                setTimeout(() => window.close(), 1500);
              } else {
                window.location.href = '/';
              }
            </script>
          </body>
        </html>
      `);
      return;
    }

    try {
      const clientId = process.env.GOOGLE_CLIENT_ID || process.env.CLIENT_ID || '';
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.CLIENT_SECRET || '';
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      const host = req.headers['x-forwarded-host'] || req.get('host');
      const origin = process.env.APP_URL || `${protocol}://${host}`;
      const redirectUri = `${origin}/auth/google/callback`;

      // 1. Exchange authorization code for access token
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: String(code),
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        })
      });

      const tokenData: any = await tokenRes.json();

      if (!tokenRes.ok || !tokenData.access_token) {
        console.error('Google token exchange error from Google:', tokenData);
        throw new Error(tokenData.error_description || tokenData.error || 'Failed to exchange authorization code with Google');
      }

      // 2. Fetch authenticated userinfo directly from Google API
      const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });
      const googleUser: any = await userRes.json();

      if (!googleUser || !googleUser.email) {
        throw new Error('Could not retrieve Google profile email.');
      }

      const normalizedEmail = googleUser.email.trim().toLowerCase();
      const existingUser = await findUserInDb(normalizedEmail);

      const derivedName = googleUser.name || normalizedEmail.split('@')[0];
      const avatarUrl = googleUser.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80';
      const nowIso = new Date().toISOString();

      let user = existingUser;
      if (user) {
        user.fullName = derivedName;
        user.avatar = avatarUrl;
        user.provider = 'google';
        user.isEmailVerified = true;
        user.updatedAt = nowIso;
        user.federationDetails = {
          provider: 'google',
          sub: googleUser.sub || user.id,
          email: normalizedEmail,
          name: derivedName,
          picture: avatarUrl,
          linkedAt: nowIso,
          deviceName: 'Real Device Google Account'
        };
        await saveUserToDb(user);
      } else {
        user = {
          id: `usr-g-${Date.now()}`,
          fullName: derivedName,
          email: normalizedEmail,
          password: '',
          isEmailVerified: true,
          createdAt: nowIso,
          updatedAt: nowIso,
          membershipTier: 'Champagne Gold VIP',
          points: 25000,
          avatar: avatarUrl,
          provider: 'google',
          googleId: googleUser.sub,
          federationDetails: {
            provider: 'google',
            sub: googleUser.sub || `g_${Date.now()}`,
            email: normalizedEmail,
            name: derivedName,
            picture: avatarUrl,
            linkedAt: nowIso,
            deviceName: 'Real Device Google Account'
          }
        };
        await saveUserToDb(user);
      }

      // Dispatch Thank You & VIP Welcome Email with platform features
      sendGoogleWelcomeEmail({
        email: user.email,
        fullName: user.fullName,
        membershipTier: user.membershipTier,
        points: user.points
      }).catch((err) => console.warn("Google Welcome email dispatch error:", err));

      const userPayload = {
        id: user.id,
        name: user.fullName,
        email: user.email,
        membershipTier: user.membershipTier,
        points: user.points,
        avatar: user.avatar,
        provider: 'google',
        federationDetails: user.federationDetails,
        isEmailVerified: true,
        welcomeEmailSent: true
      };

      res.send(`
        <!DOCTYPE html>
        <html>
          <body style="font-family: sans-serif; background: #0B0F19; color: #fff; text-align: center; padding: 40px;">
            <div style="display: inline-block; padding: 12px; border-radius: 50%; background: rgba(52, 168, 83, 0.15); border: 1px solid rgba(52, 168, 83, 0.3); margin-bottom: 12px;">
              <svg style="width: 28px; height: 28px; fill: #34A853;" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            </div>
            <h3 style="color: #E2C076; margin: 4px 0 8px;">Google Account Connected!</h3>
            <p style="color: #e2e8f0; font-size: 14px; margin: 0 0 4px;">Welcome, <strong>${derivedName}</strong></p>
            <p style="color: #94a3b8; font-size: 12px;">Activating Champagne Gold VIP & redirecting to TripNest...</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'GOOGLE_AUTH_SUCCESS',
                  user: ${JSON.stringify(userPayload)}
                }, '*');
                setTimeout(() => window.close(), 600);
              } else {
                window.location.href = '/';
              }
            </script>
          </body>
        </html>
      `);
    } catch (err: any) {
      console.error("OAuth token exchange error:", err);
      res.send(`
        <!DOCTYPE html>
        <html>
          <body style="font-family: sans-serif; background: #0B0F19; color: #fff; text-align: center; padding: 40px;">
            <p style="color: #ef4444; font-weight: bold; font-size: 16px;">Authentication Error</p>
            <p style="color: #94a3b8; font-size: 13px;">${err.message || 'Failed to exchange authorization code with Google'}</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'GOOGLE_AUTH_ERROR',
                  error: '${err.message || 'Token exchange failed'}'
                }, '*');
                setTimeout(() => window.close(), 2500);
              } else {
                window.location.href = '/';
              }
            </script>
          </body>
        </html>
      `);
    }
  });

  // Real-time Google Account Federation & Link Endpoint
  app.post("/api/auth/google/federate", async (req: Request, res: Response) => {
    try {
      const { email, password, fullName, avatar, googleSub, deviceName, intent = 'login' } = req.body;

      if (!email || !EMAIL_REGEX.test(email.trim().toLowerCase())) {
        res.status(400).json({ error: "A valid Google account email is required." });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      const derivedName = (fullName && fullName.trim().length > 0)
        ? fullName.trim()
        : normalizedEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

      const subId = googleSub || `g_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const deviceLabel = deviceName || 'Selected Device Session';
      const nowIso = new Date().toISOString();

      const existingUser = await findUserInDb(normalizedEmail);

      // ENFORCE STRICT POLICY: ONE ACCOUNT PER EMAIL ONLY
      // If user is attempting to register a new account with an email that is already registered, reject registration
      if (existingUser && (intent === 'signup' || intent === 'register')) {
        res.status(409).json({
          error: `The email (${normalizedEmail}) is already registered with TripNest. In accordance with our security policy, multiple registrations for the same email are strictly prohibited (one account per email only). Please proceed by signing in to your existing account.`,
          alreadyRegistered: true,
          email: normalizedEmail
        });
        return;
      }

      // PASSWORD VALIDATION FOR GOOGLE FEDERATION CREDENTIALS
      // If a password is provided, verify it against the account password
      if (password && existingUser && existingUser.password) {
        if (existingUser.password !== password) {
          res.status(401).json({
            error: "Incorrect password for this Google account. Please verify your credentials.",
            invalidCredentials: true
          });
          return;
        }
      }

      let user = existingUser;

      if (user) {
        // Link existing user account with Google Federation details (Login flow)
        user.federationDetails = {
          provider: 'google',
          sub: subId,
          email: normalizedEmail,
          name: derivedName,
          picture: avatar || user.avatar,
          linkedAt: nowIso,
          deviceName: deviceLabel
        };
        user.provider = 'google';
        user.isEmailVerified = true;
        user.updatedAt = nowIso;
        if (password && !user.password) {
          user.password = password;
        }
        if (avatar && avatar.startsWith('http')) {
          user.avatar = avatar;
        }
        await saveUserToDb(user);

        res.json({
          success: true,
          isNewRegistration: false,
          message: `Welcome back to TripNest, ${user.fullName}! Champagne Gold VIP session verified.`,
          user: {
            id: user.id,
            name: user.fullName,
            email: user.email,
            membershipTier: user.membershipTier,
            points: user.points,
            avatar: user.avatar,
            role: user.role || (user.email === 'admin@tripnest.luxury' ? 'admin' : 'traveler'),
            provider: 'google',
            federationDetails: user.federationDetails,
            isEmailVerified: true
          }
        });
        return;
      }

      // Create new VIP user via Google Federation (First-time Registration)
      const newUser: StoredUser = {
        id: `usr-g-${Date.now()}`,
        fullName: derivedName,
        email: normalizedEmail,
        password: password || 'Password123!',
        isEmailVerified: true,
        createdAt: nowIso,
        updatedAt: nowIso,
        membershipTier: "Champagne Gold VIP",
        points: 25000,
        avatar: avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
        provider: 'google',
        googleId: subId,
        federationDetails: {
          provider: 'google',
          sub: subId,
          email: normalizedEmail,
          name: derivedName,
          picture: avatar,
          linkedAt: nowIso,
          deviceName: deviceLabel
        }
      };

      await saveUserToDb(newUser);

      // Dispatch Welcome Email asynchronously in background so response returns in milliseconds without 4s lag
      sendGoogleWelcomeEmail({
        email: newUser.email,
        fullName: newUser.fullName,
        membershipTier: newUser.membershipTier,
        points: newUser.points
      }).catch((err) => console.warn('Background welcome email dispatch error:', err.message));

      res.json({
        success: true,
        isNewRegistration: true,
        message: `Thank you for registering with TripNest, ${derivedName}! Your Champagne Gold VIP account is active with 25,000 welcome points.`,
        welcomeEmailSent: true,
        welcomeEmailMessage: `A welcome message has been dispatched to ${normalizedEmail}.`,
        features: [
          "🤖 AI Luxury Concierge & Trip Planner with real-time web search",
          "🗺️ Custom Day-by-Day Trip Planner with INR (₹) budgeting",
          "📍 Live Radar & Verified Places with interactive GPS mapping",
          "💎 Global Luxury Bookings with Best Price Guarantee in INR (₹)",
          "🎁 25,000 Welcome Reward Points & VIP Redemption Perks"
        ],
        user: {
          id: newUser.id,
          name: newUser.fullName,
          email: newUser.email,
          membershipTier: newUser.membershipTier,
          points: newUser.points,
          avatar: newUser.avatar,
          provider: 'google',
          role: newUser.role || 'traveler',
          federationDetails: newUser.federationDetails,
          isEmailVerified: true
        }
      });
    } catch (err: any) {
      console.error("Google federation error:", err);
      res.status(500).json({ error: "Failed to federate Google account: " + err.message });
    }
  });

  // AI Chat Route with Search Grounding
  app.post("/api/ai/chat", async (req: Request, res: Response) => {
    try {
      const result = await handleAiChat(req.body);

      // Auto-save AI chat interaction with exact ISO timestamp to database
      try {
        const userEmail = req.body.userEmail || req.body.context?.userEmail;
        const userName = req.body.userName || req.body.context?.userName;
        saveAiChat({
          id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          userEmail: userEmail ? String(userEmail).toLowerCase().trim() : undefined,
          userName: userName ? String(userName) : undefined,
          userMessage: req.body.message || '',
          assistantReply: result.text || '',
          sources: result.sources || [],
          context: req.body.context,
          timestamp: new Date().toISOString()
        });
      } catch (saveErr) {
        console.warn("Could not auto-save AI chat to database:", saveErr);
      }

      // Reduce 200 points per AI chatbot conversation
      let pointDeductionInfo = { pointsDeducted: 0, remainingPoints: undefined as number | undefined };
      try {
        const targetEmail = req.body.userEmail || req.body.context?.userEmail;
        const deduction = await deductUserPoints(targetEmail, 200);
        if (deduction.success) {
          pointDeductionInfo = {
            pointsDeducted: deduction.pointsDeducted,
            remainingPoints: deduction.remainingPoints
          };
        }
      } catch (ptsErr) {
        console.warn("Could not deduct points:", ptsErr);
      }

      res.json({
        ...result,
        pointsDeducted: pointDeductionInfo.pointsDeducted,
        remainingPoints: pointDeductionInfo.remainingPoints
      });
    } catch (error: any) {
      console.error("AI chat handler error:", error);
      res.status(500).json({ error: error.message || "Failed to process AI chat request" });
    }
  });

  // Get AI Chat History from Database
  app.get("/api/ai/chats", (req: Request, res: Response) => {
    try {
      const { userEmail } = req.query;
      const chats = getAiChats(userEmail as string);
      res.json({ success: true, count: chats.length, chats });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to retrieve AI chats" });
    }
  });

  // Dedicated AI Itinerary Generator - Accurate Day-by-Day Activities & Timings from Trip Title
  app.post("/api/ai/generate-itinerary", async (req: Request, res: Response) => {
    try {
      const { title, destination, daysCount, startDate } = req.body;
      if (!title || typeof title !== "string" || !title.trim()) {
        res.status(400).json({ error: "Trip title is required to generate itinerary" });
        return;
      }

      const result = await generateAiItinerary({
        title: title.trim(),
        destination: typeof destination === "string" ? destination.trim() : undefined,
        daysCount: typeof daysCount === "number" ? daysCount : undefined,
        startDate: typeof startDate === "string" ? startDate.trim() : undefined
      });

      res.json({
        success: true,
        ...result
      });
    } catch (err: any) {
      console.error("AI itinerary generation error:", err);
      res.status(500).json({
        error: err.message || "Failed to generate AI itinerary",
        fallbackAvailable: true
      });
    }
  });

  // Bookings API - Retrieve Bookings from Database
  app.get("/api/bookings", (req: Request, res: Response) => {
    try {
      const { userEmail } = req.query;
      const list = getBookings(userEmail as string);
      res.json({ success: true, count: list.length, bookings: list });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to retrieve bookings" });
    }
  });

  // Bookings API - Create or Update Booking in Database with Timestamps
  app.post("/api/bookings", (req: Request, res: Response) => {
    try {
      const bookingData = req.body;
      if (!bookingData.itemName && !bookingData.type) {
        res.status(400).json({ error: "Booking details are required." });
        return;
      }

      const nowIso = new Date().toISOString();
      const id = bookingData.id || `bk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const bookingCode = bookingData.bookingCode || `TN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const fullBooking: StoredBooking = {
        id,
        bookingCode,
        userEmail: (bookingData.userEmail || bookingData.guestEmail || '').toLowerCase().trim(),
        guestName: bookingData.guestName || 'VIP Guest',
        guestEmail: (bookingData.guestEmail || bookingData.userEmail || '').toLowerCase().trim(),
        type: bookingData.type || 'hotel',
        itemId: bookingData.itemId || 'hotel-stay',
        itemName: bookingData.itemName || 'Luxury Suite Stay',
        destinationName: bookingData.destinationName || 'Destinations Worldwide',
        roomTierName: bookingData.roomTierName || 'Presidential Luxury Suite',
        checkInDate: bookingData.checkInDate || new Date().toISOString().split('T')[0],
        checkOutDate: bookingData.checkOutDate,
        guestsCount: Number(bookingData.guestsCount) || 1,
        totalPriceUsd: Number(bookingData.totalPriceUsd) || 0,
        paidCurrency: bookingData.paidCurrency || 'USD',
        paidAmount: Number(bookingData.paidAmount) || Number(bookingData.totalPriceUsd) || 0,
        status: bookingData.status || 'Confirmed',
        createdAt: bookingData.createdAt || nowIso,
        updatedAt: nowIso,
        specialRequests: bookingData.specialRequests,
        image: bookingData.image,
        address: bookingData.address
      };

      const saved = saveBooking(fullBooking);
      res.json({
        success: true,
        message: "Booking recorded successfully in database with timestamp.",
        booking: saved
      });
    } catch (err: any) {
      console.error("Save booking error:", err);
      res.status(500).json({ error: err.message || "Failed to save booking" });
    }
  });

  // Bookings API - Get Single Booking Details by ID or Booking Code
  app.get("/api/bookings/:id", (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const booking = getBookingById(id);
      if (!booking) {
        res.status(404).json({ error: `Booking with ID or code [${id}] not found in database.` });
        return;
      }
      res.json({ success: true, booking });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to retrieve booking" });
    }
  });

  // Bookings API - Full/Partial Update Booking Details (dates, guest, price, status, requests)
  const handleBookingUpdate = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const userEmail = typeof req.query.userEmail === "string" ? req.query.userEmail : req.body?.userEmail;

      const updated = await updateBookingInDb(id, updates, userEmail);
      if (!updated) {
        res.status(404).json({ error: `Booking with ID or code [${id}] not found or could not be updated.` });
        return;
      }

      res.json({
        success: true,
        message: `Booking [${id}] updated successfully in database.`,
        booking: updated
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to update booking" });
    }
  };
  app.patch("/api/bookings/:id", handleBookingUpdate);
  app.put("/api/bookings/:id", handleBookingUpdate);

  // Bookings API - Update Booking Status (e.g. Cancelled)
  app.patch("/api/bookings/:id/status", (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!['Confirmed', 'Pending', 'Cancelled'].includes(status)) {
        res.status(400).json({ error: "Invalid booking status" });
        return;
      }

      const updated = updateBookingStatus(id, status);
      if (!updated) {
        res.status(404).json({ error: "Booking not found in database" });
        return;
      }

      res.json({ success: true, message: `Booking status updated to ${status}`, booking: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to update booking status" });
    }
  });

  // Bookings API - Delete Booking Reservation Permanently
  app.delete("/api/bookings/:id", (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userEmail = typeof req.query.userEmail === "string" ? req.query.userEmail : undefined;
      const wasDeleted = deleteBookingFromDb(id, userEmail);

      if (!wasDeleted) {
        res.status(404).json({ error: `Reservation with ID [${id}] not found or could not be removed` });
        return;
      }

      res.json({
        success: true,
        message: `Reservation [${id}] was successfully removed from database`,
        deletedBookingId: id
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to delete booking reservation" });
    }
  });

  // User Profile API - Update User Details in Database with Timestamps
  app.patch("/api/user/profile", (req: Request, res: Response) => {
    try {
      const { email, fullName, avatar, membershipTier, points } = req.body;
      if (!email) {
        res.status(400).json({ error: "User email is required" });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      const user = usersStore.get(normalizedEmail);
      if (!user) {
        res.status(404).json({ error: "User account not found" });
        return;
      }

      const nowIso = new Date().toISOString();
      if (fullName) user.fullName = fullName.trim();
      if (avatar) user.avatar = avatar;
      if (membershipTier) user.membershipTier = membershipTier;
      if (typeof points === 'number') user.points = points;
      user.updatedAt = nowIso;

      usersStore.set(normalizedEmail, user);
      saveUsersToFile(usersStore);

      res.json({
        success: true,
        message: "User details updated in database with timestamp.",
        user: {
          id: user.id,
          name: user.fullName,
          email: user.email,
          membershipTier: user.membershipTier,
          points: user.points,
          avatar: user.avatar,
          provider: user.provider,
          updatedAt: user.updatedAt,
          isEmailVerified: user.isEmailVerified
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to update user profile" });
    }
  });

  // Custom Trip Plans API - Neon Postgres Persistence
  app.get("/api/plans", async (req: Request, res: Response) => {
    try {
      const { userEmail } = req.query;
      if (!userEmail) {
        res.status(400).json({ error: "userEmail query parameter is required" });
        return;
      }
      const plans = await getCustomPlansFromDb(userEmail as string);
      res.json({ success: true, count: plans.length, plans });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch custom plans" });
    }
  });

  app.post("/api/plans", async (req: Request, res: Response) => {
    try {
      const planData = req.body;
      if (!planData.userEmail || !planData.planTitle) {
        res.status(400).json({ error: "userEmail and planTitle are required" });
        return;
      }
      const saved = await saveCustomPlanToDb(planData);
      res.json({ success: true, message: "Custom trip plan saved to Neon Postgres!", plan: saved });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to save custom plan" });
    }
  });

  // Custom Trip Plans API - Delete Plan by ID
  app.delete("/api/plans/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userEmail = typeof req.query.userEmail === "string" ? req.query.userEmail : undefined;
      const wasDeleted = await deleteCustomPlanFromDb(id, userEmail);

      if (!wasDeleted) {
        res.status(404).json({ error: `Custom plan with ID [${id}] not found` });
        return;
      }

      res.json({
        success: true,
        message: `Custom plan [${id}] was successfully deleted`,
        deletedPlanId: id
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to delete custom plan" });
    }
  });

  // ---------------------------------------------------------------------------
  // TRIPS API (Supports Concurrent Java Spring Boot Service with Embedded Fallback)
  // ---------------------------------------------------------------------------
  // GET /api/trips - Retrieve all trips for a user
  app.get("/api/trips", async (req: Request, res: Response) => {
    try {
      // 1. Try delegating to live Java Spring Boot backend if ready
      const handledByJava = await forwardToJava(req, res, "/api/trips");
      if (handledByJava) return;

      // 2. Embedded high-performance fallback
      const userEmail = typeof req.query.userEmail === "string" ? req.query.userEmail : undefined;
      const destination = typeof req.query.destination === "string" ? req.query.destination.toLowerCase().trim() : undefined;
      let trips = await getTripsFromDb(userEmail);
      if (destination) {
        trips = trips.filter(t =>
          t.destination.toLowerCase().includes(destination) ||
          destination.includes(t.destination.toLowerCase())
        );
      }
      res.setHeader("x-served-by", "node-database");
      res.json({ success: true, count: trips.length, trips });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch trips" });
    }
  });

  // GET /api/trips/:id - Retrieve single trip details
  app.get("/api/trips/:id", async (req: Request, res: Response) => {
    try {
      const handledByJava = await forwardToJava(req, res, `/api/trips/${encodeURIComponent(req.params.id)}`);
      if (handledByJava) return;

      const trip = await getTripByIdFromDb(req.params.id);
      if (!trip) {
        res.status(404).json({ error: `Trip with ID [${req.params.id}] not found in database.` });
        return;
      }
      res.setHeader("x-served-by", "node-database");
      res.json({ success: true, trip });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to retrieve trip" });
    }
  });

  // POST /api/trips - Create a new trip
  app.post("/api/trips", async (req: Request, res: Response) => {
    try {
      // 1. Try delegating to live Java Spring Boot backend if ready
      const handledByJava = await forwardToJava(req, res, "/api/trips");
      if (handledByJava) return;

      // 2. Embedded high-performance fallback
      const { userEmail, title, destination, startDate, endDate, budgetAmount, budgetCurrency, travelersCount, notes, coverImage, itinerary } = req.body;

      if (!userEmail || !title || !destination) {
        res.status(400).json({
          error: "Missing required fields: userEmail, title, and destination are mandatory"
        });
        return;
      }

      const newTrip: StoredTrip = {
        id: `trip-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userEmail: String(userEmail).toLowerCase().trim(),
        title: String(title).trim(),
        destination: String(destination).trim(),
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        budgetAmount: budgetAmount !== undefined ? Number(budgetAmount) : 0,
        budgetCurrency: budgetCurrency || 'INR',
        travelersCount: travelersCount ? Number(travelersCount) : 1,
        status: 'Active',
        notes: notes || undefined,
        itinerary: Array.isArray(itinerary) ? itinerary : undefined,
        coverImage: coverImage || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const saved = await saveTripToDb(newTrip);
      res.setHeader("x-served-by", "node-database");
      res.status(201).json({
        success: true,
        message: "Trip created successfully in database",
        trip: saved
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to create trip" });
    }
  });

  // DELETE /api/trips/:id - Delete trip by ID
  app.delete("/api/trips/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // 1. Try delegating to live Java Spring Boot backend if ready
      const handledByJava = await forwardToJava(req, res, `/api/trips/${encodeURIComponent(id)}`);
      if (handledByJava) return;

      // 2. Embedded high-performance fallback
      const userEmail = typeof req.query.userEmail === "string" ? req.query.userEmail : undefined;
      const wasDeleted = await deleteTripFromDb(id, userEmail);

      if (!wasDeleted) {
        res.status(404).json({ error: `Trip with ID [${id}] not found` });
        return;
      }

        res.setHeader("x-served-by", "node-database");
        res.json({
          success: true,
          message: `Trip with ID [${id}] was successfully deleted from database`,
          deletedTripId: id
        });
      } catch (err: any) {
        res.status(500).json({ error: err.message || "Failed to delete trip" });
      }
    });

  // PATCH / PUT /api/trips/:id - Update trip dates, travelers count, status (Cancel), notes, etc.
  const handleTripUpdate = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const handledByJava = await forwardToJava(req, res, `/api/trips/${encodeURIComponent(id)}`);
      if (handledByJava) return;

      const { startDate, endDate, travelersCount, status, notes, title, budgetAmount, coverImage, destination, itinerary } = req.body;
      const userEmail = typeof req.query.userEmail === "string" ? req.query.userEmail : req.body.userEmail;

      const updated = await updateTripInDb(
        id,
        {
          startDate,
          endDate,
          travelersCount: travelersCount !== undefined ? Number(travelersCount) : undefined,
          status,
          notes,
          title,
          destination,
          budgetAmount: budgetAmount !== undefined ? Number(budgetAmount) : undefined,
          coverImage,
          itinerary: Array.isArray(itinerary) ? itinerary : undefined
        },
        userEmail
      );

      if (!updated) {
        res.status(404).json({ error: `Trip with ID [${id}] not found or unauthorized` });
        return;
      }

      res.setHeader("x-served-by", "node-database");
      res.json({
        success: true,
        message: status === 'Cancelled' ? "Trip has been marked as Cancelled in database" : "Trip updated successfully in database",
        trip: updated
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to update trip" });
    }
  };

  app.patch("/api/trips/:id", handleTripUpdate);
  app.put("/api/trips/:id", handleTripUpdate);

  // ---------------------------------------------------------------------------
  // DEDICATED ITINERARY BACKEND ENDPOINTS (/api/iternary & /api/itinerary)
  // ---------------------------------------------------------------------------

  // GET /api/iternary & /api/itinerary - Query itineraries or single by tripId / userEmail / destination / id
  const handleGetItineraries = async (req: Request, res: Response) => {
    try {
      const tripId = typeof req.query.tripId === "string" ? req.query.tripId.trim() : undefined;
      const userEmail = typeof req.query.userEmail === "string" ? req.query.userEmail.trim() : undefined;
      const destination = typeof req.query.destination === "string" ? req.query.destination.trim() : undefined;
      const id = typeof req.query.id === "string" ? req.query.id.trim() : undefined;

      // If specific ID or tripId requested, try direct lookup
      const targetLookup = id || tripId;
      if (targetLookup) {
        const single = await getItineraryByIdFromDb(targetLookup);
        if (single) {
          res.setHeader("x-served-by", isPostgresConnected() ? "neon-postgresql" : "node-cache");
          res.json({
            success: true,
            source: isPostgresConnected() ? "Neon PostgreSQL" : "Local Disk Storage",
            itinerary: single
          });
          return;
        }

        // Try extracting itinerary from trip if itinerary table doesn't have an entry yet
        const trip = await getTripByIdFromDb(targetLookup);
        if (trip && trip.itinerary && trip.itinerary.length > 0) {
          const autoItin: StoredItinerary = {
            id: `itin-${trip.id}`,
            tripId: trip.id,
            userEmail: trip.userEmail,
            title: trip.title,
            destination: trip.destination,
            daysCount: trip.itinerary.length,
            startDate: trip.startDate,
            endDate: trip.endDate,
            days: trip.itinerary,
            createdAt: trip.createdAt,
            updatedAt: trip.updatedAt
          };
          await saveItineraryToDb(autoItin);
          res.setHeader("x-served-by", isPostgresConnected() ? "neon-postgresql" : "node-cache");
          res.json({
            success: true,
            source: isPostgresConnected() ? "Neon PostgreSQL" : "Local Disk Storage",
            itinerary: autoItin
          });
          return;
        }
      }

      const list = await getItinerariesFromDb({ tripId, userEmail, destination });
      res.setHeader("x-served-by", isPostgresConnected() ? "neon-postgresql" : "node-cache");
      res.json({
        success: true,
        count: list.length,
        source: isPostgresConnected() ? "Neon PostgreSQL" : "Local Disk Storage",
        itineraries: list
      });
    } catch (err: any) {
      console.error("Error fetching itineraries:", err);
      res.status(500).json({ error: err.message || "Failed to retrieve itineraries from database" });
    }
  };

  app.get("/api/iternary", handleGetItineraries);
  app.get("/api/itinerary", handleGetItineraries);

  // GET /api/iternary/:id & /api/itinerary/:id - Fetch single itinerary by ID or tripId
  const handleGetItineraryById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const itin = await getItineraryByIdFromDb(id);
      if (itin) {
        res.setHeader("x-served-by", isPostgresConnected() ? "neon-postgresql" : "node-cache");
        res.json({
          success: true,
          source: isPostgresConnected() ? "Neon PostgreSQL" : "Local Disk Storage",
          itinerary: itin
        });
        return;
      }

      // Check if ID belongs to a trip
      const trip = await getTripByIdFromDb(id);
      if (trip && trip.itinerary && trip.itinerary.length > 0) {
        const syncd: StoredItinerary = {
          id: `itin-${trip.id}`,
          tripId: trip.id,
          userEmail: trip.userEmail,
          title: trip.title,
          destination: trip.destination,
          daysCount: trip.itinerary.length,
          startDate: trip.startDate,
          endDate: trip.endDate,
          days: trip.itinerary,
          createdAt: trip.createdAt,
          updatedAt: trip.updatedAt
        };
        await saveItineraryToDb(syncd);
        res.setHeader("x-served-by", isPostgresConnected() ? "neon-postgresql" : "node-cache");
        res.json({
          success: true,
          source: isPostgresConnected() ? "Neon PostgreSQL" : "Local Disk Storage",
          itinerary: syncd
        });
        return;
      }

      res.status(404).json({
        error: `Itinerary with identifier [${id}] was not found in the database.`
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch itinerary" });
    }
  };

  app.get("/api/iternary/:id", handleGetItineraryById);
  app.get("/api/itinerary/:id", handleGetItineraryById);

  // POST /api/iternary & /api/itinerary - Save or create full itinerary in Neon Postgres
  const handlePostItinerary = async (req: Request, res: Response) => {
    try {
      const { tripId, userEmail, title, destination, startDate, endDate, days, itinerary, notes, isProminent, daysCount } = req.body;

      const effectiveDays = Array.isArray(days)
        ? days
        : Array.isArray(itinerary)
        ? itinerary
        : [];

      if (effectiveDays.length === 0 && !title && !destination) {
        res.status(400).json({
          error: "Itinerary details missing: please provide days, title, or destination."
        });
        return;
      }

      const effectiveTitle = title ? String(title).trim() : (destination ? `${destination} Expedition Itinerary` : "Bespoke Journey");
      const effectiveDest = destination ? String(destination).trim() : "Curated Destination";

      const saved = await saveItineraryToDb({
        tripId: tripId ? String(tripId).trim() : undefined,
        userEmail: userEmail ? String(userEmail).toLowerCase().trim() : undefined,
        title: effectiveTitle,
        destination: effectiveDest,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        days: effectiveDays,
        daysCount: typeof daysCount === "number" ? daysCount : (effectiveDays.length || 1),
        notes: notes || undefined,
        isProminent: Boolean(isProminent)
      });

      res.setHeader("x-served-by", isPostgresConnected() ? "neon-postgresql" : "node-cache");
      res.status(201).json({
        success: true,
        message: "Itinerary saved successfully to database",
        database: isPostgresConnected() ? "Neon PostgreSQL (Live Cloud)" : "Local Persistent Engine",
        itinerary: saved
      });
    } catch (err: any) {
      console.error("Error saving itinerary:", err);
      res.status(500).json({ error: err.message || "Failed to save itinerary to database" });
    }
  };

  app.post("/api/iternary", handlePostItinerary);
  app.post("/api/itinerary", handlePostItinerary);

  // PUT / PATCH /api/iternary/:id & /api/itinerary/:id - Update itinerary
  const handlePutItinerary = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { days, itinerary, title, destination, startDate, endDate, notes, isProminent, daysCount } = req.body;

      const effectiveDays = Array.isArray(days)
        ? days
        : Array.isArray(itinerary)
        ? itinerary
        : undefined;

      const updated = await updateItineraryInDb(id, {
        days: effectiveDays,
        title: title ? String(title).trim() : undefined,
        destination: destination ? String(destination).trim() : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        notes: notes !== undefined ? notes : undefined,
        isProminent: isProminent !== undefined ? Boolean(isProminent) : undefined,
        daysCount: typeof daysCount === "number" ? daysCount : (effectiveDays ? effectiveDays.length : undefined)
      });

      if (!updated) {
        res.status(404).json({ error: `Itinerary with identifier [${id}] could not be found to update.` });
        return;
      }

      res.setHeader("x-served-by", isPostgresConnected() ? "neon-postgresql" : "node-cache");
      res.json({
        success: true,
        message: "Itinerary updated successfully in database",
        database: isPostgresConnected() ? "Neon PostgreSQL (Live Cloud)" : "Local Persistent Engine",
        itinerary: updated
      });
    } catch (err: any) {
      console.error("Error updating itinerary:", err);
      res.status(500).json({ error: err.message || "Failed to update itinerary in database" });
    }
  };

  app.put("/api/iternary/:id", handlePutItinerary);
  app.patch("/api/iternary/:id", handlePutItinerary);
  app.put("/api/itinerary/:id", handlePutItinerary);
  app.patch("/api/itinerary/:id", handlePutItinerary);

  // DELETE /api/iternary/:id & /api/itinerary/:id - Remove itinerary
  const handleDeleteItinerary = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await deleteItineraryFromDb(id);
      if (!deleted) {
        res.status(404).json({ error: `Itinerary [${id}] not found in database.` });
        return;
      }

      res.setHeader("x-served-by", isPostgresConnected() ? "neon-postgresql" : "node-cache");
      res.json({
        success: true,
        message: `Itinerary [${id}] was successfully deleted from database.`,
        deletedId: id
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to delete itinerary" });
    }
  };

  app.delete("/api/iternary/:id", handleDeleteItinerary);
  app.delete("/api/itinerary/:id", handleDeleteItinerary);

  // ===========================================================================
  // 7. BUDGET MANAGEMENT BACKEND ENDPOINTS
  // ===========================================================================
  app.get("/api/budgets", async (req: Request, res: Response) => {
    try {
      const tripId = typeof req.query.tripId === "string" ? req.query.tripId : "";
      const userEmail = typeof req.query.userEmail === "string" ? req.query.userEmail : undefined;
      if (!tripId) {
        res.status(400).json({ error: "tripId is required" });
        return;
      }
      const budget = await getBudgetForTripFromDb(tripId, userEmail);
      res.json({ success: true, budget });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch budget" });
    }
  });

  app.post("/api/budgets", async (req: Request, res: Response) => {
    try {
      const { tripId, userEmail, totalBudget, currency, allocations, estimatedCosts, notes } = req.body;
      if (!tripId) {
        res.status(400).json({ error: "tripId is required" });
        return;
      }
      const budget = await saveBudgetToDb({
        tripId,
        userEmail: userEmail || "guest@tripnest.luxury",
        totalBudget,
        currency,
        allocations,
        estimatedCosts,
        notes
      });
      res.status(201).json({ success: true, budget });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to save budget" });
    }
  });

  app.get("/api/budgets/overview/:tripId", async (req: Request, res: Response) => {
    try {
      const { tripId } = req.params;
      const userEmail = typeof req.query.userEmail === "string" ? req.query.userEmail : undefined;
      const overview = await calculateBudgetOverview(tripId, userEmail);
      res.json({ success: true, overview });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to generate budget overview" });
    }
  });

  // ===========================================================================
  // 8 & 9. EXPENSE TRACKING & CATEGORIES & REPORTS ENDPOINTS
  // ===========================================================================
  app.get("/api/expenses", async (req: Request, res: Response) => {
    try {
      const tripId = typeof req.query.tripId === "string" ? req.query.tripId : undefined;
      const userEmail = typeof req.query.userEmail === "string" ? req.query.userEmail : undefined;
      const category = typeof req.query.category === "string" ? req.query.category : undefined;
      const expenses = await getExpensesForTripFromDb(tripId, userEmail, category);
      res.json({ success: true, count: expenses.length, expenses });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", async (req: Request, res: Response) => {
    try {
      const {
        tripId, groupId, userEmail, title, amount, currency, category, date,
        paymentMethod, receiptUrl, notes, isShared, paidByMemberId, paidByName,
        splitType, splitDetails
      } = req.body;

      if (!tripId || !title || amount === undefined || !category) {
        res.status(400).json({ error: "tripId, title, amount, and category are required" });
        return;
      }

      const expense = await addExpenseToDb({
        tripId,
        groupId,
        userEmail: userEmail || "guest@tripnest.luxury",
        title,
        amount: Number(amount),
        currency: currency || "INR",
        category,
        date: date || new Date().toISOString().split("T")[0],
        paymentMethod: paymentMethod || "Credit Card",
        receiptUrl,
        notes,
        isShared: Boolean(isShared),
        paidByMemberId,
        paidByName,
        splitType,
        splitDetails
      });

      res.status(201).json({ success: true, expense });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to add expense" });
    }
  });

  app.put("/api/expenses/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updated = await updateExpenseInDb(id, req.body);
      if (!updated) {
        res.status(404).json({ error: `Expense [${id}] not found` });
        return;
      }
      res.json({ success: true, expense: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to update expense" });
    }
  });

  app.delete("/api/expenses/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await deleteExpenseFromDb(id);
      if (!deleted) {
        res.status(404).json({ error: `Expense [${id}] not found` });
        return;
      }
      res.json({ success: true, message: "Expense deleted successfully", id });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to delete expense" });
    }
  });

  app.get("/api/expenses/reports/summary", async (req: Request, res: Response) => {
    try {
      const tripId = typeof req.query.tripId === "string" ? req.query.tripId : "";
      const userEmail = typeof req.query.userEmail === "string" ? req.query.userEmail : undefined;
      if (!tripId) {
        res.status(400).json({ error: "tripId is required" });
        return;
      }
      const summary = await getExpenseSummaryReport(tripId, userEmail);
      res.json({ success: true, summary });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to generate expense report summary" });
    }
  });

  // ===========================================================================
  // MILESTONE 4: TASK 3 - REPORTS & CHARTS APIS
  // ===========================================================================

  // 1. Category-wise expense summary
  app.get("/api/reports/expense-categories", async (req: Request, res: Response) => {
    try {
      const userEmail = typeof req.query.userEmail === "string" ? req.query.userEmail : undefined;
      const categories = await getExpenseCategoryReport(userEmail);
      res.json({ success: true, count: categories.length, categories });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to generate expense categories report" });
    }
  });

  // 2. Planned vs actual comparison per category
  app.get("/api/reports/planned-vs-actual", async (req: Request, res: Response) => {
    try {
      const userEmail = typeof req.query.userEmail === "string" ? req.query.userEmail : undefined;
      const tripId = typeof req.query.tripId === "string" ? req.query.tripId : undefined;
      const plannedVsActual = await getPlannedVsActualReport(userEmail, tripId);
      res.json({ success: true, count: plannedVsActual.length, plannedVsActual });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to generate planned vs actual report" });
    }
  });

  // 3. Trends over time: spending & trip activity
  app.get("/api/reports/trends", async (req: Request, res: Response) => {
    try {
      const userEmail = typeof req.query.userEmail === "string" ? req.query.userEmail : undefined;
      const trends = await getTrendsReport(userEmail);
      res.json({ success: true, ...trends });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to generate trends report" });
    }
  });

  // 4. Combined reports bundle
  app.get("/api/reports/all", async (req: Request, res: Response) => {
    try {
      const userEmail = typeof req.query.userEmail === "string" ? req.query.userEmail : undefined;
      const tripId = typeof req.query.tripId === "string" ? req.query.tripId : undefined;
      const reports = await getFullReportsData(userEmail, tripId);
      res.json({ success: true, reports });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to generate reports bundle" });
    }
  });

  // ===========================================================================
  // MILESTONE 4: TASK 1 - TRAVELER ANALYTICS (Single Unified Dashboard API)
  // ===========================================================================
  app.get("/api/analytics/traveler", async (req: Request, res: Response) => {
    try {
      const emailHeader = req.headers['x-user-email'] as string;
      const emailQuery = typeof req.query.userEmail === "string" ? req.query.userEmail : undefined;
      const targetEmail = (emailHeader || emailQuery || "demo@tripnest.luxury").trim();

      const analytics = await getTravelerAnalytics(targetEmail);
      res.json({ success: true, analytics });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to generate traveler analytics" });
    }
  });

  // ===========================================================================
  // MILESTONE 4: TASK 2 - ADMIN ANALYTICS (Strict Role-Based Access)
  // ===========================================================================

  const requireAdminRole = async (req: Request, res: Response, next: () => void) => {
    try {
      const adminHeader = req.headers['x-user-email'] as string;
      const adminQuery = (req.query.adminEmail as string) || (req.query.userEmail as string);
      const adminBody = req.body?.adminEmail || req.body?.userEmail;
      const emailCandidate = (adminHeader || adminQuery || adminBody || '').trim().toLowerCase();

      if (!emailCandidate) {
        res.status(403).json({
          error: "Forbidden: Admin access required. Please sign in with an administrator account.",
          code: "FORBIDDEN_AUTH_REQUIRED"
        });
        return;
      }

      if (emailCandidate === 'admin@tripnest.luxury' || emailCandidate === 'tripnestoneofficial@gmail.com') {
        return next();
      }

      const user = await findUserInDb(emailCandidate);
      if (!user || user.role !== 'admin') {
        res.status(403).json({
          error: "Forbidden: Access denied. This endpoint is strictly restricted to TripNest administrators.",
          code: "FORBIDDEN_NON_ADMIN",
          attemptedEmail: emailCandidate,
          currentRole: user?.role || 'traveler'
        });
        return;
      }

      next();
    } catch (err: any) {
      res.status(500).json({ error: "Failed to verify administrator privileges" });
    }
  };

  app.get("/api/analytics/admin", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const analytics = await getAdminAnalytics();
      res.json({ success: true, analytics });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to generate admin analytics" });
    }
  });

  // Administrator All Trips Monitor (Platform-wide trips ledger)
  app.get("/api/admin/all-trips", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const trips = await getTripsFromDb();
      res.json({ success: true, count: trips.length, trips });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch platform trips ledger" });
    }
  });

  // Administrator Activity Monitor (Bookings, user registrations, and platform activities)
  app.get("/api/admin/all-activities", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const bookings = await getAllBookingsDetailed();
      const trips = await getTripsFromDb();
      res.json({
        success: true,
        totalBookings: bookings.length,
        totalTrips: trips.length,
        bookings: bookings.slice(0, 50),
        trips: trips.slice(0, 50)
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch activities ledger" });
    }
  });

  // Administrator Groups Monitor (All groups, members, invite codes, split budgets across users)
  app.get("/api/admin/all-groups", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const groups = await getAllTravelGroupsForAdmin();
      res.json({ success: true, count: groups.length, groups });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch platform travel groups" });
    }
  });

  // Administrator All Users Directory (User roles, membership tiers, loyalty points)
  app.get("/api/admin/all-users", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const users = await getAllUsersFromDb();
      res.json({ success: true, count: users.length, users });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch platform users directory" });
    }
  });

  // Administrator Complete Trip Inspection (Full day-by-day itinerary plans, budgets, expenses)
  app.get("/api/admin/trip-details/:tripId", requireAdminRole, async (req: Request, res: Response) => {
    try {
      const { tripId } = req.params;
      const trip = await getTripByIdFromDb(tripId);
      if (!trip) {
        res.status(404).json({ error: "Trip record not found" });
        return;
      }
      const budget = await getBudgetForTripFromDb(tripId);
      const expenses = await getExpensesForTripFromDb(tripId);
      res.json({
        success: true,
        trip,
        budget,
        expenses
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to inspect trip details" });
    }
  });

  // Admin Privilege Management / Role Switching (Enables promoting to admin or role toggling for testing)
  app.post("/api/admin/toggle-role", async (req: Request, res: Response) => {
    try {
      const { email, role } = req.body;
      if (!email || !role || !['admin', 'traveler'].includes(role)) {
        res.status(400).json({ error: "email and valid role ('admin' | 'traveler') are required" });
        return;
      }

      const updated = await updateUserRoleInDb(email, role);
      if (!updated) {
        res.status(404).json({ error: `User with email [${email}] not found` });
        return;
      }

      res.json({
        success: true,
        message: `User [${email}] role successfully updated to [${role}]`,
        user: {
          id: updated.id,
          name: updated.fullName,
          email: updated.email,
          membershipTier: updated.membershipTier,
          points: updated.points,
          avatar: updated.avatar,
          role: updated.role
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to update user role" });
    }
  });

  // ===========================================================================
  // 10. GROUP COLLABORATION ENDPOINTS
  // ===========================================================================
  app.get("/api/groups", async (req: Request, res: Response) => {
    try {
      const userEmail = typeof req.query.userEmail === "string" ? req.query.userEmail : undefined;
      const tripId = typeof req.query.tripId === "string" ? req.query.tripId : undefined;
      const groups = await getTravelGroupsFromDb(userEmail, tripId);
      res.json({ success: true, count: groups.length, groups });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch groups" });
    }
  });

  app.post("/api/groups", async (req: Request, res: Response) => {
    try {
      const { tripId, name, description, createdByEmail, coverImage, creatorName } = req.body;
      if (!tripId || !name || !createdByEmail) {
        res.status(400).json({ error: "tripId, name, and createdByEmail are required" });
        return;
      }
      const group = await createTravelGroupInDb({
        tripId,
        name,
        description,
        createdByEmail,
        coverImage,
        creatorName
      });
      res.status(201).json({ success: true, group });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to create travel group" });
    }
  });

  app.get("/api/groups/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const groups = await getTravelGroupsFromDb();
      const group = groups.find(g => g.id === id);
      if (!group) {
        res.status(404).json({ error: `Group [${id}] not found` });
        return;
      }
      res.json({ success: true, group });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to get group" });
    }
  });

  app.put("/api/groups/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, description, coverImage } = req.body;
      const updated = await updateTravelGroupInDb(id, { name, description, coverImage });
      if (!updated) {
        res.status(404).json({ error: "Group not found" });
        return;
      }
      res.json({ success: true, group: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to update group" });
    }
  });

  app.post("/api/groups/:id/members", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userEmail, name, avatar, role, allocatedBudget, inviterName } = req.body;
      if (!userEmail || !name) {
        res.status(400).json({ error: "userEmail and name are required" });
        return;
      }
      const member = await addGroupMemberToDb(id, {
        userEmail,
        name,
        avatar,
        role,
        allocatedBudget: allocatedBudget !== undefined ? Number(allocatedBudget) : 0,
        inviterName
      });
      res.status(201).json({ success: true, member });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to add group member" });
    }
  });

  app.put("/api/groups/:id/members/:memberId", async (req: Request, res: Response) => {
    try {
      const { id, memberId } = req.params;
      const { role, status, allocatedBudget } = req.body;
      let updated = await updateGroupMemberRoleInDb(id, memberId, role, status);
      if (allocatedBudget !== undefined) {
        const budgetUpdated = await updateGroupMemberBudgetInDb(id, memberId, Number(allocatedBudget));
        if (budgetUpdated) updated = budgetUpdated;
      }
      if (!updated) {
        res.status(404).json({ error: "Member not found" });
        return;
      }
      res.json({ success: true, member: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to update member" });
    }
  });

  app.put("/api/groups/:id/members/:memberId/budget", async (req: Request, res: Response) => {
    try {
      const { id, memberId } = req.params;
      const { allocatedBudget } = req.body;
      if (allocatedBudget === undefined) {
        res.status(400).json({ error: "allocatedBudget is required" });
        return;
      }
      const updated = await updateGroupMemberBudgetInDb(id, memberId, Number(allocatedBudget));
      if (!updated) {
        res.status(404).json({ error: "Member not found" });
        return;
      }
      res.json({ success: true, member: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to update member budget" });
    }
  });

  app.delete("/api/groups/:id/members/:memberId", async (req: Request, res: Response) => {
    try {
      const { id, memberId } = req.params;
      await removeGroupMemberFromDb(id, memberId);
      res.json({ success: true, removed: true, message: "Member removed from group successfully" });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to remove member" });
    }
  });

  app.post("/api/groups/join", async (req: Request, res: Response) => {
    try {
      const { inviteCode, userEmail, name, avatar } = req.body;
      if (!inviteCode || !userEmail) {
        res.status(400).json({ error: "inviteCode and userEmail are required" });
        return;
      }
      const result = await joinGroupByInviteCodeInDb(inviteCode, userEmail, name || userEmail.split("@")[0], avatar);
      if (!result) {
        res.status(404).json({ error: "Invalid invitation code or group does not exist" });
        return;
      }
      res.json({ success: true, group: result.group, member: result.member });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to join group" });
    }
  });

  app.get("/api/groups/:id/discussions", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userEmail = typeof req.query.userEmail === "string" ? req.query.userEmail : undefined;
      const discussions = await getGroupDiscussionsFromDb(id, userEmail);
      res.json({ success: true, count: discussions.length, discussions });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch discussions" });
    }
  });

  app.post("/api/groups/:id/discussions", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const {
        senderEmail,
        senderName,
        senderAvatar,
        recipientEmail,
        recipientName,
        isDirect,
        sendEmailNotification,
        message,
        attachments
      } = req.body;
      if (!message || !senderEmail) {
        res.status(400).json({ error: "message and senderEmail are required" });
        return;
      }
      const msg = await postGroupDiscussionInDb({
        groupId: id,
        senderEmail,
        senderName: senderName || senderEmail.split("@")[0],
        senderAvatar,
        recipientEmail,
        recipientName,
        isDirect,
        sendEmailNotification,
        message,
        attachments
      });
      res.status(201).json({ success: true, message: msg });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to post message" });
    }
  });

  // ===========================================================================
  // 11. SHARED EXPENSES & SETTLEMENTS ENDPOINTS
  // ===========================================================================
  app.get("/api/groups/:id/shared-expenses", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const tripId = typeof req.query.tripId === "string" ? req.query.tripId : undefined;
      const data = await getGroupSharedExpensesData(id, tripId);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to get shared expenses" });
    }
  });

  app.post("/api/groups/:id/settlements/settle", async (req: Request, res: Response) => {
    try {
      const { settlementId, transactionRef } = req.body;
      if (!settlementId) {
        res.status(400).json({ error: "settlementId is required" });
        return;
      }
      const settlement = await markSettlementSettledInDb(settlementId, transactionRef);
      if (!settlement) {
        res.status(404).json({ error: "Settlement record not found" });
        return;
      }
      res.json({ success: true, settlement });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to settle payment" });
    }
  });

  // ===========================================================================
  // 12. NOTIFICATIONS & MEDIA / DOCUMENT VAULT ENDPOINTS
  // ===========================================================================
  app.get("/api/notifications", async (req: Request, res: Response) => {
    try {
      const userEmail = typeof req.query.userEmail === "string" ? req.query.userEmail : "ffdhanush806@gmail.com";
      const notifications = await getUserNotificationsFromDb(userEmail);
      const unreadCount = notifications.filter(n => !n.isRead).length;
      res.json({ success: true, count: notifications.length, unreadCount, notifications });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications", async (req: Request, res: Response) => {
    try {
      const { userEmail, tripId, type, title, message, priority, actionUrl } = req.body;
      if (!userEmail || !title || !message) {
        res.status(400).json({ error: "userEmail, title, and message are required" });
        return;
      }
      const notif = await createNotificationInDb({
        userEmail,
        tripId,
        type: type || "reminder",
        title,
        message,
        priority: priority || "normal",
        actionUrl,
        isRead: false
      });
      res.status(201).json({ success: true, notification: notif });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to create notification" });
    }
  });

  app.put("/api/notifications/:id/read", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await markNotificationReadInDb(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to mark read" });
    }
  });

  app.put("/api/notifications/read-all", async (req: Request, res: Response) => {
    try {
      const userEmail = typeof req.body.userEmail === "string" ? req.body.userEmail : "ffdhanush806@gmail.com";
      await markAllNotificationsReadInDb(userEmail);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to mark all read" });
    }
  });

  app.delete("/api/notifications/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await deleteNotificationInDb(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to delete notification" });
    }
  });

  app.get("/api/media", async (req: Request, res: Response) => {
    try {
      const tripId = typeof req.query.tripId === "string" ? req.query.tripId : undefined;
      const userEmail = typeof req.query.userEmail === "string" ? req.query.userEmail : undefined;
      const type = typeof req.query.type === "string" ? req.query.type : undefined;
      const documents = await getMediaDocumentsFromDb(tripId, userEmail, type);
      res.json({ success: true, count: documents.length, documents });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch media documents" });
    }
  });

  app.post("/api/media", async (req: Request, res: Response) => {
    try {
      const { tripId = "general-vault", userEmail, type, name, fileUrl, fileSizeBytes, mimeType, notes, metadata } = req.body;
      if (!name || !fileUrl || !type) {
        res.status(400).json({ error: "name, fileUrl, and type are required" });
        return;
      }
      const doc = await addMediaDocumentToDb({
        tripId: tripId || "general-vault",
        userEmail: userEmail || "guest@tripnest.luxury",
        type,
        name,
        fileUrl,
        fileSizeBytes,
        mimeType,
        notes,
        metadata
      });
      res.status(201).json({ success: true, document: doc });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to add media document" });
    }
  });

  app.delete("/api/media/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await deleteMediaDocumentFromDb(id);
      res.json({ success: true, id });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to delete media document" });
    }
  });

  // Complete Database Bookings & Timestamps Ledger API
  app.get("/api/db/bookings-ledger", async (req: Request, res: Response) => {
    try {
      const userEmail = typeof req.query.userEmail === "string" ? req.query.userEmail : undefined;
      const records = await getAllBookingsDetailed(userEmail);

      let totalRevenue = 0;
      let confirmedCount = 0;
      let cancelledCount = 0;

      records.forEach((r) => {
        totalRevenue += Number(r.paidAmount || 0);
        if (r.status === 'Cancelled') cancelledCount++;
        else confirmedCount++;
      });

      res.setHeader("x-served-by", "node-database");
      res.json({
        success: true,
        count: records.length,
        bookings: records,
        metrics: {
          totalBookings: records.length,
          confirmedCount,
          cancelledCount,
          totalRevenue,
          currency: 'INR'
        },
        databaseInfo: {
          engine: isPostgresConnected() ? 'Neon PostgreSQL (Cloud Serverless)' : 'Local File JSON Engine',
          table: 'tripnest_bookings',
          connected: isPostgresConnected(),
          queriedAt: new Date().toISOString()
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to query database bookings ledger" });
    }
  });

  // Dedicated Database Users API - Neon PostgreSQL
  app.get("/api/db/users", async (req: Request, res: Response) => {
    try {
      const users = await getAllUsersFromDb();
      res.setHeader("x-served-by", "neon-postgres");
      res.json({
        success: true,
        count: users.length,
        users,
        databaseInfo: {
          engine: isPostgresConnected() ? 'Neon PostgreSQL (Cloud Serverless)' : 'Local File JSON Engine',
          table: 'tripnest_users',
          connected: isPostgresConnected(),
          queriedAt: new Date().toISOString()
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to query users from database" });
    }
  });

  // Direct Web-to-DB Insert for Users into Neon PostgreSQL
  app.post("/api/db/users", async (req: Request, res: Response) => {
    try {
      const { email, fullName, membershipTier, points, phone } = req.body;
      if (!email || !EMAIL_REGEX.test(email.trim())) {
        res.status(400).json({ error: "A valid email address is required" });
        return;
      }

      const normalized = email.toLowerCase().trim();
      const existing = await findUserInDb(normalized);
      if (existing) {
        res.status(409).json({ error: `User with email [${normalized}] already exists in Neon Postgres` });
        return;
      }

      const newUser = {
        id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        email: normalized,
        fullName: (fullName || normalized.split('@')[0]).trim(),
        isEmailVerified: true,
        membershipTier: membershipTier || 'Member',
        points: Number(points) || 1000,
        avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80`,
        provider: 'local',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const saved = await saveUserToDb(newUser as any);
      res.json({
        success: true,
        message: `User record [${saved.email}] inserted into Neon PostgreSQL successfully`,
        user: saved,
        table: 'tripnest_users'
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to insert user into database" });
    }
  });

  // Delete User from Neon PostgreSQL
  app.delete("/api/db/users/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await deleteUserFromDb(id);
      res.json({
        success: true,
        message: `User record [${id}] permanently removed from database`,
        deletedId: id,
        table: 'tripnest_users'
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to delete user from database" });
    }
  });

  // Direct Web-to-DB Insert for Bookings into Neon PostgreSQL
  app.post("/api/db/bookings", async (req: Request, res: Response) => {
    try {
      const {
        guestName,
        guestEmail,
        userEmail,
        type = 'hotel',
        itemId,
        itemName,
        destinationName,
        checkInDate,
        checkOutDate,
        guestsCount = 2,
        paidAmount = 25000,
        paidCurrency = 'INR',
        status = 'Confirmed',
        roomTierName,
        specialRequests
      } = req.body;

      const email = (userEmail || guestEmail || '').trim().toLowerCase();
      if (!email || !EMAIL_REGEX.test(email)) {
        res.status(400).json({ error: "A valid email is required for booking" });
        return;
      }
      if (!itemName) {
        res.status(400).json({ error: "itemName is required" });
        return;
      }

      const bookingId = `bk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const bookingCode = `TN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const newBooking = {
        id: bookingId,
        bookingCode,
        userEmail: email,
        guestName: (guestName || email.split('@')[0]).trim(),
        guestEmail: email,
        type: type || 'hotel',
        itemId: itemId || `item-${Date.now()}`,
        itemName: itemName.trim(),
        destinationName: destinationName || 'Luxury Getaway',
        roomTierName: roomTierName || 'Deluxe Heritage Suite',
        checkInDate: checkInDate || new Date().toISOString().split('T')[0],
        checkOutDate: checkOutDate || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        guestsCount: Number(guestsCount) || 2,
        totalPriceUsd: Number(paidAmount) || 25000,
        paidCurrency: paidCurrency || 'INR',
        paidAmount: Number(paidAmount) || 25000,
        status: status || 'Confirmed',
        specialRequests: specialRequests || 'Direct web database insertion',
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
        address: destinationName ? `${destinationName} Grand Resort` : 'Central Luxury Avenue',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const saved = saveBooking(newBooking as any);

      res.json({
        success: true,
        message: `Booking [${bookingCode}] for ${saved.guestName} inserted into Neon PostgreSQL successfully`,
        booking: saved,
        table: 'tripnest_bookings'
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to insert booking into database" });
    }
  });

  // Dedicated Database Trips API - Neon PostgreSQL
  app.get("/api/db/trips", async (req: Request, res: Response) => {
    try {
      const userEmail = typeof req.query.userEmail === "string" ? req.query.userEmail : undefined;
      const trips = await getTripsFromDb(userEmail);
      res.setHeader("x-served-by", "neon-postgres");
      res.json({
        success: true,
        count: trips.length,
        trips,
        databaseInfo: {
          engine: isPostgresConnected() ? 'Neon PostgreSQL (Cloud Serverless)' : 'Local File JSON Engine',
          table: 'tripnest_trips',
          connected: isPostgresConnected(),
          queriedAt: new Date().toISOString()
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to query trips from database" });
    }
  });

  // Favorites / Wishlist API - Neon Postgres Persistence
  app.get("/api/favorites", async (req: Request, res: Response) => {
    try {
      const { userEmail } = req.query;
      if (!userEmail) {
        res.status(400).json({ error: "userEmail query parameter is required" });
        return;
      }
      const favorites = await getFavoritesFromDb(userEmail as string);
      res.json({ success: true, count: favorites.length, favorites });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch favorites" });
    }
  });

  app.post("/api/favorites", async (req: Request, res: Response) => {
    try {
      const favData = req.body;
      if (!favData.userEmail || !favData.itemType || !favData.itemId || !favData.itemName) {
        res.status(400).json({ error: "userEmail, itemType, itemId, and itemName are required" });
        return;
      }
      const saved = await addFavoriteToDb(favData);
      res.json({ success: true, message: "Favorite saved to Neon Postgres!", favorite: saved });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to save favorite" });
    }
  });

  app.delete("/api/favorites", async (req: Request, res: Response) => {
    try {
      const { userEmail, itemType, itemId } = req.body;
      if (!userEmail || !itemType || !itemId) {
        res.status(400).json({ error: "userEmail, itemType, and itemId are required" });
        return;
      }
      await removeFavoriteFromDb(userEmail, itemType, itemId);
      res.json({ success: true, message: "Favorite removed from Neon Postgres!" });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to remove favorite" });
    }
  });

  // Live Places & Venues Radar (Accurate, Real-world Hotels, Restaurants & Attractions)
  app.post("/api/places/live", async (req: Request, res: Response) => {
    try {
      const { lat, lng, radiusKm, category, query, destinationName } = req.body;
      const parsedLat = typeof lat === 'number' ? lat : parseFloat(lat);
      const parsedLng = typeof lng === 'number' ? lng : parseFloat(lng);

      if (isNaN(parsedLat) || isNaN(parsedLng)) {
        res.status(400).json({ error: "Valid latitude and longitude coordinates are required." });
        return;
      }

      const result = await fetchLiveVerifiedPlaces({
        lat: parsedLat,
        lng: parsedLng,
        radiusKm: radiusKm ? Number(radiusKm) : 100,
        category: category || 'All',
        query: query || '',
        destinationName: destinationName || 'Selected Location'
      });

      res.json(result);
    } catch (error: any) {
      console.error("Live places error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch live places" });
    }
  });

  // ==========================================
  // DESTINATION & TRAVEL GUIDE APIS
  // ==========================================

  // GET /api/destinations - Get all destinations with full travel guides and attractions
  app.get("/api/destinations", async (req: Request, res: Response) => {
    try {
      const list = Array.from(MASTER_DESTINATIONS.values());
      res.json({
        success: true,
        count: list.length,
        destinations: list
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch destinations" });
    }
  });

  // GET /api/destinations/:id - Get detailed destination with attractions and comprehensive travel guide
  app.get("/api/destinations/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const lower = id.toLowerCase().trim();

      // Look for exact key match or slug/name match
      let dest = MASTER_DESTINATIONS.get(lower);
      if (!dest) {
        for (const d of MASTER_DESTINATIONS.values()) {
          if (
            d.id.toLowerCase() === lower ||
            d.name.toLowerCase() === lower ||
            d.name.toLowerCase().includes(lower) ||
            lower.includes(d.id.toLowerCase())
          ) {
            dest = d;
            break;
          }
        }
      }

      if (!dest) {
        res.status(404).json({ error: `Destination [${id}] not found in verified registry. You can generate it with AI.` });
        return;
      }

      res.json({
        success: true,
        destination: dest
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch destination details" });
    }
  });

  // GET /api/destinations/:id/roadmap - Retrieve or synthesize day 1...day n roadmap with Where to Stay & Where to Live
  app.get("/api/destinations/:id/roadmap", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const daysCount = Math.max(1, Math.min(14, parseInt(String(req.query.days || '3'), 10) || 3));
      const userEmail = typeof req.query.userEmail === 'string' ? req.query.userEmail.toLowerCase().trim() : undefined;

      // 1. Check if an existing roadmap is stored in Neon PostgreSQL / memory
      const stored = await getDestinationRoadmapFromDb(id, daysCount, userEmail);
      if (stored) {
        res.json({
          success: true,
          source: 'database',
          roadmap: stored
        });
        return;
      }

      // 2. Synthesize complete high-fidelity roadmap for this destination
      const lower = id.toLowerCase().trim();
      let dest = MASTER_DESTINATIONS.get(lower);
      if (!dest) {
        for (const d of MASTER_DESTINATIONS.values()) {
          if (
            d.id.toLowerCase() === lower ||
            d.name.toLowerCase() === lower ||
            d.name.toLowerCase().includes(lower) ||
            lower.includes(d.id.toLowerCase())
          ) {
            dest = d;
            break;
          }
        }
      }

      const destName = dest?.name || id.charAt(0).toUpperCase() + id.slice(1);
      const hotelsList = (dest as any)?.hotels || [];
      const primaryHotel = hotelsList[0] || {
        name: `The Grand Luxury Resort & Spa ${destName}`,
        roomTier: "Presidential Panoramic Suite",
        pricePerNightUsd: dest?.startingPriceUsd ? Math.round(dest.startingPriceUsd * 0.8) : 450,
        address: `${destName} Prime Promenade, Waterfront / Mountain View`,
        amenities: ["Private Infinity Pool", "24/7 Royal Butler", "Michelin Dining", "Chauffeur Airport Limousine"],
        image: dest?.heroImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'
      };

      const attractions = dest?.attractions || [];
      const daysData = [];

      for (let i = 1; i <= daysCount; i++) {
        const hotelForDay = hotelsList[(i - 1) % Math.max(1, hotelsList.length)] || primaryHotel;
        const attr1 = attractions[(i * 2 - 2) % Math.max(1, attractions.length)];
        const attr2 = attractions[(i * 2 - 1) % Math.max(1, attractions.length)];

        let theme = "Arrival, Regal Check-In & Golden Sunset Vistas";
        let morning = `VIP private chauffeur welcome from airport and check-in to ${hotelForDay.name || primaryHotel.name}. Enjoy welcome champagne and signature regional tea.`;
        let afternoon = attr1 ? `Curated private guided immersion at ${attr1.name}. ${attr1.description || 'Explore scenic heritage corridors and capture breathtaking panoramas.'}` : `Leisurely stroll through ${destName}'s historic quarters, private artisan ateliers, and tranquil scenic lanes.`;
        let evening = `Sunset cocktails followed by reservations at ${destName}'s premier waterfront or rooftop dining terrace.`;

        if (i === 2) {
          theme = "Iconic Architectural Wonders & Historic Quarters";
          morning = attr2 ? `Early morning VIP sunrise tour of ${attr2.name} before public hours with private historian.` : `Morning artisanal discovery, high tea, and scenic view walk.`;
          afternoon = `Scenic private limousine excursion along ${destName}'s most breathtaking coastal or alpine vistas, visiting local craft ateliers.`;
          evening = `Candlelit multi-course degustation dinner with paired grand cru vintages overlooking the sparkling city panorama.`;
        } else if (i === 3) {
          theme = "Hidden Gems, Epicurean Dining & Sunset Cruise";
          morning = `Private yacht or scenic morning safari discovering secret coves and secluded viewpoints.`;
          afternoon = `Indulgent afternoon spa treatment at ${hotelForDay.name || primaryHotel.name}, followed by bespoke shopping in luxury boutiques.`;
          evening = `Gala farewell banquet with live local string quartet and midnight champagne on the private terrace.`;
        } else if (i > 3) {
          theme = `Deep Cultural Discovery & Scenic Excursions - Day ${i}`;
          morning = `Day trip to nearby picturesque villages, vineyards, or mountain summits with dedicated escort.`;
          afternoon = `Culinary masterclass with a celebrity chef featuring rare regional delicacies.`;
          evening = `Private dining under the stars with traditional music and panoramic vistas.`;
        }

        daysData.push({
          day: i,
          title: `Day ${i}: ${theme}`,
          theme,
          whereToStay: {
            hotelId: hotelForDay.id || `hotel-${i}`,
            hotelName: hotelForDay.name || primaryHotel.name,
            roomTierName: hotelForDay.roomTiers?.[0]?.name || hotelForDay.roomTier || "Signature Imperial Suite",
            pricePerNightUsd: hotelForDay.pricePerNightUsd || primaryHotel.pricePerNightUsd || 420,
            address: hotelForDay.address || primaryHotel.address || `${destName} Central Luxury Boulevard`,
            highlights: hotelForDay.amenities || primaryHotel.amenities || ["Butler Service", "Thermal Spa", "Scenic Balcony"],
            image: hotelForDay.image || primaryHotel.image || dest?.heroImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'
          },
          whereToLive: {
            neighborhood: `${destName} Historic Heart & Golden Quarter`,
            vibe: "Sophisticated, safe, atmospheric, and rich in world-class culture",
            morningActivity: morning,
            afternoonActivity: afternoon,
            eveningDining: evening,
            highlights: [
              "Centuries-old cobblestone or scenic waterfront promenade",
              "Artisan boutiques & heritage tea houses",
              "Quiet mornings with panoramic photo opportunities"
            ]
          },
          transit: i === 1 ? "Complimentary Airport VIP Chauffeur Transfer" : "Private Mercedes Maybach / Scenic Luxury Boat On-Call",
          includedMeals: ["Artisanal Breakfast Buffet", "Michelin Dinner Tasting"]
        });
      }

      const newRoadmap: DestinationRoadmap = {
        id: `roadmap-${id.toLowerCase()}-${daysCount}-${userEmail ? 'usr-' + Date.now() : 'default'}`,
        destinationId: id.toLowerCase().trim(),
        destinationName: destName,
        userEmail: userEmail || undefined,
        daysCount,
        title: `The Ultimate ${daysCount}-Day ${destName} Luxury Travel Roadmap`,
        overview: `A complete day-by-day roadmap specifying exactly where to stay in 5-star luxury and where to live like a local connoisseur across ${daysCount} unforgettable days in ${destName}.`,
        days: daysData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Persist to Neon Postgres
      await saveDestinationRoadmap(newRoadmap);

      res.json({
        success: true,
        source: 'generated-and-saved',
        roadmap: newRoadmap
      });
    } catch (err: any) {
      console.error("Roadmap generation error:", err);
      res.status(500).json({ error: err.message || "Failed to generate destination roadmap" });
    }
  });

  // POST /api/destinations/:id/roadmap - Save user custom updated roadmap to database
  app.post("/api/destinations/:id/roadmap", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { daysCount, title, overview, days, userEmail, destinationName } = req.body;

      if (!days || !Array.isArray(days)) {
        res.status(400).json({ error: "days array is required" });
        return;
      }

      const roadmap: DestinationRoadmap = {
        id: `roadmap-${id.toLowerCase()}-${daysCount || days.length}-${Date.now()}`,
        destinationId: id.toLowerCase().trim(),
        destinationName: destinationName || id,
        userEmail: userEmail ? String(userEmail).toLowerCase().trim() : undefined,
        daysCount: Number(daysCount) || days.length,
        title: title || `${days.length}-Day Luxury Roadmap for ${destinationName || id}`,
        overview: overview || `Custom traveler roadmap across ${days.length} days.`,
        days,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const saved = await saveDestinationRoadmap(roadmap);
      res.status(201).json({
        success: true,
        message: "Destination roadmap saved to database successfully",
        roadmap: saved
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to save destination roadmap" });
    }
  });

  // POST /api/destinations/ai-guide - Synthesize or refresh complete destination guide with attractions using AI
  app.post("/api/destinations/ai-guide", async (req: Request, res: Response) => {
    try {
      const { destinationName, categoryHint } = req.body;
      if (!destinationName || typeof destinationName !== 'string') {
        res.status(400).json({ error: "destinationName is required." });
        return;
      }

      const cleanName = destinationName.trim();
      const generated = await generateDestinationWithAi(cleanName, categoryHint);

      res.json({
        success: true,
        source: generated.isAiGenerated ? 'gemini-ai' : 'verified-curated',
        destination: generated
      });
    } catch (err: any) {
      console.error("[TripNest AI] Notice in /api/destinations/ai-guide:", err);
      const fallbackName = typeof req.body?.destinationName === 'string' ? req.body.destinationName.trim() : 'Destination';
      const fallback = generateProceduralDestination(fallbackName, req.body?.categoryHint);
      res.json({
        success: true,
        source: 'verified-curated',
        destination: fallback
      });
    }
  });

  // GET /api/destinations/live-weather/:lat/:lng - Live Open-Meteo real-world weather
  app.get("/api/destinations/live-weather/:lat/:lng", async (req: Request, res: Response) => {
    try {
      const lat = parseFloat(req.params.lat);
      const lng = parseFloat(req.params.lng);
      if (isNaN(lat) || isNaN(lng)) {
        res.status(400).json({ error: "Valid latitude and longitude required" });
        return;
      }
      const weather = await getLiveWeather(lat, lng);
      res.json({ success: true, weather: weather || { tempC: 22, condition: "Pleasant & Clear Skies" } });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch live weather" });
    }
  });

  // Explicit Safe API 404 handler (prevents returning HTML for missing API routes)
  app.all('/api/*', (req: Request, res: Response) => {
    res.status(404).json({ error: `Route ${req.method} ${req.url} not found` });
  });

  // Vite Dev Server / Production Static Serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`TripNest server running on http://localhost:${PORT}`);
  });
}

startServer();

# E-Classroom LMS - Setup & Development Guide

Welcome to E-Classroom LMS! This guide will help you get the project up and running.

## 🎯 What's Been Set Up

✅ **Phase 1 Foundation - COMPLETE**

- ✅ Next.js 14 project with App Router, TypeScript, and Tailwind CSS
- ✅ All dependencies installed (Supabase, Zustand, React Hook Form, Zod, etc.)
- ✅ Complete folder structure (app, components, lib, types)
- ✅ Supabase client utilities (browser and server-side)
- ✅ Authentication middleware with role-based routing
- ✅ TypeScript types for all database entities
- ✅ Configuration files (ESLint, Prettier, Tailwind, etc.)
- ✅ Environment variables template
- ✅ Complete database schema (SQL ready to run)
- ✅ Storage bucket policies

## 📋 Next Steps to Get Started

### Step 1: Set Up Supabase

1. Go to [https://supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Wait for the project to finish setting up (~2 minutes)
4. Go to Project Settings → API and copy:
   - Project URL
   - `anon` `public` key
   - `service_role` key (keep this secret!)

### Step 2: Update Environment Variables

Open `.env.local` and replace the placeholders with your actual Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key
```

### Step 3: Set Up Database

Open `SUPABASE_SETUP.md` and follow the instructions to:

1. Run the complete database schema SQL in Supabase SQL Editor
2. Create storage buckets (avatars, assignments, submissions, materials)
3. Apply storage policies
4. Enable Realtime for notifications

This will create all tables, RLS policies, indexes, and functions needed for the app.

### Step 4: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 5: Create Your First Admin User

Since the database is empty, you'll need to:

1. Sign up through the app (this will create the first user in Supabase Auth)
2. Go to Supabase Dashboard → Authentication → Users
3. Copy the user's UUID
4. Go to SQL Editor and run:

```sql
-- Insert first admin user
INSERT INTO public.users (id, email, full_name, role)
VALUES (
  'paste-user-uuid-here',
  'admin@example.com',
  'Admin User',
  'admin'
);
```

Now you can log in as admin and start using the system!

## 📁 Project Structure

```
e-classroom/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, signup)
│   ├── (dashboard)/       # Protected dashboard routes
│   │   ├── admin/         # Admin pages
│   │   ├── teacher/       # Teacher pages
│   │   └── student/       # Student pages
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page (redirects)
│   └── globals.css        # Global styles
│
├── components/            # React components
│   ├── auth/             # Auth components
│   ├── dashboard/        # Dashboard components
│   ├── classes/          # Class components
│   ├── live-class/       # Jitsi/Live class components
│   ├── assignments/      # Assignment components
│   ├── notifications/    # Notification components
│   ├── layout/           # Layout components (Sidebar, Header)
│   └── ui/               # Reusable UI components
│
├── lib/                   # Core libraries
│   ├── supabase/         # Supabase clients & utilities
│   │   ├── client.ts     # Browser client
│   │   └── server.ts     # Server client
│   ├── services/         # Business logic layer
│   ├── hooks/            # Custom React hooks
│   ├── store/            # Zustand state stores
│   └── utils/            # Utilities & helpers
│       └── constants.ts  # App constants
│
├── types/                 # TypeScript type definitions
│   └── database.types.ts # Database entity types
│
├── middleware.ts          # Auth & routing middleware
├── SUPABASE_SETUP.md     # Database setup guide
├── README.md             # Master plan
├── SECURITY.md           # Security architecture
└── .env.local            # Environment variables
```

## 🚀 What to Build Next (Phase 2: Authentication)

Following the implementation plan, the next phase is to build the **Authentication System**:

### Create these components and pages:

1. **Login Page** - `app/(auth)/login/page.tsx`
2. **Signup Page** - `app/(auth)/signup/page.tsx`
3. **Auth Layout** - `app/(auth)/layout.tsx`
4. **Login Form** - `components/auth/LoginForm.tsx`
5. **Signup Form** - `components/auth/SignupForm.tsx`
6. **Auth Service** - `lib/services/auth.service.ts`
7. **Auth Hook** - `lib/hooks/useAuth.ts`
8. **Auth Store** - `lib/store/authStore.ts`

### Key Features to Implement:

- Email/password login and registration
- Form validation with Zod
- Error handling and display
- Loading states
- Redirect to appropriate dashboard based on role
- Session management

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Format code with Prettier
npx prettier --write .
```

## 📚 Key Technologies

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **Supabase** - Backend (Database, Auth, Storage, Realtime)
- **Zustand** - State management
- **React Hook Form + Zod** - Form handling and validation
- **Jitsi** - Live video classes
- **Lucide React** - Icons
- **Sonner** - Toast notifications

## 🔐 Security Features Implemented

- ✅ Row Level Security (RLS) on all database tables
- ✅ Role-based access control via middleware
- ✅ Protected API routes
- ✅ Secure file storage with access policies
- ✅ TypeScript for type safety
- ✅ Input validation with Zod schemas

## 📖 Important Files to Understand

1. **middleware.ts** - Handles authentication and redirects users based on roles
2. **lib/supabase/client.ts** - Browser-side Supabase client
3. **lib/supabase/server.ts** - Server-side Supabase client
4. **types/database.types.ts** - All database entity types
5. **lib/utils/constants.ts** - App-wide constants

## 🎨 Styling Guidelines

- Use Tailwind CSS utility classes
- Custom colors are defined in `tailwind.config.ts`
- Primary color: Blue (`primary-500`, `primary-600`, etc.)
- Mobile-first responsive design
- Dark mode ready (can be enabled later)

## 🐛 Troubleshooting

### Supabase Connection Error

If you see "Invalid supabaseUrl" error:
- Make sure you've updated `.env.local` with real Supabase credentials
- Restart the dev server after updating environment variables

### TypeScript Errors

- Run `npm install` to ensure all dependencies are installed
- Check that `tsconfig.json` is properly configured
- VS Code: Restart TypeScript server (Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server")

### Middleware Not Working

- Ensure Supabase is properly configured
- Check that you have a user in the `public.users` table
- Verify RLS policies are enabled in Supabase

## 📞 Need Help?

- Review the master plan: `README.md`
- Check security architecture: `SECURITY.md`
- Database setup: `SUPABASE_SETUP.md`
- Implementation plan: `.claude/plans/expressive-moseying-pebble.md`

## 🎯 Project Roadmap

**✅ Phase 1: Foundation (COMPLETE)**
- Project setup, database schema, authentication infrastructure

**🚧 Phase 2: Authentication (NEXT)**
- Login/signup pages, auth forms, session management

**📋 Phase 3-10: Feature Development**
- Dashboards, Classes, Live Classes, Attendance, Assignments, Notifications, PWA, Deployment

Great work! The foundation is solid. Let's build an amazing LMS! 🚀

# Settings Page Architecture & Data Flow

This document details the technical implementation of the Settings page in the EventVista platform.

## 🏗️ Architecture Overview

The Settings page is implemented as a client-side Next.js page that serves as a control hub for user profile management, security settings, and account lifecycle.

- **File Path**: `src/app/settings/page.tsx`
- **Type**: `"use client"` (Interactive UI)
- **Primary Integration**: `AuthContext` (`src/lib/AuthContext.tsx`)
- **Styling**: Tailwind CSS 4 with custom `glass-card` and `btn-primary` utility classes.
- **Animations**: `framer-motion` for layout transitions, modals, and toasts.

## 🔄 Data Flow

### 1. Initial State & Synchronization
- **Auth Guard**: On mount, the page checks the `loading` and `isLoggedIn` status from `useAuth`. If the user is unauthenticated, they are redirected to `/login`.
- **Data Hydration**: A `useEffect` hook synchronizes the local form state (name, email, agency, etc.) with the current `user` object provided by the global `AuthContext`.

### 2. Profile Management (`handleSaveProfile`)
1. **User Action**: User updates profile fields and clicks "Save Profile".
2. **Global Update**: Calls `saveProfile({ ...fields })` from `useAuth`.
3. **API Interaction**: 
   - Endpoint: `PATCH /api/auth/me`
   - Headers: Bearer Token Authorization
4. **State Persistence**: On success, the API returns the updated user object, which is then updated in the global React state and persisted to `localStorage`.
5. **Feedback**: A success toast is displayed via `framer-motion`.

### 3. Security Flow (`handleChangePassword`)
1. **Validation**: Client-side check for password matching and minimum length (6+ characters).
2. **API Interaction**: 
   - Reuses the `PATCH /api/auth/me` endpoint.
   - Payload includes `currentPassword` and `newPassword`.
3. **Success**: Form fields are cleared, and a success notification is shown.

### 4. Account Lifecycle (`handleDeleteAccount`)
1. **Confirmation**: Opens a modal requiring the user to re-enter their password.
2. **Destructive Action**:
   - Endpoint: `DELETE /api/auth/me`
3. **Cleanup**: Upon success, `deleteAccount` clears the `localStorage`, resets the auth state to null, and redirects the user to the landing page.

## 🧩 Component Breakdown

### Reusable UI Elements
- **`InputField`**: Standardized input wrapper with icon support, accessibility labels, and support for "Right Elements" (e.g., password eye toggles).
- **`Toast`**: Contextual feedback component (Success/Error) with auto-dismissal logic.
- **`Danger Zone`**: A visually distinct section (Red themed) for irreversible actions.

## 🌓 Theme Support
The page uses Tailwind's `dark:` variant extensively to ensure all elements (inputs, cards, text) are readable in both light and dark modes.
- **Light Mode**: White base, soft coral accents, `zinc-900` text.
- **Dark Mode**: `zinc-900` base, `zinc-800` card backgrounds, `zinc-100` text.

## 🛠️ Tech Stack Recap
- **Next.js 15**: App Router for routing and navigation.
- **Lucide React**: For consistent iconography across the dashboard.
- **Framer Motion**: For fluid modal entries and toast notifications.
- **Context API**: For global user state and authentication methods.

# Plan: Push Notification System Implementation

Implement a full push notification system as described in the summary, including backend automation, admin interface, and native integration.

## User-facing changes
- **Admin Panel**: New "Notificações" tab to send general push notifications.
- **Native Experience**: Users will be asked for notification permissions on mobile devices.
- **Dynamic Feedback**: Real-time notifications for important events and birthday wishes.

## Technical details

### 1. Database Schema
- Create `public.device_tokens` table:
    - `id` (uuid, primary key)
    - `user_id` (uuid, references profiles.id)
    - `token` (text, unique)
    - `platform` (text, e.g., 'android', 'ios', 'web')
    - `created_at` (timestamp)
- Create `public.push_notifications` table (history):
    - `id` (uuid, primary key)
    - `title` (text)
    - `body` (text)
    - `sender_id` (uuid, references profiles.id)
    - `status` (text)
    - `created_at` (timestamp)
- Enable RLS and add policies.

### 2. Capacitor Integration (`src/lib/push-notifications.ts`)
- Use `@capacitor/push-notifications` to request permissions.
- Register listeners (`registration`, `registrationError`, `pushNotificationReceived`, `pushNotificationActionPerformed`).
- Send the registration token to the backend (`device_tokens` table).

### 3. Server Logic (`src/lib/notifications.functions.ts`)
- `sendPushNotification`: Server function to send a request to FCM.
- `notifyBirthdays`: Logic to check for birthdays and trigger notifications (will use a cron job placeholder).

### 4. Admin Interface
- Update `src/routes/admin.tsx` to include a "Notificações" tab.
- Form to send a notification to all users or specific groups.

### 5. Automation & Deep Linking
- Add triggers to the database for automatic notifications on specific events (e.g., new announcements).
- Implement deep linking logic in `src/routes/__root.tsx` or `src/router.tsx` to handle `actionPerformed` events.

## Infrastructure Requirements
- **Firebase Service Account**: I will need the Firebase Service Account JSON (as a secret) to communicate with FCM.
- **pg_cron**: Enable for birthday automation if supported, or provide a server-side polling mechanism.

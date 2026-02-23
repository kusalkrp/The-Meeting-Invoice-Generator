# The Meeting Invoice Generator 💸🗓️

> *"Revenge for your calendar. Calculate the exact monetary cost of all your 'quick syncs' and generate fake invoices to soothe your soul."*

![Meeting Invoice Generator UI Screenshot](/preview.png)

## Overview

The Meeting Invoice Generator is a micro-SaaS tool designed for consultants, freelancers, and weary corporate employees. It connects to your Google Calendar, scans the last 30 days of your schedule, identifies meetings with multiple attendees, and calculates the exact amount of money 'wasted' on those meetings based on your customizable hourly rate.

It then formats these findings into a sleek dashboard and a downloadable PDF invoice.

---

## 🚀 Features

- **Google Calendar Integration**: Securely fetches real meeting events via NextAuth over OAuth 2.0.
- **"Demo Mode"**: Experiencing OAuth blockages? Test the entire UI and calculation engine using a fully mocked backend—no API keys required.
- **Granular Analysis**: Filters out solo work blocks and unstructured time, focusing purely on actual meetings (events with > 1 attendee).
- **Client-Side PDF Generation**: Exports beautifully formatted PDF invoices for your records (or for your boss) directly from the browser using `jsPDF`.
- **Sleek Aesthetic**: Built with Next.js App Router, styled securely with Tailwind CSS, utilizing `lucide-react` for iconography.

---

## 🛠 Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: `next-auth` (Google Provider)
- **PDF Generation**: `jspdf` & `jspdf-autotable`

---

## 💻 Running Locally

### 1. Clone the repository
Make sure you are in the `meeting-invoice-generator` directory.

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory.

If you just want to run the app in **Demo Mode**, you can use dummy values:
```env
GOOGLE_CLIENT_ID="dummy-id"
GOOGLE_CLIENT_SECRET="dummy-secret"
NEXTAUTH_SECRET="super-secret-key-123"
NEXTAUTH_URL="http://localhost:3000"
```

To use **Real Google Calendar Data**, you need to generate API credentials in the [Google Cloud Console](https://console.cloud.google.com/):
1. Create a new Google Cloud Project.
2. Enable the **Google Calendar API**.
3. Configure the OAuth Consent Screen.
4. Create an **OAuth Client ID** (Web application).
5. Add `http://localhost:3000` to Authorized JavaScript origins.
6. Add `http://localhost:3000/api/auth/callback/google` to Authorized redirect URIs.
7. Important: Ensure the scope `https://www.googleapis.com/auth/calendar.readonly` is requested.
8. Paste the real `Client ID` and `Client Secret` into your `.env.local`.

### 4. Start the Application
```bash
npm run dev
```
Navigate to `http://localhost:3000`.

---

## 📖 API Documentation

The core calculation logic is handled server-side to obscure logic and secure token passing.

### `POST /api/invoice/generate`

Calculates meeting durations and total costs based on Google Calendar events.

#### Request Body
```json
{
  "hourlyRate": 150,     // (Number) The user's requested hourly rate in dollars.
  "demoMode": false      // (Boolean) If true, skips the Google API fetch and generates a localized mock schema.
}
```

#### Authentication
The API relies on the secure, HTTP-only cookie managed by `next-auth` to retrieve the `Google Access Token`. 
If `demoMode` is true, or if no valid NextAuth session token is found, the server intentionally returns Mock simulated data.

#### Response Body (Success: 200 OK)
```json
{
  "invoice": {
    "totalMeetings": 12,        // (Integer) Count of valid meetings found
    "totalHours": 9.3,          // (Float) Summation of meeting duration
    "hourlyRate": 150,          // (Number) Rate passed in request
    "calculatedCost": 1395,     // (Float) totalHours * hourlyRate
    "dateRange": "Last 30 Days",
    "meetings": [
      {
        "id": "event-id-string",
        "summary": "Q3 Planning Sync",
        "durationHours": 1.5,
        "date": "2023-10-25T14:30:00.000Z"
      }
      // ...
    ]
  }
}
```

#### Error Handling (500 Internal Server Error)
Returns if the Google Calendar API forcibly rejects the provided OAuth token (e.g., if token expired or scope was revoked).
```json
{
  "error": "Failed to generate invoice."
}
```

---

## 📜 Future Enhancements

- [ ] Support for multiple calendars simultaneously.
- [ ] Direct email integration to automatically mail the generated PDF.
- [ ] Database integration to store historical invoices over time.

# HyperVerge Verification System

A modern, user-friendly identity verification system built with Next.js 14 and shadcn/ui, integrating HyperVerge's verification APIs.

## ✨ Features

- 🎨 **Modern UI** - Clean, responsive design with shadcn/ui components
- 📱 **Mobile Friendly** - Works seamlessly on all devices
- 🔄 **Sequential Flow** - Guided 3-step verification process
- 🔒 **Secure** - Backend API routes protect sensitive credentials
- ⚡ **Fast** - Built with Next.js 14 App Router
- 🎯 **User-Friendly** - Clear progress indicators and feedback

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- HyperVerge API credentials (appId and appKey)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Then edit `.env.local` with your credentials:
   ```env
   HYPERVERGE_APP_ID=your_app_id
   HYPERVERGE_APP_KEY=your_app_key
   HYPERVERGE_REGION=ind
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Documentation

See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for detailed integration instructions, API documentation, and troubleshooting.

## 🔄 Verification Flow

1. **Selfie Validation** - Upload selfie for liveness detection
2. **Face Match** - Upload ID card to match with selfie
3. **ID Verification** - Extract and verify ID information

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **UI Library:** shadcn/ui + Radix UI
- **Styling:** Tailwind CSS
- **Language:** TypeScript
- **Icons:** Lucide React

## 📁 Project Structure

```
├── app/
│   ├── api/                    # API routes
│   │   ├── validate-selfie/    # Selfie validation endpoint
│   │   ├── match-face/         # Face matching endpoint
│   │   └── read-id/            # ID reading endpoint
│   ├── page.tsx                # Main verification page
│   ├── layout.tsx              # Root layout
│   └── globals.css             # Global styles
├── components/
│   └── ui/                     # shadcn/ui components
├── lib/
│   └── utils.ts                # Utility functions
├── INTEGRATION_GUIDE.md        # Detailed integration guide
└── package.json
```

## 🔐 Security

- API credentials stored in environment variables
- Backend API routes handle all external API calls
- No sensitive data exposed to frontend
- Input validation on all endpoints

## 📝 License

MIT

## 🤝 Support

For issues or questions:
- HyperVerge API: Contact HyperVerge support
- Application: Check INTEGRATION_GUIDE.md or open an issue

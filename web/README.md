# YTTR Search Web Application

A modern, full-stack web application for searching YouTube video transcripts. Built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

### Core Functionality
- 🔍 **Transcript Search**: Search for keywords across YouTube video transcripts
- 📺 **Multiple Source Types**: Support for channels, playlists, single videos, and batch URLs
- ⏱️ **Timestamp Links**: Jump directly to the moment in the video where keywords are mentioned
- 💾 **Search History**: View and manage your past searches
- ⭐ **Saved Items**: Bookmark important results for quick access

### Authentication & User Management
- 🔐 **Multiple Auth Methods**: Email/password, Google, and GitHub OAuth
- ✉️ **Email Verification**: Secure account creation with email verification
- 🔄 **Password Reset**: Self-service password recovery
- 👤 **User Profiles**: Manage account settings and preferences

### Subscription & Payments
- 💳 **Stripe Integration**: Secure payment processing
- 📊 **Tiered Plans**: Free, Starter, Pro, and Enterprise tiers
- 🔢 **Usage Limits**: Rate limiting based on subscription tier
- 🧾 **Billing Management**: Self-service subscription management via Stripe Customer Portal

### Admin Panel
- 👥 **User Management**: View, edit, and manage all users
- 📈 **Analytics Dashboard**: Monitor usage statistics and revenue
- ⚙️ **System Configuration**: Manage application settings
- 📝 **Audit Logs**: Track important system events

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Payments**: Stripe
- **Rate Limiting**: Redis (with in-memory fallback)

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Redis (optional, for rate limiting)
- YouTube Data API key
- Stripe account (for payments)
- OAuth credentials (Google, GitHub)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/yttr-search.git
   cd yttr-search/web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in all required environment variables (see [Environment Variables](#environment-variables) below).

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Seed the database (optional)**
   ```bash
   npx prisma db seed
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/yttr_search"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_ID="your-github-client-id"
GITHUB_SECRET="your-github-client-secret"

# YouTube API
YOUTUBE_API_KEY="your-youtube-api-key"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_STARTER_PRICE_ID="price_..."
STRIPE_PRO_PRICE_ID="price_..."
STRIPE_ENTERPRISE_PRICE_ID="price_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Redis (optional)
REDIS_URL="redis://localhost:6379"

# Email (SMTP)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-smtp-user"
SMTP_PASSWORD="your-smtp-password"
EMAIL_FROM="noreply@yourdomain.com"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Project Structure

```
web/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts            # Database seeding script
├── src/
│   ├── app/               # Next.js App Router pages
│   │   ├── admin/         # Admin panel pages
│   │   ├── api/           # API routes
│   │   ├── auth/          # Authentication pages
│   │   ├── dashboard/     # User dashboard pages
│   │   ├── search/        # Search page
│   │   ├── layout.tsx     # Root layout
│   │   └── page.tsx       # Landing page
│   ├── components/
│   │   ├── layout/        # Layout components (Header, Footer)
│   │   ├── providers/     # React context providers
│   │   └── ui/            # Shadcn UI components
│   ├── hooks/             # Custom React hooks
│   └── lib/               # Utility functions and services
│       ├── auth.ts        # NextAuth configuration
│       ├── email.ts       # Email service
│       ├── prisma.ts      # Prisma client
│       ├── redis.ts       # Redis client & rate limiting
│       ├── search.ts      # Search service
│       ├── stripe.ts      # Stripe integration
│       ├── transcript.ts  # Transcript fetching
│       ├── utils.ts       # Helper functions
│       ├── validations.ts # Zod schemas
│       └── youtube.ts     # YouTube API client
├── .env.example           # Example environment variables
├── middleware.ts          # Next.js middleware
├── next.config.js         # Next.js configuration
├── package.json           # Dependencies
├── tailwind.config.ts     # Tailwind configuration
└── tsconfig.json          # TypeScript configuration
```

## API Routes

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/verify-email` - Verify email address
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Search
- `GET /api/search` - Get search info and history
- `POST /api/search` - Perform a new search
- `GET /api/search/[id]` - Get search results
- `DELETE /api/search/[id]` - Delete a search

### User
- `GET /api/user/profile` - Get user profile
- `PATCH /api/user/profile` - Update user profile

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/history` - Get search history

### Stripe
- `POST /api/stripe/checkout` - Create checkout/portal session
- `POST /api/stripe/webhook` - Handle Stripe webhooks

### Admin
- `GET /api/admin/stats` - Get admin statistics
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/[id]` - Get user details
- `PATCH /api/admin/users/[id]` - Update user
- `DELETE /api/admin/users/[id]` - Delete user

## Subscription Tiers

| Feature | Free | Starter ($9.99/mo) | Pro ($24.99/mo) | Enterprise ($49.99/mo) |
|---------|------|-------------------|-----------------|----------------------|
| Daily Searches | 10 | 30 | 120 | 500 |
| Max Videos/Search | 50 | 200 | 500 | Unlimited |
| History Retention | 7 days | 30 days | Unlimited | Unlimited |
| Export Results | ❌ | ✅ | ✅ | ✅ |
| Priority Support | ❌ | ❌ | ✅ | ✅ |
| API Access | ❌ | ❌ | ❌ | ✅ |

## Development

### Running Tests
```bash
npm run test
```

### Linting
```bash
npm run lint
```

### Building for Production
```bash
npm run build
```

### Database Management
```bash
# Generate Prisma client
npx prisma generate

# Push schema changes
npx prisma db push

# Run migrations
npx prisma migrate dev

# Open Prisma Studio
npx prisma studio
```

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy

### Docker

```bash
docker build -t yttr-search-web .
docker run -p 3000:3000 yttr-search-web
```

### Manual Deployment

1. Build the application: `npm run build`
2. Start the production server: `npm start`

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

- 📧 Email: support@yttr-search.com
- 💬 Discord: [Join our community](https://discord.gg/yttr-search)
- 📖 Documentation: [docs.yttr-search.com](https://docs.yttr-search.com)

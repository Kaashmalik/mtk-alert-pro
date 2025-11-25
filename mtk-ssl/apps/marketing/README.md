# SSL Marketing Website

Beautiful, high-converting, SEO-optimized marketing website for Shakir Super League.

## Features

- ✅ Beautiful hero section with animated cricket ball and live score ticker
- ✅ Features section for Organizers, Teams, Players, and Fans
- ✅ Pricing section with Free, Basic, Pro, and Enterprise tiers
- ✅ Trust badges section
- ✅ Waitlist form with Supabase integration
- ✅ SEO optimized with structured data (Organization, WebSite, SoftwareApplication)
- ✅ OG image generation
- ✅ Mobile-responsive design
- ✅ Performance optimized (LCP < 1.8s target)
- ✅ Urdu + English typography (Inter + Noto Nastaliq)

## Setup

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up environment variables:**
   Make sure you have these in your `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Create waitlist table in Supabase:**
   Run the migration:
   ```bash
   # If using Supabase CLI
   supabase migration up
   
   # Or run the SQL directly in Supabase dashboard
   # See: supabase/migrations/005_create_waitlist_table.sql
   ```

4. **Run development server:**
   ```bash
   pnpm dev
   ```

   The marketing site will be available at http://localhost:3000

## Tech Stack

- **Next.js 15** - React framework with App Router
- **Framer Motion** - Animations
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **next-seo** - SEO optimization
- **Supabase** - Waitlist database
- **Lucide React** - Icons

## Performance

- Optimized for Core Web Vitals
- Lazy loading for images and components
- Font optimization with `display: swap`
- Compressed responses
- Package import optimization

## SEO

- Structured data (JSON-LD) for:
  - Organization
  - WebSite
  - SoftwareApplication
- Dynamic OG images
- Sitemap generation
- Robots.txt
- Meta tags optimization

## Components

- `Nav` - Navigation header with scroll effects
- `Hero` - Hero section with animated cricket ball
- `Features` - Features grid with stats
- `Pricing` - Pricing cards
- `TrustBadges` - Trust indicators and league logos
- `Waitlist` - Email capture form
- `Footer` - Footer with links

## Deployment

The site is optimized for deployment on Vercel:

1. Connect your repository
2. Set environment variables
3. Deploy!

The site will automatically generate OG images and sitemaps.


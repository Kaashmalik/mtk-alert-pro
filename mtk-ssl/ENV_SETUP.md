# Environment Variables Setup

Create a `.env.local` file in the root directory with the following variables:

```env
# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_MARKETING_URL=http://localhost:3000
NEXT_PUBLIC_ADMIN_URL=http://localhost:3002

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
DATABASE_URL=your_database_connection_string

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Payments (Pakistan)
JAZZCASH_MERCHANT_ID=your_jazzcash_merchant_id
JAZZCASH_PASSWORD=your_jazzcash_password
JAZZCASH_HASH_KEY=your_jazzcash_hash_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token

# Super Admin
SUPER_ADMIN_EMAIL=kaash0542@gmail.com

# API
PORT=4000
NODE_ENV=development
```

## Getting Started

1. **Supabase**: 
   - Create a project at https://supabase.com
   - Get your project URL and anon key from Settings > API
   - Get service role key from Settings > API (keep this secret!)

2. **Clerk**:
   - Create a project at https://clerk.com
   - Get your publishable key and secret key from the dashboard
   - Configure allowed origins for your apps

3. **Payments**:
   - Set up JazzCash merchant account
   - Set up Stripe account for international payments

4. **Redis**:
   - Create an Upstash Redis database at https://upstash.com
   - Get REST URL and token

## Important Notes

- Never commit `.env.local` to git (it's in .gitignore)
- Use different keys for development and production
- Keep service role keys and secrets secure
- The SUPER_ADMIN_EMAIL must match the email used in Clerk


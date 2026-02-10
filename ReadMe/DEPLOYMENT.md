# 🚀 DEX ERP - Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Supabase Configuration](#supabase-configuration)
4. [Cloudinary Setup](#cloudinary-setup)
5. [Vercel Deployment](#vercel-deployment)
6. [Post-Deployment](#post-deployment)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts
- ✅ Vercel Account (hobby or pro)
- ✅ Supabase Account
- ✅ Cloudinary Account (Free tier sufficient for start)
- ✅ Domain Name (optional but recommended)

### Local Development Setup
```bash
# Node.js version required
node --version  # Should be >= 18.17.0

# Install dependencies
npm install

# Run development server
npm run dev
```

---

## Environment Setup

### 1. Copy Environment Template
```bash
cp .env.example .env.local
```

### 2. Fill Environment Variables

#### Supabase Configuration
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create new project or select existing
3. Get credentials from Settings > API

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

#### Cloudinary Configuration
1. Go to [Cloudinary Console](https://cloudinary.com/console)
2. Get credentials from Dashboard

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=dex_preset
```

#### Application URLs
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

#### Security
```bash
# Generate cron secret
openssl rand -base64 32
```

```env
CRON_SECRET=your_generated_secret_here
```

---

## Supabase Configuration

### 1. Database Schema Setup

**Option A: Using Supabase Migration Files**

```bash
# Navigate to supabase directory
cd supabase

# Link to your project
npx supabase link --project-ref your-project-ref

# Push migrations
npx supabase db push
```

**Option B: Manual SQL Execution**

1. Go to Supabase Dashboard > SQL Editor
2. Run the following schema files in order:

```sql
-- File: 01_create_users_table.sql
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT CHECK (role IN ('admin', 'accountant', 'team_leader', 'creator', 'client')) DEFAULT 'client',
    avatar_url TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile"
ON public.users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admin can view all users"
ON public.users FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'admin'
    )
);
```

```sql
-- File: 02_create_projects_table.sql
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.users(id),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK (status IN ('active', 'completed', 'on_hold')) DEFAULT 'active',
    budget DECIMAL(10, 2),
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
ON public.projects FOR SELECT
USING (
    client_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role IN ('admin', 'team_leader')
    )
);
```

```sql
-- File: 03_create_tasks_table.sql
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK (status IN ('new', 'in_progress', 'review', 'revision', 'approved', 'rejected', 'completed')) DEFAULT 'new',
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    assigned_to UUID REFERENCES public.users(id),
    created_by UUID REFERENCES public.users(id),
    deadline TIMESTAMPTZ,
    client_feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators see assigned tasks"
ON public.tasks FOR SELECT
USING (
    assigned_to = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role IN ('admin', 'team_leader')
    )
);
```

```sql
-- File: 04_create_transactions_table.sql
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    category TEXT,
    receipt_url TEXT,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Treasury access control"
ON public.transactions FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role IN ('admin', 'accountant')
    )
);
```

```sql
-- File: 05_create_notifications_table.sql
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT,
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own notifications"
ON public.notifications FOR SELECT
USING (user_id = auth.uid());
```

```sql
-- File: 06_create_site_settings_table.sql
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB,
    type TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read settings"
ON public.site_settings FOR SELECT
USING (true);

CREATE POLICY "Admin can update settings"
ON public.site_settings FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'admin'
    )
);
```

### 2. Database Triggers

```sql
-- Auto-update updated_at on tasks
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Notification trigger for task updates
CREATE OR REPLACE FUNCTION notify_task_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.notifications (user_id, title, message, link)
        VALUES (
            NEW.assigned_to,
            'Task Status Updated',
            'Task "' || NEW.title || '" is now ' || NEW.status,
            '/creator/task/' || NEW.id
        );
    END IF;
    
    IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
        INSERT INTO public.notifications (user_id, title, message, link)
        VALUES (
            NEW.assigned_to,
            'New Task Assigned',
            'You have been assigned: ' || NEW.title,
            '/creator/task/' || NEW.id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_notification_trigger
AFTER UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION notify_task_update();
```

### 3. Database Indexes

```sql
-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read);
```

### 4. Create Initial Admin User

```sql
-- This should be run AFTER you've registered through the UI
UPDATE public.users
SET role = 'admin', is_active = true
WHERE email = 'your-admin-email@example.com';
```

---

## Cloudinary Setup

### 1. Create Upload Preset

1. Go to Cloudinary Console > Settings > Upload
2. Click "Add upload preset"
3. Configure:

```
Preset name: dex_preset
Signing Mode: Unsigned
Folder: dex-erp
Format: Auto
Quality: Auto
Access Mode: Public
```

4. Save

### 2. Configure Auto-Delete (Optional)

For automatic cleanup of old files:

1. Go to Settings > Upload > Upload presets
2. Edit `dex_preset`
3. Add Context/Metadata:
   - Key: `uploaded_at`
   - Value: Auto-generated timestamp

---

## Vercel Deployment

### 1. Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Select framework: **Next.js**

### 2. Configure Environment Variables

In Vercel Project Settings > Environment Variables, add all from `.env.local`:

**Production Environment:**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=dex_preset
NEXT_PUBLIC_APP_URL=https://dex-erp.vercel.app
NEXT_PUBLIC_SITE_URL=https://dex-erp.vercel.app
CRON_SECRET=your_secure_secret
NODE_ENV=production
```

### 3. Build Settings

```
Framework Preset: Next.js
Build Command: npm run build
Output Directory: .next
Install Command: npm install
Development Command: npm run dev
```

### 4. Deploy

Click **Deploy** button. ⏳ Wait for build to complete (~2-3 minutes).

### 5. Custom Domain (Optional)

1. Go to Project Settings > Domains
2. Add your custom domain
3. Configure DNS records:
   - Type: A Record or CNAME
   - Name: @ (or subdomain)
   - Value: cname.vercel-dns.com

---

## Post-Deployment

### 1. Verify Deployment

**Checklist:**
- [ ] Homepage loads successfully
- [ ] Login/Register works
- [ ] Database connections successful
- [ ] File uploads work (Cloudinary)
- [ ] Real-time updates functioning
- [ ] Email notifications sent
- [ ] Cron jobs scheduled

### 2. Setup Cron Jobs in Vercel

1. Go to Project Settings > Cron Jobs
2. Verify `vercel.json` cron schedule is active
3. Test manually:

```bash
curl -X GET https://dex-erp.vercel.app/api/cron/cleanup \
  -H "Authorization: Bearer your_cron_secret"
```

### 3. Configure Supabase Redirect URLs

1. Go to Supabase Dashboard > Authentication > URL Configuration
2. Add Site URL: `https://dex-erp.vercel.app`
3. Add Redirect URLs:
   - `https://dev-erp.vercel.app/**`
   - `http://localhost:3000/**` (for local development)

### 4. Enable Realtime

1. Go to Supabase Dashboard > Database > Replication
2. Enable realtime for tables:
   - `tasks`
   - `notifications`
   - `transactions`

### 5. Database Backups

**Automated Backups (Supabase Pro):**
- Daily automated backups enabled by default

**Manual Backup:**
```bash
# Using Supabase CLI
npx supabase db dump -f backup.sql

# Restore if needed
npx supabase db reset --db-url your-database-url
```

---

## Monitoring Setup

### 1. Vercel Analytics

1. Go to Project > Analytics
2. Enable Web Vitals
3. Enable Error Tracking

### 2. Uptime Monitoring

**UptimeRobot Configuration:**
```
Monitor Type: HTTPS
URL: https://dex-erp.vercel.app
Interval: 5 minutes
Alert Contacts: your-email@example.com
```

### 3. Supabase Alerts

1. Go to Supabase Project Settings > Database > Alerts
2. Enable alerts for:
   - High CPU usage
   - Connection pool saturation
   - Disk space warnings

---

## Troubleshooting

### Build Failures

**Issue: TypeScript errors during build**
```bash
# Check locally first
npm run type-check

# Fix errors, then commit
git add .
git commit -m "Fix TypeScript errors"
git push
```

**Issue: Environment variables not found**
- Verify all variables are set in Vercel Project Settings
- Restart deployment after adding variables

### Runtime Errors

**Issue: Database connection fails**
```
Error: Failed to fetch user
```

**Solution:**
1. Check Supabase project is active
2. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
3. Check RLS policies allow access

**Issue: File upload fails**
```
Error: Upload failed 401 Unauthorized
```

**Solution:**
1. Verify Cloudinary preset is "Unsigned"
2. Check `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is correct
3. Ensure upload preset exists

**Issue: Cron job not running**
```
Cleanup job never executes
```

**Solution:**
1. Verify `vercel.json` is in repository root
2. Check `CRON_SECRET` matches code
3. Upgrade to Vercel Pro if on hobby plan

### Performance Issues

**Issue: Slow page loads**

**Solutions:**
1. Check Lighthouse score
2. Optimize images (use Next/Image)
3. Enable ISR (Incremental Static Regeneration):

```typescript
// app/[locale]/page.tsx
export const revalidate = 3600; // Revalidate every hour
```

4. Check database query performance in Supabase

**Issue: High serverless function duration**

- Reduce middleware database calls
- Use connection pooling
- Cache frequently accessed data

---

## Rollback Procedure

### Quick Rollback in Vercel

1. Go to Project > Deployments
2. Find last stable deployment
3. Click "..." menu > Promote to Production

### Database Rollback

```bash
# Restore from backup
npx supabase db reset --db-url your-backup-url
```

---

## Scaling Considerations

### For 15K+ Concurrent Users

**Vercel Configuration:**
- Upgrade to **Pro Plan** ($20/month)
  - Increased function execution time
  - More bandwidth
  - Better analytics

**Supabase Configuration:**
- Upgrade to **Pro Plan** ($25/month)
  - Connection pooling
  - Point-in-time recovery
  - Database size up to 100GB

**Cloudinary:**
- **Free tier:** 25GB/month bandwidth
- For heavy usage: Upgrade to **Plus** ($89/month)

**Performance Optimizations:**
- Enable Redis caching (Upstash)
- Use CDN for static assets
- Implement service worker for offline

---

## Security Checklist

Before going live:

- [ ] All environment variables secured
- [ ] Database RLS policies tested
- [ ] API routes protected
- [ ] CORS configured correctly
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Rate limiting implemented
- [ ] SQL injection prevention verified
- [ ] XSS protection active
- [ ] CSRF tokens implemented

---

## Support \u0026 Maintenance

### Regular Tasks

**Daily:**
- Monitor error logs in Vercel
- Check uptime status

**Weekly:**
- Review performance metrics
- Check database usage
- Verify backups

**Monthly:**
- Update dependencies
- Security audit
- Performance optimization review

### Getting Help

**Documentation:**
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)

**Support Channels:**
- Vercel Support (if on Pro plan)
- Supabase Discord
- GitHub Issues

---

## Success Criteria

Deployment is successful when:

✅ All pages load without errors
✅ Authentication flow works end-to-end
✅ Task management workflow completes
✅ File uploads successful
✅ Real-time updates working
✅ Lighthouse score > 90
✅ No console errors
✅ Mobile responsive
✅ RTL (Arabic) works correctly
✅ Performance under load verified

---

**Deployment Date:** [To be filled]
**Deployed By:** [Your Name]
**Production URL:** https://dex-erp.vercel.app
**Status:** ✅ LIVE

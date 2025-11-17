# Deployment Guide for Render

This guide will help you deploy your Finlay Brewer website to Render and connect it to PostgreSQL.

## Prerequisites

1. A Render account (sign up at https://render.com)
2. A PostgreSQL database created in Render
3. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Create PostgreSQL Database in Render

1. Go to your Render dashboard
2. Click "New +" → "PostgreSQL"
3. Configure your database:
   - **Name**: `finlay-brewer-db` (or your preferred name)
   - **Database**: `finlay_brewer` (or your preferred name)
   - **User**: Auto-generated (or custom)
   - **Region**: Choose closest to your users
   - **PostgreSQL Version**: Latest stable
   - **Plan**: Free tier is fine for low-medium traffic
4. Click "Create Database"
5. **Important**: Copy the **Internal Database URL** - you'll need this!

## Step 2: Create Web Service in Render

1. In Render dashboard, click "New +" → "Web Service"
2. Connect your Git repository
3. Configure the service:
   - **Name**: `finlay-brewer-website`
   - **Region**: Same as your database
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: Leave empty (or specify if your app is in a subdirectory)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Starter ($7/month) recommended for production

## Step 3: Configure Environment Variables

In your Web Service settings, go to "Environment" and add these variables:

### Required Variables:

```
DATABASE_URL=<your-postgres-internal-connection-string>
PORT=10000
```

### Email Configuration (for lead notifications):

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM_NAME=Finlay Brewer Website
LEAD_EMAIL=your-email@gmail.com
```

### Getting Your Database URL:

1. Go to your PostgreSQL database in Render
2. In the "Connections" section, find **Internal Database URL**
3. It looks like: `postgres://user:password@hostname:5432/database_name`
4. Copy this entire string and paste it as `DATABASE_URL`

**Important Notes:**
- Use the **Internal Database URL** (not External) - it's faster and more secure
- The Internal URL only works from other Render services
- If you need to connect from outside Render, use the External Database URL

## Step 4: Deploy

1. Click "Create Web Service"
2. Render will automatically:
   - Install dependencies (`npm install`)
   - Build your application
   - Initialize the database (via `initDatabase()` in server.js)
   - Start your server

## Step 5: Verify Deployment

1. Check the logs to ensure:
   - Database connection successful
   - Database schema initialized
   - Server started successfully
2. Visit your website URL (provided by Render)
3. Test the contact form to verify:
   - Leads are saved to PostgreSQL
   - Email notifications are sent

## Troubleshooting

### Database Connection Issues

**Error: "Connection refused"**
- Verify `DATABASE_URL` is set correctly
- Ensure you're using the Internal Database URL
- Check that database is in the same region as web service

**Error: "relation 'leads' does not exist"**
- The database schema should auto-initialize on first server start
- Check server logs for initialization errors
- You can manually run: `npm run init-db` (if you have shell access)

### Email Not Sending

- Verify SMTP credentials are correct
- For Gmail, ensure you're using an App Password (not regular password)
- Check that 2-Factor Authentication is enabled on Gmail account
- Check server logs for SMTP errors

### Build Failures

- Ensure `package.json` includes `pg` dependency
- Check that Node version is compatible (Node 18+ recommended)
- Review build logs for specific errors

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgres://user:pass@host:5432/db` |
| `PORT` | Yes | Server port (Render sets this automatically) | `10000` |
| `SMTP_HOST` | No* | SMTP server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | No* | SMTP server port | `587` |
| `SMTP_USER` | No* | SMTP username/email | `your-email@gmail.com` |
| `SMTP_PASS` | No* | SMTP password/app password | `your-app-password` |
| `SMTP_FROM_NAME` | No | Email sender name | `Finlay Brewer Website` |
| `LEAD_EMAIL` | No* | Email to receive lead notifications | `your-email@gmail.com` |

*Required if you want email notifications to work

## Database Schema

The application automatically creates a `leads` table with the following structure:

- `id` (SERIAL PRIMARY KEY)
- `timestamp` (TIMESTAMP)
- `first_name`, `last_name`, `name` (VARCHAR)
- `email`, `email_address` (VARCHAR)
- `phone`, `phone_number`, `country_code`, `phone_full` (VARCHAR)
- `property` (VARCHAR)
- `message` (TEXT)
- `lead_data` (JSONB) - stores complete form data
- `created_at` (TIMESTAMP)

## Custom Domain

To add a custom domain:
1. Go to your Web Service settings
2. Click "Custom Domains"
3. Add your domain
4. Follow DNS configuration instructions

## Monitoring

- View logs in real-time in Render dashboard
- Set up alerts for errors
- Monitor database usage in PostgreSQL dashboard

## Cost Estimate

- **Web Service**: Starter plan - $7/month
- **PostgreSQL**: Free tier available (suitable for low-medium traffic)
- **Total**: ~$7/month for production-ready setup

For higher traffic, consider:
- Standard Web Service plan ($25/month)
- PostgreSQL paid plans if you exceed free tier limits


# pgAdmin Connection Guide for Render PostgreSQL

## Common Connection Issues

### Error: "nodename nor servname provided, or not known"

This error means the hostname is incomplete or incorrect.

## Solution Steps

### 1. Get the External Connection String from Render

1. Go to your Render Dashboard
2. Click on your PostgreSQL database
3. Go to the **"Connections"** or **"Info"** tab
4. Look for **"External Connection String"** (NOT Internal)
5. It should look like:
   ```
   postgresql://username:password@dpg-xxxxx-xxxxx-a.oregon-postgres.render.com:5432/database_name
   ```

### 2. Extract Connection Details

From the connection string, extract:
- **Host:** `dpg-xxxxx-xxxxx-a.oregon-postgres.render.com` (the FULL hostname with domain)
- **Port:** `5432`
- **Database:** `finlay_brewer_db` (or the database name from the connection string)
- **Username:** `finlay_brewer_db_user` (or the username from the connection string)
- **Password:** The password from the connection string

### 3. Configure pgAdmin

In pgAdmin, use these settings:

**General Tab:**
- **Name:** Finlay Brewer Render DB (or any name you prefer)

**Connection Tab:**
- **Host name/address:** `dpg-d4dmgpf5r7bs73828ms0-a.oregon-postgres.render.com` (FULL hostname with domain)
- **Port:** `5432`
- **Maintenance database:** `finlay_brewer_db`
- **Username:** `finlay_brewer_db_user`
- **Password:** [Your password]
- **Save password?:** ✓ (optional, but recommended)

**SSL Tab:**
- **SSL mode:** `Require` or `Prefer`
- This is important for Render databases!

### 4. Common Hostname Formats

Render PostgreSQL hostnames typically follow these patterns:
- `dpg-xxxxx-xxxxx-a.oregon-postgres.render.com`
- `dpg-xxxxx-xxxxx-a.frankfurt-postgres.render.com`
- `dpg-xxxxx-xxxxx-a.singapore-postgres.render.com`

**Important:** Always include the full domain (`.oregon-postgres.render.com` or similar), not just the `dpg-xxxxx-xxxxx-a` part!

### 5. If You Only Have the Internal Connection String

If Render only shows the Internal Connection String, you can:
1. Check if there's a toggle to show External Connection String
2. The external hostname is usually the same as internal but with the full domain
3. Try appending `.oregon-postgres.render.com` to your hostname

### 6. Test Connection

After entering all details:
1. Click "Save" to save the connection
2. Click the connection in the server list
3. Enter your password if prompted
4. If successful, you'll see the database tree

## Troubleshooting

### Still Can't Connect?

1. **Check Firewall:** Make sure your IP isn't blocked
2. **Verify SSL:** Make sure SSL mode is set to "Require" or "Prefer"
3. **Check Region:** Make sure you're using the correct region domain (oregon, frankfurt, singapore, etc.)
4. **Verify Credentials:** Double-check username and password from Render dashboard

### Need to Find Your Region?

The region is usually visible in:
- Render dashboard → Database → Info tab
- The connection string domain (oregon, frankfurt, singapore, etc.)


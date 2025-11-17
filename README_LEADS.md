# Lead Management System

This system handles form submissions from the landing page and sends email notifications.

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Email

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your email configuration:

   **For Gmail:**
   - Use an App Password (not your regular password)
   - Generate one at: https://myaccount.google.com/apppasswords
   - Enable 2-Factor Authentication first if you haven't

   **For other email providers:**
   - Adjust `SMTP_HOST` and `SMTP_PORT` accordingly
   - Common providers:
     - Outlook: `smtp-mail.outlook.com`, port `587`
     - Yahoo: `smtp.mail.yahoo.com`, port `587`
     - Custom SMTP: Check with your provider

3. Set `LEAD_EMAIL` to the email address where you want to receive lead notifications

### 3. How It Works

When a form is submitted:

1. **Validation**: Server validates all required fields
2. **Storage**: Lead is saved to `data/leads.json` (created automatically)
3. **Email Notification**: Formatted email is sent to `LEAD_EMAIL` with all lead details
4. **Response**: User receives success/error message

### 4. Lead Data Storage

All leads are stored in `data/leads.json` with:
- Unique ID
- Timestamp
- All form data (name, email, phone, message, property info, etc.)

### 5. Email Format

Emails include:
- Professional HTML formatting
- All lead information clearly organized
- Reply-to set to the lead's email address
- Timestamp of submission

### 6. Testing

1. Start the server:
   ```bash
   npm start
   # or for development
   npm run dev
   ```

2. Submit a test form on the website

3. Check:
   - Console logs for any errors
   - Your email inbox for the notification
   - `data/leads.json` for stored lead data

### 7. Troubleshooting

**Email not sending:**
- Check `.env` file has correct credentials
- Verify App Password is correct (for Gmail)
- Check console logs for error messages
- Ensure SMTP port is not blocked by firewall

**Leads not saving:**
- Check that `data/` directory is writable
- Check console logs for file system errors

### 8. Optional: View Leads

You can view all leads by reading `data/leads.json` or create a simple admin page to view them.

### 9. Production Considerations

For production:
- Use environment variables (already set up)
- Consider adding rate limiting
- Add spam protection (reCAPTCHA)
- Set up email backup/forwarding
- Consider database instead of JSON file for large scale
- Add logging/monitoring


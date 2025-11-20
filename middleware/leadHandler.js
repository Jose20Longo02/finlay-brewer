// Lead Handler - Processes and stores form submissions
const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const { query } = require('../config/database');

class LeadHandler {
    constructor() {
        this.emailMethod = this.determineEmailMethod();
        this.initEmailTransporter();
    }

    determineEmailMethod() {
        // Prefer SendGrid if API key is provided (more reliable on cloud platforms)
        if (process.env.SENDGRID_API_KEY) {
            return 'sendgrid';
        }
        // Fall back to SMTP if credentials are provided
        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            return 'smtp';
        }
        return 'none';
    }

    /**
     * Parse recipient emails from environment variable
     * Supports single email or comma-separated list
     * @returns {string[]} Array of email addresses
     */
    getRecipientEmails() {
        const leadEmail = process.env.LEAD_EMAIL;
        const smtpUser = process.env.SMTP_USER;
        const sendgridFrom = process.env.SENDGRID_FROM_EMAIL;
        
        // Get the email string (prefer LEAD_EMAIL, fallback to others)
        const emailString = leadEmail || smtpUser || sendgridFrom;
        
        if (!emailString) {
            return [];
        }
        
        // Split by comma and clean up (trim whitespace, remove empty strings)
        return emailString
            .split(',')
            .map(email => email.trim())
            .filter(email => email.length > 0 && email.includes('@'));
    }

    initEmailTransporter() {
        if (this.emailMethod === 'sendgrid') {
            // Initialize SendGrid
            sgMail.setApiKey(process.env.SENDGRID_API_KEY);
            console.log('Email method: SendGrid (API)');
        } else if (this.emailMethod === 'smtp') {
            // Initialize SMTP transporter
            const smtpPort = parseInt(process.env.SMTP_PORT || '587');
            const useSecure = smtpPort === 465;
            
            // Enhanced SMTP configuration for cloud platforms like Render
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: smtpPort,
                secure: useSecure, // true for 465, false for other ports
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                },
                // Increased timeouts for cloud environments
                connectionTimeout: 30000, // 30 seconds (increased from 10)
                greetingTimeout: 30000, // 30 seconds (increased from 10)
                socketTimeout: 30000, // 30 seconds (increased from 10)
                // Disable pooling - create new connection each time (more reliable on cloud)
                pool: false,
                // TLS options for better compatibility
                tls: {
                    // Don't fail on invalid certificates (needed for some cloud environments)
                    rejectUnauthorized: false,
                    // Use modern TLS
                    minVersion: 'TLSv1.2'
                },
                // Require TLS for port 587
                requireTLS: !useSecure && smtpPort === 587,
                // Debug mode (set to true for troubleshooting)
                debug: process.env.SMTP_DEBUG === 'true',
                logger: process.env.SMTP_DEBUG === 'true'
            });

            // Verify email configuration (non-blocking, don't fail if email is down)
            // Use a longer timeout for verification
            const verifyPromise = this.transporter.verify();
            const verifyTimeout = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Verification timeout')), 30000);
            });
            
            Promise.race([verifyPromise, verifyTimeout])
                .then(() => {
                    console.log('Email method: SMTP - Server is ready to send messages');
                })
                .catch((error) => {
                    console.warn('SMTP verification warning (emails may still work):', error.message);
                    console.warn('Configuration:', {
                        host: process.env.SMTP_HOST || 'smtp.gmail.com',
                        port: parseInt(process.env.SMTP_PORT || '587'),
                        user: process.env.SMTP_USER ? '***configured***' : 'not set'
                    });
                });
        } else {
            console.warn('Email not configured. Set either SENDGRID_API_KEY or SMTP_USER/SMTP_PASS');
        }
    }

    async saveLead(leadData) {
        try {
            // Determine if it's a property inquiry or contact form
            const isPropertyInquiry = leadData.property !== undefined;

            // Prepare data for database insertion
            const insertData = {
                first_name: leadData.firstName || null,
                last_name: leadData.lastName || null,
                name: leadData.name || null,
                email: leadData.email || null,
                email_address: leadData.emailAddress || null,
                phone: leadData.phone || null,
                phone_number: leadData.phoneNumber || null,
                country_code: leadData.countryCode || null,
                phone_full: leadData.phoneFull || null,
                property: leadData.property || null,
                message: leadData.message || null,
                best_time_to_contact: leadData.bestTimeToContact || null,
                lead_data: leadData // Store full data as JSONB for flexibility
            };

            // Insert into database
            const result = await query(
                `INSERT INTO leads (
                    first_name, last_name, name, email, email_address,
                    phone, phone_number, country_code, phone_full,
                    property, message, best_time_to_contact, lead_data
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                RETURNING id, timestamp, created_at`,
                [
                    insertData.first_name,
                    insertData.last_name,
                    insertData.name,
                    insertData.email,
                    insertData.email_address,
                    insertData.phone,
                    insertData.phone_number,
                    insertData.country_code,
                    insertData.phone_full,
                    insertData.property,
                    insertData.message,
                    insertData.best_time_to_contact,
                    JSON.stringify(insertData.lead_data)
                ]
            );

            const savedLead = result.rows[0];
            
            return {
                id: savedLead.id.toString(),
                timestamp: savedLead.timestamp.toISOString(),
                ...leadData
            };
        } catch (error) {
            console.error('Error saving lead to database:', error);
            throw error;
        }
    }

    async sendEmailNotification(leadData) {
        if (this.emailMethod === 'none') {
            console.warn('Email not configured, skipping email notification');
            return false;
        }

        // Get recipient emails (supports multiple comma-separated emails)
        const recipientEmails = this.getRecipientEmails();
        
        if (recipientEmails.length === 0) {
            console.warn('No recipient emails configured. Set LEAD_EMAIL environment variable.');
            return false;
        }

        const isPropertyInquiry = leadData.property !== undefined;

        const subject = isPropertyInquiry
            ? `New Property Inquiry: ${leadData.property || 'Unknown Property'}`
            : 'New Contact Form Submission - Finlay Brewer International';

        const emailBody = this.formatEmailBody(leadData, isPropertyInquiry);
        const emailText = this.formatEmailText(leadData, isPropertyInquiry);

        console.log(`Sending email notification to ${recipientEmails.length} recipient(s): ${recipientEmails.join(', ')}`);

        try {
            if (this.emailMethod === 'sendgrid') {
                // Use SendGrid API
                const fromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_USER || 'noreply@finlaybrewer.com';
                const fromName = process.env.SMTP_FROM_NAME || 'Finlay Brewer Website';

                const msg = {
                    to: recipientEmails, // SendGrid accepts array of emails
                    from: {
                        email: fromEmail,
                        name: fromName
                    },
                    replyTo: leadData.email || leadData.emailAddress,
                    subject: subject,
                    html: emailBody,
                    text: emailText
                };

                await sgMail.send(msg);
                console.log(`Email sent via SendGrid to ${recipientEmails.length} recipient(s)`);
                return true;
            } else {
                // Use SMTP with retry logic
                const fromEmail = process.env.SMTP_USER;
                const fromName = process.env.SMTP_FROM_NAME || 'Finlay Brewer Website';

                // For SMTP, convert array to comma-separated string or use array (nodemailer supports both)
                const toEmails = recipientEmails.join(', ');

                // Retry logic for SMTP (up to 3 attempts)
                let lastError;
                const maxRetries = 3;
                
                for (let attempt = 1; attempt <= maxRetries; attempt++) {
                    try {
                        console.log(`SMTP send attempt ${attempt} of ${maxRetries}...`);
                        
                        // Create email promise
                        const emailPromise = this.transporter.sendMail({
                            from: `"${fromName}" <${fromEmail}>`,
                            to: toEmails, // nodemailer accepts comma-separated string or array
                            replyTo: leadData.email || leadData.emailAddress,
                            subject: subject,
                            html: emailBody,
                            text: emailText
                        });

                        // Extended timeout (45 seconds) for cloud environments
                        const timeoutPromise = new Promise((_, reject) => {
                            setTimeout(() => reject(new Error('Email send timeout after 45 seconds')), 45000);
                        });

                        const info = await Promise.race([emailPromise, timeoutPromise]);

                        console.log(`Email sent via SMTP (attempt ${attempt}) to ${recipientEmails.length} recipient(s):`, info.messageId);
                        return true;
                    } catch (error) {
                        lastError = error;
                        console.warn(`SMTP attempt ${attempt} failed:`, error.message);
                        
                        // If not the last attempt, wait before retrying
                        if (attempt < maxRetries) {
                            const waitTime = attempt * 2000; // 2s, 4s, 6s
                            console.log(`Waiting ${waitTime}ms before retry...`);
                            await new Promise(resolve => setTimeout(resolve, waitTime));
                        }
                    }
                }
                
                // All retries failed
                throw lastError;
            }
        } catch (error) {
            // Log error but don't throw - lead is already saved
            console.error('Error sending email notification:', error.message);
            console.error('Lead was saved successfully, but email notification failed.');
            
            if (this.emailMethod === 'smtp') {
                console.error('SMTP connection failed. This is often due to port restrictions on Render.');
                console.error('Recommended: Use SendGrid instead (set SENDGRID_API_KEY environment variable)');
            } else {
                console.error('SendGrid error. Check your API key and from email address.');
            }
            
            return false;
        }
    }

    formatEmailBody(leadData, isPropertyInquiry) {
        let fields;
        
        if (isPropertyInquiry) {
            // For property inquiries, show country code and phone separately if available
            fields = {
                'Name': leadData.name,
                'Email': leadData.email,
                'Property': leadData.property || 'Not specified',
                'Message': leadData.message
            };
            
            // Add phone fields - show separately if country code exists
            if (leadData.countryCode && leadData.phone) {
                fields['Country Code'] = leadData.countryCode;
                fields['Phone Number'] = leadData.phone;
                fields['Full Phone'] = `${leadData.countryCode} ${leadData.phone}`.trim();
            } else if (leadData.phoneFull) {
                fields['Phone'] = leadData.phoneFull;
            } else if (leadData.phone) {
                fields['Phone'] = leadData.phone;
            }
        } else {
            // Contact form - combine country code and phone
            fields = {
                'First Name': leadData.firstName,
                'Last Name': leadData.lastName,
                'Email': leadData.emailAddress,
                'Message': leadData.message
            };
            
            // Add phone - show separately if country code exists
            if (leadData.countryCode && leadData.phoneNumber) {
                fields['Country Code'] = leadData.countryCode;
                fields['Phone Number'] = leadData.phoneNumber;
                fields['Full Phone'] = `${leadData.countryCode} ${leadData.phoneNumber}`.trim();
            } else if (leadData.phoneNumber) {
                fields['Phone'] = leadData.phoneNumber;
            }
        }

        let html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
                    .field { margin-bottom: 15px; }
                    .label { font-weight: bold; color: #555; margin-bottom: 5px; display: block; }
                    .value { color: #333; }
                    .message-box { background: white; padding: 15px; border-left: 4px solid #667eea; margin-top: 10px; }
                    .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>${isPropertyInquiry ? '🏠 New Property Inquiry' : '📧 New Contact Form Submission'}</h2>
                    </div>
                    <div class="content">
        `;

        // Display all fields except Message (will show in message box)
        Object.entries(fields).forEach(([label, value]) => {
            if (value && label !== 'Message') {
                html += `
                    <div class="field">
                        <span class="label">${label}:</span>
                        <span class="value">${value}</span>
                    </div>
                `;
            }
        });

        // Show message in highlighted box
        const message = fields['Message'] || leadData.message || 'No message provided';
        html += `
                        <div class="message-box">
                            <strong>Message:</strong><br>
                            ${message}
                        </div>
                        <div class="footer">
                            <p>Submitted on ${new Date().toLocaleString()}</p>
                            <p>Finlay Brewer International</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        return html;
    }

    formatEmailText(leadData, isPropertyInquiry) {
        let fields;
        
        if (isPropertyInquiry) {
            // For property inquiries, show country code and phone separately if available
            fields = {
                'Name': leadData.name,
                'Email': leadData.email,
                'Property': leadData.property || 'Not specified',
                'Message': leadData.message
            };
            
            // Add phone fields - show separately if country code exists
            if (leadData.countryCode && leadData.phone) {
                fields['Country Code'] = leadData.countryCode;
                fields['Phone Number'] = leadData.phone;
                fields['Full Phone'] = `${leadData.countryCode} ${leadData.phone}`.trim();
            } else if (leadData.phoneFull) {
                fields['Phone'] = leadData.phoneFull;
            } else if (leadData.phone) {
                fields['Phone'] = leadData.phone;
            }
            
            // Add best time to contact
            if (leadData.bestTimeToContact) {
                fields['Best Time to Contact'] = leadData.bestTimeToContact;
            }
        } else {
            // Contact form - combine country code and phone
            fields = {
                'First Name': leadData.firstName,
                'Last Name': leadData.lastName,
                'Email': leadData.emailAddress,
                'Message': leadData.message
            };
            
            // Add phone - show separately if country code exists
            if (leadData.countryCode && leadData.phoneNumber) {
                fields['Country Code'] = leadData.countryCode;
                fields['Phone Number'] = leadData.phoneNumber;
                fields['Full Phone'] = `${leadData.countryCode} ${leadData.phoneNumber}`.trim();
            } else if (leadData.phoneNumber) {
                fields['Phone'] = leadData.phoneNumber;
            }
            
            // Add best time to contact
            if (leadData.bestTimeToContact) {
                fields['Best Time to Contact'] = leadData.bestTimeToContact;
            }
        }

        let text = `${isPropertyInquiry ? 'New Property Inquiry' : 'New Contact Form Submission'}\n\n`;
        text += '='.repeat(50) + '\n\n';

        Object.entries(fields).forEach(([label, value]) => {
            if (value) {
                text += `${label}: ${value}\n`;
            }
        });

        text += `\nSubmitted on: ${new Date().toLocaleString()}\n`;
        text += '\nFinlay Brewer International';

        return text;
    }

    async processLead(leadData) {
        try {
            // Save to file
            const savedLead = await this.saveLead(leadData);

            // Send email notification
            const emailSent = await this.sendEmailNotification(leadData);

            return {
                success: true,
                leadId: savedLead.id,
                emailSent: emailSent
            };
        } catch (error) {
            console.error('Error processing lead:', error);
            throw error;
        }
    }
}

module.exports = new LeadHandler();


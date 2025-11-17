// Lead Handler - Processes and stores form submissions
const nodemailer = require('nodemailer');
const { query } = require('../config/database');

class LeadHandler {
    constructor() {
        this.initEmailTransporter();
    }

    initEmailTransporter() {
        // Email configuration from environment variables
        // For Gmail: Use App Password (not regular password)
        // For other providers: Adjust settings accordingly
        
        const smtpPort = parseInt(process.env.SMTP_PORT || '587');
        const useSecure = smtpPort === 465;
        
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: smtpPort,
            secure: useSecure, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            // Connection timeout settings for Render/cloud environments
            connectionTimeout: 10000, // 10 seconds
            greetingTimeout: 10000, // 10 seconds
            socketTimeout: 10000, // 10 seconds
            // Retry settings
            pool: true,
            maxConnections: 1,
            maxMessages: 3
        });

        // Verify email configuration (non-blocking, don't fail if email is down)
        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            // Don't block startup if email verification fails
            this.transporter.verify((error, success) => {
                if (error) {
                    console.warn('Email configuration warning (emails may still work):', error.message);
                    console.warn('Tip: Try using port 465 with SSL, or check if SMTP ports are accessible from Render');
                } else {
                    console.log('Email server is ready to send messages');
                }
            });
        } else {
            console.warn('Email not configured. Set SMTP_USER and SMTP_PASS in .env file');
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
                lead_data: leadData // Store full data as JSONB for flexibility
            };

            // Insert into database
            const result = await query(
                `INSERT INTO leads (
                    first_name, last_name, name, email, email_address,
                    phone, phone_number, country_code, phone_full,
                    property, message, lead_data
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
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
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.warn('Email not configured, skipping email notification');
            return false;
        }

        const recipientEmail = process.env.LEAD_EMAIL || process.env.SMTP_USER;
        const isPropertyInquiry = leadData.property !== undefined;

        const subject = isPropertyInquiry
            ? `New Property Inquiry: ${leadData.property || 'Unknown Property'}`
            : 'New Contact Form Submission - Finlay Brewer International';

        const emailBody = this.formatEmailBody(leadData, isPropertyInquiry);

        try {
            // Set a timeout for email sending to prevent hanging
            const emailPromise = this.transporter.sendMail({
                from: `"${process.env.SMTP_FROM_NAME || 'Finlay Brewer Website'}" <${process.env.SMTP_USER}>`,
                to: recipientEmail,
                replyTo: leadData.email || leadData.emailAddress,
                subject: subject,
                html: emailBody,
                text: this.formatEmailText(leadData, isPropertyInquiry)
            });

            // Add timeout wrapper (15 seconds max)
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Email send timeout')), 15000);
            });

            const info = await Promise.race([emailPromise, timeoutPromise]);

            console.log('Email sent:', info.messageId);
            return true;
        } catch (error) {
            // Log error but don't throw - lead is already saved
            console.error('Error sending email notification:', error.message);
            console.error('Lead was saved successfully, but email notification failed.');
            console.error('This is often due to SMTP port restrictions on Render. Consider:');
            console.error('1. Using port 465 with SSL (set SMTP_PORT=465)');
            console.error('2. Using a transactional email service (SendGrid, Mailgun, etc.)');
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


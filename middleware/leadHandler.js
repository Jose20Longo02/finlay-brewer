// Lead Handler - Processes and stores form submissions
const fs = require('fs').promises;
const path = require('path');
const nodemailer = require('nodemailer');

class LeadHandler {
    constructor() {
        this.leadsFilePath = path.join(__dirname, '../data/leads.json');
        this.initEmailTransporter();
    }

    initEmailTransporter() {
        // Email configuration from environment variables
        // For Gmail: Use App Password (not regular password)
        // For other providers: Adjust settings accordingly
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        // Verify email configuration
        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            this.transporter.verify((error, success) => {
                if (error) {
                    console.error('Email configuration error:', error);
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
            // Ensure data directory exists
            const dataDir = path.dirname(this.leadsFilePath);
            await fs.mkdir(dataDir, { recursive: true });

            // Read existing leads
            let leads = [];
            try {
                const data = await fs.readFile(this.leadsFilePath, 'utf8');
                leads = JSON.parse(data);
            } catch (error) {
                // File doesn't exist yet, start with empty array
                leads = [];
            }

            // Add new lead with timestamp
            const lead = {
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                ...leadData
            };

            leads.push(lead);

            // Save back to file
            await fs.writeFile(this.leadsFilePath, JSON.stringify(leads, null, 2));

            return lead;
        } catch (error) {
            console.error('Error saving lead:', error);
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
            const info = await this.transporter.sendMail({
                from: `"${process.env.SMTP_FROM_NAME || 'Finlay Brewer Website'}" <${process.env.SMTP_USER}>`,
                to: recipientEmail,
                replyTo: leadData.email || leadData.emailAddress,
                subject: subject,
                html: emailBody,
                text: this.formatEmailText(leadData, isPropertyInquiry)
            });

            console.log('Email sent:', info.messageId);
            return true;
        } catch (error) {
            console.error('Error sending email:', error);
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


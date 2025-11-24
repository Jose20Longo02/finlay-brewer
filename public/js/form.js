// Contact Form and Newsletter Form Handling

class FormHandler {
    constructor() {
        this.contactForm = document.getElementById('contactForm');
        this.newsletterForm = document.querySelector('.newsletter-form');
        this.submitButton = document.getElementById('submitButton');
        this.newsletterSuccess = document.querySelector('.newsletter-success');
        this.propertyInquiryForm = document.getElementById('propertyInquiryForm');
        this.propertyInquirySubmit = document.getElementById('propertyInquirySubmit');
        this.propertyInquiryName = document.getElementById('propertyInquiryName');
        this.propertyInquiryEmail = document.getElementById('propertyInquiryEmail');
        this.propertyInquiryCountryCode = document.getElementById('propertyInquiryCountryCode');
        this.propertyInquiryPhone = document.getElementById('propertyInquiryPhone');
        this.propertyInquiryMessage = document.getElementById('propertyInquiryMessage');
        this.propertyInquiryProperty = document.getElementById('propertyInquiryProperty');
        
        this.init();
    }
    
    init() {
        this.setupContactForm();
        this.setupNewsletterForm();
        this.setupPropertyInquiryForm();
        this.setupInputValidation();
    }
    
    setupContactForm() {
        if (!this.contactForm) return;
        
        this.contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!this.validateContactForm()) {
                return;
            }
            
            // Disable submit button
            if (this.submitButton) {
                this.submitButton.disabled = true;
                this.submitButton.textContent = 'Submitting...';
            }
            
            // Collect form data
            const bestTimeToContact = document.getElementById('bestTimeToContact')?.value || '';
            const budgetRange = document.getElementById('budgetRange')?.value || '';
            const formData = {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                countryCode: document.getElementById('countryCode').value,
                phoneNumber: document.getElementById('phoneNumber').value,
                emailAddress: document.getElementById('emailAddress').value,
                message: document.getElementById('message').value,
                bestTimeToContact: bestTimeToContact,
                budgetRange: budgetRange
            };
            
            try {
                // Send to server
                const response = await fetch('/submit-lead', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    // Track conversion in Google Ads
                    if (typeof gtag_report_conversion === 'function') {
                        gtag_report_conversion();
                    }
                    
                    // Show success message
                    this.showSuccessMessage(this.contactForm, 'Thank you! We\'ll be in touch soon.');
                    this.contactForm.reset();
                } else {
                    throw new Error(result.message || 'Submission failed');
                }
            } catch (error) {
                console.error('Form submission error:', error);
                this.showErrorMessage(this.contactForm, 'Something went wrong. Please try again.');
            } finally {
                // Re-enable submit button
                if (this.submitButton) {
                    this.submitButton.disabled = false;
                    this.submitButton.textContent = 'Submit';
                }
            }
        });
    }
    
    setupNewsletterForm() {
        if (!this.newsletterForm) return;
        
        this.newsletterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const emailInput = this.newsletterForm.querySelector('.newsletter-input');
            const email = emailInput.value.trim();
            
            if (!this.validateEmail(email)) {
                emailInput.style.borderColor = '#dc3545';
                return;
            }
            
            try {
                // In a real implementation, send to server
                // For now, just show success
                if (this.newsletterSuccess) {
                    this.newsletterSuccess.style.display = 'block';
                    emailInput.value = '';
                    emailInput.style.borderColor = '';
                    
                    // Hide success message after 5 seconds
                    setTimeout(() => {
                        if (this.newsletterSuccess) {
                            this.newsletterSuccess.style.display = 'none';
                        }
                    }, 5000);
                }
            } catch (error) {
                console.error('Newsletter subscription error:', error);
            }
        });
    }
    
    setupInputValidation() {
        const inputs = [
            ...(this.contactForm ? Array.from(this.contactForm.querySelectorAll('input, textarea, select')) : []),
            ...(this.propertyInquiryForm ? Array.from(this.propertyInquiryForm.querySelectorAll('input, textarea, select')) : [])
        ];
        
        inputs.forEach((input) => {
            input.addEventListener('blur', () => {
                this.validateInput(input);
            });
            
            const eventType = input.tagName === 'SELECT' ? 'change' : 'input';
            input.addEventListener(eventType, () => {
                // Clear error state on input/change
                if (input.style.borderColor === 'rgb(220, 53, 69)') {
                    input.style.borderColor = '';
                }
            });
        });
    }
    
    validateContactForm() {
        const firstName = document.getElementById('firstName');
        const lastName = document.getElementById('lastName');
        const countryCode = document.getElementById('countryCode');
        const phoneNumber = document.getElementById('phoneNumber');
        const emailAddress = document.getElementById('emailAddress');
        const message = document.getElementById('message');
        const bestTimeToContact = document.getElementById('bestTimeToContact');
        const budgetRange = document.getElementById('budgetRange');
        
        let isValid = true;
        
        if (!firstName.value.trim()) {
            this.showInputError(firstName);
            isValid = false;
        }
        
        if (!lastName.value.trim()) {
            this.showInputError(lastName);
            isValid = false;
        }
        
        if (!countryCode.value.trim()) {
            this.showInputError(countryCode);
            isValid = false;
        }
        
        if (!phoneNumber.value.trim()) {
            this.showInputError(phoneNumber);
            isValid = false;
        }
        
        if (!this.validateEmail(emailAddress.value)) {
            this.showInputError(emailAddress);
            isValid = false;
        }
        
        if (!message.value.trim()) {
            this.showInputError(message);
            isValid = false;
        }
        
        if (!bestTimeToContact || !bestTimeToContact.value) {
            if (bestTimeToContact) {
                this.showInputError(bestTimeToContact);
            }
            isValid = false;
        }
        
        if (!budgetRange || !budgetRange.value.trim()) {
            if (budgetRange) {
                this.showInputError(budgetRange);
            }
            isValid = false;
        }
        
        return isValid;
    }
    
    setupPropertyInquiryForm() {
        if (!this.propertyInquiryForm) return;
        
        this.propertyInquiryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!this.validatePropertyInquiryForm()) {
                return;
            }
            
            if (this.propertyInquirySubmit) {
                this.propertyInquirySubmit.disabled = true;
                this.propertyInquirySubmit.textContent = 'Sending...';
            }
            
            // Combine country code and phone number
            const countryCode = this.propertyInquiryCountryCode?.value.trim() || '';
            const phoneNumber = this.propertyInquiryPhone?.value.trim() || '';
            const fullPhone = countryCode && phoneNumber 
                ? `${countryCode} ${phoneNumber}`.trim()
                : phoneNumber || countryCode;

            // Get best time to contact
            const bestTimeToContact = document.getElementById('propertyInquiryBestTime')?.value || '';
            
            const formData = {
                name: this.propertyInquiryName?.value || '',
                email: this.propertyInquiryEmail?.value || '',
                countryCode: countryCode,
                phone: phoneNumber,
                phoneFull: fullPhone,
                message: this.propertyInquiryMessage?.value || '',
                property: this.propertyInquiryProperty?.value || '',
                bestTimeToContact: bestTimeToContact
            };
            
            try {
                const response = await fetch('/submit-lead', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    // Track conversion in Google Ads
                    if (typeof gtag_report_conversion === 'function') {
                        gtag_report_conversion();
                    }
                    
                    this.showSuccessMessage(this.propertyInquiryForm, 'Thank you! We will reach out shortly.');
                    this.propertyInquiryForm.reset();
                    
                    if (this.propertyInquiryMessage) {
                        const propertyName = formData.property || 'this property';
                        this.propertyInquiryMessage.value = `Hi, I'm interested in "${propertyName}". Please send me more information.`;
                    }
                    
                    if (this.propertyInquiryProperty) {
                        this.propertyInquiryProperty.value = formData.property;
                    }
                } else {
                    throw new Error(result.message || 'Submission failed');
                }
            } catch (error) {
                console.error('Property inquiry submission error:', error);
                this.showErrorMessage(this.propertyInquiryForm, 'Something went wrong. Please try again.');
            } finally {
                if (this.propertyInquirySubmit) {
                    this.propertyInquirySubmit.disabled = false;
                    this.propertyInquirySubmit.textContent = 'Send Inquiry';
                }
            }
        });
    }
    
    validatePropertyInquiryForm() {
        const bestTimeToContact = document.getElementById('propertyInquiryBestTime');
        let isValid = true;
        
        if (!this.propertyInquiryName?.value.trim()) {
            this.showInputError(this.propertyInquiryName);
            isValid = false;
        }
        
        if (!this.propertyInquiryEmail?.value.trim() || !this.validateEmail(this.propertyInquiryEmail.value)) {
            this.showInputError(this.propertyInquiryEmail);
            isValid = false;
        }
        
        if (!this.propertyInquiryCountryCode?.value.trim()) {
            this.showInputError(this.propertyInquiryCountryCode);
            isValid = false;
        }
        
        if (!this.propertyInquiryPhone?.value.trim()) {
            this.showInputError(this.propertyInquiryPhone);
            isValid = false;
        }
        
        if (!this.propertyInquiryMessage?.value.trim()) {
            this.showInputError(this.propertyInquiryMessage);
            isValid = false;
        }
        
        if (!bestTimeToContact || !bestTimeToContact.value) {
            if (bestTimeToContact) {
                this.showInputError(bestTimeToContact);
            }
            isValid = false;
        }
        
        return isValid;
    }
    
    validateInput(input) {
        if (input.hasAttribute('required') && !input.value.trim()) {
            this.showInputError(input);
            return false;
        }
        
        if (input.type === 'email' && input.value && !this.validateEmail(input.value)) {
            this.showInputError(input);
            return false;
        }
        
        // Clear error if valid
        input.style.borderColor = '';
        return true;
    }
    
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    showInputError(input) {
        input.style.borderColor = '#dc3545';
        input.focus();
    }
    
    showSuccessMessage(form, message) {
        this.showToast(message, 'success');
    }
    
    showErrorMessage(form, message) {
        this.showToast(message, 'error');
    }
    
    showToast(message, type = 'success') {
        // Remove existing toasts
        const existingToasts = document.querySelectorAll('.toast-notification');
        existingToasts.forEach(toast => {
            toast.classList.remove('toast-show');
            setTimeout(() => toast.remove(), 500);
        });
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        
        // Icon based on type
        const icon = type === 'success' 
            ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
            : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
        
        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-icon">${icon}</div>
                <div class="toast-message">${message}</div>
            </div>
        `;
        
        // Append to body first (off-screen)
        document.body.appendChild(toast);
        
        // Force reflow to ensure initial state is applied
        toast.offsetHeight;
        
        // Trigger slide-in animation after a tiny delay
        setTimeout(() => {
            toast.classList.add('toast-show');
        }, 10);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('toast-show');
            // Remove from DOM after slide-out animation completes
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 500); // Wait for slide-out animation (0.5s)
        }, 3000);
    }
}

// Initialize form handler when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new FormHandler();
    });
} else {
    new FormHandler();
}


// Property detail modal handling

class PropertyModal {
    constructor() {
        this.modal = document.getElementById('propertyModal');
        if (!this.modal) return;

        this.dialog = this.modal.querySelector('.property-modal__dialog');
        this.closeControls = Array.from(this.modal.querySelectorAll('[data-modal-close]'));
        this.prevButton = this.modal.querySelector('[data-modal-prev]');
        this.nextButton = this.modal.querySelector('[data-modal-next]');
        this.imageEl = document.getElementById('propertyModalImage');
        this.counterEl = document.getElementById('propertyModalCounter');
        this.thumbnailsEl = document.getElementById('propertyModalThumbnails');
        this.titleEl = document.getElementById('propertyModalTitle');
        this.locationEl = document.getElementById('propertyModalLocation');
        this.priceEl = document.getElementById('propertyModalPrice');
        this.statsEl = document.getElementById('propertyModalStats');
        this.descriptionEl = document.getElementById('propertyModalDescription');
        this.form = document.getElementById('propertyInquiryForm');
        this.propertyField = document.getElementById('propertyInquiryProperty');
        this.messageField = document.getElementById('propertyInquiryMessage');
        this.ctaButton = document.getElementById('propertyModalCTA');
        this.galleryCache = new Map();
        this.images = [];
        this.currentIndex = 0;
        this.property = null;
        this.focusedBeforeOpen = null;
        this.boundKeydown = this.handleKeydown.bind(this);
        this.boundPopState = this.handlePopState.bind(this);
        this.updateURLHash = true; // Flag to control URL updates

        this.initEvents();
        this.initURLHandling();
    }

    initEvents() {
        if (!this.modal) return;

        this.closeControls.forEach((control) => {
            control.addEventListener('click', (event) => {
                event.preventDefault();
                this.close();
            });
        });

        if (this.prevButton) {
            this.prevButton.addEventListener('click', () => this.showPrevious());
        }

        if (this.nextButton) {
            this.nextButton.addEventListener('click', () => this.showNext());
        }

        const overlay = this.modal.querySelector('.property-modal__overlay');
        if (overlay) {
            overlay.addEventListener('click', () => this.close());
        }
        
        if (this.ctaButton && this.form) {
            this.ctaButton.addEventListener('click', () => {
                this.form.scrollIntoView({ behavior: 'smooth', block: 'start' });
                const firstField = this.form.querySelector('input, textarea');
                if (firstField) {
                    setTimeout(() => {
                        firstField.focus();
                    }, 400);
                }
            });
        }
    }

    /**
     * Generate a SEO-friendly slug from a property title
     * @param {string} title - Property title
     * @returns {string} - URL-friendly slug
     */
    generateSlug(title) {
        if (!title) return '';
        
        return title
            .toLowerCase()
            .trim()
            // Replace common special characters with spaces
            .replace(/[^\w\s-]/g, ' ')
            // Replace multiple spaces/hyphens with single hyphen
            .replace(/[\s_-]+/g, '-')
            // Remove leading/trailing hyphens
            .replace(/^-+|-+$/g, '')
            // Limit to 80 characters for readability
            .substring(0, 80)
            // Remove trailing hyphen if cut off mid-word
            .replace(/-+$/, '');
    }

    initURLHandling() {
        // Listen for browser back/forward buttons
        window.addEventListener('popstate', this.boundPopState);
        
        // Check URL on page load (after DOM is ready)
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                // Small delay to ensure PropertyDataStore is initialized
                setTimeout(() => this.checkURLHash(), 100);
            });
        } else {
            // DOM already loaded, small delay to ensure PropertyDataStore is initialized
            setTimeout(() => this.checkURLHash(), 100);
        }
    }

    handlePopState(event) {
        // When user navigates back/forward, check if we need to open/close modal
        this.checkURLHash();
    }

    checkURLHash() {
        const hash = window.location.hash;
        // Support both old format (#property-1) and new format (#slug)
        if (hash && hash.length > 1) {
            const slug = hash.substring(1); // Remove the '#'
            this.openPropertyFromURL(slug);
        } else if (this.modal && this.modal.classList.contains('open')) {
            // If there's no hash but modal is open, close it
            this.close();
        }
    }

    async openPropertyFromURL(slugOrId) {
        if (!window.PropertyDataStore) {
            console.warn('PropertyDataStore is not available. Cannot open property from URL.');
            return;
        }

        try {
            const properties = await window.PropertyDataStore.getProperties();
            let property = null;
            
            // First, try to find by ID (for backward compatibility with old URLs)
            if (slugOrId.startsWith('property-')) {
                property = properties.find(p => p.id === slugOrId);
            }
            
            // If not found by ID, try to find by slug (match generated slug from title)
            if (!property) {
                property = properties.find(p => {
                    const propertySlug = this.generateSlug(p.title);
                    return propertySlug === slugOrId;
                });
            }
            
            if (property) {
                // Open the property modal without updating URL (to avoid duplicate hash)
                this.updateURLHash = false;
                this.open(property);
                this.updateURLHash = true;
            } else {
                console.warn(`Property with slug/ID "${slugOrId}" not found.`);
                // Remove invalid hash
                if (window.history.replaceState) {
                    window.history.replaceState(null, '', window.location.pathname);
                }
            }
        } catch (error) {
            console.error('Error loading property from URL:', error);
        }
    }

    updateURLForProperty(property) {
        if (!property || !property.title) return;
        
        const slug = this.generateSlug(property.title);
        if (!slug) return;
        
        const newHash = `#${slug}`;
        const currentHash = window.location.hash;
        
        // Only update if hash is different
        if (currentHash !== newHash) {
            if (window.history.pushState) {
                window.history.pushState(null, '', newHash);
            } else {
                // Fallback for older browsers
                window.location.hash = newHash;
            }
        }
    }

    clearURLHash() {
        // Remove hash from URL without triggering page reload
        if (window.history.replaceState) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
        } else {
            // Fallback for older browsers
            window.location.hash = '';
        }
    }

    async open(property) {
        if (!this.modal) return;

        this.property = property;
        this.focusedBeforeOpen = document.activeElement;

        // Reset form and remove previous messages
        if (this.form) {
            this.form.reset();
            const messageNode = this.form.querySelector('.form-message');
            if (messageNode) {
                messageNode.remove();
            }
            if (this.propertyField) {
                this.propertyField.value = property.title || '';
            }
            if (this.messageField) {
                this.messageField.value = `Hi, I'm interested in "${property.title}". Please send me more information.`;
            }
        }

        this.populateDetails(property);

        if (this.galleryCache.has(property.id)) {
            this.images = [...this.galleryCache.get(property.id)];
        } else {
            this.images = [property.image];
            this.populateGalleryAsync(property);
        }

        this.currentIndex = 0;
        this.renderGallery();

        this.modal.classList.add('open');
        this.modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        document.addEventListener('keydown', this.boundKeydown);

        if (this.dialog) {
            this.dialog.focus();
        } else if (this.closeControls[0]) {
            this.closeControls[0].focus();
        }

        // Update URL hash if enabled
        if (this.updateURLHash) {
            this.updateURLForProperty(property);
        }
    }

    close() {
        if (!this.modal) return;
        this.modal.classList.remove('open');
        this.modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
        document.removeEventListener('keydown', this.boundKeydown);
        if (this.modal.scrollTop > 0) {
            this.modal.scrollTo({ top: 0, behavior: 'auto' });
        }
        if (this.dialog) {
            if (this.dialog.scrollTop > 0) {
                this.dialog.scrollTo({ top: 0, behavior: 'auto' });
            }
            const contentWrapper = this.dialog.querySelector('.property-modal__content');
            if (contentWrapper && contentWrapper.scrollTop > 0) {
                contentWrapper.scrollTo({ top: 0, behavior: 'auto' });
            }
        }

        if (this.focusedBeforeOpen && typeof this.focusedBeforeOpen.focus === 'function') {
            this.focusedBeforeOpen.focus();
        }
        
        // Clear URL hash when closing modal
        if (this.updateURLHash) {
            this.clearURLHash();
        }

        // Dispatch custom event to notify that modal is closed
        // Dispatch on both modal and document to ensure it's caught
        const closeEvent = new CustomEvent('propertyModalClosed', {
            bubbles: true,
            cancelable: false,
            detail: { modal: this.modal }
        });
        this.modal.dispatchEvent(closeEvent);
        document.dispatchEvent(closeEvent); // Also dispatch on document for better event propagation
    }

    populateDetails(property) {
        if (this.titleEl) {
            this.titleEl.textContent = property.title || '';
        }

        if (this.locationEl) {
            this.locationEl.textContent = property.location || 'Nice, France';
        }

        if (this.priceEl) {
            this.priceEl.textContent = property.price ? `€${Number(property.price).toLocaleString()}` : '';
        }

        if (this.descriptionEl) {
            this.descriptionEl.textContent = property.description || '';
        }

        if (this.statsEl) {
            const stats = this.buildStatCards(property);
            this.statsEl.innerHTML = stats;
        }

        // Highlights section removed - no longer needed
    }

    buildStatCards(property) {
        const statEntries = [
            { label: 'Interior', value: this.formatMetric(property.area, 'm²') },
            { label: 'Bedrooms', value: this.formatMetric(property.beds) },
            { label: 'Bathrooms', value: this.formatMetric(property.baths) },
            { label: 'Rooms', value: this.formatMetric(property.rooms) },
            // Add lot size if available
            { label: 'Lot Size', value: this.formatMetric(property.lotSize, 'm²') }
        ].filter((entry) => entry.value);

        return statEntries.map((entry) => `
            <div class="property-modal__stat-card">
                <span class="property-modal__stat-label">${entry.label}</span>
                <span class="property-modal__stat-value">${entry.value}</span>
            </div>
        `).join('');
    }

    buildHighlights(property) {
        const highlights = [];

        if (property.type) {
            highlights.push(`${property.type.charAt(0).toUpperCase()}${property.type.slice(1)}`);
        }

        if (property.lotSize) {
            highlights.push(`Lot size: ${this.formatMetric(property.lotSize, 'm²')}`);
        }

        if (property.parking !== null && property.parking !== undefined) {
            const spaces = Number(property.parking);
            if (!Number.isNaN(spaces) && spaces > 0) {
                highlights.push(`${spaces} parking ${spaces > 1 ? 'spaces' : 'space'}`);
            }
        }

        if (property.featured) {
            highlights.push('Featured listing');
        }

        if (property.new) {
            highlights.push('Recently added');
        }

        return highlights.length
            ? highlights.map((item) => `<div class="property-modal__highlight">${item}</div>`).join('')
            : '';
    }

    formatMetric(value, suffix = '') {
        if (value === null || value === undefined || value === '') {
            return null;
        }

        if (typeof value === 'number') {
            const formatted = Number.isInteger(value)
                ? value.toLocaleString()
                : value.toLocaleString(undefined, { maximumFractionDigits: 1 });
            return suffix ? `${formatted} ${suffix}` : formatted;
        }

        return suffix ? `${value} ${suffix}` : value;
    }

    async populateGalleryAsync(property) {
        const images = await this.fetchGalleryImages(property);
        if (this.property?.id !== property.id) {
            return; // User closed or opened another property before this resolved
        }

        if (images.length) {
            const uniqueImages = Array.from(new Set([property.image, ...images]));
            this.galleryCache.set(property.id, uniqueImages);
            this.images = uniqueImages;
            this.currentIndex = 0;
            this.renderGallery();
        } else {
            this.galleryCache.set(property.id, [property.image]);
        }
    }

    async fetchGalleryImages(property) {
        const primary = property.image;
        if (!primary) return [];
        
        const match = primary.match(/^(.*\/)(\d+)\.(jpe?g|png|webp)$/i);
        if (!match) return [];
        
        const [, basePath, startingIndex, extension] = match;
        const start = parseInt(startingIndex, 10);
        const extraImages = [];
        
        for (let index = start + 1; index <= start + 12; index += 1) {
            const candidate = `${basePath}${index}.${extension}`;
            // eslint-disable-next-line no-await-in-loop
            const exists = await this.imageExists(candidate);
            if (!exists) {
                break;
            }
            extraImages.push(candidate);
        }
        
        return extraImages;
    }
    
    async imageExists(url) {
        try {
            const response = await fetch(url, { method: 'HEAD', cache: 'no-cache' });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    renderGallery() {
        if (!this.imageEl || !this.images.length) return;

        const total = this.images.length;
        const index = Math.max(0, Math.min(this.currentIndex, total - 1));
        const src = this.images[index];

        this.imageEl.src = src;
        this.imageEl.alt = this.property?.title
            ? `${this.property.title} photo ${index + 1}`
            : `Property photo ${index + 1}`;

        if (this.counterEl) {
            this.counterEl.textContent = `${index + 1} / ${total}`;
            this.counterEl.style.visibility = total > 1 ? 'visible' : 'hidden';
        }

        this.updateNavigation(total);
        this.renderThumbnails();
    }

    updateNavigation(total) {
        const hasMultiple = total > 1;
        if (this.prevButton) {
            this.prevButton.style.display = hasMultiple ? 'inline-flex' : 'none';
        }
        if (this.nextButton) {
            this.nextButton.style.display = hasMultiple ? 'inline-flex' : 'none';
        }
    }

    renderThumbnails() {
        if (!this.thumbnailsEl) return;

        const total = this.images.length;
        this.thumbnailsEl.innerHTML = '';

        if (total <= 1) {
            this.thumbnailsEl.style.display = 'none';
            return;
        }

        this.thumbnailsEl.style.display = 'grid';

        this.images.forEach((src, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'property-modal__thumbnail';
            if (index === this.currentIndex) {
                button.classList.add('property-modal__thumbnail--active');
            }
            button.setAttribute('aria-label', `View image ${index + 1} of ${total}`);

            const img = document.createElement('img');
            img.src = src;
            img.loading = 'lazy'; // Lazy load property images
            img.decoding = 'async'; // Async decoding for better performance
            img.alt = this.property?.title
                ? `${this.property.title} thumbnail ${index + 1}`
                : `Property thumbnail ${index + 1}`;

            button.appendChild(img);
            button.addEventListener('click', () => {
                this.currentIndex = index;
                this.renderGallery();
            });

            this.thumbnailsEl.appendChild(button);
        });
    }

    showPrevious() {
        if (this.images.length <= 1) return;
        this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
        this.renderGallery();
    }

    showNext() {
        if (this.images.length <= 1) return;
        this.currentIndex = (this.currentIndex + 1) % this.images.length;
        this.renderGallery();
    }

    handleKeydown(event) {
        if (!this.modal?.classList.contains('open')) return;

        if (event.key === 'Escape') {
            this.close();
        } else if (event.key === 'ArrowRight') {
            this.showNext();
        } else if (event.key === 'ArrowLeft') {
            this.showPrevious();
        }
    }
}

// Create global PropertyModal instance for use by both PropertySearch and HeroCarousel
let globalPropertyModal = null;

// Property Search and Grid Functionality

class PropertySearch {
    constructor() {
        this.grid = document.getElementById('grid');
        this.emptyState = document.getElementById('emptyState');
        this.searchButton = document.getElementById('searchButton');
        this.typeFilter = document.getElementById('typeFilter');
        this.priceFilter = document.getElementById('priceFilter');
        this.roomFilter = document.getElementById('roomFilter');
        this.properties = [];
        this.filteredProperties = [];
        
        // Use global modal instance
        if (!globalPropertyModal) {
            globalPropertyModal = new PropertyModal();
            window.PropertyModalInstance = globalPropertyModal;
        }
        this.modal = globalPropertyModal;
        
        this.init();
    }
    
    async init() {
        await this.loadProperties();
        this.populateTypeFilter();
        this.renderProperties();
        this.setupEventListeners();
    }
    
    async loadProperties() {
        if (!window.PropertyDataStore) {
            throw new Error('PropertyDataStore is not available. Ensure dataStore.js is loaded before properties.js');
        }
        
        const properties = await window.PropertyDataStore.getProperties();
        this.properties = properties.map((property) => ({
            ...property,
            price: Number(property.price),
            area: property.area !== null && property.area !== undefined ? Number(property.area) : null,
            beds: property.beds !== undefined ? property.beds : null,
            baths: property.baths !== undefined ? property.baths : null,
            rooms: property.rooms !== undefined ? property.rooms : null,
            parking: property.parking !== undefined ? property.parking : null
        }));
        
        this.filteredProperties = [...this.properties];
    }
    
    populateTypeFilter() {
        if (!this.typeFilter) return;
        
        const uniqueTypes = Array.from(
            new Set(this.properties.map((property) => property.type).filter(Boolean))
        );
        
        const options = [
            { value: '', label: 'All Types' },
            ...uniqueTypes.map((type) => ({
                value: type,
                label: type.charAt(0).toUpperCase() + type.slice(1)
            }))
        ];
        
        this.typeFilter.innerHTML = options
            .map((option) => `<option value="${option.value}">${option.label}</option>`)
            .join('');
    }
    
    filterProperties() {
        const typeValue = this.typeFilter.value;
        const priceValue = this.priceFilter.value;
        const roomValue = this.roomFilter.value;
        
        this.filteredProperties = this.properties.filter(property => {
            // Type filter
            if (typeValue && property.type !== typeValue) {
                return false;
            }
            
            // Price filter
            if (priceValue) {
                if (priceValue === '10000000+') {
                    if (property.price < 10000000) return false;
                } else {
                    const [min, max] = priceValue.split('-').map(Number);
                    if (property.price < min || property.price > max) return false;
                }
            }
            
            // Room filter
            if (roomValue) {
                if (roomValue === '7+') {
                    if (property.rooms < 7) return false;
                } else {
                    const [min, max] = roomValue.split('-').map(Number);
                    if (property.rooms < min || property.rooms > max) return false;
                }
            }
            
            return true;
        });
        
        this.renderProperties();
    }
    
    renderProperties() {
        if (this.filteredProperties.length === 0) {
            this.grid.style.display = 'none';
            this.emptyState.style.display = 'block';
            return;
        }
        
        this.grid.style.display = 'grid';
        this.emptyState.style.display = 'none';
        
        // Clear existing cards
        this.grid.innerHTML = '';
        
        // Create skeleton loaders or render properties
        this.filteredProperties.forEach(property => {
            const card = this.createPropertyCard(property);
            this.grid.appendChild(card);
        });
    }
    
    createPropertyCard(property) {
        const formatStat = (value, suffix) => {
            if (value === null || value === undefined) {
                return '--';
            }
            if (typeof value === 'number') {
                return `${Number.isInteger(value) ? value.toLocaleString() : value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 })} ${suffix}`.trim();
            }
            return `${value} ${suffix}`.trim();
        };
        
        const card = document.createElement('div');
        card.className = 'property-card';
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `View details for ${property.title}`);
        card.innerHTML = `
            <img src="${property.image}" alt="${property.title}" class="property-image" loading="lazy">
            <div class="property-content">
                <h3 class="property-title">${property.title}</h3>
                <p class="property-location">${property.location || 'Nice, France'}</p>
                <div class="property-price">€${property.price.toLocaleString()}</div>
                <div class="property-stats">
                    <div class="stat-item">
                        <span class="stat-icon" aria-hidden="true">
                            <img src="/images/icons/size-icon.png" alt="">
                        </span>
                        <span>${formatStat(property.area, 'm²')}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-icon" aria-hidden="true">
                            <img src="/images/icons/bed-icon.png" alt="">
                        </span>
                        <span>${formatStat(property.beds, 'beds')}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-icon" aria-hidden="true">
                            <img src="/images/icons/bath-icon.png" alt="">
                        </span>
                        <span>${formatStat(property.baths, 'baths')}</span>
                    </div>
                </div>
            </div>
        `;

        card.addEventListener('click', (event) => {
            event.preventDefault();
            if (this.modal) {
                this.modal.open(property);
            }
        });

        card.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                if (this.modal) {
                    this.modal.open(property);
                }
            }
        });

        return card;
    }
    
    setupEventListeners() {
        if (this.searchButton) {
            this.searchButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.filterProperties();
            });
        }
        
        // Filter on change
        [this.typeFilter, this.priceFilter, this.roomFilter].forEach(filter => {
            if (filter) {
                filter.addEventListener('change', () => {
                    this.filterProperties();
                });
            }
        });
    }
}

// Initialize property search when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new PropertySearch();
    });
} else {
    new PropertySearch();
}

// Export PropertyModal class for use in other modules
window.PropertyModal = PropertyModal;


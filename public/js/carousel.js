// Hero Carousel with Autoplay Animation

const HERO_STAT_ICONS = {
    area: `<img src="/images/icons/size-icon.png" alt="Size icon">`,
    beds: `<img src="/images/icons/bed-icon.png" alt="Beds icon">`,
    baths: `<img src="/images/icons/bath-icon.png" alt="Baths icon">`
};

class HeroCarousel {
    constructor() {
        this.track = document.getElementById('carouselTrack');
        this.prevBtn = document.querySelector('.carousel-prev');
        this.nextBtn = document.querySelector('.carousel-next');
        this.cards = [];
        this.currentIndex = 0;
        this.centerDomIndex = 1;
        this.isPaused = false;
        this.autoplayInterval = null;
        this.transitionDuration = 600;
        this.pauseDuration = 1000;
        this.isTransitioning = false;
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.lastClickedCard = null; // Track the last clicked card to remove focus
        this.cardTiltData = new Map(); // Store smooth tilt data for each card
        
        // Check for reduced motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            this.transitionDuration = 1200;
        }
        
        this.init();
    }
    
    async init() {
        await this.loadProperties();
        this.setupCarousel();
        // Wait a bit for layout to settle before positioning
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                this.updatePosition();
                this.startAutoplay();
            });
        });
        this.setupEventListeners();
    }
    
    async loadProperties() {
        if (!window.PropertyDataStore) {
            throw new Error('PropertyDataStore is not available. Ensure dataStore.js is loaded before carousel.js');
        }
        
        const properties = await window.PropertyDataStore.getHeroSelection();
        this.cards = properties.map((property) => ({
            ...property,
            price: Number(property.price),
            size: property.lotSize !== null && property.lotSize !== undefined
                ? Number(property.lotSize)
                : (property.area !== null && property.area !== undefined ? Number(property.area) : null),
            area: property.area !== null && property.area !== undefined ? Number(property.area) : null,
            beds: property.beds !== undefined ? property.beds : null,
            baths: property.baths !== undefined ? property.baths : null,
            parking: property.parking !== undefined ? property.parking : null
        }));
    }
    
    setupCarousel() {
        if (!this.cards || this.cards.length === 0) {
            return;
        }

        this.track.innerHTML = '';

        const fragment = document.createDocumentFragment();
        this.cards.forEach((card, index) => {
            const cardElement = this.createCard(card, index);
            fragment.appendChild(cardElement);
        });
        this.track.appendChild(fragment);

        if (this.track.children.length > 1) {
            const lastCard = this.track.lastElementChild;
            this.track.insertBefore(lastCard, this.track.firstElementChild);
            this.centerDomIndex = 1;
        } else {
            this.centerDomIndex = 0;
        }

        this.currentIndex = 0;

        this.track.style.transition = 'none';
        const baseOffset = this.calculateDomOffset(this.centerDomIndex);
        this.track.style.transform = `translateX(-${baseOffset}px)`;

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                this.track.style.transition = `transform ${this.transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
                this.updateCardScales();
            });
        });
    }
    
    createCard(property, index) {
        const formatMetric = (value, { suffix = '', decimals = 0 } = {}) => {
            if (value === null || value === undefined) {
                return '--';
            }
            if (typeof value === 'number') {
                const options = decimals > 0
                    ? { minimumFractionDigits: decimals, maximumFractionDigits: decimals }
                    : undefined;
                const formatted = options ? value.toLocaleString(undefined, options) : value.toLocaleString();
                return suffix ? `${formatted} ${suffix}` : formatted;
            }
            return suffix ? `${value} ${suffix}` : value;
        };

        const renderStat = (type, displayValue) => `
            <div class="stat-item">
                <span class="stat-icon">${HERO_STAT_ICONS[type] || ''}</span>
                <span class="card-value">${displayValue}</span>
            </div>
        `;

        const sizeLabel = formatMetric(property.size ?? property.area, { suffix: 'm²' });
        const bedsLabel = formatMetric(property.beds);
        const bathsLabel = formatMetric(property.baths);

        const card = document.createElement('div');
        card.className = 'hero-card';
        card.dataset.cardIndex = index.toString();
        card.dataset.propertyId = property.id || index.toString();
        // Store property data on the card element for click handler
        card._propertyData = property;
        // Make card clickable
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `View details for ${property.title}`);
        card.style.cursor = 'pointer';
        // Initialize with normal size, no transition
        card.style.transform = 'scale(1)';
        card.style.transition = 'none';
        card.innerHTML = `
            <div class="card-media">
                <img src="${property.image}" alt="${property.title}" class="card-image" loading="lazy">
            </div>
            <div class="card-overlay">
                <div class="card-overlay-content">
                    <h3 class="card-title">${property.title}</h3>
                    <div class="card-meta">
                        <div class="card-price">€${property.price.toLocaleString()}</div>
                        <div class="card-stats">
                            ${renderStat('area', sizeLabel)}
                            ${renderStat('beds', bedsLabel)}
                            ${renderStat('baths', bathsLabel)}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add click handler to open property modal
        card.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.lastClickedCard = card; // Store reference to clicked card
            this.openPropertyModal(property);
        });
        
        // Add keyboard handler
        card.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                event.stopPropagation();
                this.lastClickedCard = card; // Store reference to clicked card
                this.openPropertyModal(property);
            }
        });
        
        return card;
    }
    
    handleCardMouseMove(event, card) {
        if (!card.classList.contains('is-hovered')) return;
        
        // Use latest event if available (from batched updates)
        const latestEvent = card._lastMouseEvent || event;
        if (card._lastMouseEvent) {
            card._lastMouseEvent = null;
        }
        
        const cardRect = card.getBoundingClientRect();
        const cardCenterX = cardRect.left + cardRect.width / 2;
        const cardCenterY = cardRect.top + cardRect.height / 2;
        
        // Calculate mouse position relative to card center
        const mouseX = latestEvent.clientX - cardCenterX;
        const mouseY = latestEvent.clientY - cardCenterY;
        
        // Normalize to -1 to 1 range (divide by half width/height)
        const normalizedX = mouseX / (cardRect.width / 2);
        const normalizedY = mouseY / (cardRect.height / 2);
        
        // Clamp values to prevent extreme tilts
        const clampedX = Math.max(-1, Math.min(1, normalizedX));
        const clampedY = Math.max(-1, Math.min(1, normalizedY));
        
        // Calculate target rotation angles (increase for stronger 3D effect)
        const maxTilt = 14;
        const targetRotateY = clampedX * maxTilt; // Rotate around Y axis (left/right tilt)
        const targetRotateX = -clampedY * maxTilt; // Rotate around X axis (up/down tilt)
        // Stronger lift towards the viewer for a deeper 3D feeling
        const targetTranslateZ = (Math.abs(clampedX) + Math.abs(clampedY)) * 18; // Range ~0–36px
        
        // Get or initialize tilt data for smooth interpolation
        if (!this.cardTiltData.has(card)) {
            this.cardTiltData.set(card, {
                rotateX: 0,
                rotateY: 0,
                translateZ: 0,
                targetRotateX: 0,
                targetRotateY: 0,
                targetTranslateZ: 0,
                animationFrame: null,
                isAnimating: false
            });
        }
        
        const tiltData = this.cardTiltData.get(card);
        
        // Update target values directly (smoothing happens in animation loop)
        tiltData.targetRotateX = targetRotateX;
        tiltData.targetRotateY = targetRotateY;
        tiltData.targetTranslateZ = targetTranslateZ;
        
        // Start animation loop if not already running
        if (!tiltData.isAnimating) {
            tiltData.isAnimating = true;
            this.animateCardTilt(card);
        }
    }
    
    animateCardTilt(card) {
        const tiltData = this.cardTiltData.get(card);
        if (!tiltData || !card.classList.contains('is-hovered') || !tiltData.isAnimating) {
            if (tiltData) {
                tiltData.isAnimating = false;
            }
            return;
        }
        
        // Smooth interpolation factor (lower = smoother, less jittery)
        // Using exponential smoothing for buttery smooth motion
        const smoothingFactor = 0.15;
        
        // Calculate differences
        const diffX = tiltData.targetRotateX - tiltData.rotateX;
        const diffY = tiltData.targetRotateY - tiltData.rotateY;
        const diffZ = tiltData.targetTranslateZ - tiltData.translateZ;
        
        // Apply exponential smoothing interpolation
        tiltData.rotateX += diffX * smoothingFactor;
        tiltData.rotateY += diffY * smoothingFactor;
        tiltData.translateZ += diffZ * smoothingFactor;
        
        // Round very small values to zero to prevent micro-jitter
        if (Math.abs(tiltData.rotateX) < 0.01) tiltData.rotateX = 0;
        if (Math.abs(tiltData.rotateY) < 0.01) tiltData.rotateY = 0;
        if (Math.abs(tiltData.translateZ) < 0.01) tiltData.translateZ = 0;
        
        // Get stored scale from when hover started (preserves center card scaling)
        const storedScale = card.dataset.hoverScale || '1';
        const scale = parseFloat(storedScale);
        
        // Apply smooth 3D rotation preserving scale
        // Use transform3d for better hardware acceleration
        // Transform order: scale first, then rotate, then translate
        const rotX = tiltData.rotateX.toFixed(2);
        const rotY = tiltData.rotateY.toFixed(2);
        const transZ = tiltData.translateZ.toFixed(2);
        card.style.transform = `scale(${scale}) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(${transZ}px)`;
        card.style.transformOrigin = 'center center';
        
        // Always continue animation loop while hovered (smooth continuous updates)
        tiltData.animationFrame = requestAnimationFrame(() => this.animateCardTilt(card));
    }
    
    resetCardTilt(card) {
        // Smoothly reset transform - use smooth transition for reset
        card.style.transition = 'transform 400ms cubic-bezier(0.23, 1, 0.32, 1)';
        card.style.transform = '';
        
        // Use requestAnimationFrame to ensure transform is cleared before updating scales
        requestAnimationFrame(() => {
            // Force update to restore center card scaling if applicable
            this.updateCardScales();
        });
    }
    
    openPropertyModal(property) {
        // Pause autoplay when opening modal
        this.pauseAutoplay();
        
        // Get or create the global PropertyModal instance
        let modalInstance = window.PropertyModalInstance;
        
        // If modal doesn't exist yet, try to create it
        if (!modalInstance && window.PropertyModal) {
            modalInstance = new window.PropertyModal();
            window.PropertyModalInstance = modalInstance;
        }
        
        if (!modalInstance) {
            console.warn('PropertyModal is not available. Ensure properties.js is loaded.');
            return;
        }
        
        // Fetch full property data from PropertyDataStore if available
        if (window.PropertyDataStore) {
            window.PropertyDataStore.getProperties().then((properties) => {
                const fullProperty = properties.find(p => p.id === property.id) || property;
                modalInstance.open(fullProperty);
            }).catch(() => {
                // Fallback to the property data we have
                modalInstance.open(property);
            });
        } else {
            modalInstance.open(property);
        }
    }
    
    getCardWidth() {
        // Get base card width from CSS calculation, not from actual rendered size
        const carousel = document.getElementById('heroCarousel');
        if (carousel) {
            const carouselWidth = carousel.offsetWidth;
            const gap = this.getGap();
            
            // Check if we're on mobile (max-width: 767px)
            const isMobile = window.innerWidth <= 767;
            
            if (isMobile) {
                // On mobile: 1 card takes 100% minus 3rem (48px) padding
                return carouselWidth - 48; // 3rem = 48px
            } else {
                // Desktop/Tablet: 1/3 of carousel minus 2 gaps
                return (carouselWidth - (gap * 2)) / 3;
            }
        }
        return 380;
    }
    
    getGap() {
        // Get gap from computed style (2rem = 32px on desktop, 1rem = 16px on mobile)
        const trackStyle = window.getComputedStyle(this.track);
        const gap = parseFloat(trackStyle.gap) || 32;
        return gap;
    }
    
    calculateDomOffset(domIndex) {
        // Calculate the transform offset for a given DOM index
        const cardWidth = this.getCardWidth();
        const gap = this.getGap();
        const carousel = document.getElementById('heroCarousel');
        if (!carousel) return 0;
        
        const carouselWidth = carousel.offsetWidth || window.innerWidth;
        const isMobile = window.innerWidth <= 767;
        
        const totalCardWidth = cardWidth + gap;
        const cardLeftEdge = domIndex * totalCardWidth;
        const cardCenter = cardLeftEdge + (cardWidth / 2);
        const viewportCenter = carouselWidth / 2;
        
        return cardCenter - viewportCenter;
    }
    
    updatePosition() {
        const offset = this.calculateDomOffset(this.centerDomIndex);
        this.track.style.transform = `translateX(-${offset}px)`;
        this.updateCardScales();
    }
    
    updateCardScales() {
        // Calculate dynamic size for each card - ONLY the center card should grow
        const allCards = Array.from(this.track.children);
        const carousel = document.getElementById('heroCarousel');
        if (!carousel) return;
        
        const isMobile = window.innerWidth <= 767;
        const carouselWidth = carousel.offsetWidth;
        const viewportCenter = carouselWidth / 2;
        const baseCardWidth = this.getCardWidth();
        const baseCardHeight = 320; // Base height from CSS
        const threshold = baseCardWidth * 0.3; // Threshold to determine if card is centered
        const gap = this.getGap();
        
        // On mobile, don't apply scaling effects - just show cards normally
        if (isMobile) {
            allCards.forEach((card) => {
                card.style.transform = 'scale(1)';
                card.style.transformOrigin = 'center center';
                card.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.12)';
                card.style.filter = 'blur(0)';
                card.style.opacity = '1';
                card.style.zIndex = '1';
            });
            return;
        }
        
        allCards.forEach((card) => {
            // Check if card is currently hovered using class
            const isHovered = card.classList.contains('is-hovered');
            
            // Calculate card's center position in the viewport
            const cardRect = card.getBoundingClientRect();
            const carouselRect = carousel.getBoundingClientRect();
            const cardCenter = cardRect.left + (cardRect.width / 2) - carouselRect.left;
            
            // Distance from viewport center
            const distanceFromCenter = Math.abs(cardCenter - viewportCenter);
            
            // If hovered, preserve existing tilt transform (set by mousemove handler)
            if (isHovered) {
                // Don't clear transform - mousemove handler manages it
                // Only ensure base properties are set
                card.style.filter = 'blur(0)';
                card.style.opacity = '1';
                card.style.zIndex = '20';
                // Keep transitions smooth for non-transform properties
                // Transform transition is handled by CSS and mousemove (100ms ease-out)
                card.style.transition = 'box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1), filter 300ms cubic-bezier(0.4, 0, 0.2, 1)';
                return; // Skip further processing for hovered cards (tilt is handled by mousemove)
            }
            
            // Only grow if card is very close to center (within threshold)
            if (distanceFromCenter < threshold) {
                // Card is at center: scale up to 1.15x size uniformly from center
                const ratio = distanceFromCenter / threshold;
                const easedRatio = 1 - Math.pow(1 - ratio, 2);
                const scale = 1.15 - (easedRatio * 0.15); // 1.15 at exact center, 1.0 at threshold edge
                
                // Apply smooth transition with scale transform (grows uniformly from center)
                card.style.transition = 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1), filter 300ms cubic-bezier(0.4, 0, 0.2, 1)';
                card.style.transform = `scale(${scale})`;
                card.style.transformOrigin = 'center center';
                
                // Reset any width/height overrides
                card.style.flexBasis = '';
                card.style.width = '';
                card.style.height = '';
                
                // Enhanced shadow for center card - grows with the card
                const shadowIntensity = 1 - (easedRatio * 0.5);
                card.style.boxShadow = `0 ${12 * shadowIntensity}px ${40 * shadowIntensity}px rgba(0, 0, 0, ${0.25 * shadowIntensity})`;
                card.style.filter = 'blur(0)';
                card.style.opacity = '1';
                card.style.zIndex = '10';
            } else {
                // Card is not at center: keep at normal size, add blur and reduce opacity
                card.style.transition = 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1), filter 300ms cubic-bezier(0.4, 0, 0.2, 1)';
                card.style.transform = 'scale(1)';
                card.style.transformOrigin = 'center center';
                
                // Reset any width/height overrides
                card.style.flexBasis = '';
                card.style.width = '';
                card.style.height = '';
                
                // Side cards: reduced shadow, slight blur, reduced opacity
                const sideThreshold = baseCardWidth * 0.8; // Cards further from center
                if (distanceFromCenter < sideThreshold) {
                    // Side visible cards
                    const sideRatio = (distanceFromCenter - threshold) / (sideThreshold - threshold);
                    card.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.12)';
                    card.style.filter = `blur(${sideRatio * 2}px)`;
                    card.style.opacity = `${1 - (sideRatio * 0.3)}`; // 0.7 to 1.0 opacity
                    card.style.zIndex = '1';
                } else {
                    // Cards far from center
                    card.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.12)';
                    card.style.filter = 'blur(0)';
                    card.style.opacity = '1';
                    card.style.zIndex = '1';
                }
            }
        });
    }
    
    animateScalesDuringTransition() {
        // Animate scales continuously during the CSS transition
        const startTime = performance.now();
        const duration = this.transitionDuration;
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Update scales based on current position (CSS handles track movement)
            this.updateCardScales();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Final update after transition completes
                this.updateCardScales();
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    updateCardStates() {
        // This function now just calls updateCardScales for dynamic scaling
        this.updateCardScales();
    }
    
    goToNext() {
        if (this.isTransitioning) return;
        if (!this.track || this.track.children.length <= 1) return;

        this.isTransitioning = true;
        const targetDomIndex = this.centerDomIndex + 1;
        const offset = this.calculateDomOffset(targetDomIndex);
        this.track.style.transition = `transform ${this.transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        this.track.style.transform = `translateX(-${offset}px)`;
        this.animateScalesDuringTransition();
        this.track.addEventListener('transitionend', this.handleNextTransitionEnd, { once: true });
    }
    
    handleNextTransitionEnd = (evt) => {
        if (evt.target !== this.track) {
            this.track.addEventListener('transitionend', this.handleNextTransitionEnd, { once: true });
            return;
        }
        
        const firstCard = this.track.firstElementChild;
        if (firstCard) {
            this.track.appendChild(firstCard);
        }

        this.currentIndex = (this.currentIndex + 1) % this.cards.length;

        this.track.style.transition = 'none';
        const baseOffset = this.calculateDomOffset(this.centerDomIndex);
        this.track.style.transform = `translateX(-${baseOffset}px)`;
        this.updateCardStates();

        requestAnimationFrame(() => {
            this.track.style.transition = `transform ${this.transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
            this.isTransitioning = false;
        });
    }
 
    goToPrev() {
        if (this.isTransitioning) return;
        if (!this.track || this.track.children.length <= 1) return;
        
        this.isTransitioning = true;
        const targetDomIndex = Math.max(0, this.centerDomIndex - 1);
        const offset = this.calculateDomOffset(targetDomIndex);
        this.track.style.transition = `transform ${this.transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        this.track.style.transform = `translateX(-${offset}px)`;
        this.animateScalesDuringTransition();
        this.track.addEventListener('transitionend', this.handlePrevTransitionEnd, { once: true });
    }
    
    handlePrevTransitionEnd = (evt) => {
        if (evt.target !== this.track) {
            this.track.addEventListener('transitionend', this.handlePrevTransitionEnd, { once: true });
            return;
        }
        
        const lastCard = this.track.lastElementChild;
        if (lastCard) {
            this.track.insertBefore(lastCard, this.track.firstElementChild);
        }
        
        this.currentIndex = (this.currentIndex - 1 + this.cards.length) % this.cards.length;
        
        this.track.style.transition = 'none';
        const baseOffset = this.calculateDomOffset(this.centerDomIndex);
        this.track.style.transform = `translateX(-${baseOffset}px)`;
        this.updateCardStates();
        
        requestAnimationFrame(() => {
            this.track.style.transition = `transform ${this.transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
            this.isTransitioning = false;
        });
    }
 
    startAutoplay() {
        this.autoplayInterval = setInterval(() => {
            if (!this.isPaused && !this.isTransitioning) {
                this.goToNext();
            }
        }, this.transitionDuration + this.pauseDuration);
    }
    
    pauseAutoplay() {
        this.isPaused = true;
        if (this.autoplayInterval) {
            clearInterval(this.autoplayInterval);
        }
    }
    
    resumeAutoplay() {
        this.isPaused = false;
        this.startAutoplay();
    }
    
    setupEventListeners() {
        // Navigation buttons
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => {
                this.pauseAutoplay();
                this.goToPrev();
                setTimeout(() => this.resumeAutoplay(), 3000);
            });
        }
        
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => {
                this.pauseAutoplay();
                this.goToNext();
                setTimeout(() => this.resumeAutoplay(), 3000);
            });
        }
        
        // Track carousel hover state
        this.isCarouselHovered = false;
        
        // Listen for modal close event to resume autoplay and remove focus
        const modal = document.getElementById('propertyModal');
        if (modal) {
            modal.addEventListener('propertyModalClosed', () => {
                // Remove focus from the clicked card
                if (this.lastClickedCard && typeof this.lastClickedCard.blur === 'function') {
                    this.lastClickedCard.blur();
                }
                this.lastClickedCard = null;
                
                // Resume autoplay after a short delay when modal closes
                // Only resume if not hovering over carousel
                setTimeout(() => {
                    if (!this.isCarouselHovered) {
                        this.resumeAutoplay();
                    }
                }, 500);
            });
        }
        
        // Pause autoplay on carousel hover, resume when mouse leaves
        const carousel = document.getElementById('heroCarousel');
        if (carousel) {
            carousel.addEventListener('mouseenter', () => {
                this.isCarouselHovered = true;
                this.pauseAutoplay();
            });
            
            carousel.addEventListener('mouseleave', () => {
                this.isCarouselHovered = false;
                // Only resume if modal is not open
                if (!modal || !modal.classList.contains('open')) {
                    this.resumeAutoplay();
                }
            });
        }
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.target.closest('#heroCarousel')) {
                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    this.pauseAutoplay();
                    this.goToPrev();
                    setTimeout(() => this.resumeAutoplay(), 3000);
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    this.pauseAutoplay();
                    this.goToNext();
                    setTimeout(() => this.resumeAutoplay(), 3000);
                }
            }
        });
        
        // Touch/swipe support for mobile
        if (this.track) {
            this.track.addEventListener('touchstart', (e) => {
                this.touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });
            
            this.track.addEventListener('touchend', (e) => {
                this.touchEndX = e.changedTouches[0].screenX;
                this.handleSwipe();
            }, { passive: true });
        }
        
        // Handle window resize to recalculate positions
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.updatePosition();
            }, 150);
        });
    }
    
    handleSwipe() {
        const swipeThreshold = 50;
        const diff = this.touchStartX - this.touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Swipe left - next
                this.pauseAutoplay();
                this.goToNext();
                setTimeout(() => this.resumeAutoplay(), 3000);
            } else {
                // Swipe right - prev
                this.pauseAutoplay();
                this.goToPrev();
                setTimeout(() => this.resumeAutoplay(), 3000);
            }
        }
    }
}

// Initialize carousel when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new HeroCarousel();
    });
} else {
    new HeroCarousel();
}


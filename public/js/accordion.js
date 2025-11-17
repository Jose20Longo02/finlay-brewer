// Horizontal Accordion for "We Make It Simple" Section

class HorizontalAccordion {
    constructor() {
        this.container = document.getElementById('buyersAccordion');
        this.panels = document.querySelectorAll('.accordion-panel');
        this.prevBtn = document.querySelector('.accordion-prev');
        this.nextBtn = document.querySelector('.accordion-next');
        this.activeIndex = 0; // Start with panel 1 "Find the Right Property" (index 0)
        this.isTransitioning = false;
        
        this.init();
    }
    
    init() {
        this.setupPanels();
        this.setupEventListeners();
        this.updatePanelBackgrounds();
        // Ensure the first panel is active on initialization
        this.setActivePanel(this.activeIndex);
    }
    
    setupPanels() {
        // Set background images for each panel
        const backgrounds = [
            '/images/Properties/1/1.jpg',
            '/images/Properties/3/1.jpg',
            '/images/Properties/5/1.jpg',
            '/images/Properties/7/1.jpg'
        ];
        
        this.panels.forEach((panel, index) => {
            const bgElement = panel.querySelector('.panel-background');
            if (!bgElement) {
                return;
            }

            const backgroundImage = backgrounds[index % backgrounds.length];
            if (backgroundImage) {
                bgElement.style.backgroundImage = `url(${backgroundImage})`;
                bgElement.dataset.accordionBg = backgroundImage;
            }
        });
    }
    
    updatePanelBackgrounds() {
        // Backgrounds are set in setupPanels
    }
    
    setActivePanel(index) {
        if (this.isTransitioning || index === this.activeIndex) return;
        if (index < 0 || index >= this.panels.length) return;
        
        this.isTransitioning = true;
        const prevIndex = this.activeIndex;
        this.activeIndex = index;
        
        // Remove active class from all panels
        this.panels.forEach(panel => panel.classList.remove('active'));
        
        // Add active class to new panel
        this.panels[this.activeIndex].classList.add('active');
        
        // Reset transition flag after animation
        setTimeout(() => {
            this.isTransitioning = false;
        }, 400);
    }
    
    goToNext() {
        const nextIndex = (this.activeIndex + 1) % this.panels.length;
        this.setActivePanel(nextIndex);
    }
    
    goToPrev() {
        const prevIndex = (this.activeIndex - 1 + this.panels.length) % this.panels.length;
        this.setActivePanel(prevIndex);
    }
    
    setupEventListeners() {
        // Panel click handlers
        this.panels.forEach((panel, index) => {
            panel.addEventListener('click', () => {
                this.setActivePanel(index);
            });
        });
        
        // Navigation buttons
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.goToPrev();
            });
        }
        
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.goToNext();
            });
        }
        
        // Keyboard navigation
        this.container.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.goToPrev();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.goToNext();
            } else if (e.key === 'Home') {
                e.preventDefault();
                this.setActivePanel(0);
            } else if (e.key === 'End') {
                e.preventDefault();
                this.setActivePanel(this.panels.length - 1);
            }
        });
        
        // Make panels focusable
        this.panels.forEach(panel => {
            panel.setAttribute('tabindex', '0');
        });
    }
}

// Initialize accordion when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new HorizontalAccordion();
    });
} else {
    new HorizontalAccordion();
}


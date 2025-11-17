// Stats Count-Up Animation

class StatsAnimation {
    constructor() {
        this.statsStrip = document.getElementById('statsStrip');
        this.statItems = [
            document.getElementById('statItem-1'),
            document.getElementById('statItem-2'),
            document.getElementById('statItem-3')
        ];
        this.targetValues = {
            stat1: { value: 1.9, unit: '%', prefix: '+' },
            stat2: { value: 300, unit: '+', prefix: '' },
            stat3: { min: 4, max: 6, unit: '%', prefix: '' }
        };
        this.hasAnimated = false;
        this.animationDuration = 1600;
        
        this.init();
    }
    
    init() {
        // Use Intersection Observer to trigger animation when section enters viewport
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.hasAnimated) {
                    this.animateStats();
                    this.hasAnimated = true;
                }
            });
        }, {
            threshold: 0.3 // Trigger when 30% of section is visible
        });
        
        if (this.statsStrip) {
            observer.observe(this.statsStrip);
        }
    }
    
    animateStats() {
        // Animate stat 1: +1.9%
        this.animateValue(
            this.statItems[0].querySelector('.stat-value'),
            this.targetValues.stat1.value,
            this.targetValues.stat1.prefix,
            this.targetValues.stat1.unit
        );
        
        // Animate stat 2: 300+
        this.animateValue(
            this.statItems[1].querySelector('.stat-value'),
            this.targetValues.stat2.value,
            this.targetValues.stat2.prefix,
            this.targetValues.stat2.unit
        );
        
        // Animate stat 3: 4–6%
        const stat3Min = this.statItems[2].querySelector('.stat-value-min');
        const stat3Max = this.statItems[2].querySelector('.stat-value-max');
        
        if (stat3Min && stat3Max) {
            this.animateRange(
                stat3Min,
                stat3Max,
                this.targetValues.stat3.min,
                this.targetValues.stat3.max,
                this.targetValues.stat3.unit
            );
        }
    }
    
    animateValue(element, target, prefix, unit) {
        if (!element) return;
        
        const start = 0;
        const duration = this.animationDuration;
        const startTime = performance.now();
        
        const easeOut = (t) => {
            return 1 - Math.pow(1 - t, 3); // Cubic ease-out
        };
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOut(progress);
            const current = start + (target - start) * eased;
            
            // Format number based on type
            if (target < 10) {
                // Decimal number (1.9)
                element.textContent = current.toFixed(1);
            } else {
                // Whole number (300)
                element.textContent = Math.floor(current).toLocaleString();
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Ensure final value is exact
                if (target < 10) {
                    element.textContent = target.toFixed(1);
                } else {
                    element.textContent = Math.floor(target).toLocaleString();
                }
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    animateRange(minElement, maxElement, minTarget, maxTarget, unit) {
        if (!minElement || !maxElement) return;
        
        const start = 0;
        const duration = this.animationDuration;
        const startTime = performance.now();
        
        const easeOut = (t) => {
            return 1 - Math.pow(1 - t, 3);
        };
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOut(progress);
            const currentMin = start + (minTarget - start) * eased;
            const currentMax = start + (maxTarget - start) * eased;
            
            minElement.textContent = Math.floor(currentMin);
            maxElement.textContent = Math.floor(currentMax);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                minElement.textContent = Math.floor(minTarget);
                maxElement.textContent = Math.floor(maxTarget);
            }
        };
        
        requestAnimationFrame(animate);
    }
}

// Initialize stats animation when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new StatsAnimation();
    });
} else {
    new StatsAnimation();
}


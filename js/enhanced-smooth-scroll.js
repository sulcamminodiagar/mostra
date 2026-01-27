/**
 * Enhanced Smooth Scroll
 * Provides smooth scrolling with easing that works well with GSAP ScrollTrigger
 */
class EnhancedSmoothScroll {
    constructor() {
        this.targetScroll = 0;
        this.currentScroll = 0;
        this.ease = 0.08; // Smoothing factor (lower = smoother but slower)
        this.isScrolling = false;
        this.scrollTimeout = null;
        this.wheelTimeout = null;
        
        this.init();
    }

    init() {
        // Listen to wheel events
        window.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
        
        // Listen to touch events
        window.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
        window.addEventListener('touchend', (e) => this.onTouchEnd(e));
        
        // Start the animation loop
        this.animate();
    }

    onWheel(e) {
        // Increase scroll sensitivity for wheel events
        const scrollAmount = e.deltaY * 1.2;
        this.targetScroll += scrollAmount;
        
        // Clamp to valid scroll range
        this.clampScroll();
        
        // Prevent default scroll
        e.preventDefault();
        
        // Mark as actively scrolling
        this.isScrolling = true;
        clearTimeout(this.wheelTimeout);
        
        this.wheelTimeout = setTimeout(() => {
            this.isScrolling = false;
        }, 150);
    }

    onTouchMove(e) {
        if (e.touches.length === 1) {
            e.preventDefault();
            if (this.lastTouchY !== undefined) {
                const deltaY = this.lastTouchY - e.touches[0].clientY;
                this.targetScroll += deltaY;
                this.clampScroll();
            }
            this.lastTouchY = e.touches[0].clientY;
            this.isScrolling = true;
        }
    }

    onTouchEnd(e) {
        this.lastTouchY = undefined;
        clearTimeout(this.scrollTimeout);
        this.scrollTimeout = setTimeout(() => {
            this.isScrolling = false;
        }, 300);
    }

    clampScroll() {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        this.targetScroll = Math.max(0, Math.min(this.targetScroll, maxScroll));
    }

    animate() {
        // Smooth interpolation towards target
        const diff = this.targetScroll - this.currentScroll;
        this.currentScroll += diff * this.ease;

        // Apply scroll with requestAnimationFrame for smooth 60fps
        window.scrollTo(0, this.currentScroll);

        requestAnimationFrame(() => this.animate());
    }

    // Allow adjusting the smoothing factor
    setSmoothing(value) {
        this.ease = Math.max(0.01, Math.min(0.3, value));
    }

    // Increase smoothness (lower ease value)
    increaseSmoothing() {
        this.setSmoothing(this.ease * 0.8);
    }

    // Decrease smoothness (higher ease value)
    decreaseSmoothing() {
        this.setSmoothing(this.ease * 1.2);
    }
}

// Initialize after DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.enhancedSmoothScroll = new EnhancedSmoothScroll();
    });
} else {
    window.enhancedSmoothScroll = new EnhancedSmoothScroll();
}

// smooth-wheel.js
class SmoothScrollWheel {
    constructor() {
        // Check if user prefers reduced motion
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return; // Skip smooth scroll for accessibility
        }

        this.target = 0;
        this.current = 0;
        this.ease = 0.05; // Lower = smoother (0.05–0.2)
        this.lastTouchY = undefined;

        // Disable native scroll
        document.body.style.overflow = 'hidden';

        // Create virtual scroll container
        this.createScrollContainer();

        // Listen to wheel events
        window.addEventListener('wheel', this.onWheel.bind(this), { passive: false });

        // Handle touchpad/trackpad
        window.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
        window.addEventListener('touchend', this.onTouchEnd.bind(this));

        // Start animation loop
        requestAnimationFrame(this.animate.bind(this));
    }

    createScrollContainer() {
        this.scrollContainer = document.createElement('div');
        this.scrollContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      overflow-y: scroll;
      -webkit-overflow-scrolling: touch;
      opacity: 0;
      pointer-events: none;
    `;

        const contentHeight = Math.max(
            document.body.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.clientHeight,
            document.documentElement.scrollHeight,
            document.documentElement.offsetHeight
        );

        this.scrollContainer.innerHTML = `<div style="height: ${contentHeight}px;"></div>`;
        document.body.appendChild(this.scrollContainer);
    }

    onWheel(e) {
        e.preventDefault();
        this.target += e.deltaY;
        this.clampTarget();
    }

    onTouchMove(e) {
        if (e.touches.length === 1) {
            e.preventDefault();
            if (this.lastTouchY !== undefined) {
                const deltaY = this.lastTouchY - e.touches[0].clientY;
                this.target += deltaY * 2;
                this.clampTarget();
            }
            this.lastTouchY = e.touches[0].clientY;
        }
    }

    onTouchEnd() {
        this.lastTouchY = undefined;
    }

    clampTarget() {
        const maxScroll = this.scrollContainer.scrollHeight - window.innerHeight;
        this.target = Math.max(0, Math.min(this.target, maxScroll));
    }

    animate() {
        const diff = this.target - this.current;
        this.current += diff * this.ease;

        // Apply to actual page
        window.scrollTo(0, this.current);

        requestAnimationFrame(this.animate.bind(this));
    }

    // Public method to refresh height (call after dynamic content loads)
    update() {
        const contentHeight = Math.max(
            document.body.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.clientHeight,
            document.documentElement.scrollHeight,
            document.documentElement.offsetHeight
        );
        this.scrollContainer.querySelector('div').style.height = `${contentHeight}px`;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.smoothWheel = new SmoothScrollWheel();
    });
} else {
    window.smoothWheel = new SmoothScrollWheel();
}
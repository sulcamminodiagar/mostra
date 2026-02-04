gsap.registerPlugin(ScrollTrigger);


// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', async () => {
    // Initial check for resolution and orientation
    checkViewport();

    // Reload page on resize to recalculate all GSAP animations and positions
    let lastWidth = window.innerWidth;
    let lastHeight = window.innerHeight;
    let resizeTimer;
    window.addEventListener('resize', () => {
        checkViewport();

        const currentWidth = window.innerWidth;
        const currentHeight = window.innerHeight;

        // Only reload if width changed (desktop resize or orientation change)
        // or if height changed significantly (more than 150px, to avoid mobile address bar issues)
        if (currentWidth !== lastWidth || Math.abs(currentHeight - lastHeight) > 150) {
            lastWidth = currentWidth;
            lastHeight = currentHeight;
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                window.location.reload();
            }, 500);
        }
    });

    const body = document.body;
    const loadingOverlay = document.getElementById('loadingOverlay');
    const progressFill = document.getElementById('progressFill');

    // Get all images that need to be loaded
    const images = document.querySelectorAll('img');
    const totalImages = images.length;

    // If no images, enable scrolling immediately
    if (totalImages === 0) {
        enableScrolling();
        return;
    }

    //enableScrolling(); // TEMPORARY DISABLE LOADING SCREEN

    console.log(`Preloading ${totalImages} images...`);

    try {
        // Create array of image loading promises
        const imagePromises = Array.from(images).map((img, index) => {
            return loadImageWithProgress(img, index, totalImages, progressFill);
        });

        // Wait for all images OR timeout after 10 seconds
        await Promise.race([
            Promise.all(imagePromises),
            new Promise(resolve => setTimeout(() => {
                console.warn('Image loading timeout reached - proceeding anyway');
                resolve();
            }, 10000))
        ]);

        console.log('All images loaded successfully!');

    } catch (error) {
        console.error('Error during image loading:', error);
    } finally {
        // Always enable scrolling after loading completes or times out
        enableScrolling();
    }
});
/**
 * Load a single image with progress tracking
 */
function loadImageWithProgress(img, index, totalImages, progressFill) {
    return new Promise((resolve) => {
        // Check if image is already loaded (from cache)
        if (img.complete && img.naturalHeight !== 0) {
            updateProgress(index + 1, totalImages, progressFill);
            resolve();
            return;
        }

        // Handle successful load
        img.addEventListener('load', () => {
            updateProgress(index + 1, totalImages, progressFill);
            resolve();
        });

        // Handle load errors (don't hang forever)
        img.addEventListener('error', () => {
            console.warn('Image failed to load:', img.src);
            updateProgress(index + 1, totalImages, progressFill);
            resolve(); // Resolve even on error to prevent hanging
        });
    });
}

/**
 * Update progress bar
 */
function updateProgress(loadedCount, totalCount, progressFill) {
    const percentage = Math.min(100, Math.round((loadedCount / totalCount) * 100));
    if (progressFill) {
        progressFill.style.width = `${percentage}%`;
    }
    // console.log(`Progress: ${loadedCount}/${totalCount} (${percentage}%)`);
}

/**
 * Enable scrolling and hide loading overlay
 */
function enableScrolling() {
    const body = document.body;
    const loadingOverlay = document.getElementById('loadingOverlay');

    // Remove loading class to enable scrolling
    body.classList.remove('loading');

    // Hide loading overlay with fade animation
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');

        // Remove from DOM after animation
        setTimeout(() => {
            if (loadingOverlay.parentNode) {
                loadingOverlay.parentNode.removeChild(loadingOverlay);
            }
        }, 500);
    }

    // Refresh ScrollTrigger if it exists (for GSAP animations)
    if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
    }

    // Initialize your GSAP animations here
    initializeAnimations();

    // Initialize Menu Drawer Logic
    initMenuDrawer();

    // Initialize Auto Scroll logic
    initAutoScroll();
}

function initMenuDrawer() {
    const menuButton = document.getElementById('menuButton');
    const closeDrawer = document.getElementById('closeDrawer');
    const menuDrawer = document.getElementById('menuDrawer');
    const menuOverlay = document.getElementById('menuOverlay');

    const toggleMenu = (open) => {
        if (open) {
            menuDrawer.classList.add('open');
            menuOverlay.classList.add('visible');
        } else {
            menuDrawer.classList.remove('open');
            menuOverlay.classList.remove('visible');
        }
    };

    if (menuButton) menuButton.addEventListener('click', () => toggleMenu(true));
    if (closeDrawer) closeDrawer.addEventListener('click', () => toggleMenu(false));
    if (menuOverlay) menuOverlay.addEventListener('click', () => toggleMenu(false));

    // Close drawer when a link is clicked and handle smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href === '#') return;

            e.preventDefault();
            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                // Close menu if it was open
                if (menuDrawer.classList.contains('open')) {
                    toggleMenu(false);
                }

                // If ScrollTrigger is used, it's better to scroll to the trigger's start position
                let targetScrollPos = 0;

                // Try to find a ScrollTrigger associated with this element
                const triggers = ScrollTrigger.getAll();
                const trigger = triggers.find(st => st.trigger === targetElement);

                if (trigger) {
                    targetScrollPos = trigger.start;
                } else {
                    // Fallback to absolute top position
                    targetScrollPos = targetElement.getBoundingClientRect().top + window.pageYOffset;
                }

                // Custom smooth scroll with duration control
                smoothScrollTo(targetScrollPos, 5000); // 2000ms duration
            }
        });
    });

    /**
     * Custom smooth scroll function to control speed without additional plugins
     * @param {number} targetY - The target vertical position
     * @param {number} duration - Animation duration in milliseconds
     */
    function smoothScrollTo(targetY, duration) {
        const startY = window.pageYOffset;
        const diff = targetY - startY;
        let startTimestamp = null;

        function step(timestamp) {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);

            // Easing function: easeInOutCubic
            const ease = progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;

            const currentPos = startY + diff * ease;
            window.scrollTo(0, currentPos);

            // Sync with EnhancedSmoothScroll to prevent it from resetting the position
            if (window.enhancedSmoothScroll) {
                window.enhancedSmoothScroll.currentScroll = currentPos;
                window.enhancedSmoothScroll.targetScroll = currentPos;
            }

            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                // Final sync once animation is complete
                if (window.enhancedSmoothScroll) {
                    window.enhancedSmoothScroll.currentScroll = targetY;
                    window.enhancedSmoothScroll.targetScroll = targetY;
                }
            }
        }

        window.requestAnimationFrame(step);
    }

    // Close drawer when clicking outside
    document.addEventListener('click', (e) => {
        if (menuDrawer && !menuDrawer.contains(e.target) && !menuButton.contains(e.target) && menuDrawer.classList.contains('open')) {
            toggleMenu(false);
        }
    });

    // Close drawer on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menuDrawer && menuDrawer.classList.contains('open')) {
            toggleMenu(false);
        }
    });
}

// Adjust title size
fitty('.title_1_1', {
    minSize: 48,
    maxSize: 108,
    multiLine: false
});
fitty('.title_1_2', {
    minSize: 48,
    maxSize: 80,
    multiLine: false
});
fitty('.title_1_3', {
    minSize: 16,
    maxSize: 80,
    multiLine: false
});
fitty('.title', {
    minSize: 16,
    maxSize: 108,
    multiLine: false
});
fitty('.title_13', {
    minSize: 16,
    maxSize: 108,
    multiLine: false
});

function initializeAnimations() {

    // Section 1: Sequenced Animation
    // Pin the section, then sequence the images entering and leaving.

    // gsap.to(".disclaimer", { opacity: 1, duration: 3 });

    let tl1 = gsap.timeline({
        scrollTrigger: {
            trigger: "#section1",
            start: "top top",
            end: "+=600%", // Longer scroll distance for the sequence
            pin: true,
            scrub: true,
            // markers: true
        }
    });

    tl1.to(".title_1_1", { left: "5vw", duration: 3 })
        .to(".title_1_2", { left: "5vw", duration: 3 }, "<+=1")
        .to(".title_1_3", { y: "-20vh", duration: 3 }, "<+=1")
        .to(".scroll_logo", { opacity: 0, duration: 3 }, "<+=1")
        .to(".img_wrapper_1", { opacity: 0, duration: 3 })
        .to(".title_1_1", { opacity: 0, duration: 3 }, "<+=1")
        .to(".title_1_2", { opacity: 0, duration: 3 }, "<+=1")
        .to(".title_1_3", { opacity: 0, duration: 3 }, "<+=1")
        .to(".disclaimer_curtain", { opacity: 1, duration: .1 })
        .to(".disclaimer", { opacity: 1, duration: 3 }, "<+=1")
        .to(".disclaimer_curtain", { height: 0, duration: 12 });

    let tl2 = gsap.timeline({
        scrollTrigger: {
            trigger: "#section2",
            start: "top top",
            end: "+=1800%", // Longer scroll distance for the sequence
            pin: true,
            scrub: true,
            // markers: true,
        }
    });

    carousel_width_1 = document.getElementsByClassName("carusell_wrapper_1")[0].offsetWidth;
    let img_2_1_width = document.getElementsByClassName("img_2_1")[0].offsetWidth;
    let img_2_3_width = document.getElementsByClassName("img_2_3")[0].offsetWidth;
    let img_2_5_height = document.getElementsByClassName("img_2_5")[0].offsetHeight;
    let img_2_6_height = document.getElementsByClassName("img_2_6")[0].offsetHeight;
    let img_2_7_height = document.getElementsByClassName("img_2_7")[0].offsetHeight;

    tl2.to(".img_wrapper_2_1", { x: img_2_1_width, opacity: 1, duration: 1 })
        .to(".img_wrapper_2_2", { x: "-20%", opacity: 1, duration: 3 })
        .to(".text_2_1", { y: "-80vh", duration: 4 }, "<+=1")
        .to(".text_2_1", { opacity: 0, duration: 2 }, "+=.5")
        .to(".img_wrapper_2_3", { x: -img_2_3_width, opacity: 1, duration: 1 }, "<+=1")
        .to(".img_wrapper_2_4", { x: 0, opacity: 1, duration: 1 }, "<+=1")
        .to(".text_2_2", { y: "-80vh", duration: 2 }, "<+=1")
        .to(".text_2_2", { opacity: 0, duration: 2 }, "-=.3")
        .to(".img_wrapper_2_1, .img_wrapper_2_2, .img_wrapper_2_3, .img_wrapper_2_4", { opacity: 0, duration: 1 })
        .to(".carusell_wrapper_1", { x: -carousel_width_1, duration: 15 }, "-=.3")
        .to(".img_wrapper_2_5", { y: -img_2_5_height, opacity: 1, duration: 6, ease: "power2.in" }, "-=0")
        .to(".img_wrapper_2_6", { y: -img_2_6_height, duration: 3 })
        .to(".img_wrapper_2_7", { y: -img_2_7_height, duration: 3 })
        .to(".text_2_5", { opacity: 1, duration: 3 }, "-=1")
        .to(".text_2_5", { opacity: 0, duration: 3 }, "-=1")
        .to(".img_wrapper_2_8", { x: "-100vw", duration: 3 }, "-=1")

    let tl3 = gsap.timeline({
        scrollTrigger: {
            trigger: "#section3",
            start: "top top",
            end: "+=3200%", // Longer scroll distance for the sequence
            pin: true,
            scrub: true,
            // markers: true,
            id: "section3",
        }
    });

    let img_3_2_height = document.getElementsByClassName("img_3_2")[0].offsetHeight;


    tl3.to(".text_3_1", { opacity: 1, duration: 3 })
        .to(".img_wrapper_3_1", { opacity: 1, duration: 3 }, "<-=2")
        .to(".img_wrapper_3_1, .text_3_1", { opacity: 0, duration: 3 })
        .to(".img_wrapper_3_2", { opacity: 1, duration: 3 }, "-=2")
        .to(".img_wrapper_3_2", { y: -(img_3_2_height - window.innerHeight), duration: 6 }, "-=2")   //yPercent
        .to(".img_wrapper_3_2", { opacity: 0, duration: 3 }, "-=2")
        .to(".img_wrapper_3_3", { opacity: 1, duration: 3 }, "-=2")
        .to(".text_3_2", { opacity: 1, duration: 3 }, "-=0")
        .to(".img_3_3", { filter: "blur(0px)", duration: 1 }, "-=2")
        .to(".img_wrapper_3_3", { opacity: 0, duration: 3 }, "-=0")
        .to(".text_3_2", { opacity: 0, duration: 3 }, "-=2")
        .to(".img_wrapper_3_4", { opacity: 1, duration: 1 }, "-=2")
        .to(".text_3_3", { y: "-85vh", duration: 4 })
        .to(".text_3_3", { opacity: 0, duration: 1 })
        .to(".img_wrapper_3_5", { x: - document.getElementsByClassName("img_wrapper_3_5")[0].offsetWidth, duration: 3 }, "-=2")
        .to(".img_wrapper_3_4", { opacity: 0, duration: 3 }, "-=2")
        .to(".text_3_4", { opacity: 1, duration: 3 }, "<-=0")
        .to(".img_wrapper_3_5", { x: window.innerWidth / 2, duration: 3 }, "+=0.5")
        .to(".text_3_4", { opacity: 0, duration: 1 })
        .to(".img_wrapper_3_6", { opacity: 1, duration: 1 }, "+=0.5")
        .to(".text_3_5", { opacity: 1, duration: 2 }, "+=0.5")
        .to(".text_3_5", { opacity: 0, duration: 2 }, "+=0.5")

    let tl4 = gsap.timeline({
        scrollTrigger: {
            trigger: "#section4",
            start: "top top",
            end: "+=2000%", // Longer scroll distance for the sequence
            pin: true,
            scrub: true,
            // markers: true,
            id: "section4",
        }
    });

    // Get the actual dimensions
    const containerWidth_4_1 = document.querySelector('.img_wrapper_4_1').offsetHeight;
    const containerWidth_4_2 = document.querySelector('.img_wrapper_4_2').offsetWidth;
    const containerHeight_4_2 = document.querySelector('.img_wrapper_4_2').offsetHeight;
    document.querySelector('.img_4_2').style.height = containerHeight_4_2 + 'px';
    const imgWidth_4_2 = document.querySelector('.img_4_2').naturalWidth * (containerHeight_4_2 / document.querySelector('.img_4_2').naturalHeight);
    const maxOffset_4_2 = imgWidth_4_2 - containerWidth_4_2;

    tl4.to(".img_wrapper_4_1", { y: -(containerWidth_4_1 - window.innerHeight), opacity: 1, duration: 6 })
        .to(".img_wrapper_4_2", { opacity: 1, duration: 3 }, "-=2")
        .to(".img_4_2", { x: -maxOffset_4_2, duration: 3 }, "+=0")
        .to(".text_4_1", { opacity: 1, duration: 3 }, "-=4")
        .to(".text_4_1", { opacity: 0, duration: 3 }, "-=1")
        .to(".img_wrapper_4_2", { opacity: 0, duration: 3 }, "-=2")
        .to(".img_wrapper_4_3", { opacity: 1, duration: 3 }, "-=2")
        .to(".img_4_3", { scale: 2, duration: 3 }, "+=2")
        .to(".text_4_2", { opacity: 1, duration: 3 }, "-=1")
        .to(".text_4_2", { opacity: 0, duration: 3 }, "+=2")
        .to(".img_wrapper_4_4", { y: "-100vh", duration: 3 })
        .to(".img_4_4", { filter: "saturate(1)", duration: 3 }, "+=2")
        .to(".carusell_wrapper_4", { x: - document.getElementsByClassName("carusell_wrapper_4")[0].offsetWidth * 1.3, duration: 20 }, "-=.3")
        .to(".carusell_wrapper_4", { opacity: 0, duration: 5 })

    let tl4b = gsap.timeline({
        scrollTrigger: {
            trigger: "#section4b",
            start: "top top",
            end: "+=1000%", // Longer scroll distance for the sequence
            pin: true,
            scrub: true,
            // markers: true,
            id: "section4b",
        }
    });

    slogan_1 = document.getElementsByClassName("slogan_1")[0].getBoundingClientRect().width;
    slogan_2 = document.getElementsByClassName("slogan_2")[0].getBoundingClientRect().width;
    slogan_3 = document.getElementsByClassName("slogan_3")[0].getBoundingClientRect().width;
    slogan_4 = document.getElementsByClassName("slogan_4")[0].getBoundingClientRect().width;

    tl4b.to(".slogan_1", { x: - (slogan_1 + window.innerWidth), duration: 3 })
        .to(".slogan_2", { x: - (slogan_2 + window.innerWidth), duration: 3 }, "-=2")
        .to(".slogan_3", { x: - (slogan_3 + window.innerWidth), duration: 3.1 }, "-=2.6")
        .to(".slogan_4", { x: - (slogan_4 + window.innerWidth), duration: 3.2 }, "-=2.8");

    tl5 = gsap.timeline({
        scrollTrigger: {
            trigger: "#section5",
            start: "top top",
            end: "+=2200%", // Longer scroll distance for the sequence
            pin: true,
            scrub: true,
            // markers: true,
            id: "section5",
        }
    });

    // Get image dimensions
    const imgHeight_5_1 = document.querySelector('.img_5_4').getBoundingClientRect().height;
    // Get viewport height
    const viewportHeight = window.innerHeight;
    // Calculate overflow (how much extends below viewport)
    const overflowAmount_5_1 = Math.max(0, imgHeight_5_1 - viewportHeight);

    tl5.to(".img_wrapper_5_1", { opacity: 1, duration: 3 })
        .to(".text_5_1", { y: "-80vh", duration: 3 })
        .to(".text_5_1", { opacity: 0, duration: 3 })
        .to(".img_wrapper_5_2", { x: "-100vw", duration: 3 }, "-=3")
        .to(".img_wrapper_5_3", { opacity: 1, duration: 3 })
        .to(".img_5_3", { y: "-70vh", duration: 3 }, "-=3")
        .to(".img_wrapper_5_4", { opacity: 1, duration: 3 })
        .to(".text_5_2", { opacity: 1, duration: 3 })
        .to(".img_5_4", { y: -overflowAmount_5_1, duration: 3 }, "<+=0")
        .to(".text_5_2", { opacity: 0, duration: 3 })
        .to(".img_wrapper_red_wall", { y: "-150vh", duration: 3 }, "<-=1")
        .to(".img_wrapper_5_5", { x: "-100vw", duration: 3 })
        .to(".text_5_3", { zIndex: 20, duration: 3 }, "-=2")
        .to(".text_5_3", { opacity: 1, duration: 3 })
        .to(".img_wrapper_5_6", { x: "100vw", duration: 3 })
        .to(".text_5_3", { opacity: 0, duration: 3 }, "-=3")
        .to(".text_5_4", { zIndex: 20, duration: 3 }, "-=2")
        .to(".text_5_4", { opacity: 1, duration: 3 })


    tl6 = gsap.timeline({
        scrollTrigger: {
            trigger: "#section6",
            start: "top top",
            end: "+=1800%", // Longer scroll distance for the sequence
            pin: true,
            scrub: true,
            // markers: true,
        }
    });

    img_6_2_width = document.getElementsByClassName("img_6_2")[0].offsetWidth;

    tl6.to(".img_wrapper_6_1_left", { x: "-100vw", duration: 3 })
        .to(".img_wrapper_6_1_center", { x: "-67vw", duration: 3 }, "-=1")
        .to(".img_wrapper_6_1_right", { x: "-34.1vw", duration: 3 }, "-=1")
        .to(".text_6_1", { opacity: 1, duration: 3 })
        .to(".img_wrapper_6_1_left, .img_wrapper_6_1_center, .img_wrapper_6_1_right, .text_6_1", { opacity: 0, duration: 3 })
        .to(".img_wrapper_6_2", { x: -(img_6_2_width + 10), duration: 3 })
        .to(".text_6_2", { x: "55vw", duration: 3 }, "<+=0")


    tl6_2 = gsap.timeline({
        scrollTrigger: {
            trigger: "#section6_2",
            start: "top top",
            end: "+=1200%", // Longer scroll distance for the sequence
            pin: true,
            scrub: true,
            // markers: true,
        }
    });

    tl6_2.to(".text_6_3", { opacity: 1, duration: 2 })
        .to(".img_wrapper_6_3", { x: "-100vw", duration: 2 }, "+=.5")
        .to(".text_6_4", { opacity: 1, duration: 2 })


    tl7 = gsap.timeline({
        scrollTrigger: {
            trigger: "#section7",
            start: "top top",
            end: "+=1500%", // Longer scroll distance for the sequence
            pin: true,
            scrub: true,
            // markers: true,
        }
    });

    carousel_width_7 = document.getElementsByClassName("carusell_wrapper_7")[0].offsetWidth;
    const img_7_4 = document.getElementsByClassName("img_7_4")[0].offsetWidth;
    carousel_pos_7 = carousel_width_7 - img_7_4;

    text_7_2_height = document.getElementsByClassName("text_7_2")[0].offsetHeight;

    tl7.to(".carusell_wrapper_7", { opacity: 1, duration: 1 }, "-=1")
        // .to(".text_7_1", { x: "-140vw", duration: 3 })
        .to(".carusell_wrapper_7", { x: -carousel_pos_7, duration: 12 }, "+=.5")
        .to(".text_7_2", { y: -(text_7_2_height + window.innerHeight), duration: 9 }, "-=3")
        .to(".img_wrapper_7_5", { y: "-100%", duration: 3 }, "-=1")
        .to(".img_wrapper_7_6", { y: "100%", duration: 3 })
        .to(".img_wrapper_7_7", { y: "-100%", duration: 3 }, "<=0")
        .to(".text_7_3", { x: "60vw", duration: 3 })
        .to(".text_7_4", { x: "-40vw", duration: 3 })

    let tl8 = gsap.timeline({
        scrollTrigger: {
            trigger: "#section8",
            start: "top top",
            end: "+=1200%", // Longer scroll distance for the sequence
            pin: true,
            scrub: true,
            // markers: true,
        }
    });

    gsap.set(".text_8_2", { zIndex: 1 });
    gsap.set(".img_wrapper_8_4", { zIndex: 10 });
    gsap.set(".img_wrapper_8_5", { zIndex: 10 });

    img_8_7_height = document.getElementsByClassName("img_8_7")[0].offsetHeight;

    tl8.to(".img_wrapper_8_1", { opacity: 1, duration: 3, ease: "power2.out" })
        .to(".img_wrapper_8_2", { y: "-180vh", duration: 5 }, "-=1")
        .to(".img_wrapper_8_1", { opacity: 0, duration: 3 })
        .to(".img_wrapper_8_3", { x: "-100vw", duration: 3 }, "<-=0")
        .to(".text_8_1", { x: "-45vw", duration: 2 }, "-=1")
        .to(".text_8_1", { opacity: 0, duration: 2 }, "+=1")
        .to(".img_wrapper_8_3", { opacity: 0, duration: 3 }, "-=2")
        .to(".img_wrapper_8_4", { x: "50vw", duration: 3 }, "-=2")
        .to(".img_wrapper_8_5", { x: "-50vw", duration: 3 }, "<=0")
        .to(".text_8_2", { opacity: 1, duration: 1 })
        .to(".img_wrapper_8_4", { x: "-50vw", duration: 3, ease: "power3.in" })
        .to(".img_wrapper_8_5", { x: "50vw", duration: 3, ease: "power3.in" }, "<=0")
        .to(".text_8_2", { opacity: 0, duration: 1 })
        .to(".img_wrapper_8_6", { opacity: 1, duration: 1 })
        .to(".img_wrapper_8_6", { scale: 1.1, y: "-10%", duration: 3 })
        .to(".img_wrapper_8_6", { opacity: 0, duration: 3 })
        .to(".img_wrapper_8_7", { opacity: 1, duration: 3 }, "-=2")
        .to(".img_wrapper_8_7", { y: - (img_8_7_height - window.innerHeight), duration: 5 }, "+=3")

    let tl9 = gsap.timeline({
        scrollTrigger: {
            trigger: "#section9",
            start: "top top",
            end: "+=1500%", // Longer scroll distance for the sequence
            pin: true,
            scrub: true,
            // markers: true,
        }
    });

    tl9.to(".img_wrapper_9_1", { filter: "saturate(1)", duration: 3, ease: "power2.out" })
        .to(".img_wrapper_9_2", { x: "-100vw", filter: "saturate(1)", duration: 3 })
        .to(".text_9_1", { x: "50vw", duration: 3 }, "-=1")
        .to(".img_wrapper_9_3", { x: "-100vw", duration: 3 })
        .to(".text_9_1", { x: "-50vw", duration: 3 }, "-=.5")
        .to(".img_wrapper_9_3, .img_wrapper_9_2", { opacity: 0, duration: 3 }, "+=1")
        .to(".img_wrapper_9_4", { y: "100vh", duration: 3 })
        .to(".text_9_2", { opacity: 1, scale: 2, duration: 3 })
        .to(".text_9_2", { opacity: 0, duration: 3 })
        .to(".img_wrapper_9_5", { x: "-100vw", duration: 3 })
        .to(".text_9_3", { opacity: 1, duration: 3 })


    let tl10 = gsap.timeline({
        scrollTrigger: {
            trigger: "#section10",
            start: "top top",
            end: "+=600%", // Longer scroll distance for the sequence
            pin: true,
            scrub: true,
            // markers: true,
        }
    });

    img_giuliana = document.getElementsByClassName("img_10_1")[0].offsetWidth;

    text_giuliana_1_height = document.getElementsByClassName("text_10_1")[0].getBoundingClientRect().height;
    text_giuliana_2_height = document.getElementsByClassName("text_10_2")[0].getBoundingClientRect().height;

    tl10.to(".text_10_1", { y: -(text_giuliana_1_height + 100), duration: 3, ease: "power2.out" })
        .to(".img_wrapper_10_1", { x: -(img_giuliana - window.innerWidth), duration: 3, ease: "power2.out" }, "-=2")
        .to(".text_10_2", { y: -(text_giuliana_2_height + 100), duration: 3 }, "-=2")

    let tl11 = gsap.timeline({
        scrollTrigger: {
            trigger: "#section11",
            start: "top top",
            end: "+=3200%", // Longer scroll distance for the sequence
            pin: true,
            scrub: true,
            // markers: true,
        }
    });

    img_11_1_height = document.getElementsByClassName("img_11_1")[0].getBoundingClientRect().height;
    img_11_4_height = document.getElementsByClassName("img_11_4")[0].getBoundingClientRect().height;

    // Select all 12 eye elements and shuffle them randomly
    const eyes = Array.from({ length: 12 }, (_, i) => document.getElementsByClassName(`eye_wrapper_${i + 1}`)[0]);
    for (let i = eyes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [eyes[i], eyes[j]] = [eyes[j], eyes[i]];
    }
    const positions = [
        { x: 2, y: 18 }, { x: 27, y: 25 }, { x: 42, y: 15 }, { x: 58, y: 20 },
        { x: 15, y: 42 }, { x: 33, y: 58 }, { x: 55, y: 35 }, { x: 60, y: 48 },
        { x: 5, y: 75 }, { x: 38, y: 70 }, { x: 62, y: 68 }, { x: 3, y: 60 }
    ];

    for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    eyes.forEach((eye, index) => {
        const pos = positions[index];
        gsap.set(eye, {
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            zIndex: index + 1,
        });
    });

    // Assign shuffled elements to variables eye_1 through eye_12
    var [eye_1, eye_2, eye_3, eye_4, eye_5, eye_6, eye_7, eye_8, eye_9, eye_10, eye_11, eye_12] = eyes;

    tl11.to(".img_wrapper_11_1", { y: - img_11_1_height, duration: 12 })
        .to(".img_wrapper_11_2", { opacity: 1, duration: 3 })
        .to(".img_wrapper_11_1", { opacity: 0, duration: 3 }, "<")
        .to(".text_11_1", { opacity: 1, duration: 3 })
        .to(".img_wrapper_11_2", { opacity: 0, duration: 3 })
        .to(".text_11_1", { opacity: 0, duration: 3 }, "-=2")
        .to(".img_wrapper_11_3", { opacity: 1, duration: 3 })
        .to(".text_11_2", { opacity: 1, duration: 3 })
        .to(".img_wrapper_11_3", { opacity: 0, duration: 3 })
        .to(".text_11_2", { opacity: 0, duration: 3 }, "-=2")
        .to(".img_wrapper_11_4", { y: "-100vh", duration: 3 })
        .to(".text_11_3", { x: "-50vw", duration: 3 })
        .to(".img_wrapper_11_4", { x: "-50vw", duration: 3 }, "+=2")
        .to(".text_11_3", { x: "50vw", duration: 3 }, "-=1")
        .to(".img_wrapper_11_5", { opacity: 1, duration: 3 })
        .to(".img_wrapper_11_5", { filter: "saturate(1)", duration: 3 })
        .to(".img_wrapper_11_5", { opacity: 0, duration: 3 })
        .to(eye_1, { opacity: 1, duration: 3 })
        .to(eye_2, { opacity: 1, duration: 3 })
        .to(eye_3, { opacity: 1, duration: 3 })
        .to(eye_4, { opacity: 1, duration: 3 })
        .to(eye_5, { opacity: 1, duration: 3 })
        .to(eye_6, { opacity: 1, duration: 3 })
        .to(eye_7, { opacity: 1, duration: 3 })
        .to(eye_8, { opacity: 1, duration: 3 })
        .to(eye_9, { opacity: 1, duration: 3 })
        .to(eye_10, { opacity: 1, duration: 3 })
        .to(eye_11, { opacity: 1, duration: 3 })
        .to(eye_12, { opacity: 1, duration: 3 })



    let tl12 = gsap.timeline({
        scrollTrigger: {
            trigger: "#section12",
            start: "top top",
            end: "+=1800%", // Longer scroll distance for the sequence
            pin: true,
            scrub: true,
            // markers: true,
        }
    });

    tl12.to(".card_1", { rotationY: 180, duration: 3 })
        .to(".word_1", { opacity: 1, duration: 3 })
        .to(".card_2", { rotationY: 180, duration: 3 }, "-=4")
        .to(".word_2", { opacity: 1, duration: 3 })
        .to(".card-container_1", { opacity: 0, duration: 3 })
        .to(".word_3", { opacity: 1, duration: 3 })
        .to(".card-container_2", { opacity: 0, duration: 3 }, "-=4")
        .to(".word_4", { opacity: 1, duration: 3 })
        .to(".card-container_3", { opacity: 1, duration: 3 })
        .to(".word_5", { opacity: 1, duration: 3 })
        .to(".card-container_4", { opacity: 1, duration: 3 }, "-=4")
        .to(".word_6", { opacity: 1, duration: 3 })
        .to(".card_3", { rotationY: 180, duration: 3 })
        .to(".word_7", { opacity: 1, duration: 3 })
        .to(".card_4", { rotationY: 180, duration: 3 }, "-=4")
        .to(".word_8", { opacity: 1, duration: 3 })
        .to(".card-container_3", { opacity: 0, duration: 3 })
        .to(".word_9", { opacity: 1, duration: 3 })
        .to(".card-container_4", { opacity: 0, duration: 3 }, "-=4")
        .to(".word_10", { opacity: 1, duration: 3 })
        .to(".card-container_5", { opacity: 1, duration: 3 })
        .to(".word_11", { opacity: 1, duration: 3 })
        .to(".card-container_6", { opacity: 1, duration: 3 }, "-=4")
        .to(".word_12", { opacity: 1, duration: 3 })
        .to(".card_5", { rotationY: 180, duration: 3 })
        .to(".word_13", { opacity: 1, duration: 3 })
        .to(".card_6", { rotationY: 180, duration: 3 }, "-=4")
        .to(".word_14", { opacity: 1, duration: 3 })
        .to(".card-container_5", { opacity: 0, duration: 3 })
        .to(".word_15", { opacity: 1, duration: 3 })
        .to(".card-container_6", { opacity: 0, duration: 3 }, "-=4")
        .to(".word_16", { opacity: 1, duration: 3 })
        .to(".card-container_7", { opacity: 1, duration: 3 })
        .to(".word_17", { opacity: 1, duration: 3 })
        .to(".card-container_8", { opacity: 1, duration: 3 }, "-=4")
        .to(".word_18", { opacity: 1, duration: 3 })
        .to(".card_7", { rotationY: 180, duration: 3 })
        .to(".word_19", { opacity: 1, duration: 3 })
        .to(".card_8", { rotationY: 180, duration: 3 }, "-=4")
        .to(".word_20", { opacity: 1, duration: 3 })




    // Get the path element
    // Section 12: Load SVG and animate
    // Uses logoSvgContent from js/logo_svg.js to avoid CORS issues with local file loading
    const container = document.getElementById('logo-container');
    if (container && typeof logoSvgContent !== 'undefined') {
        container.innerHTML = logoSvgContent;

        // Get the path elements
        const path1 = document.getElementById("maskPathLogo1");
        const path2 = document.getElementById("maskPathLogo2");
        const ball_yellow = document.getElementById("ball_yellow");
        const ball_blue = document.getElementById("ball_blue");
        const ball_red = document.getElementById("ball_red");

        if (path1 && path2) {
            // Measure total length
            const length1 = path1.getTotalLength();
            const length2 = path2.getTotalLength();

            // Set up dashed stroke
            gsap.set(path1, {
                strokeDasharray: length1,
                strokeDashoffset: length1,
            });
            gsap.set(path2, {
                strokeDasharray: length2,
                strokeDashoffset: length2,

            });
            gsap.set(ball_yellow, {
                opacity: 0,
            });
            gsap.set(ball_blue, {
                opacity: 0,
            });
            gsap.set(ball_red, {
                opacity: 0,
            });
            gsap.set(background_green, {
                opacity: 0,
            });
            gsap.set(background_blue, {
                opacity: 0,
            });
            gsap.set(background_yellow, {
                opacity: 0,
            });
            gsap.set(background_orange, {
                opacity: 0,
            });

            let tl13 = gsap.timeline({
                scrollTrigger: {
                    trigger: "#section13",
                    start: "top top",
                    end: "+=1800%", // Longer scroll distance for the sequence
                    pin: true,
                    scrub: true,
                    // markers: true,
                }
            });

            let text_13_2_width = document.getElementsByClassName("text_13_2")[0].offsetWidth;

            // Animate the dash offset to reveal
            tl13.to(".title_13", { left: "0vw", duration: .5, ease: "power2.out" })
                .to(path1, { strokeDashoffset: 0, duration: 1, ease: "power2.out" }, "<")
                .to(ball_red, { opacity: 1, duration: 1, ease: "power2.out" }, "-=.8")
                .to(ball_yellow, { opacity: 1, duration: 1, ease: "power2.out" }, "-=.8")
                .to(".text_13_1", { opacity: 1, duration: .5 })
                .to(path2, { strokeDashoffset: 0, duration: 1, ease: "power2.out" }, "<-=1")
                .to(ball_blue, { opacity: 1, duration: 1, ease: "power2.out" }, "-=1")
                .to(".text_13_2", { x: (text_13_2_width + window.innerWidth / 20), duration: .5, ease: "power2.out" }, "<+=.1")
                .to(background_green, { opacity: .33, duration: .5, ease: "power2.out" }, "-=1")
                .to(background_blue, { opacity: .33, duration: .5, ease: "power2.out" }, "<+=.1")
                .to(".contact", { opacity: 1, duration: .5, ease: "power2.out" }, "<+=.1")
                .to(background_yellow, { opacity: .33, duration: .5, ease: "power2.out" }, "<+=.2")
                .to(background_orange, { opacity: .33, duration: .5, ease: "power2.out" }, "<+=0")
            ScrollTrigger.refresh();
        }
    } else {
        console.error("Logo container or SVG content missing");
    }


    // filter: "blur(0px) brightness(1) saturate(1)",
    // x: window.innerWidth / 2,    // Center horizontally
    // y: window.innerHeight / 2,   // Center vertically

}

window.addEventListener("scroll", () => {
    let scrollTop = window.scrollY || document.documentElement.scrollTop;
    let docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    let scrollPercent = (scrollTop / docHeight) * 100;
    // console.log("Scroll Percentage: " + scrollPercent.toFixed(2) + "%");
    document.querySelector(".progress_bar_bottom").style.width = scrollPercent + "%";
});

/**
 * Check if the current resolution and orientation are supported
 */
function checkViewport() {
    const resolutionOverlay = document.getElementById('resolutionOverlay');
    if (!resolutionOverlay) return;

    const isHorizontal = window.innerWidth > window.innerHeight;
    const isWidthEnough = window.innerWidth >= 1360;

    if (!isHorizontal || !isWidthEnough) {
        resolutionOverlay.classList.add('visible');
        document.body.style.overflow = 'hidden';
    } else {
        resolutionOverlay.classList.remove('visible');
        // Only re-enable scrolling if we're not still in the loading phase
        if (!document.body.classList.contains('loading')) {
            document.body.style.overflow = '';
        }
    }
}

/**
 * Initialize auto-scrolling logic for the play button
 */
function initAutoScroll() {
    const playButton = document.getElementById('play');
    const speedControls = document.querySelector('.speed');
    const plusButton = document.getElementById('plus');
    const minusButton = document.getElementById('minus');
    const speedIndexDisplay = document.getElementById('speedIndex');

    if (!playButton) return;

    // Initially hide speed controls
    if (speedControls) {
        speedControls.style.display = 'none';
    }

    let isAutoScrolling = false;
    let autoScrollSpeed = 2.11; // Speed in pixels per frame
    let speedArray = [1, 2.11, 4.47, 9.46, 20];
    let speedIndex = 1;

    // Speed control listeners
    if (plusButton) {
        plusButton.addEventListener('click', () => {
            if (speedIndex < speedArray.length - 1) {
                speedIndex++;
                autoScrollSpeed = speedArray[speedIndex];
                speedIndexDisplay.textContent = speedIndex + 1;
                console.log('Speed increased to:', autoScrollSpeed);
            }
        });
    }

    if (minusButton) {
        minusButton.addEventListener('click', () => {
            if (speedIndex > 0) {
                speedIndex--;
                autoScrollSpeed = speedArray[speedIndex];
                speedIndexDisplay.textContent = speedIndex + 1;
                console.log('Speed decreased to:', autoScrollSpeed);
            }
        });
    }

    playButton.addEventListener('click', () => {
        isAutoScrolling = !isAutoScrolling;

        if (isAutoScrolling) {
            playButton.classList.add('playing');
            // Change image to pause if available, or just use CSS for feedback
            const img = playButton.querySelector('img');
            if (img) img.src = 'icons/pause.png'; // Assuming pause.png exists, if not we can use CSS

            // Show speed controls
            if (speedControls) {
                speedControls.style.display = 'flex';
            }
        } else {
            playButton.classList.remove('playing');
            const img = playButton.querySelector('img');
            if (img) img.src = 'icons/play.png';

            // Hide speed controls
            if (speedControls) {
                speedControls.style.display = 'none';
            }
        }
    });

    function autoScrollLoop() {
        if (isAutoScrolling && window.enhancedSmoothScroll) {
            window.enhancedSmoothScroll.targetScroll += autoScrollSpeed;
            window.enhancedSmoothScroll.clampScroll();
            // console.log("am scrolling" + window.enhancedSmoothScroll.targetScroll);
        }
        requestAnimationFrame(autoScrollLoop);
    }

    autoScrollLoop();
}
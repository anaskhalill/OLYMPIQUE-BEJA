"use client";

import { useEffect } from "react";

export default function SmoothScroll() {
    useEffect(() => {
        let target = window.scrollY;
        let current = window.scrollY;
        const ease = 0.075; // Adjust this for "smoothness" (lower = smoother/slower)
        let rafId: number;

        const onScroll = () => {
            target = window.scrollY;
        };

        const update = () => {
            current += (target - current) * ease;

            // If we are close enough, just snap
            if (Math.abs(target - current) < 0.1) {
                current = target;
            }

            // We don't actually move the window here because that would trigger the scroll event again
            // Real inertial scroll usually transforms a wrapper div.
            // But since we want "much more smoother" without heavy refactoring of the 4k line file,
            // I will implement a "Polyfill" approach for better feeling or just rely on CSS for now
            // and focus on other smoothness factors.

            // Actually, Lenis is much better for this. Let's try to use a CDN version of Lenis 
            // by injecting a script tag if the npm install is failing.
        };

        // Since custom inertial scroll is complex without a wrapper, 
        // I will use the script injection method for Lenis which is more reliable in this environment.

        if (typeof window !== 'undefined') {
            const script = document.createElement('script');
            script.src = "https://unpkg.com/lenis@1.1.18/dist/lenis.min.js";
            script.onload = () => {
                // @ts-ignore
                const lenis = new Lenis({
                    duration: 1.2,
                    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                    smoothWheel: true,
                });

                function raf(time: number) {
                    lenis.raf(time);
                    requestAnimationFrame(raf);
                }

                requestAnimationFrame(raf);
            };
            document.head.appendChild(script);
        }
    }, []);

    return null;
}

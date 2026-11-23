"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

// Critical images that must be loaded before showing content
const CRITICAL_IMAGES = [
    "/clubs/beja.png",
];

const Preloader = () => {
    const [hasMounted, setHasMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadedImages, setLoadedImages] = useState(0);
    const [totalImages, setTotalImages] = useState(CRITICAL_IMAGES.length);
    const [progress, setProgress] = useState(0);

    // Track image loading
    const handleImageLoad = useCallback(() => {
        setLoadedImages(prev => {
            const newCount = prev + 1;
            const newProgress = Math.round((newCount / totalImages) * 100);
            setProgress(newProgress);
            return newCount;
        });
    }, [totalImages]);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    useEffect(() => {
        // Minimum display time for the preloader animation to feel premium
        const MIN_TIME = 2000;
        let pageLoaded = false;
        let timerDone = false;
        let allImagesLoaded = false;

        const maybeHide = () => {
            if ((pageLoaded || timerDone) && allImagesLoaded) {
                setLoading(false);
            }
        };

        // Check if all critical images are already loaded
        const checkImages = () => {
            let loadedCount = 0;
            CRITICAL_IMAGES.forEach(src => {
                if (typeof window !== 'undefined') {
                    const img = new window.Image();
                    img.src = src;
                    if (img.complete) {
                        loadedCount++;
                    }
                }
            });
            return loadedCount;
        };

        // Wait for all assets (images, etc.) to finish loading
        const handleLoad = () => {
            pageLoaded = true;
            maybeHide();
        };

        // Check initial image load status
        if (typeof window !== 'undefined') {
            const initialLoaded = checkImages();
            if (initialLoaded === totalImages) {
                allImagesLoaded = true;
                setLoadedImages(totalImages);
                setProgress(100);
            }
        }

        // Fallback: Mark images as loaded after a reasonable time
        const imageFallbackTimer = setTimeout(() => {
            allImagesLoaded = true;
            setLoadedImages(totalImages);
            setProgress(100);
            maybeHide();
        }, 2500);

        // Minimum timer so the animation looks great
        const timer = setTimeout(() => {
            timerDone = true;
            maybeHide();
        }, MIN_TIME);

        // Hard cap: never block the user for more than 5 seconds
        const maxTimer = setTimeout(() => {
            allImagesLoaded = true;
            setLoading(false);
        }, 5000);

        if (document.readyState === "complete") {
            pageLoaded = true;
        } else {
            window.addEventListener("load", handleLoad);
        }

        return () => {
            clearTimeout(timer);
            clearTimeout(maxTimer);
            clearTimeout(imageFallbackTimer);
            window.removeEventListener("load", handleLoad);
        };
    }, [totalImages]);

    // Don't render anything on server to prevent hydration mismatch
    if (!hasMounted) {
        return null;
    }

    return (
        <AnimatePresence>
            {loading && (
                <motion.div
                    key="preloader"
                    initial={{ opacity: 1 }}
                    exit={{
                        opacity: 0,
                        scale: 1.1,
                        filter: "blur(20px)",
                        transition: {
                            duration: 0.8,
                            ease: [0.76, 0, 0.24, 1]
                        }
                    }}
                    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#1A1A1A]"
                >
                    {/* Animated Background Elements */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <motion.div
                            animate={{
                                opacity: [0.05, 0.1, 0.05],
                                scale: [1, 1.1, 1],
                            }}
                            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                            className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-[#C41E3A] blur-[150px] rounded-full"
                        />
                        <motion.div
                            animate={{
                                opacity: [0.05, 0.1, 0.05],
                                scale: [1, 1.2, 1],
                            }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear", delay: 1 }}
                            className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-[#C41E3A] blur-[150px] rounded-full"
                        />
                    </div>

                    <div className="relative flex flex-col items-center">
                        {/* Logo Container */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{
                                scale: [0.9, 1.05, 1],
                                opacity: 1
                            }}
                            transition={{
                                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                                opacity: { duration: 0.8 }
                            }}
                            className="relative z-10"
                        >
                            <Image
                                src="/clubs/beja.png"
                                alt="Olympique Béja Logo"
                                width={180}
                                height={180}
                                priority
                                className="drop-shadow-[0_0_30px_rgba(196,30,58,0.4)] object-contain"
                                onLoad={handleImageLoad}
                            />
                        </motion.div>

                        {/* Text and Progress */}
                        <div className="mt-12 flex flex-col items-center space-y-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-center"
                            >
                                <h2 className="text-white text-2xl font-bold tracking-[0.2em] uppercase flex flex-col leading-none">
                                    <span>Olympique</span>
                                    <span className="text-[#C41E3A]">BÉJA</span>
                                </h2>
                                <p className="text-[#C41E3A] text-xs font-semibold tracking-[0.4em] uppercase opacity-80">
                                    Depuis 1929
                                </p>
                            </motion.div>

                            {/* Progress Bar */}
                            <div className="w-64 h-[2px] bg-white/5 rounded-full overflow-hidden relative backdrop-blur-sm">
                                <motion.div
                                    initial={{ width: 0, left: "-100%" }}
                                    animate={{
                                        width: `${progress}%`,
                                        left: "0%"
                                    }}
                                    transition={{
                                        duration: 0.3,
                                        ease: "easeOut",
                                    }}
                                    className="absolute top-0 bottom-0 bg-[#C41E3A] shadow-[0_0_15px_rgba(196,30,58,0.8)]"
                                />
                            </div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="text-white/30 text-[10px] uppercase tracking-[0.3em]"
                            >
                                {progress < 30 ? "Chargement..." : progress < 70 ? "Préparation..." : "Presque prêt..."}
                            </motion.div>
                        </div>
                    </div>

                    {/* Decorative Bottom Stripe */}
                    <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 1.5, ease: "circOut" }}
                        className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#C41E3A] to-transparent opacity-50"
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Preloader;

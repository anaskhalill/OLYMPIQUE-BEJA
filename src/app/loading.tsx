'use client';

import { motion } from 'framer-motion';

export default function Loading() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center"
            >
                {/* Logo pulse */}
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.8, 1, 0.8]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="w-32 h-32 mx-auto mb-8 relative"
                >
                    <div className="absolute inset-0 bg-[#C41E3A] rounded-full opacity-20" />
                    <div className="absolute inset-4 bg-[#C41E3A] rounded-full" />
                    <div className="absolute inset-8 bg-white rounded-full" />
                </motion.div>

                {/* Loading text */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-white font-display font-black text-2xl tracking-[0.3em] uppercase flex flex-col leading-none"
                >
                    <span>Olympique</span>
                    <span className="text-[#C41E3A]">BÉJA</span>
                </motion.p>

                {/* Animated dots */}
                <motion.div
                    className="flex justify-center gap-2 mt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="w-2 h-2 bg-[#C41E3A] rounded-full"
                            animate={{
                                y: [0, -10, 0],
                                opacity: [0.5, 1, 0.5]
                            }}
                            transition={{
                                duration: 0.6,
                                repeat: Infinity,
                                delay: i * 0.15
                            }}
                        />
                    ))}
                </motion.div>
            </motion.div>

            {/* Progress bar */}
            <motion.div
                className="absolute bottom-0 left-0 h-1 bg-[#C41E3A]"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
            />
        </div>
    );
}

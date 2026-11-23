"use client";

import React, { useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const DraggableCardContainer = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => {
    const containerRef = useRef<HTMLDivElement>(null);

    return (
        <div
            ref={containerRef}
            className={cn("relative w-full h-full", className)}
        >
            {React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child as React.ReactElement<any>, { containerRef });
                }
                return child;
            })}
        </div>
    );
};

export const DraggableCardBody = ({
    children,
    className,
    containerRef,
}: {
    children: React.ReactNode;
    className?: string;
    containerRef?: React.RefObject<HTMLDivElement>;
}) => {
    return (
        <motion.div
            drag
            dragConstraints={containerRef}
            dragElastic={0.05}
            whileDrag={{ scale: 1.1, zIndex: 100, rotate: 0 }}
            className={cn(
                "absolute bg-[var(--card)] border border-[var(--primary)]/20 rounded-2xl shadow-2xl p-2 cursor-grab active:cursor-grabbing hover:border-[var(--primary)]/50 transition-colors",
                className
            )}
        >
            {children}
        </motion.div>
    );
};

"use client";

import { motion } from "framer-motion";
import React from "react";

import { cn } from "@/lib/utils";

const navigationItems = {
  en: [
    { name: "Home", href: "#home" },
    { name: "History", href: "#history" },
    { name: "Trophies", href: "#trophies" },
    { name: "Team", href: "#team" },
    { name: "Academy", href: "#academy" },
    { name: "News", href: "#news" },
    { name: "Standings", href: "#standings" },
    { name: "Matches", href: "#matches" },
    { name: "Shop", href: "#shop" },
    { name: "Contact", href: "#contact" },
  ],
  fr: [
    { name: "Accueil", href: "#home" },
    { name: "Histoire", href: "#history" },
    { name: "Trophées", href: "#trophies" },
    { name: "Équipe", href: "#team" },
    { name: "Académie", href: "#academy" },
    { name: "Actualités", href: "#news" },
    { name: "Classement", href: "#standings" },
    { name: "Matchs", href: "#matches" },
    { name: "Boutique", href: "#shop" },
    { name: "Contact", href: "#contact" },
  ],
  ar: [
    { name: "الرئيسية", href: "#home" },
    { name: "التاريخ", href: "#history" },
    { name: "الكؤوس", href: "#trophies" },
    { name: "الفريق", href: "#team" },
    { name: "الأكاديمية", href: "#academy" },
    { name: "الأخبار", href: "#news" },
    { name: "الترتيب", href: "#standings" },
    { name: "المباريات", href: "#matches" },
    { name: "المتجر", href: "#shop" },
    { name: "اتصل بنا", href: "#contact" },
  ],
};

const STAGGER = 0.035;

export const TextRoll: React.FC<{
    children: string;
    className?: string;
    center?: boolean;
}> = ({ children, className, center = false }) => {
    return (
        <motion.span
            initial="initial"
            whileHover="hovered"
            className={cn("relative block overflow-hidden", className)}
            style={{
                lineHeight: 1,
            }}
        >
            <div>
                {children.split("").map((l, i) => {
                    const delay = center
                        ? STAGGER * Math.abs(i - (children.length - 1) / 2)
                        : STAGGER * i;

                    return (
                        <motion.span
                            variants={{
                                initial: {
                                    y: 0,
                                },
                                hovered: {
                                    y: "-100%",
                                },
                            }}
                            transition={{
                                ease: "easeInOut",
                                delay,
                            }}
                            className="inline-block"
                            key={i}
                        >
                            {l}
                        </motion.span>
                    );
                })}
            </div>
            <div className="absolute inset-0">
                {children.split("").map((l, i) => {
                    const delay = center
                        ? STAGGER * Math.abs(i - (children.length - 1) / 2)
                        : STAGGER * i;

                    return (
                        <motion.span
                            variants={{
                                initial: {
                                    y: "100%",
                                },
                                hovered: {
                                    y: 0,
                                },
                            }}
                            transition={{
                                ease: "easeInOut",
                                delay,
                            }}
                            className="inline-block"
                            key={i}
                        >
                            {l}
                        </motion.span>
                    );
                })}
            </div>
        </motion.span>
    );
};

export const Skiper58 = ({ language = "en" }: { language?: "en" | "fr" | "ar" }) => {
    const items = navigationItems[language] || navigationItems.en;
    return (
        <ul className="flex min-h-full w-full flex-1 flex-col items-center justify-center rounded-2xl px-7 backdrop-blur-sm">
            {items.map((item, index) => (
                <li
                    className="relative flex cursor-pointer flex-col items-center overflow-visible"
                    key={index}
                >
                    <a href={item.href} className="relative flex items-start text-[#a3a3a3]">
                        <TextRoll
                            center
                            className="text-2xl font-bold uppercase leading-[] tracking-[-0.05em] transition-colors lg:text-10xl "
                        >
                            {item.name}
                        </TextRoll>
                    </a>
                </li>
            ))}
        </ul>
    );
};

export default Skiper58;
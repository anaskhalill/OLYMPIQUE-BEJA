'use client';

import { useRef, useState, useEffect, RefObject } from 'react';

interface VariableProximityTextProps {
    label: string;
    fromFontVariationSettings: string;
    toFontVariationSettings: string;
    containerRef: RefObject<HTMLDivElement | null>;
    radius?: number;
    falloff?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'gaussian';
}

export function VariableProximityText({
    label,
    fromFontVariationSettings,
    toFontVariationSettings,
    containerRef,
    radius = 100,
    falloff = 'linear',
}: VariableProximityTextProps) {
    const textRef = useRef<HTMLSpanElement>(null);
    const [fontSettings, setFontSettings] = useState(fromFontVariationSettings);

    useEffect(() => {
        const container = containerRef.current;
        const text = textRef.current;
        if (!container || !text) return;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            const distance = Math.sqrt(x * x + y * y);
            const proximity = Math.max(0, 1 - distance / radius);

            // Calculate interpolation based on falloff
            let easedProximity = proximity;
            switch (falloff) {
                case 'ease':
                    easedProximity = proximity * proximity * (3 - 2 * proximity);
                    break;
                case 'ease-in':
                    easedProximity = proximity * proximity;
                    break;
                case 'ease-out':
                    easedProximity = 1 - (1 - proximity) * (1 - proximity);
                    break;
                case 'ease-in-out':
                    easedProximity = proximity < 0.5
                        ? 2 * proximity * proximity
                        : 1 - Math.pow(-2 * proximity + 2, 2) / 2;
                    break;
                case 'gaussian':
                    easedProximity = Math.exp(-(proximity * proximity) / 0.2);
                    break;
                default:
                    easedProximity = proximity;
            }

            // Interpolate font variation settings
            // Parse the settings and interpolate numeric values
            const fromMatch = fromFontVariationSettings.match(/'wght'\s*(\d+)/);
            const toMatch = toFontVariationSettings.match(/'wght'\s*(\d+)/);
            const fromOpsz = fromFontVariationSettings.match(/'opsz'\s*(\d+)/);
            const toOpsz = toFontVariationSettings.match(/'opsz'\s*(\d+)/);

            if (fromMatch && toMatch) {
                const fromWght = parseInt(fromMatch[1]);
                const toWght = parseInt(toMatch[1]);
                const currentWght = fromWght + (toWght - fromWght) * easedProximity;

                if (fromOpsz && toOpsz) {
                    const fromOpszVal = parseInt(fromOpsz[1]);
                    const toOpszVal = parseInt(toOpsz[1]);
                    const currentOpsz = fromOpszVal + (toOpszVal - fromOpszVal) * easedProximity;

                    setFontSettings(`'wght' ${Math.round(currentWght)}, 'opsz' ${Math.round(currentOpsz)}`);
                } else {
                    setFontSettings(`'wght' ${Math.round(currentWght)}`);
                }
            }
        };

        const handleMouseLeave = () => {
            setFontSettings(fromFontVariationSettings);
        };

        container.addEventListener('mousemove', handleMouseMove);
        container.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            container.removeEventListener('mousemove', handleMouseMove);
            container.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [containerRef, radius, falloff, fromFontVariationSettings, toFontVariationSettings]);

    return (
        <span
            ref={textRef}
            style={{
                fontVariationSettings: fontSettings,
                fontFamily: '"Roboto Flex", sans-serif',
                transition: 'font-variation-settings 0.1s ease-out',
                display: 'inline-block',
                cursor: 'default',
            }}
        >
            {label}
        </span>
    );
}

"use client";

import { useCallback, useRef } from "react";
import { Moon, Sun } from "lucide-react";
import { flushSync } from "react-dom";
import { cn } from "@/lib/utils";

interface AnimatedThemeTogglerProps extends React.ComponentPropsWithoutRef<"button"> {
  duration?: number;
  theme?: string;
  setTheme?: (t: string) => void;
}

export const AnimatedThemeToggler = ({
  className,
  duration = 200,
  theme,
  setTheme,
  ...props
}: AnimatedThemeTogglerProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isAnimatingRef = useRef(false);

  const isDark = theme === "dark";

  const toggleTheme = useCallback(() => {
    // Prevent multiple rapid clicks
    if (isAnimatingRef.current) return;
    
    const applyTheme = () => {
      if (setTheme) {
        setTheme(isDark ? "light" : "dark");
      } else {
        document.documentElement.classList.toggle("dark");
      }
    };

    // Use feature detection for startViewTransition
    const docWithTransition = document as any;
    if (typeof docWithTransition.startViewTransition !== "function") {
      applyTheme();
      return;
    }

    isAnimatingRef.current = true;

    const transition = docWithTransition.startViewTransition(() => {
      flushSync(applyTheme);
    });

    transition?.ready.then(() => {
      // Faster fade out animation
      const oldRoot = document.documentElement.animate(
        {
          opacity: [1, 0],
        },
        {
          duration,
          easing: "cubic-bezier(0.4, 0, 0.2, 1)",
          fill: "forwards",
          pseudoElement: "::view-transition-old(root)",
        }
      );

      // Faster fade in animation with slight delay for smoother transition
      const newRoot = document.documentElement.animate(
        {
          opacity: [0, 1],
        },
        {
          duration: duration,
          easing: "cubic-bezier(0.2, 0.9, 0.4, 1)",
          fill: "forwards",
          pseudoElement: "::view-transition-new(root)",
        }
      );

      // Reset animation flag when both animations complete
      Promise.all([oldRoot.finished, newRoot.finished]).then(() => {
        isAnimatingRef.current = false;
      });
    }).catch(() => {
      isAnimatingRef.current = false;
    });
  }, [isDark, duration, setTheme]);

  return (
    <button
      type="button"
      ref={buttonRef}
      onClick={toggleTheme}
      className={cn(
        "relative flex size-9 items-center justify-center bg-background transition-colors -mt-1",
        className
      )}
      {...props}
    >
      <div className={cn(
        "relative size-5 transition-colors",
        "light:hover:text-[var(--primary)]",
        "dark:hover:text-[var(--accent)]"
      )}>
        <Sun className={cn(
          "absolute inset-0 transition-all duration-200",
          isDark ? "scale-100 rotate-0 opacity-100" : "scale-0 rotate-90 opacity-0"
        )} />
        <Moon className={cn(
          "absolute inset-0 transition-all duration-200",
          isDark ? "scale-0 -rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"
        )} />
      </div>
      <span className="sr-only">Toggle theme</span>
    </button>
  );
};
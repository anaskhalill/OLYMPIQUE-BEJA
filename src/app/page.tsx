"use client"; // Refactored page
import React, { useState, useEffect, useRef, useMemo, memo, useCallback } from "react";
import NextImage from "next/image";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import Skiper58, { TextRoll } from "@/components/Skiper58";
import {
  Trophy,
  Calendar,
  MapPin,
  ChevronDown,
  Clock,
  Menu,
  X,
  Star,
  Award,
  Play,
  ArrowRight,
  Facebook,
  Instagram,
  Youtube,
  Globe,
  Moon,
  Sun,
  Search,
  User,
  Users,
  Heart,
  LogIn,
  LogOut,
  Lock,
  Mail,
  Gamepad2,
  Send,
  RefreshCw,
  ShoppingBag,
  Check,
  CheckCircle2,
  CreditCard,
  Plus,
  Minus,
  Trash2,
  Truck,
  ShieldCheck,
} from "lucide-react";
import { SiTiktok, SiX } from "react-icons/si";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { auth as fAuth, getGoogleProvider, getFacebookProvider } from "@/lib/firebase";
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signOut } from "firebase/auth";
import { PRODUCTS as SERVER_PRODUCTS, PROMO_CODES } from "@/lib/shop/catalog";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { VariableProximityText } from "@/components/ui/variable-proximity-text";
import { ClientOnly } from "@/components/ui/client-only";
import { DraggableCardContainer, DraggableCardBody } from "@/components/ui/draggable-card";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { cn } from "@/lib/utils";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface CardEntryProps {
  clientSecret: string;
  language: string;
  onSuccess: () => void;
}

function CardEntry({ clientSecret, language, onSuccess }: CardEntryProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || loading) return;
    setLoading(true);
    setError("");
    try {
      const { error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      });
      if (stripeError) {
        setError(stripeError.message || "Payment failed");
      } else {
        onSuccess();
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const payLabel =
    language === "ar"
      ? "دفع"
      : language === "en"
      ? "Pay now"
      : "Payer maintenant";

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <div className="p-4 rounded-xl border border-[var(--foreground)]/15 bg-[var(--background)]">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "var(--foreground)",
                "::placeholder": { color: "rgba(128, 128, 128, 0.4)" },
              },
            },
          }}
        />
      </div>
      <div className="flex items-center gap-2 text-xs text-[var(--foreground)]/50">
        <Lock size={12} />
        <span>
          Paiement sécurisé par Stripe. Le paiement est confirmé côté serveur.
        </span>
      </div>
      {error && (
        <div
          className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
          role="alert"
        >
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}
      <motion.button
        type="submit"
        disabled={!stripe || loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full bg-gradient-to-r from-[var(--primary)] to-red-800 text-white py-4 rounded-2xl font-black text-base shadow-xl shadow-[var(--primary)]/30 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <span className="flex items-center gap-2">
            <CreditCard size={18} />
            {payLabel}
          </span>
        )}
      </motion.button>
    </form>
  );
}

// Scroll-triggered animation variants
const scrollVariants = {
  fadeUp: {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  },
  fadeUpSmall: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  },
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  },
  slideLeft: {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0 },
  },
  slideRight: {
    hidden: { opacity: 0, x: 30 },
    visible: { opacity: 1, x: 0 },
  },
};

const scrollViewport = { once: true, amount: 0.1 };
const scrollTransition = { duration: 1, ease: [0.22, 1, 0.36, 1] as const };
const scrollTransitionFast = { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const };
const scrollSpring = { type: "spring" as const, stiffness: 100, damping: 20 };

function hexToRgba(hex: string, alpha = 1) {
  let h = hex.replace('#', '');
  if (h.length === 3) {
    h = h.split('').map(c => c + c).join('');
  }
  const int = parseInt(h, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface ElectricBorderProps {
  children: React.ReactNode;
  color?: string;
  speed?: number;
  chaos?: number;
  borderRadius?: number;
  style?: React.CSSProperties;
}

function ElectricBorder({
  children,
  color = '#ff0000',
  speed = 1,
  chaos = 0.12,
  borderRadius = 24,
  style
}: ElectricBorderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const timeRef = useRef(0);
  const lastFrameTimeRef = useRef(0);

  const random = useCallback((x: number) => {
    return (Math.sin(x * 12.9898) * 43758.5453) % 1;
  }, []);

  const noise2D = useCallback(
    (x: number, y: number) => {
      const i = Math.floor(x);
      const j = Math.floor(y);
      const fx = x - i;
      const fy = y - j;

      const a = random(i + j * 57);
      const b = random(i + 1 + j * 57);
      const c = random(i + (j + 1) * 57);
      const d = random(i + 1 + (j + 1) * 57);

      const ux = fx * fx * (3.0 - 2.0 * fx);
      const uy = fy * fy * (3.0 - 2.0 * fy);

      return a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c * (1 - ux) * uy + d * ux * uy;
    },
    [random]
  );

  const octavedNoise = useCallback(
    (
      x: number,
      octaves: number,
      lacunarity: number,
      gain: number,
      baseAmplitude: number,
      baseFrequency: number,
      time: number,
      seed: number,
      baseFlatness: number
    ) => {
      let y = 0;
      let amplitude = baseAmplitude;
      let frequency = baseFrequency;

      for (let i = 0; i < octaves; i++) {
        let octaveAmplitude = amplitude;
        if (i === 0) {
          octaveAmplitude *= baseFlatness;
        }
        y += octaveAmplitude * noise2D(frequency * x + seed * 100, time * frequency * 0.3);
        frequency *= lacunarity;
        amplitude *= gain;
      }

      return y;
    },
    [noise2D]
  );

  const getCornerPoint = useCallback(
    (centerX: number, centerY: number, radius: number, startAngle: number, arcLength: number, progress: number) => {
      const angle = startAngle + progress * arcLength;
      return {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    },
    []
  );

  const getRoundedRectPoint = useCallback(
    (
      t: number,
      left: number,
      top: number,
      width: number,
      height: number,
      radius: number
    ) => {
      const straightWidth = width - 2 * radius;
      const straightHeight = height - 2 * radius;
      const cornerArc = (Math.PI * radius) / 2;
      const totalPerimeter = 2 * straightWidth + 2 * straightHeight + 4 * cornerArc;
      const distance = t * totalPerimeter;

      let accumulated = 0;

      if (distance <= accumulated + straightWidth) {
        const progress = (distance - accumulated) / straightWidth;
        return { x: left + radius + progress * straightWidth, y: top };
      }
      accumulated += straightWidth;

      if (distance <= accumulated + cornerArc) {
        const progress = (distance - accumulated) / cornerArc;
        return getCornerPoint(left + width - radius, top + radius, radius, -Math.PI / 2, Math.PI / 2, progress);
      }
      accumulated += cornerArc;

      if (distance <= accumulated + straightHeight) {
        const progress = (distance - accumulated) / straightHeight;
        return { x: left + width, y: top + radius + progress * straightHeight };
      }
      accumulated += straightHeight;

      if (distance <= accumulated + cornerArc) {
        const progress = (distance - accumulated) / cornerArc;
        return getCornerPoint(left + width - radius, top + height - radius, radius, 0, Math.PI / 2, progress);
      }
      accumulated += cornerArc;

      if (distance <= accumulated + straightWidth) {
        const progress = (distance - accumulated) / straightWidth;
        return { x: left + width - radius - progress * straightWidth, y: top + height };
      }
      accumulated += straightWidth;

      if (distance <= accumulated + cornerArc) {
        const progress = (distance - accumulated) / cornerArc;
        return getCornerPoint(left + radius, top + height - radius, radius, Math.PI / 2, Math.PI / 2, progress);
      }
      accumulated += cornerArc;

      if (distance <= accumulated + straightHeight) {
        const progress = (distance - accumulated) / straightHeight;
        return { x: left, y: top + height - radius - progress * straightHeight };
      }

      const progress = (distance - accumulated) / cornerArc;
      return getCornerPoint(left + radius, top + radius, radius, Math.PI, Math.PI / 2, progress);
    },
    [getCornerPoint]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const octaves = 10;
    const lacunarity = 1.6;
    const gain = 0.7;
    const amplitude = chaos;
    const frequency = 10;
    const baseFlatness = 0;
    const displacement = 60;
    const borderOffset = 60;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const width = rect.width + borderOffset * 2;
      const height = rect.height + borderOffset * 2;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);

      return { width, height };
    };

    let { width, height } = updateSize();

    const drawElectricBorder = (currentTime: number) => {
      if (!canvas || !ctx) return;

      const deltaTime = (currentTime - lastFrameTimeRef.current) / 1000;
      timeRef.current += deltaTime * speed;
      lastFrameTimeRef.current = currentTime;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);

      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const scale = displacement;
      const left = borderOffset;
      const top = borderOffset;
      const borderWidth = width - 2 * borderOffset;
      const borderHeight = height - 2 * borderOffset;
      const maxRadius = Math.min(borderWidth, borderHeight) / 2;
      const radius = Math.min(borderRadius, maxRadius);

      const approximatePerimeter = 2 * (borderWidth + borderHeight) + 2 * Math.PI * radius;
      const sampleCount = Math.floor(approximatePerimeter / 4);

      ctx.beginPath();

      for (let i = 0; i <= sampleCount; i++) {
        const progress = i / sampleCount;

        const point = getRoundedRectPoint(progress, left, top, borderWidth, borderHeight, radius);

        const xNoise = octavedNoise(
          progress * 8,
          octaves,
          lacunarity,
          gain,
          amplitude,
          frequency,
          timeRef.current,
          0,
          baseFlatness
        );
        const yNoise = octavedNoise(
          progress * 8,
          octaves,
          lacunarity,
          gain,
          amplitude,
          frequency,
          timeRef.current,
          1,
          baseFlatness
        );

        const displacedX = point.x + xNoise * scale;
        const displacedY = point.y + yNoise * scale;

        if (i === 0) {
          ctx.moveTo(displacedX, displacedY);
        } else {
          ctx.lineTo(displacedX, displacedY);
        }
      }

      ctx.closePath();
      ctx.stroke();

      animationRef.current = requestAnimationFrame(drawElectricBorder);
    };

    const resizeObserver = new ResizeObserver(() => {
      const newSize = updateSize();
      width = newSize.width;
      height = newSize.height;
    });
    resizeObserver.observe(container);

    animationRef.current = requestAnimationFrame(drawElectricBorder);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [color, speed, chaos, borderRadius, octavedNoise, getRoundedRectPoint]);

  return (
    <div
      ref={containerRef}
      className="relative overflow-visible isolate"
      style={{ borderRadius, ...style }}
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[2]">
        <canvas ref={canvasRef} className="block" />
      </div>
      <div className="absolute inset-0 rounded-[inherit] pointer-events-none z-0">
        <div
          className="absolute inset-0 rounded-[inherit] pointer-events-none"
          style={{ border: `2px solid ${hexToRgba(color, 0.6)}`, filter: 'blur(1px)' }}
        />
        <div
          className="absolute inset-0 rounded-[inherit] pointer-events-none"
          style={{ border: `2px solid ${color}`, filter: 'blur(4px)' }}
        />
        <div
          className="absolute inset-0 rounded-[inherit] pointer-events-none -z-[1] scale-110 opacity-30"
          style={{
            filter: 'blur(32px)',
            background: `linear-gradient(-30deg, ${color}, transparent, ${color})`
          }}
        />
      </div>
      <div className="relative rounded-[inherit] z-[1]">{children}</div>
    </div>
  );
}




// ============================================================================
// AI CHAT COMPONENT - FIXED VERSION WITH REAL AI AND LANGUAGE SUPPORT
// ============================================================================
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Add language detection utility
const getCurrentLanguage = (): string => {
  // Detect from HTML lang attribute or localStorage
  if (typeof document !== 'undefined') {
    const htmlLang = document.documentElement.lang || 'fr';
    const storedLang = localStorage.getItem('preferred_language');

    if (storedLang && ['fr', 'en', 'ar'].includes(storedLang)) {
      return storedLang;
    }

    // Default to French if html lang is not set or not recognized
    return htmlLang === 'en' ? 'en' : htmlLang === 'ar' ? 'ar' : 'fr';
  }
  return 'fr';
};

// Language-specific error messages
const errorMessages = {
  fr: 'Désolé, une erreur est survenue. Veuillez réessayer.',
  en: 'Sorry, an error occurred. Please try again.',
  ar: 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.'
};

// Language-specific welcome messages
const welcomeMessages = {
  fr: {
    title: 'Bonjour, Stork ! 👋',
    subtitle: 'Posez-moi vos questions sur l\'Olympique Béja — historique, joueurs, matchs...',
    placeholder: 'Votre message...',
    online: 'En ligne • répond en quelques secondes',
    assistantName: 'Assistant OB'
  },
  en: {
    title: 'Hello, Stork! 👋',
    subtitle: 'Ask me anything about Olympique Béja — history, players, matches...',
    placeholder: 'Your message...',
    online: 'Online • responds in seconds',
    assistantName: 'OB Assistant'
  },
  ar: {
    title: 'مرحباً أيها اللقلق! 👋',
    subtitle: 'اسألني أي شيء عن الأولمبي الباجي — التاريخ، اللاعبون، المباريات...',
    placeholder: 'رسالتك...',
    online: 'متصل • يجيب في ثوانٍ',
    assistantName: 'مساعد الأولمبي'
  }
};

function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [currentLang, setCurrentLang] = useState<string>('fr');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync theme and language from document
  useEffect(() => {
    const checkTheme = () => setIsDark(!document.documentElement.classList.contains('light'));
    const updateLanguage = () => setCurrentLang(getCurrentLanguage());

    checkTheme();
    updateLanguage();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          checkTheme();
        }
        if (mutation.attributeName === 'lang') {
          updateLanguage();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'lang']
    });

    // Listen for language change events
    window.addEventListener('languageChange', updateLanguage);

    return () => {
      observer.disconnect();
      window.removeEventListener('languageChange', updateLanguage);
    };
  }, []);

  // Close when clicking outside the widget
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (isOpen && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      let token: string | null = null;
      try {
        if (fAuth && fAuth.currentUser) {
          token = await fAuth.currentUser.getIdToken(true);
        }
      } catch {
        token = null;
      }
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: userMessage,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          language: currentLang // Send language preference to backend
        }),
      });

      const data = await res.json();

      // Handle response with language support
      if (!res.ok) {
        // Render the backend-provided error string instead of masking it.
        // The backend correctly identifies API Quota and Invalid Key errors!
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.error || errorMessages[currentLang as keyof typeof errorMessages] || errorMessages.fr
        }]);
      } else if (data.reply || data.response) {
        const aiResponse = data.reply || data.response;
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: aiResponse
        }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      // Use language-specific error message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: errorMessages[currentLang as keyof typeof errorMessages] || errorMessages.fr
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Get current language's welcome messages
  const currentWelcome = welcomeMessages[currentLang as keyof typeof welcomeMessages] || welcomeMessages.fr;

  // Theme-aware style tokens
  const panel = isDark
    ? { background: 'rgba(10,10,10,0.93)', border: '1px solid rgba(200,16,46,0.25)', boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 32px 64px rgba(0,0,0,0.6), 0 0 40px rgba(200,16,46,0.08)' }
    : { background: '#F5F5DC', border: '1px solid rgba(200,16,46,0.2)', boxShadow: '0 0 0 1px rgba(0,0,0,0.04), 0 24px 60px rgba(0,0,0,0.12), 0 0 30px rgba(200,16,46,0.06)' };

  const headerBg = isDark ? 'linear-gradient(135deg, rgba(200,16,46,0.2) 0%, transparent 100%)' : 'linear-gradient(135deg, rgba(200,16,46,0.08) 0%, transparent 100%)';
  const headerBorder = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)';
  const titleColor = isDark ? '#F5F5DC' : '#111111';
  const subColor = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const closeBtnCls = isDark ? 'text-white/40 hover:text-white hover:bg-white/10' : 'text-black/30 hover:text-black hover:bg-black/8';
  const onlineBorder = isDark ? 'border-[#0a0a0a]' : 'border-white';

  const msgAreaBg = isDark ? 'transparent' : '#F5F5DC';
  const emptyTitle = isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)';
  const emptyText = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)';

  // Dynamic example questions based on language
  const exampleQuestions = {
    fr: ["Prochains matchs ?", "Meilleur buteur ?", "Histoire du CA"],
    en: ["Next matches?", "Top scorer?", "CA History"],
    ar: ["المباريات القادمة؟", "أفضل هداف؟", "تاريخ النادي"]
  };

  const currentQuestions = exampleQuestions[currentLang as keyof typeof exampleQuestions] || exampleQuestions.fr;

  const chipCls = isDark
    ? 'border border-white/10 text-white/50 hover:border-[#C41E3A]/50 hover:text-white/80 hover:bg-[#C41E3A]/10'
    : 'border border-black/10 text-black/50 hover:border-[#C41E3A]/50 hover:text-[#8B0000] hover:bg-[#C41E3A]/5';

  const assistantBubbleBg = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)';
  const assistantBubbleBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const assistantText = isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.8)';
  const dotColor = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)';

  const inputBorder = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)';
  const inputBg = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)';
  const inputBorder2 = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)';
  const inputText = isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)';
  const placeholderCls = isDark ? 'placeholder:text-white/25' : 'placeholder:text-black/30';

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-[90] flex flex-col items-end gap-3" suppressHydrationWarning={true}>
      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="w-[min(340px,calc(100vw-2rem))] sm:w-[380px] rounded-3xl overflow-hidden shadow-2xl"
            style={{ ...panel, backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
          >
            {/* Header */}
            <div
              className="relative flex items-center gap-3 px-5 py-4"
              style={{ background: headerBg, borderBottom: `1px solid ${headerBorder}` }}
            >
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-[#C41E3A] rounded-full blur-3xl opacity-15 pointer-events-none" />
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-2xl bg-[#C41E3A] flex items-center justify-center shadow-lg shadow-[#C41E3A]/30">
                  <NextImage src="/clubs/beja.png" alt="OB" width={26} height={26} className="object-contain" />
                </div>
                <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 ${onlineBorder} animate-pulse`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm leading-none" style={{ color: titleColor }}>{currentWelcome.assistantName}</p>
                <p className="text-[10px] mt-1 font-medium tracking-wide" style={{ color: subColor }}>
                  {currentWelcome.online}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all ${closeBtnCls}`}
              >
                <X size={14} />
              </button>
            </div>

            {/* Messages */}
            <div
              className="h-72 overflow-y-auto overscroll-contain px-4 py-4 space-y-3 flex flex-col"
              style={{ background: msgAreaBg }}
              data-lenis-prevent="true"
            >
              {messages.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#C41E3A]/10 border border-[#C41E3A]/20 flex items-center justify-center">
                    <NextImage src="/clubs/beja.png" alt="OB" width={32} height={32} className="object-contain" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: emptyTitle }}>
                      {currentWelcome.title}
                    </p>
                    <p className="text-xs mt-1 leading-relaxed max-w-[200px] mx-auto" style={{ color: emptyText }}>
                      {currentWelcome.subtitle}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center mt-1">
                    {currentQuestions.map((q) => (
                      <button
                        key={q}
                        onClick={() => setInput(q)}
                        className={`text-[11px] px-3 py-1.5 rounded-full transition-all ${chipCls}`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                  dir={currentLang === 'ar' ? 'rtl' : 'ltr'}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex-shrink-0 w-7 h-7 rounded-xl bg-[#C41E3A]/15 border border-[#C41E3A]/25 flex items-center justify-center mt-0.5">
                      <NextImage src="/clubs/beja.png" alt="OB" width={16} height={16} className="object-contain" />
                    </div>
                  )}
                  <div
                    className="max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
                    style={
                      msg.role === 'user'
                        ? { background: '#C41E3A', color: '#000000', borderRadius: '18px 4px 18px 18px' }
                        : { background: assistantBubbleBg, color: assistantText, borderRadius: '4px 18px 18px 18px', border: `1px solid ${assistantBubbleBorder}` }
                    }
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}

              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2 flex-row"
                  dir={currentLang === 'ar' ? 'rtl' : 'ltr'}
                >
                  <div className="flex-shrink-0 w-7 h-7 rounded-xl bg-[#C41E3A]/15 border border-[#C41E3A]/25 flex items-center justify-center">
                    <NextImage src="/clubs/beja.png" alt="OB" width={16} height={16} className="object-contain" />
                  </div>
                  <div
                    className="px-4 py-3 rounded-2xl flex items-center gap-1.5"
                    style={{ background: assistantBubbleBg, border: `1px solid ${assistantBubbleBorder}`, borderRadius: '4px 18px 18px 18px' }}
                  >
                    {[0, 1, 2].map((dot) => (
                      <motion.span
                        key={dot}
                        className="w-1.5 h-1.5 rounded-full block"
                        style={{ background: dotColor }}
                        animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: dot * 0.15 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 pb-4 pt-2" style={{ borderTop: `1px solid ${inputBorder}` }}>
              <div
                className="flex items-center gap-2 rounded-2xl px-4 py-2.5"
                style={{ background: inputBg, border: `1px solid ${inputBorder2}` }}
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !loading && sendMessage()}
                  placeholder={currentWelcome.placeholder}
                  className={`flex-1 bg-transparent text-sm outline-none ${placeholderCls}`}
                  style={{ color: inputText }}
                  dir={currentLang === 'ar' ? 'rtl' : 'ltr'}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="flex-shrink-0 w-8 h-8 rounded-xl bg-[#C41E3A] flex items-center justify-center transition-all hover:bg-[#8B0000] disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-[#C41E3A]/30"
                >
                  <Send size={13} className="text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative w-14 h-14 rounded-2xl bg-transparent flex items-center justify-center"
        style={{ border: '1px solid #C41E3A' }}
        aria-label="Open AI Assistant"
      >
        {/* Pulsing ring */}


        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="x"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X size={22} className="text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="bot"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-7 h-7 relative"
              suppressHydrationWarning={true}
            >
              <NextImage src="/bot.png" alt="AI Bot" fill className="object-contain" sizes="28px" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI badge */}
        {!isOpen && messages.length === 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white text-[#8B0000] text-[9px] font-black flex items-center justify-center shadow-sm">
            AI
          </span>
        )}
      </motion.button>
    </div>
  );
}

const clubLogoMap: Record<string, string> = {
  "Espérance de Tunis": "/clubs/est.png",
  "Espérance Tunis": "/clubs/est.png",
  "EST": "/clubs/est.png",
  "Olympique Béja": "/clubs/beja.png",
  "Béja": "/clubs/beja.png",
  "OB": "/clubs/beja.png",
  "Stade Tunisien": "/clubs/st.png",
  "ST": "/clubs/st.png",
  "CS Sfaxien": "/clubs/css.png",
  "CSS": "/clubs/css.png",
  "US Monastir": "/clubs/usm.png",
  "USM": "/clubs/usm.png",
  "Etoile du Sahel": "/clubs/ess.png",
  "Etoile Sportive Du Sahel": "/clubs/ess.png",
  "ES Sahel": "/clubs/ess.png",
  "ESS": "/clubs/ess.png",
  "JS Omrane": "/clubs/jso.png",
  "JSO": "/clubs/jso.png",
  "CA Bizertin": "/clubs/cab.png",
  "CAB": "/clubs/cab.png",
  "Club Africain": "/clubs/ca.png",
  "CA": "/clubs/ca.png",
  "ES Zarzis": "/clubs/esz.png",
  "ESZ": "/clubs/esz.png",
  "PS Sakiet Eddaïer": "/clubs/psse.png",
  "PSSE": "/clubs/psse.png",
  "ES Hammam-Sousse": "/clubs/eshs.png",
  "ESHS": "/clubs/eshs.png",
  "Avenir Sportif De La Marsa": "/clubs/marsa.png",
  "AS Marsa": "/clubs/marsa.png",
  "ASM": "/clubs/marsa.png",
  "ES Métlaoui": "/clubs/esm.png",
  "ES Metlaoui": "/clubs/esm.png",
  "ESM": "/clubs/esm.png",
  "CS Hammam-Lif": "/clubs/cshl.png",
  "CSHL": "/clubs/cshl.png",
  "ES Beni-Khalled": "/clubs/esbk.png",
  "Ariana": "/clubs/asa.png",
  "BS Bouhajla": "/clubs/bsb.png",
  "US Ben Guerdane": "/clubs/usb.png",
  "USBG": "/clubs/usb.png",

};

function StandingsTable({ language, theme }: { language: "en" | "fr" | "ar", theme: string }) {
  const [data, setData] = useState<{ overall: any[]; home: any[]; away: any[] }>({ overall: [], home: [], away: [] });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"overall" | "home" | "away" | "topscorers">("overall");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDown, setIsDown] = useState(false);
  const [startY, setStartY] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDown(true);
    setStartY(e.pageY - (scrollRef.current?.offsetTop || 0));
    setScrollTop(scrollRef.current?.scrollTop || 0);
  };

  const handleMouseLeave = () => setIsDown(false);
  const handleMouseUp = () => setIsDown(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown) return;
    e.preventDefault();
    const y = e.pageY - (scrollRef.current?.offsetTop || 0);
    const walk = (y - startY) * 2;
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollTop - walk;
    }
  };

    // Real 2026/2027 Tunisian Ligue 1 Pro Standings - OVERALL
  const overallFallback = [
    { position: 1, team: { name: "Club Africain", shortName: "CA" }, matches: 2, wins: 2, draws: 0, losses: 0, goalsFor: 2, goalsAgainst: 0, goalDifference: 2, points: 6 },
    { position: 2, team: { name: "CA Bizertin", shortName: "CAB" }, matches: 2, wins: 2, draws: 0, losses: 0, goalsFor: 2, goalsAgainst: 0, goalDifference: 2, points: 6 },
    { position: 3, team: { name: "PS Sakiet Eddaïer", shortName: "PSSE" }, matches: 2, wins: 1, draws: 1, losses: 0, goalsFor: 2, goalsAgainst: 0, goalDifference: 2, points: 4 },
    { position: 4, team: { name: "CS Sfaxien", shortName: "CSS" }, matches: 2, wins: 1, draws: 1, losses: 0, goalsFor: 3, goalsAgainst: 2, goalDifference: 1, points: 4 },
    { position: 5, team: { name: "US Monastir", shortName: "USM" }, matches: 2, wins: 1, draws: 1, losses: 0, goalsFor: 2, goalsAgainst: 1, goalDifference: 1, points: 4 },
    { position: 6, team: { name: "Ben Guerdane", shortName: "USBG" }, matches: 1, wins: 1, draws: 0, losses: 0, goalsFor: 2, goalsAgainst: 1, goalDifference: 1, points: 3 },
    { position: 7, team: { name: "Étoile du Sahel", shortName: "ESS" }, matches: 2, wins: 1, draws: 0, losses: 1, goalsFor: 4, goalsAgainst: 4, goalDifference: 0, points: 3 },
    { position: 8, team: { name: "ES Zarzis", shortName: "ESZ" }, matches: 2, wins: 1, draws: 0, losses: 1, goalsFor: 2, goalsAgainst: 2, goalDifference: 0, points: 3 },
    { position: 9, team: { name: "JS Omrane", shortName: "JSO" }, matches: 2, wins: 1, draws: 0, losses: 1, goalsFor: 3, goalsAgainst: 3, goalDifference: 0, points: 3 },
    { position: 10, team: { name: "Espérance de Tunis", shortName: "EST" }, matches: 2, wins: 1, draws: 0, losses: 1, goalsFor: 4, goalsAgainst: 5, goalDifference: -1, points: 3 },
    { position: 11, team: { name: "AS Marsa", shortName: "ASM" }, matches: 2, wins: 0, draws: 1, losses: 1, goalsFor: 0, goalsAgainst: 1, goalDifference: -1, points: 1 },
    { position: 12, team: { name: "ES Hammam-Sousse", shortName: "ESHS" }, matches: 2, wins: 0, draws: 1, losses: 1, goalsFor: 0, goalsAgainst: 1, goalDifference: -1, points: 1 },
    { position: 13, team: { name: "Stade Tunisien", shortName: "ST" }, matches: 2, wins: 0, draws: 1, losses: 1, goalsFor: 2, goalsAgainst: 3, goalDifference: -1, points: 1 },
    { position: 14, team: { name: "CS Hammam-Lif", shortName: "ESHL" }, matches: 1, wins: 0, draws: 0, losses: 1, goalsFor: 0, goalsAgainst: 1, goalDifference: -1, points: 0 },
    { position: 15, team: { name: "Olympique Béja", shortName: "OB" }, matches: 2, wins: 0, draws: 0, losses: 2, goalsFor: 1, goalsAgainst: 3, goalDifference: -2, points: 0 },
    { position: 16, team: { name: "ES Métlaoui", shortName: "ESM" }, matches: 2, wins: 0, draws: 0, losses: 2, goalsFor: 1, goalsAgainst: 3, goalDifference: -2, points: 0 },
  ];

  // HOME standings
  const homeFallback = [
    { position: 1, team: { name: "JS Omrane", shortName: "JSO" }, matches: 1, wins: 1, draws: 0, losses: 0, goalsFor: 3, goalsAgainst: 1, goalDifference: 2, points: 3 },
    { position: 2, team: { name: "PS Sakiet Eddaïer", shortName: "PSSE" }, matches: 1, wins: 1, draws: 0, losses: 0, goalsFor: 2, goalsAgainst: 0, goalDifference: 2, points: 3 },
    { position: 3, team: { name: "Étoile du Sahel", shortName: "ESS" }, matches: 1, wins: 1, draws: 0, losses: 0, goalsFor: 2, goalsAgainst: 1, goalDifference: 1, points: 3 },
    { position: 4, team: { name: "Club Africain", shortName: "CA" }, matches: 1, wins: 1, draws: 0, losses: 0, goalsFor: 1, goalsAgainst: 0, goalDifference: 1, points: 3 },
    { position: 5, team: { name: "CA Bizertin", shortName: "CAB" }, matches: 1, wins: 1, draws: 0, losses: 0, goalsFor: 1, goalsAgainst: 0, goalDifference: 1, points: 3 },
    { position: 6, team: { name: "CS Sfaxien", shortName: "CSS" }, matches: 1, wins: 1, draws: 0, losses: 0, goalsFor: 2, goalsAgainst: 1, goalDifference: 1, points: 3 },
    { position: 7, team: { name: "Espérance de Tunis", shortName: "EST" }, matches: 1, wins: 1, draws: 0, losses: 0, goalsFor: 3, goalsAgainst: 2, goalDifference: 1, points: 3 },
    { position: 8, team: { name: "US Monastir", shortName: "USM" }, matches: 1, wins: 1, draws: 0, losses: 0, goalsFor: 2, goalsAgainst: 1, goalDifference: 1, points: 3 },
    { position: 9, team: { name: "ES Zarzis", shortName: "ESZ" }, matches: 1, wins: 1, draws: 0, losses: 0, goalsFor: 1, goalsAgainst: 0, goalDifference: 1, points: 3 },
    { position: 10, team: { name: "AS Marsa", shortName: "ASM" }, matches: 1, wins: 0, draws: 1, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 1 },
    { position: 11, team: { name: "ES Hammam-Sousse", shortName: "ESHS" }, matches: 1, wins: 0, draws: 1, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 1 },
    { position: 12, team: { name: "Stade Tunisien", shortName: "ST" }, matches: 1, wins: 0, draws: 1, losses: 0, goalsFor: 1, goalsAgainst: 1, goalDifference: 0, points: 1 },
    { position: 13, team: { name: "Ben Guerdane", shortName: "USBG" }, matches: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 },
    { position: 14, team: { name: "CS Hammam-Lif", shortName: "ESHL" }, matches: 1, wins: 0, draws: 0, losses: 1, goalsFor: 0, goalsAgainst: 1, goalDifference: -1, points: 0 },
    { position: 15, team: { name: "Olympique Béja", shortName: "OB" }, matches: 1, wins: 0, draws: 0, losses: 1, goalsFor: 1, goalsAgainst: 2, goalDifference: -1, points: 0 },
    { position: 16, team: { name: "ES Métlaoui", shortName: "ESM" }, matches: 1, wins: 0, draws: 0, losses: 1, goalsFor: 0, goalsAgainst: 1, goalDifference: -1, points: 0 },
  ];

  // AWAY standings
  const awayFallback = [
    { position: 1, team: { name: "Club Africain", shortName: "CA" }, matches: 1, wins: 1, draws: 0, losses: 0, goalsFor: 1, goalsAgainst: 0, goalDifference: 1, points: 3 },
    { position: 2, team: { name: "CA Bizertin", shortName: "CAB" }, matches: 1, wins: 1, draws: 0, losses: 0, goalsFor: 1, goalsAgainst: 0, goalDifference: 1, points: 3 },
    { position: 3, team: { name: "Ben Guerdane", shortName: "USBG" }, matches: 1, wins: 1, draws: 0, losses: 0, goalsFor: 2, goalsAgainst: 1, goalDifference: 1, points: 3 },
    { position: 4, team: { name: "CS Sfaxien", shortName: "CSS" }, matches: 1, wins: 0, draws: 1, losses: 0, goalsFor: 1, goalsAgainst: 1, goalDifference: 0, points: 1 },
    { position: 5, team: { name: "US Monastir", shortName: "USM" }, matches: 1, wins: 0, draws: 1, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 1 },
    { position: 6, team: { name: "PS Sakiet Eddaïer", shortName: "PSSE" }, matches: 1, wins: 0, draws: 1, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 1 },
    { position: 7, team: { name: "CS Hammam-Lif", shortName: "ESHL" }, matches: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 },
    { position: 8, team: { name: "Étoile du Sahel", shortName: "ESS" }, matches: 1, wins: 0, draws: 0, losses: 1, goalsFor: 2, goalsAgainst: 3, goalDifference: -1, points: 0 },
    { position: 9, team: { name: "AS Marsa", shortName: "ASM" }, matches: 1, wins: 0, draws: 0, losses: 1, goalsFor: 0, goalsAgainst: 1, goalDifference: -1, points: 0 },
    { position: 10, team: { name: "ES Hammam-Sousse", shortName: "ESHS" }, matches: 1, wins: 0, draws: 0, losses: 1, goalsFor: 0, goalsAgainst: 1, goalDifference: -1, points: 0 },
    { position: 11, team: { name: "Olympique Béja", shortName: "OB" }, matches: 1, wins: 0, draws: 0, losses: 1, goalsFor: 0, goalsAgainst: 1, goalDifference: -1, points: 0 },
    { position: 12, team: { name: "Stade Tunisien", shortName: "ST" }, matches: 1, wins: 0, draws: 0, losses: 1, goalsFor: 1, goalsAgainst: 2, goalDifference: -1, points: 0 },
    { position: 13, team: { name: "ES Zarzis", shortName: "ESZ" }, matches: 1, wins: 0, draws: 0, losses: 1, goalsFor: 1, goalsAgainst: 2, goalDifference: -1, points: 0 },
    { position: 14, team: { name: "ES Métlaoui", shortName: "ESM" }, matches: 1, wins: 0, draws: 0, losses: 1, goalsFor: 1, goalsAgainst: 2, goalDifference: -1, points: 0 },
    { position: 15, team: { name: "Espérance de Tunis", shortName: "EST" }, matches: 1, wins: 0, draws: 0, losses: 1, goalsFor: 1, goalsAgainst: 3, goalDifference: -2, points: 0 },
    { position: 16, team: { name: "JS Omrane", shortName: "JSO" }, matches: 1, wins: 0, draws: 0, losses: 1, goalsFor: 0, goalsAgainst: 2, goalDifference: -2, points: 0 },
  ];
  // Top Scorers data (27 players) - will be shown in Top Scorers tab
  const topScorersFallback = [
    { position: 1, player: "Abid O.", team: "Étoile du Sahel", teamShort: "ESS", goals: 14 },
    { position: 2, player: "Haj Ali M.", team: "Espérance de Tunis", teamShort: "EST", goals: 12 },
    { position: 3, player: "Trabelsi M.", team: "CS Sfaxien", teamShort: "CSS", goals: 11 },
    { position: 4, player: "Aloui Z.", team: "PS Sakiet Eddaïer", teamShort: "PSSE", goals: 10 },
    { position: 5, player: "Amamou H.", team: "CA Bizertin", teamShort: "CAB", goals: 9 },
    { position: 6, player: "Ayadi G.", team: "US Ben Guerdane", teamShort: "USBG", goals: 9 },
    { position: 7, player: "Barhoumi S.", team: "US Monastir", teamShort: "USM", goals: 8 },
    { position: 8, player: "Belhadj M.", team: "Espérance de Tunis", teamShort: "EST", goals: 8 },
    { position: 9, player: "Belhaj O.", team: "JS Omrane", teamShort: "JSO", goals: 7 },
    { position: 10, player: "Belwafi I.", team: "CS Sfaxien", teamShort: "CSS", goals: 7 },
    { position: 11, player: "Ben Dhiaf A.", team: "Étoile du Sahel", teamShort: "ESS", goals: 7 },
    { position: 12, player: "Bouchniba R.", team: "US Monastir", teamShort: "USM", goals: 6 },
    { position: 13, player: "Fajari A.", team: "Étoile du Sahel", teamShort: "ESS", goals: 6 },
    { position: 14, player: "Ferchichi A.", team: "CA Bizertin", teamShort: "CAB", goals: 6 },
    { position: 15, player: "Hasni B.", team: "Olympique Béja", teamShort: "OB", goals: 5 },
    { position: 16, player: "Jertila M.", team: "ES Zarzis", teamShort: "ESZ", goals: 5 },
    { position: 17, player: "Kadida S.", team: "Club Africain", teamShort: "CA", goals: 5 },
    { position: 18, player: "Labidi H.", team: "ES Zarzis", teamShort: "ESZ", goals: 5 },
    { position: 19, player: "Mastouri H.", team: "Espérance de Tunis", teamShort: "EST", goals: 5 },
    { position: 20, player: "Mhirsi I.", team: "US Ben Guerdane", teamShort: "USBG", goals: 5 },
    { position: 21, player: "Naffati O.", team: "ES Métlaoui", teamShort: "ESM", goals: 4 },
    { position: 22, player: "Omri M.", team: "PS Sakiet Eddaïer", teamShort: "PSSE", goals: 4 },
    { position: 23, player: "Ouerghemmi W.", team: "Stade Tunisien", teamShort: "ST", goals: 4 },
    { position: 24, player: "Riahi R.", team: "Stade Tunisien", teamShort: "ST", goals: 4 },
    { position: 25, player: "Souissi M.", team: "JS Omrane", teamShort: "JSO", goals: 4 },
    { position: 26, player: "Zaddem M.", team: "Club Africain", teamShort: "CA", goals: 4 },
    { position: 27, player: "Zoughlami C.", team: "JS Omrane", teamShort: "JSO", goals: 3 },
  ];



  useEffect(() => {
    const fetchStandings = () => {
      fetch('/api/standings')
        .then(res => res.json())
        .then(json => {
          const standings = json.standings || (Array.isArray(json) ? [{ rows: json }] : []);
          const pick = (key: string) => {
            const entry = standings.find((s: any) => String(s.type || '').toLowerCase() === key)
              || standings.find((s: any) => String(s.type || '').toLowerCase().includes(key));
            return entry?.rows || [];
          };
          const overall = pick('total') || pick('overall');
          setData({
            overall: Array.isArray(overall) && overall.length > 0 ? overall : overallFallback,
            home: homeFallback,
            away: awayFallback,
          });
        })
        .catch(() => setData({ overall: overallFallback, home: homeFallback, away: awayFallback }))
        .finally(() => setLoading(false));
    };

    fetchStandings();
    const interval = setInterval(fetchStandings, 120000); // Auto-refresh every 2 minutes
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- fallbacks are stable constants; mount-only is intentional

  const viewRows = view === "overall" ? data.overall : view === "home" ? data.home : view === "away" ? data.away : [];
  const displayData = viewRows.length > 0 ? viewRows : (view === 'away' ? awayFallback : overallFallback);

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-[var(--card)] rounded-3xl border border-[var(--border)] overflow-hidden animate-pulse">
        <div className="p-6 bg-[var(--foreground)]/5 border-b border-[var(--border)] h-20" />
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex gap-4 h-12 bg-[var(--foreground)]/5 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-4xl mx-auto bg-[var(--card)] backdrop-blur-xl rounded-3xl border transition-colors duration-300 overflow-hidden ${theme === 'light' ? 'border-[#8B0000]/25 shadow-[0_0_50px_rgba(139,0,0,0.06)]' : 'border-[var(--border)] shadow-[0_0_50px_rgba(0,0,0,0.2)]'}`}>
      <div className={`p-6 bg-gradient-to-r ${theme === 'light' ? 'from-[#8B0000]/10' : 'from-[#C41E3A]/20'} to-transparent border-b border-[var(--border)] flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <Trophy className={theme === 'light' ? 'text-[#8B0000]' : 'text-[#C41E3A]'} size={24} />
          <h3 className="text-[var(--foreground)] font-bold text-xl uppercase tracking-wider">
            {language === 'ar' ? 'ترتيب الرابطة المحترفة الأولى' : language === 'fr' ? 'Ligue 1 Professionnelle' : 'Ligue 1 Professional'}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] text-[var(--foreground)]/40 uppercase font-medium">{language === 'ar' ? 'مباشر' : language === 'fr' ? 'EN DIRECT' : 'LIVE'}</span>
        </div>
      </div>

      {/* Overall / Home / Away / Top Scorers toggle */}
      <div className="flex items-center justify-center gap-1.5 px-6 py-3 border-b border-[var(--border)] bg-[var(--foreground)]/[0.02] flex-wrap">
        {([
          { key: 'overall', label: language === 'ar' ? 'عام' : language === 'fr' ? 'Général' : 'Overall' },
          { key: 'home', label: language === 'ar' ? 'على أرضه' : language === 'fr' ? 'Domicile' : 'Home' },
          { key: 'away', label: language === 'ar' ? 'خارجه' : language === 'fr' ? 'Extérieur' : 'Away' },
          { key: 'topscorers', label: language === 'ar' ? 'الهدافين' : language === 'fr' ? 'Meilleurs Buteurs' : 'Top Scorers' },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setView(tab.key)}
            className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all border ${
              view === tab.key
                ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-md shadow-[var(--primary)]/30'
                : 'bg-[var(--foreground)]/5 text-[var(--foreground)]/60 border-[var(--foreground)]/10 hover:border-[var(--primary)]/50 hover:text-[var(--primary)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar cursor-grab active:cursor-grabbing select-none"
      >
        {view === "topscorers" ? (
          /* Top Scorers List */
          <div className="w-full min-w-[760px] p-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-[var(--background)] text-[var(--foreground)]/40 text-[10px] uppercase font-bold tracking-widest">
                    <th className="py-4 px-6 text-center">#</th>
                    <th className="py-4 px-6">{language === 'ar' ? 'اللاعب' : language === 'fr' ? 'Joueur' : 'Player'}</th>
                    <th className="py-4 px-6 text-center">{language === 'ar' ? 'الفريق' : language === 'fr' ? 'Équipe' : 'Team'}</th>
                    <th className="py-4 px-4 text-center">{language === 'ar' ? 'أهداف' : language === 'fr' ? 'Buts' : 'Goals'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {topScorersFallback.map((row: any, idx) => {
                    const isOB = row.teamShort === "OB";
                    return (
                      <motion.tr
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: (idx % 10) * 0.05 }}
                        className={`${isOB ? 'bg-[#C41E3A]/20 ring-1 ring-[#C41E3A]/30' : 'hover:bg-[var(--foreground)]/5'} transition-colors group`}
                      >
                        <td className="py-4 px-6 text-center font-bold text-[var(--foreground)]/70 group-hover:text-[var(--foreground)]">
                          <span>{row.position}</span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <span className={`font-bold tracking-tight ${isOB ? 'text-[#C41E3A]' : 'text-[var(--foreground)]/90'}`}>{row.player}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`font-bold tracking-tight ${isOB ? 'text-[#C41E3A]' : 'text-[var(--foreground)]/90'}`}>{row.team}</span>
                        </td>
                        <td className="py-4 px-4 text-center font-black text-[var(--primary)]">{row.goals} {language === 'ar' ? 'هدف' : language === 'fr' ? 'but' : 'goal'}</td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Standings Table */
          <table className="w-full min-w-[760px] text-left">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[var(--background)] text-[var(--foreground)]/40 text-[10px] uppercase font-bold tracking-widest">
                <th className="py-4 px-6 text-center">#</th>
                <th className="py-4 px-6">{language === 'ar' ? 'الفريق' : language === 'fr' ? 'Équipe' : 'Team'}</th>
                <th className="py-4 px-3 text-center">P</th>
                <th className="py-4 px-3 text-center">W</th>
                <th className="py-4 px-3 text-center">D</th>
                <th className="py-4 px-3 text-center">L</th>
                <th className="py-4 px-3 text-center" title={language === 'ar' ? 'سجل (Goals For)' : language === 'fr' ? 'Buts marqués (Goals For)' : 'GF (Goals For)'}>GF</th>
                <th className="py-4 px-3 text-center" title={language === 'ar' ? 'Goals Against (المستقبلة)' : language === 'fr' ? 'Buts encaissés (Goals Against)' : 'GA (Goals Against)'}>GA</th>
                <th className="py-4 px-3 text-center" title={language === 'ar' ? 'Net (الفرق)' : language === 'fr' ? 'Différence de buts (GD)' : 'GD (Goal Difference)'}>GD</th>
                <th className="py-4 px-4 text-right">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {displayData.map((row: any, idx) => {
                const teamName = row.team?.name || row.team?.shortName || "Unknown";
                const teamShortName = row.team?.shortName || "";
                const isCA = teamName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes('beja');
                const logo = clubLogoMap[teamName] || clubLogoMap[teamShortName] || null;

                // Qualification logic
                const pos = row.position;
                const getQualification = (position: number) => {
                  if (position <= 2) return { label: '', color: 'bg-green-500', text: 'green-500' };
                  if (position === 3) return { label: '', color: 'bg-yellow-500', text: 'yellow-500' };
                  if (position >= 15) return { label: '', color: 'bg-red-600', text: 'red-500' };
                  return null;
                };
                const qual = getQualification(pos);

                return (
                  <motion.tr
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: (idx % 10) * 0.05 }}
                    className={`${isCA ? 'bg-[#C41E3A]/10' : 'hover:bg-[var(--foreground)]/5'} transition-colors group`}
                  >
                    <td className="py-4 px-6 text-center font-bold text-[var(--foreground)]/70 group-hover:text-[var(--foreground)]">
                      <div className="flex items-center justify-center gap-1">
                        <span>{row.position}</span>
                        {qual && (
                          <span className={`text-[8px] px-1 py-1 rounded ${qual.color} text-white font-bold`} title={pos <= 2 ? 'CAF Champions League' : pos === 3 ? 'CAF Confederation Cup' : 'Relegation to Division 2'}>
                            {qual.label}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center p-1.5 overflow-hidden">
                          {logo ? (
                            <NextImage
                              src={logo}
                              alt={teamName}
                              width={24}
                              height={24}
                              className="object-contain"
                            />
                          ) : (
                            <span className="text-[8px] font-bold text-white/50">{teamName.substring(0, 2).toUpperCase()}</span>
                          )}
                        </div>
                        <span className={`font-bold tracking-tight ${isCA ? 'text-[#C41E3A]' : 'text-[var(--foreground)]/90'}`}>{teamName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-3 text-center text-[var(--foreground)]/60">{row.matches}</td>
                    <td className="py-4 px-3 text-center text-[var(--foreground)]/60">{row.wins}</td>
                    <td className="py-4 px-3 text-center text-[var(--foreground)]/60">{row.draws}</td>
                    <td className="py-4 px-3 text-center text-[var(--foreground)]/60">{row.losses}</td>
                    <td className="py-4 px-3 text-center text-[var(--foreground)]/60">{row.goalsFor ?? 0}</td>
                    <td className="py-4 px-3 text-center text-[var(--foreground)]/60">{row.goalsAgainst ?? 0}</td>
                    <td className={`py-4 px-3 text-center font-black ${(row.goalDifference ?? 0) > 0 ? 'text-green-500' : (row.goalDifference ?? 0) < 0 ? 'text-red-500' : 'text-[var(--foreground)]/60'}`}>
                      {row.goalDifference ?? 0}
                    </td>
                    <td className="py-4 px-4 text-right font-black text-[var(--foreground)]">{row.points}</td>
                  </motion.tr>
                );
              })}
</tbody>
          </table>
        )}
      </div>

      <div className="p-4 bg-white/[0.02] text-center">
        <p className="text-[10px] text-[var(--foreground)]/20 uppercase font-medium tracking-widest italic">
          {language === 'ar' ? 'تحديث تلقائي بعد كل مباراة' : language === 'fr' ? 'Mis à jour après chaque match' : 'Updated automatically after each match'}
        </p>
      </div>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(150, 150, 150, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(150, 150, 150, 0.5);
        }
      `}</style>
    </div>
  );
}
// Add this after imports (line ~1030)
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600">Something went wrong</h2>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Top Scorers full list with Home/Away filter
const TOP_SCORERS: TopStatRow[] = [
  { name: "Abid O.", team: "Étoile Sahel", short: "ESS", stat: 2, isCA: false, image: null },
  { name: "Haj Ali M.", team: "Espérance Tunis", short: "EST", stat: 2, isCA: false, image: null },
  { name: "Trabelsi M.", team: "CS Sfaxien", short: "CSS", stat: 2, isCA: false, image: null },
  { name: "Aloui Z.", team: "PS Sakiet Eddaier", short: "PSSE", stat: 1, isCA: false, image: null },
  { name: "Amamou H.", team: "CA Bizertin", short: "CAB", stat: 1, isCA: false, image: null },
  { name: "Ayadi G.", team: "Ben Guerdane", short: "USBG", stat: 1, isCA: false, image: null },
  { name: "Barhoumi S.", team: "Monastir", short: "USM", stat: 1, isCA: false, image: null },
  { name: "Belhadj M.", team: "Espérance Tunis", short: "EST", stat: 1, isCA: false, image: null },
  { name: "Belhaj O.", team: "JS Omrane", short: "JSO", stat: 1, isCA: false, image: null },
  { name: "Belwafi I.", team: "CS Sfaxien", short: "CSS", stat: 1, isCA: false, image: null },
  { name: "Ben Dhiaf A.", team: "Étoile Sahel", short: "ESS", stat: 1, isCA: false, image: null },
  { name: "Bouchniba R.", team: "Monastir", short: "USM", stat: 1, isCA: false, image: null },
  { name: "Fajari A.", team: "Étoile Sahel", short: "ESS", stat: 1, isCA: false, image: null },
  { name: "Ferchichi A.", team: "CA Bizertin", short: "CAB", stat: 1, isCA: false, image: null },
  { name: "Hasni B.", team: "Olympique Béja", short: "OB", stat: 1, isCA: true, image: null },
  { name: "Jertila M.", team: "Zarzis", short: "ESZ", stat: 1, isCA: false, image: null },
  { name: "Kadida S.", team: "Club Africain", short: "CA", stat: 1, isCA: false, image: null },
  { name: "Labidi H.", team: "Zarzis", short: "ESZ", stat: 1, isCA: false, image: null },
  { name: "Mastouri H.", team: "Espérance Tunis", short: "EST", stat: 1, isCA: false, image: null },
  { name: "Mhirsi I.", team: "Ben Guerdane", short: "USBG", stat: 1, isCA: false, image: null },
  { name: "Naffati O.", team: "Metlaoui", short: "ESM", stat: 1, isCA: false, image: null },
  { name: "Omri M.", team: "PS Sakiet Eddaier", short: "PSSE", stat: 1, isCA: false, image: null },
  { name: "Ouerghemmi W.", team: "Stade Tunisien", short: "ST", stat: 1, isCA: false, image: null },
  { name: "Riahi R.", team: "Stade Tunisien", short: "ST", stat: 1, isCA: false, image: null },
  { name: "Souissi M.", team: "JS Omrane", short: "JSO", stat: 1, isCA: false, image: null },
  { name: "Zaddem M.", team: "Club Africain", short: "CA", stat: 1, isCA: false, image: null },
  { name: "Zoughlami C.", team: "JS Omrane", short: "JSO", stat: 1, isCA: false, image: null },
];

type TopStatRow = { name: string; team: string; short: string; stat: number; isCA: boolean; image: string | null };

function TopStatsCard({ title, icon, rows, accent, language }: { title: string; icon: React.ReactNode; rows: TopStatRow[]; accent: string; language: "en" | "fr" | "ar" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ ...scrollTransitionFast }}
      className="relative rounded-3xl bg-[var(--card)] border border-[var(--foreground)]/10 overflow-hidden shadow-xl"
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent" />
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--foreground)]/10">
        <div className="flex items-center gap-2.5">
          <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent}`}>{icon}</span>
          <h4 className="font-black uppercase tracking-wider text-[var(--foreground)] text-sm">{title}</h4>
        </div>
        <span className="text-[10px] text-[var(--foreground)]/40 uppercase font-bold tracking-widest">
          {language === 'ar' ? 'موسم 2026/27' : language === 'fr' ? 'Saison 2026/27' : 'Season 2026/27'}
        </span>
      </div>
      <div className="p-3 space-y-1.5">
        {rows.map((row, index) => (
          <div key={index} className={`flex items-center justify-between rounded-xl px-3 py-2 transition-colors ${
            row.isCA
              ? 'bg-[#C41E3A]/20 ring-2 ring-[#C41E3A]/40 shadow-[0_0_15px_rgba(196,30,58,0.3)]'
              : 'bg-[var(--foreground)]/[0.03] hover:bg-[var(--foreground)]/5'
          }`}>
            <div className="flex items-center gap-3 min-w-0">
              <span className={`w-6 h-6 shrink-0 rounded-md flex items-center justify-center text-[11px] font-black ${
                index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                index === 1 ? 'bg-gray-400/20 text-gray-300' :
                index === 2 ? 'bg-amber-700/25 text-amber-500' :
                'bg-[var(--foreground)]/10 text-[var(--foreground)]/50'
              }`}>
                {index + 1}
              </span>
              <div className="w-8 h-8 rounded-full bg-[var(--background)] border border-[var(--foreground)]/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                {row.image ? (
                  <NextImage src={row.image} alt={row.name} width={26} height={26} className="object-cover rounded-full" />
                ) : (
                  <span className="text-[10px] font-black text-[var(--primary)]">{row.name.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[var(--foreground)] font-bold text-sm truncate">{row.name}</p>
                <p className={`text-[10px] ${row.isCA ? 'text-[#C41E3A]' : 'text-[var(--foreground)]/40'} font-bold uppercase tracking-wider`}>{row.team}</p>
              </div>
            </div>
            <span className="text-lg font-black text-[var(--primary)] shrink-0">{row.stat} {row.stat === 1 ? (language === 'ar' ? 'هدف' : language === 'fr' ? 'but' : 'goal') : (language === 'ar' ? 'أهداف' : language === 'fr' ? 'buts' : 'goals')}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function TopStatsCards({ language }: { language: "en" | "fr" | "ar" }) {
  const [filter, setFilter] = useState<"all" | "home" | "away">("all");
  const t = translations[language];

  // Mock home/away split for demonstration - in real app this would come from API
  const homeScorers = TOP_SCORERS.filter((_, i) => i % 2 === 0);
  const awayScorers = TOP_SCORERS.filter((_, i) => i % 2 === 1);
  const filteredScorers = filter === "home" ? homeScorers : filter === "away" ? awayScorers : TOP_SCORERS;

  return (
    <div className="max-w-4xl mx-auto mt-6 px-4 sm:px-6">
      {/* Filter tabs */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-black uppercase tracking-wider text-[var(--foreground)] text-lg">
          {language === 'ar' ? 'أفضل الهدافين' : language === 'fr' ? 'Meilleurs Buteurs' : 'Top Scorers'}
        </h3>
        <div className="flex gap-2 bg-[var(--foreground)]/5 rounded-xl p-1">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filter === "all"
                ? "bg-[var(--primary)] text-white shadow-[0_4px_12px_rgba(196,30,58,0.4)]"
                : "text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/10"
            }`}
          >
            {language === 'ar' ? 'الكل' : language === 'fr' ? 'Tous' : 'All'}
          </button>
          <button
            onClick={() => setFilter("home")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filter === "home"
                ? "bg-[var(--primary)] text-white shadow-[0_4px_12px_rgba(196,30,58,0.4)]"
                : "text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/10"
            }`}
          >
            {language === 'ar' ? 'داخل' : language === 'fr' ? 'Domicile' : 'Home'}
          </button>
          <button
            onClick={() => setFilter("away")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filter === "away"
                ? "bg-[var(--primary)] text-white shadow-[0_4px_12px_rgba(196,30,58,0.4)]"
                : "text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/10"
            }`}
          >
            {language === 'ar' ? 'خارج' : language === 'fr' ? 'Extérieur' : 'Away'}
          </button>
        </div>
      </div>

      <TopStatsCard
        title=""
        icon={<Trophy size={16} className="text-[#D4AF37]" />}
        accent="bg-amber-500/15"
        rows={filteredScorers}
        language={language}
      />
    </div>
  );
}

function HeroScrollDemo({ language, theme }: { language: "en" | "fr" | "ar", theme: string }) {
  const standingsRef = useRef<HTMLDivElement>(null);
  const standingsTitle = language === "ar" ? "ترتيب الرابطة المحترفة الأولى" : language === "fr" ? "Classement Ligue 1 Pro" : "Ligue 1 Pro Standings";
  const { ref, inView } = useInView({ threshold: 0.2, triggerOnce: true });

  return (
    <section id="standings" ref={ref} className="relative pt-12 pb-0 overflow-hidden mt-10">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={scrollTransition}
          className="text-center mb-6"
        >
          <motion.span
            initial={{ scale: 0 }}
            animate={inView ? { scale: 1 } : {}}
            transition={scrollSpring}
            className={`inline-block px-6 py-2 rounded-full border text-sm font-semibold mb-4 transition-colors duration-300 ${theme === 'light' ? 'bg-[#8B0000]/10 border-[#8B0000]/30 text-[#8B0000]' : 'bg-[var(--primary)]/10 border-[var(--primary)]/30 text-[var(--primary)]'}`}
          >
            {translations[language].history.standings}
          </motion.span>
          <br />
          <div ref={standingsRef} className="inline-block">
            <p
              className={`text-5xl lg:text-7xl font-display font-black uppercase tracking-tighter italic ${theme === 'light' ? 'text-[#8B0000]' : 'text-[#C41E3A]'}`}
              style={{ WebkitTextStroke: '1px black', textShadow: '0 0 1px #000' }}
            >
              <VariableProximityText
                label={standingsTitle}
                fromFontVariationSettings="'wght' 300, 'opsz' 9"
                toFontVariationSettings="'wght' 1000, 'opsz' 40"
                containerRef={standingsRef}
                radius={150}
                falloff="gaussian"
              />
            </p>
          </div>
          <p className="text-[var(--foreground)] opacity-60 max-w-2xl mx-auto text-lg mt-4 border-[var(--foreground)]/10 pb-4">
            {language === 'ar' ? 'متابعة حية لترتيب البطولة التونسية' : language === 'fr' ? 'Suivi en direct du classement du championnat tunisien' : 'Live tracking of the Tunisian league standings'}
          </p>
        </motion.div>

        <ContainerScroll titleComponent={<div className="h-4" />}>
          <StandingsTable language={language} theme={theme} />
        </ContainerScroll>
      </div>
    </section>
  );
}

// Translations dictionary
const translations = {
  en: {
    nav: ["Home", "History", "Trophies", "Team", "Academy", "News", "Standings", "Matches", "Shop", "Contact"],
    hero: {
      title: "Olympique Béja",
      tagline: "A Legacy of Glory, Passion, and Red-White Pride",
      stats: ["Founded", "Titles", "Fans"],
      watch: "Watch Highlights",
      explore: "Explore More"
    },
    history: {
      header: "SINCE 1929",
      title: "OUR HISTORY",
      subtitle: "Nearly a century of passion, glory, and unwavering dedication to excellence.",
      milestones: [
        { title: "Foundation", desc: "Official foundation of Olympique de Béja on July 17, 1929 in Béja, northern Tunisia." },
        { title: "Regional Beginnings", desc: "Grew into a strong club of the northwest of Tunisia, home of the Storks." },
        { title: "First Ligue 2 Title", desc: "Crowned champions of Ligue Professionnelle 2 in 1984/1985." },
        { title: "First Tunisian Cup", desc: "Won its first Tunisian Cup in 1992/1993 against AS Marsa." },
        { title: "Continental Runs", desc: "Reached the quarter-finals of the 1994 African Cup Winners' Cup." },
        { title: "Super Cup Glory", desc: "Lifted the Tunisian Super Cup in 1995." },
        { title: "Second Tunisian Cup", desc: "Won its second Tunisian Cup in 2009/2010 against Espérance de Tunis." },
        { title: "Return to the Top", desc: "Back in Ligue Professionnelle 2 triumph in 2019/2020." },
        { title: "Cup & Super Cup 2023", desc: "Won the 2022/2023 Tunisian Cup and the 2023 Tunisian Super Cup." },
        { title: "Continental Dreams", desc: "Continuing to grow and dream both at home and on the African continent." }
      ],
      standings: "Ligue 1 Standings",
    },
    trophies: {
      title: "Trophy Cabinet",
      subtitle: "A collection of silverware that tells our story.",
      items: ["Tunisian Cup", "Tunisian Super Cup"],
      total: "Total Trophies"
    },
    academy: {
      title: "The Academy",
      subtitle: "Monitor the next generation of superstars. Track U19 & U21 prospects as they rise through the ranks to the first team.",
      futureStar: "FUTURE STAR",
      potm: "PLAYER OF THE MONTH",
      voteText: "Vote for your favorite talent",
      voteBtn: "VOTE NOW",
      yo: "yo",
      striker: "Striker",
      midfielder: "Midfielder",
      defender: "Defender",
      enterPlayer: "Enter player name",
      topPlayers: "Top Voted Players",
      votes: "votes",
      thankYou: "Thank you for voting!",
      alreadyVoted: "You've already voted for"
    },
    team: {
      header: "THE SQUAD",
      title: "Team Roster",
      bench: "Bench",
      fanTab: "",
      realTab: "",
      formationLabel: "Formation",
      dragHint: "Drag to swap",
      resetBtn: "Reset",
      loading: "Loading live squad data...",
      error: "Live squad unavailable. Using fallback."
    },
    matches: {
      title: "Fixtures & Results",
      upcoming: "Upcoming",
      results: "Results",
      stats: "Ligue 1 Pro"
    },
    news: {
      header: "LATEST",
      title: "Club News",
      subtitle: "Latest Olympique Béja news, updated daily",
      more: "Read More",
      showLess: "Show Less",
      readMore: "Read More"
    },
    stadium: {
      header: "OUR HOME",
      title: "Boujemaa Kmiti Stadium",
      subtitle: "The fortress where the Storks take flight.",
      stats: ["Capacity", "Location", "Built", "Atmosphere"],
      values: ["15 000", "Béja", "1929", "Electric"],
      hint: "Explore"
    },
    tickets: {
      header: "TICKETS",
      title: "Match Tickets",
      buy: "Buy Now",
      pointsBuy: "Buy with Points",
      types: ["Pelouse", "Upper", "Lower"],
      states: ["Available", "Limited", "Selling Fast"],
      details: [
        ["Category", "GA"], ["Access", "Stand"], ["View", "Pitch"], ["Best For", "Ultras"],
        ["Category", "Upper"], ["Access", "Seat"], ["View", "High"], ["Best For", "Family"],
        ["Category", "Lower"], ["Access", "VIP"], ["View", "Close"], ["Best For", "Premium"]
      ]
    },
    shop: {
      header: "OFFICIAL SHOP",
      title: "Club Store",
      subtitle: "Get the 2025/26 collection.",
      buy: "ADD TO CART",
      pointsBuy: "Buy with Points",
      more: "SEE ALL",
      less: "SHOW LESS",
      products: [
        { name: "Home Jersey 25/26", category: "Jersey" },
        { name: "Stork Sweatshirt", category: "Casual" },
        { name: "Basketball Jersey", category: "Sports" },
        { name: "Home Jersey (Promo)", category: "Jersey" },
        { name: "Béja Bombers", category: "Casual" },
        { name: "Circle Polo", category: "Casual" },
        { name: "Bicolor Parka", category: "Casual" },
        { name: "Stork Tracksuit", category: "Casual" },
        { name: "Demi Zip Stork", category: "Casual" },
        { name: "Grey Hoodie", category: "Casual" },
        { name: "Club Vest", category: "Casual" },
        { name: "Kids Jersey", category: "Jersey" },
        { name: "Third Jersey", category: "Jersey" },
        { name: "Training Kit", category: "Training" },
        { name: "Auth Demi Zip", category: "Casual" },
      ]
    },
    boutique: {
      header: "OFFICIAL STORE",
      title: "OB Boutique",
      subtitle: "Get your official 2025/26 collection and wear the colors with pride.",
      buy: "ADD TO CART",
      more: "SEE ALL PRODUCTS",
      less: "SHOW LESS"
    },
    footer: {
      tagline: "Olympique de Béja (OB) has been a true institution in the north of Tunisia since its creation in 1929. Known as El Lampik (The Storks), the club plays in red and white and is a source of pride for the city of Béja.",
      links: "Quick Links",
      contact: "Contact",
      subscribe: "Stay Updated",
      subText: "Subscribe to our newsletter for the latest news.",
      button: "Subscribe",
      rights: "All rights reserved.",
      placeholder: "Your email"
    },
    search: {
      types: { news: "News", team: "Team", history: "History", trophy: "Trophy", shop: "Shop", tickets: "Tickets" },
      news: ["Olympique Béja latest news", "Training center project", "Mercato: new striker signing"],
      players: ["Raed Gazzeh - Goalkeeper", "Iyed Touis - Defender", "Salah Harrabi - Forward", "Yahia Achouri - Striker"],
      history: ["Olympique Béja history"],
      trophies: ["Tunisian Cup 2022/2023"],
      products: ["Official Home Jersey 2026/27", "OB Scarf"],
      matches: ["Next Match", "Match Tickets"]
    }
  },
  fr: {
    nav: ["Accueil", "Histoire", "Trophées", "Équipe", "Académie", "Actualités", "Classements", "Matchs", "Boutique", "Contact"],
    hero: {
      title: "Olympique Béja",
      tagline: "Un héritage de gloire, de passion et de fierté rouge et blanc",
      stats: ["Fondé en", "Titres", "Fans"],
      watch: "Voir les moments forts",
      explore: "Explorer plus"
    },
    history: {
      header: "DEPUIS 1929",
      title: "NOTRE HISTOIRE",
      subtitle: "Près d'un siècle de passion, de gloire et de dévouement inébranlable à l'excellence.",
      milestones: [
        { title: "Fondation", desc: "Fondation officielle de l'Olympique de Béja le 17 juillet 1929 à Béja, au nord de la Tunisie." },
        { title: "Débuts régionaux", desc: "Affirmation comme club fort du nord-ouest de la Tunisie, terre des Storks." },
        { title: "Premier titre de Ligue 2", desc: "Sacré champion de la Ligue Professionnelle 2 en 1984/1985." },
        { title: "Première Coupe de Tunisie", desc: "Victoire en Coupe de Tunisie en 1992/1993 face à l'AS Marsa." },
        { title: "Parcours continental", desc: "Quart de finale de la Coupe d'Afrique des Vainqueurs de Coupe en 1994." },
        { title: "Gloire en Super Coupe", desc: "Soulèvement de la Super Coupe de Tunisie en 1995." },
        { title: "Seconde Coupe de Tunisie", desc: "Victoire en Coupe de Tunisie en 2009/2010 face à l'Espérance de Tunis." },
        { title: "Retour au sommet", desc: "Retour en force avec le titre de Ligue Professionnelle 2 en 2019/2020." },
        { title: "Coupe et Super Coupe 2023", desc: "Victoire en Coupe de Tunisie 2022/2023 et en Super Coupe 2023." },
        { title: "Rêves continentaux", desc: "Continuer à grandir et à rêver tant au niveau national qu'africain." }
      ],
      standings: "Classement Ligue 1",
    },
    trophies: {
      title: "Galerie des Trophées",
      subtitle: "Une collection qui raconte notre histoire.",
      items: ["Coupe de Tunisie", "Super Coupe de Tunisie"],
      total: "Total des trophées"
    },
    academy: {
      title: "L'Académie",
      subtitle: "Surveillez la prochaine génération de superstars. Suivez les espoirs U19 et U21 alors qu'ils montent dans l'équipe première.",
      futureStar: "FUTURE STAR",
      potm: "JOUEUR DU MOIS",
      voteText: "Votez pour votre talent préféré",
      voteBtn: "VOTER MAINTENANT",
      yo: "ans",
      striker: "Attaquant",
      midfielder: "Milieu",
      defender: "Défenseur",
      enterPlayer: "Entrez le nom du joueur",
      topPlayers: "Joueurs les plus votés",
      votes: "votes",
      thankYou: "Merci pour votre vote!",
      alreadyVoted: "Vous avez déjà voted pour"
    },
    team: {
      header: "L'EFFECTIF",
      title: "Effectif de l'équipe",
      bench: "Banc",
      fanTab: "XI du Fan",
      realTab: "XI Officiel",
      formationLabel: "Formation",
      dragHint: "Glissez pour échanger",
      resetBtn: "Reset",
      loading: "Chargement de l'effectif...",
      error: "Effectif live indisponible. Utilisation du secours."
    },
    matches: {
      title: "Calendrier & Résultats",
      upcoming: "À venir",
      results: "Résultats",
      stats: "Ligue 1 Pro"
    },
    news: {
      header: "ACTU",
      title: "Actualités du Club",
      subtitle: "Dernières actualités de l'Olympique Béja, mises à jour quotidiennement",
      more: "Lire plus",
      showLess: "Voir moins",
      readMore: "Lire plus"
    },
    stadium: {
      header: "NOTRE MAISON",
      title: "Stade Boujemaa Kmiti",
      subtitle: "La forteresse où les Storks prennent leur envol.",
      stats: ["Capacité", "Lieu", "Construit", "Atmosphère"],
      values: ["15 000", "Béja", "1929", "Électrique"],
      hint: "Explorer"
    },
    tickets: {
      header: "BILLETS",
      title: "Billets de Match",
      buy: "Acheter",
      pointsBuy: "Acheter avec Points",
      types: ["Pelouse", "Supérieure", "Inférieure"],
      states: ["Disponible", "Limité", "Vente Rapide"],
      details: [
        ["Catégorie", "GA"], ["Accès", "Debout"], ["Vue", "Terrain"], ["Idéal Pour", "Ultras"],
        ["Catégorie", "Supérieure"], ["Accès", "Assis"], ["Vue", "Haute"], ["Idéal Pour", "Famille"],
        ["Catégorie", "Inférieure"], ["Accès", "VIP"], ["Vue", "Proche"], ["Idéal Pour", "Premium"]
      ]
    },
    shop: {
      header: "BOUTIQUE",
      title: "Shop Officiel",
      subtitle: "Collection 2025/26.",
      buy: "AJOUTER",
      pointsBuy: "Acheter avec Points",
      more: "VOIR TOUT",
      less: "MOINS",
      products: [
        { name: "Maillot Home 25/26", category: "Maillot" },
        { name: "Sweat Stork 25/26", category: "Casual" },
        { name: "Maillot Basket 24/25", category: "Basket" },
        { name: "Maillot Home (Promo)", category: "Maillot" },
        { name: "Bombers Béja 25/26", category: "Casual" },
        { name: "Polo Sangle Cercle", category: "Casual" },
        { name: "Parka Bicolore 25/26", category: "Casual" },
        { name: "Survêtement Stork 25/26", category: "Casual" },
        { name: "Demi Zip Stork 25/26", category: "Casual" },
        { name: "Capuche Gris 25/26", category: "Casual" },
        { name: "Gilet OB 25/26", category: "Casual" },
        { name: "Maillot Kids 25/26", category: "Maillot" },
        { name: "Maillot Third 25/26", category: "Maillot" },
        { name: "Maillot Training 25/26", category: "Training" },
        { name: "Demi Zip Authentique 25/26", category: "Casual" },
      ]
    },
    boutique: {
      header: "BOUTIQUE OFFICIELLE",
      title: "Boutique OB",
      subtitle: "Découvrez la collection officielle 2025/26 et portez fièrement les couleurs.",
      buy: "AJOUTER AU PANIER",
      more: "VOIR TOUS LES PRODUITS",
      less: "VOIR MOINS"
    },
    footer: {
      tagline: "L'Olympique de Béja (OB) est une véritable institution du nord de la Tunisie depuis sa création en 1929. Surnommé El Lampik (Les Storks), le club joue en rouge et blanc et fait la fierté de la ville de Béja.",
      links: "Liens rapides",
      contact: "Contact",
      subscribe: "Restez à jour",
      subText: "Abonnez-vous à notre newsletter pour les dernières nouvelles.",
      button: "S'abonner",
      rights: "Tous droits réservés.",
      placeholder: "Votre email"
    },
    search: {
      types: { news: "Actualités", team: "Équipe", history: "Histoire", trophy: "Trophée", shop: "Boutique", tickets: "Billets" },
      news: ["Dernières nouvelles de l'Olympique Béja", "Projet centre d'entraînement", "Mercato: signature d'un nouvel attaquant"],
      players: ["Raed Gazzeh - Gardien", "Iyed Touis - Défenseur", "Salah Harrabi - Attaquant", "Yahia Achouri - Avant-centre"],
      history: ["Histoire de l'Olympique Béja"],
      trophies: ["Coupe de Tunisie 2022/2023"],
      products: ["Maillot Domicile Officiel 2026/27", "Écharpe OB"],
      matches: ["Prochain Match", "Billets de Match"]
    }
  },
  ar: {
    nav: ["الرئيسية", "التاريخ", "الألقاب", "الفريق", "الأكاديمية", "الأخبار", "الترتيب", "المباريات", "المغازة", "اتصل بنا"],
    hero: {
      title: "الأولمبي الباجي",
      tagline: "إرث من المجد والعاطفة والفخر باللونين الأحمر والأبيض",
      stats: ["تأسست", "ألقاب", "مشجعين"],
      watch: "شاهد الأهداف",
      explore: "اكتشف المزيد"
    },
    history: {
      header: "منذ 1929",
      title: "تاريخنا",
      subtitle: "ما يقرب من قرن من العاطفة والمجد والتفاني الذي لا يتزعزع من أجل التميز.",
      milestones: [
        { title: "التأسيس", desc: "التأسيس الرسمي للأولمبي الباجي يوم 17 يوليو 1929 في باجة شمال تونس." },
        { title: "البدايات الجهوية", desc: "ترسّخ النادي كقوة قوية في شمال غرب تونس، أرض اللقلق." },
        { title: "أول لقب للرابطة الثانية", desc: "التتويج بطلاً للرابطة المحترفة الثانية موسم 1984/1985." },
        { title: "أول كأس تونس", desc: "التتويج بكأس تونس موسم 1992/1993 أمام الاتحاد الرياضي بلمرصا." },
        { title: "مشوار قاري", desc: "الوصول إلى ربع نهائي كأس إفريقيا للأندية الفائزة بالكؤوس سنة 1994." },
        { title: "مجد الكأس الممتازة", desc: "التتويج بالكأس الممتازة التونسية سنة 1995." },
        { title: "كأس تونس الثانية", desc: "التتويج بكأس تونس موسم 2009/2010 أمام الترجي الرياضي التونسي." },
        { title: "العودة للقمة", desc: "العودة بقوة مع لقب الرابطة المحترفة الثانية موسم 2019/2020." },
        { title: "كأس وكأس ممتازة 2023", desc: "التتويج بكأس تونس 2022/2023 وبالكأس الممتازة سنة 2023." },
        { title: "أحلام قارية", desc: "الاستمرار في النمو والحلم محلياً وقارياً." }
      ],
      standings: "ترتيب الرابطة الأولى",
    },
    trophies: {
      title: "خزانة الألقاب",
      subtitle: "مجموعة من الألقاب التي تحكي قصة مجدنا.",
      items: ["كأس تونس", "الكأس الممتازة"],
      total: "إجمالي الألقاب"
    },
    academy: {
      title: "أكاديمية النادي",
      subtitle: "راقب الجيل القادم من النجوم. تتبع مواهب تحت 19 وتحت 21 عاماً وهم يصعدون إلى الفريق الأول.",
      futureStar: "نجم المستقبل",
      potm: "لاعب الشهر",
      voteText: "صوّت لموهبتك المفضلة",
      voteBtn: "صوّت الآن",
      yo: "سنة",
      striker: "مهاجم",
      midfielder: "وسط ميدان",
      defender: "مدافع",
      enterPlayer: "أدخل اسم اللاعب",
      topPlayers: "اللاعبون الأكثر تصويتاً",
      votes: "تصويت",
      thankYou: "شكراً لتصويتك!",
      alreadyVoted: "لقد صوّتتم بالفعل لـ"
    },
    team: {
      header: "التشكيلة",
      title: "قائمة الفريق",
      bench: "الاحتياط",
      fanTab: "تشكيلة المشجع",
      realTab: "التشكيلة الرسمية",
      formationLabel: "التشكيلة",
      dragHint: "اسحب للتبديل",
      resetBtn: "إعادة",
      loading: "جاري تحميل قائمة اللاعبين المباشرة...",
      error: "قائمة اللاعبين المباشرة غير متوفرة. يتم استخدام البيانات المخزنة."
    },
    matches: {
      title: "المباريات والنتائج",
      upcoming: "القادمة",
      results: "النتائج",
      stats: "الرابطة المحترفة الأولى"
    },
    news: {
      header: "الأخبار",
      title: "أخبار النادي",
      subtitle: "أحدث أخبار الأولمبي الباجي، متجددة يومياً",
      more: "المزيد",
      showLess: "عرض أقل",
      readMore: "اقرأ المزيد"
    },
    stadium: {
      header: "بيتنا",
      title: "ملعب بوجمعة كميتي",
      subtitle: "الحصن الذي يحلّق منه اللقلق.",
      stats: ["السعة", "الموقع", "بني في", "الأجواء"],
      values: ["15,000", "باجة", "1929", "كهربائية"],
      hint: "استكشف"
    },
    tickets: {
      header: "التذاكر",
      title: "تذاكر المباراة",
      buy: "احجز الآن",
      pointsBuy: "شراء بالنقاط",
      types: ["فيراج", "مدارج علوية", "مدارج سفلية"],
      states: ["متوفر", "محدود", "بيع سريع"],
      details: [
        ["الفئة", "دخول عام"], ["الدخول", "وقوف"], ["الرؤية", "ملعب"], ["الأفضل لـ", "الألتراس"],
        ["الفئة", "علوية"], ["الدخول", "جلوس"], ["الرؤية", "عالية"], ["الأفضل لـ", "العائلات"],
        ["الفئة", "سفلية"], ["الدخول", "VIP"], ["الرؤية", "قريبة"], ["الأفضل لـ", "متميز"]
      ]
    },
    shop: {
      header: "المغازة",
      title: "المغازة الرسمية",
      subtitle: "مجموعة 2025/26.",
      buy: "أضف",
      pointsBuy: "شراء بالنقاط",
      more: "الكل",
      less: "أقل",
      buyPoints: "شراء بالنقاط",
      products: [
        { name: "قميص الأساسي 25/26", category: "قميص" },
        { name: "سويت شيرت اللقلق 25/26", category: "ملابس" },
        { name: "قميص كرة السلة 24/25", category: "رياضة" },
        { name: "قميص الأساسي (عرض)", category: "قميص" },
        { name: "بومبرز باجة 25/26", category: "ملابس" },
        { name: "بولو سيرانغل 25/26", category: "ملابس" },
        { name: "باركا بلونين 25/26", category: "ملابس" },
        { name: "ترينينغ اللقلق 25/26", category: "ملابس" },
        { name: "ديمي زيب اللقلق 25/26", category: "ملابس" },
        { name: "هودي رمادي 25/26", category: "ملابس" },
        { name: "جيليه النادي 25/26", category: "ملابس" },
        { name: "قميص للأطفال 25/26", category: "قميص" },
        { name: "القميص الثالث 25/26", category: "قميص" },
        { name: "قميص التدريب 25/26", category: "تدريب" },
        { name: "ديمي زيب أصلي 25/26", category: "ملابس" },
      ]
    },
    boutique: {
      header: "المغازة الرسمية",
      title: "مغازة OB",
      subtitle: "احصل على المجموعة الرسمية 2025/26 وارتدِ الألوان بفخر.",
      buy: "أضف للسلة",
      more: "عرض جميع المنتجات",
      less: "عرض أقل"
    },
    footer: {
      tagline: "لقد كان الأولمبي الباجي (OB) مؤسسة حقيقية في شمال تونس منذ إنشائه عام 1929. يُلقب باللقلق الناشئ (El Lampik)، ويلعب بالأحمر والأبيض ويمثل فخر مدينة باجة.",
      links: "روابط سريعة",
      contact: "اتصل بنا",
      subscribe: "ابق على اطلاع",
      subText: "اشترك في نشرتنا الإخبارية للحصول على آخر الأخبار.",
      button: "اشترك",
      rights: "جميع الحقوق محفوظة.",
      placeholder: "بريدك الإلكتروني"
    },
    search: {
      types: { news: "الأخبار", team: "الفريق", history: "التاريخ", trophy: "الكؤوس", shop: "المتجر", tickets: "التذاكر" },
      news: ["أحدث أخبار الأولمبي الباجي", "مشروع مركز التدريب", "الميركاتو: التعاقد مع مهاجم جديد"],
      players: ["رائد القزاح - حارس مرمى", "إياد التوي - مدافع", "صلاح الهرابي - مهاجم", "يحيى عشوري - رأس حربة"],
      history: ["تاريخ الأولمبي الباجي"],
      trophies: ["كأس تونس 2022/2023"],
      products: ["القميص الرسمي 2026/27", "شاححة OB"],
      matches: ["المباراة القادمة", "تذاكر المباراة"]
    }
  }
};
// Floating particles component
const FLOATING_PARTICLES = Array.from({ length: 8 }, () => ({
  left: Math.random() * 100,
  top: Math.random() * 100,
  x: Math.random() * 50 - 25,
  duration: 4 + Math.random() * 4,
  delay: Math.random() * 2,
}));

function FloatingParticles() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {FLOATING_PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-[#C41E3A] rounded-full opacity-20"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
          }}
          whileInView={{
            y: [-20, -100, -20],
            x: [0, p.x, 0],
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.5, 1],
          }}
          viewport={{ once: false }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
          }}
        />
      ))}
    </div>
  );
}


// Animated counter component
function AnimatedCounter({ end, duration = 2, suffix = "" }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView({ triggerOnce: true });

  useEffect(() => {
    if (inView) {
      let start = 0;
      const increment = end / (duration * 60);
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 1000 / 60);
      return () => clearInterval(timer);
    }
  }, [inView, end, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

// Search Modal Component
function SearchModal({ isOpen, onClose, language }: { isOpen: boolean; onClose: () => void; language: "en" | "fr" | "ar" }) {
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) searchInputRef.current?.focus();
  }, [isOpen]);

  const t = translations[language];
    const results = useMemo(() => {
      if (!query.trim()) return [];
      const lowerQuery = query.toLowerCase();
      // Enhanced search pool with translated content
      const pool = [
        { type: t.search?.types?.news || "News", title: t.search?.news?.[0] || "Olympique Béja latest news", href: "#news" },
        { type: t.search?.types?.news || "News", title: t.search?.news?.[1] || "Training center project", href: "#news" },
        { type: t.search?.types?.news || "News", title: t.search?.news?.[2] || "Mercato: new striker signing", href: "#news" },
        { type: t.search?.types?.team || "Team", title: t.search?.players?.[0] || "Raed Gazzeh - Goalkeeper", href: "#team" },
        { type: t.search?.types?.team || "Team", title: t.search?.players?.[1] || "Iyed Touis - Defender", href: "#team" },
        { type: t.search?.types?.team || "Team", title: t.search?.players?.[2] || "Salah Harrabi - Forward", href: "#team" },
        { type: t.search?.types?.team || "Team", title: t.search?.players?.[3] || "Yahia Achouri - Striker", href: "#team" },
        { type: t.search?.types?.history || "History", title: t.search?.history?.[0] || "Olympique Béja history", href: "#history" },
        { type: t.search?.types?.trophy || "Trophy", title: t.search?.trophies?.[0] || "Tunisian Cup 2022/2023", href: "#trophies" },
        { type: t.search?.types?.shop || "Shop", title: t.search?.products?.[0] || "Official Home Jersey 2026/27", href: "#shop" },
        { type: t.search?.types?.shop || "Shop", title: t.search?.products?.[1] || "OB Scarf", href: "#shop" },
        { type: t.search?.types?.tickets || "Tickets", title: t.search?.matches?.[0] || "Next Match", href: "#matches" },
        { type: t.search?.types?.tickets || "Tickets", title: t.search?.matches?.[1] || "Match Tickets", href: "#matches" },
      ];
      return pool.filter(item => item.title.toLowerCase().includes(lowerQuery));
    }, [query, language]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4 sm:px-6"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.9, y: -20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: -20, opacity: 0 }}
            className="w-full max-w-2xl bg-[var(--card)] rounded-3xl shadow-2xl overflow-hidden border border-[var(--primary)]/30 relative z-10"
          >
            <div className="p-6">
              <div className="relative flex items-center">
                <Search className="absolute left-4 text-[var(--primary)]" size={20} />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={language === "ar" ? "ابحث عن أخبار، لاعبين، أو منتجات..." : language === "fr" ? "Rechercher des actualités, joueurs, produits..." : "Search news, players, products..."}
                  className="w-full bg-[var(--background)] border-2 border-[var(--primary)]/10 focus:border-[var(--primary)] rounded-2xl py-4 pl-12 pr-12 text-[var(--foreground)] text-lg transition-all outline-none"
                />
                <button onClick={onClose} className="absolute right-4 text-[var(--foreground)] opacity-40 hover:opacity-100">
                  <X size={20} />
                </button>
              </div>

              <div className="mt-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {results.length > 0 ? (
                  <div className="space-y-2">
                    {results.map((res, i) => (
                      <motion.a
                        key={i}
                        href={res.href}
                        onClick={onClose}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between p-4 rounded-xl bg-[var(--background)] hover:bg-[var(--primary)]/5 border border-transparent hover:border-[var(--primary)]/20 transition-all group"
                      >
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-0.5 rounded-full mb-1 inline-block">
                            {res.type}
                          </span>
                          <h4 className="text-[var(--foreground)] font-semibold group-hover:text-[var(--primary)] transition-colors">
                            {res.title}
                          </h4>
                        </div>
                        <ArrowRight size={16} className="text-[var(--primary)] opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                      </motion.a>
                    ))}
                  </div>
                ) : query ? (
                  <div className="text-center py-12">
                    <p className="text-[var(--foreground)] opacity-40">
                      {language === "ar" ? "لم يتم العثور على نتائج" : "No results found for your search."}
                    </p>
                  </div>
                ) : (
                  <div className="py-6">
                    <h5 className="text-[var(--foreground)] opacity-40 text-xs font-bold uppercase tracking-widest mb-4">
                      {language === "ar" ? "عمليات البحث الشائعة" : "Frequent Searches"}
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {["Tickets", "Jersey", "Derby", "History"].map(tag => (
                        <button
                          key={tag}
                          onClick={() => setQuery(tag)}
                          className="px-4 py-2 rounded-full bg-[var(--primary)]/5 hover:bg-[var(--primary)] text-[var(--foreground)] hover:text-white text-sm transition-all border border-[var(--primary)]/10"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Authentication Modal Component
function AuthModal({ isOpen, onClose, language, onLogin }: { isOpen: boolean; onClose: () => void; language: string; onLogin: (user: any) => void }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setError(
        language === "ar"
          ? "يرجى إدخال بريد إلكتروني صحيح"
          : "Veuillez saisir une adresse email valide"
      );
      return;
    }
    if (!password || password.length < 6) {
      setError(
        language === "ar"
          ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل"
          : "Le mot de passe doit contenir au moins 6 caractères"
      );
      return;
    }
    if (isSignUp && !name.trim()) {
      setError("Veuillez saisir votre nom complet");
      return;
    }

    setLoading(true);

    if (!fAuth) {
      setError("Auth service unavailable");
      setLoading(false);
      return;
    }

    try {
      let res;
      if (isSignUp) {
        res = await createUserWithEmailAndPassword(fAuth, email, password);
        if (fAuth.currentUser) {
          await updateProfile(fAuth.currentUser, { displayName: name || email.split("@")[0] });
        }
      } else {
        res = await signInWithEmailAndPassword(fAuth, email, password);
      }

      const u = res.user;
      const userData = {
        uid: u.uid,
        name: u.displayName || name || u.email?.split("@")[0] || "User",
        email: u.email,
        avatar: u.photoURL || "/anas.jpeg"
      };

      onLogin(userData);
      localStorage.setItem("ca_user", JSON.stringify(userData));
      onClose();
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleProviderLogin = async (provider: any) => {
    setError("");
    setLoading(true);

    if (!fAuth || !provider) {
      setError("Provider unavailable");
      setLoading(false);
      return;
    }

    try {
      const result = await signInWithPopup(fAuth, provider);
      const u = result.user;
      const userData = {
        uid: u.uid,
        name: u.displayName || "User",
        email: u.email,
        avatar: u.photoURL || "/anas.jpeg"
      };
      onLogin(userData);
      localStorage.setItem("ca_user", JSON.stringify(userData));
      onClose();
    } catch (err: any) {
      setError(err.message || "Provider login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
          
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="w-full max-w-md bg-[var(--card)] text-[var(--foreground)] rounded-3xl shadow-2xl p-8 flex flex-col items-center border border-[var(--border)] relative z-10 overflow-hidden"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full text-[var(--foreground)]/60 hover:text-[var(--primary)] hover:bg-[var(--foreground)]/5 transition-all"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            {/* Logo Badge */}
            <div className="relative w-16 h-16 mb-4 p-2 bg-[var(--foreground)]/5 rounded-2xl border border-[var(--foreground)]/10 flex items-center justify-center shadow-lg">
              <NextImage src="/clubs/beja.png" alt="Olympique Béja" fill className="object-contain p-2" sizes="64px" />
            </div>

            {/* Title */}
            <h3 className="font-oswald font-bold text-2xl uppercase tracking-tight text-[var(--foreground)] mb-1">
              {isSignUp
                ? (language === "ar" ? "إنشاء حساب جديد" : language === "fr" ? "Créer un compte" : "Create Account")
                : (language === "ar" ? "تسجيل الدخول" : language === "fr" ? "Connexion" : "Welcome Back")}
            </h3>
            <p className="text-xs text-[var(--foreground)]/60 mb-6 text-center">
              {isSignUp
                ? (language === "ar" ? "انضم إلى عائلة الباجي واستمتع بالميزات الحصرية" : "Rejoignez la famille des Storks et gagnez des points")
                : (language === "ar" ? "أدخل بياناتك للمتابعة" : "Accédez à votre espace supporter de l'Olympique Béja")}
            </p>

            {/* Tabs */}
            <div className="w-full flex p-1 bg-[var(--foreground)]/5 rounded-xl border border-[var(--foreground)]/10 mb-6">
              <button
                type="button"
                onClick={() => { setIsSignUp(false); setError(""); }}
                className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${
                  !isSignUp
                    ? 'bg-[var(--primary)] text-white shadow-md'
                    : 'text-[var(--foreground)]/60 hover:text-[var(--foreground)]'
                }`}
              >
                {language === "ar" ? "تسجيل الدخول" : language === "fr" ? "Connexion" : "Log In"}
              </button>
              <button
                type="button"
                onClick={() => { setIsSignUp(true); setError(""); }}
                className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${
                  isSignUp
                    ? 'bg-[var(--primary)] text-white shadow-md'
                    : 'text-[var(--foreground)]/60 hover:text-[var(--foreground)]'
                }`}
              >
                {language === "ar" ? "حساب جديد" : language === "fr" ? "Inscription" : "Sign Up"}
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAuth} className="w-full flex flex-col gap-3.5">
              {isSignUp && (
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--foreground)]/40">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    placeholder={language === "ar" ? "الاسم واللقب" : "Nom complet"}
                    type="text"
                    required={isSignUp}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 bg-[var(--background)] text-[var(--foreground)] text-sm transition-all"
                  />
                </div>
              )}

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--foreground)]/40">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  placeholder={language === "ar" ? "البريد الإلكتروني" : "Adresse email"}
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 bg-[var(--background)] text-[var(--foreground)] text-sm transition-all"
                />
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--foreground)]/40">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  placeholder={language === "ar" ? "كلمة المرور" : "Mot de passe"}
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 bg-[var(--background)] text-[var(--foreground)] text-sm transition-all"
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-500 font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 hover:opacity-95 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-[var(--primary)]/30 transition-all uppercase tracking-wide text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : isSignUp ? (
                  language === "ar" ? "إنشاء الحساب" : "Créer mon compte"
                ) : (
                  language === "ar" ? "دخول" : "Se connecter"
                )}
              </button>
            </form>

            {/* Social Divider */}
            <div className="flex items-center w-full my-5">
              <div className="flex-grow border-t border-[var(--border)]"></div>
              <span className="mx-3 text-[10px] text-[var(--foreground)]/40 uppercase tracking-widest whitespace-nowrap font-mono">
                {language === "ar" ? "أو عبر" : "Ou continuer avec"}
              </span>
              <div className="flex-grow border-t border-[var(--border)]"></div>
            </div>

            {/* Social Buttons */}
            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={() => handleProviderLogin(getGoogleProvider())}
                className="flex items-center justify-center py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--foreground)]/5 transition-all grow group"
                title="Google"
              >
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google"
                  className="w-5 h-5 group-hover:scale-110 transition-transform"
                />
              </button>
              <button
                type="button"
                onClick={() => handleProviderLogin(getFacebookProvider())}
                className="flex items-center justify-center py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--foreground)]/5 transition-all grow group"
                title="Facebook"
              >
                <img
                  src="https://www.svgrepo.com/show/448224/facebook.svg"
                  alt="Facebook"
                  className="w-5 h-5 group-hover:scale-110 transition-transform"
                />
              </button>
              <button
                type="button"
                disabled
                title="Apple - bientôt disponible"
                className="flex items-center justify-center py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] opacity-50 cursor-not-allowed transition-all grow group"
              >
                <img
                  src="https://www.svgrepo.com/show/511330/apple-173.svg"
                  alt="Apple - bientôt disponible"
                  className="w-5 h-5 dark:invert"
                />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function AnimatedThemeTogglerDemo() {
  return <AnimatedThemeToggler />;
}

// Navigation component
function Navigation({
  theme,
  setTheme,
  language,
  setLanguage,
  setIsSearchOpen,
  setIsAuthOpen,
  user,
  points,
  onLogout
}: {
  theme: string;
  setTheme: (t: string) => void;
  language: "en" | "fr" | "ar";
  setLanguage: (l: "en" | "fr" | "ar") => void;
  setIsSearchOpen: (v: boolean) => void;
  setIsAuthOpen: (v: boolean) => void;
  user: any;
  points: number;
  onLogout: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);

  // Memoized values
  const isRTL = useMemo(() => language === "ar", [language]);
  const navItems = useMemo(() => translations[language].nav, [language]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle click outside for user menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setShowLangMenu(false);
      }
    };

document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Navigation handlers
  const handleNavClick = useCallback((href: string) => {
    setIsOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const handleLanguageChange = useCallback((lang: "en" | "fr" | "ar") => {
    setLanguage(lang);
    setShowLangMenu(false);
  }, [setLanguage]);

  const handleLogout = useCallback(() => {
    onLogout();
    setShowUserMenu(false);
  }, [onLogout]);

  const languages = [
    { code: "en", name: "English", flag: "eng", displayName: "English" },
    { code: "fr", name: "Français", flag: "fr", displayName: "Français" },
    { code: "ar", name: "العربية", flag: "tn", displayName: "العربية" },
  ] as const;

  // Navigation items configuration
  const navItemsConfig = [
    { key: "home", href: "#home" },
    { key: "history", href: "#history" },
    { key: "trophies", href: "#trophies" },
    { key: "team", href: "#team" },
    { key: "academy", href: "#academy" },
    { key: "news", href: "#news" },
    { key: "standings", href: "#standings" },
    { key: "matches", href: "#matches" },
    { key: "shop", href: "#shop" },
    { key: "contact", href: "#contact" },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
        ? "bg-[var(--background)]/95 backdrop-blur-lg shadow-lg shadow-[var(--primary)]/10 border-b border-[var(--primary)]/10"
        : "bg-transparent"
        }`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => handleNavClick("#home")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="relative w-14 h-14">
              <NextImage
                src="/clubs/beja.png"
                alt="Olympique Béja Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-7 min-w-[680px] justify-center py-2">
            {/* First half: Home to Academy */}
            {navItemsConfig.slice(0, 5).map((item, index) => {
              const navItem = navItems[index];
              if (!navItem) return null;
              return (
                <motion.a
                  key={item.key}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(item.href);
                  }}
                  className="inline-block text-[var(--foreground)] opacity-80 hover:text-[var(--primary)] font-bold text-sm transition-all whitespace-nowrap relative overflow-visible uppercase tracking-[-0.05em]"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {language === "ar" ? (
                    <span className="text-sm font-bold uppercase font-arabic nav-label">
                      {navItem}
                    </span>
                  ) : (
                    <TextRoll center className="text-sm font-bold uppercase tracking-[-0.05em]">
                      {navItem}
                    </TextRoll>
                  )}
                </motion.a>
              );
            })}

            {/* Search Button (Between Academy and Standings) */}
            <div key="search" className="inline-flex">
              <motion.button
                onClick={() => setIsSearchOpen(true)}
                className="w-auto h-auto flex items-center justify-center text-[var(--foreground)] opacity-60 hover:opacity-100 hover:text-[var(--primary)] transition-all"
                aria-label="Search"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                style={{ width: 'auto', height: 'auto' }}
              >
                <Search size={18} />
              </motion.button>
            </div>

            {/* Second half: Standings to Contact */}
            {navItemsConfig.slice(5).map((item, index) => {
              const navItem = navItems[index + 5]; // Note the index shift
              if (!navItem) return null;
              return (
                <motion.a
                  key={item.key}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(item.href);
                  }}
                  className="inline-block text-[var(--foreground)] opacity-80 hover:text-[var(--primary)] font-bold text-sm transition-all whitespace-nowrap relative overflow-visible uppercase tracking-[-0.05em]"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (index + 6) * 0.05 }}
                >
                  {language === "ar" ? (
                    <span className="text-sm font-bold uppercase font-arabic nav-label">
                      {navItem}
                    </span>
                  ) : (
                    <TextRoll center className="text-sm font-bold uppercase tracking-[-0.05em]">
                      {navItem}
                    </TextRoll>
                  )}
                </motion.a>
              );
            })}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <AnimatedThemeToggler theme={theme} setTheme={setTheme} />

            {/* Language Switcher */}
            <div
              ref={langMenuRef}
              className="relative"
            >
              <motion.button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center justify-center w-9 h-9 bg-[var(--foreground)]/10 hover:bg-[var(--foreground)]/20 rounded-full overflow-hidden transition-all border border-[var(--foreground)]/10 hover:scale-105"
                aria-label="Change language"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="relative w-5 h-5">
                  <NextImage
                    src={`/${languages.find(l => l.code === language)?.flag || "eng"}.png`}
                    alt={languages.find(l => l.code === language)?.displayName || "Language"}
                    fill
                    className="object-cover rounded-sm"
                  />
                </div>
              </motion.button>

              <AnimatePresence>
                {showLangMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-44 bg-[var(--background)] border border-[var(--foreground)]/10 rounded-xl shadow-2xl overflow-hidden z-50 backdrop-blur-lg"
                  >
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-[var(--foreground)]/10 transition-all ${language === lang.code
                          ? "text-[var(--primary)] bg-[var(--foreground)]/5 font-semibold"
                          : "text-[var(--foreground)]/80"
                          }`}
                      >
                        <span>{lang.displayName}</span>
                        <div className="relative w-6 h-6 rounded-sm overflow-hidden">
                          <NextImage
                            src={`/${lang.flag}.png`}
                            alt={lang.displayName}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Profile / Auth */}
            <div className="flex items-center gap-3" ref={userMenuRef}>
              {user && points > 0 && (
                <motion.div
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-full hover:bg-[var(--primary)]/20 transition-all"
                  whileHover={{ scale: 1.02 }}
                >
                  <Star size={12} className="text-yellow-500" />
                  <span className="text-sm font-bold text-[var(--primary)] whitespace-nowrap">
                    {points} {language === "ar" ? "نقطة" : "pts"}
                  </span>
                </motion.div>
              )}
              {user ? (
                <>
                  <motion.div
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="relative cursor-pointer group"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/80 shadow-lg shadow-[var(--primary)]/20 flex items-center justify-center text-white font-bold text-sm overflow-hidden border-2 border-white/10 transition-all group-hover:shadow-xl">
                      {user.avatar && !user.avatar.includes("anas.jpeg") ? (
                        <NextImage
                          src={user.avatar}
                          alt={user.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-sm font-bold">
                          {user.name?.[0]?.toUpperCase() || "U"}
                        </span>
                      )}
                    </div>
                    {points > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center border-2 border-[var(--background)] shadow-sm animate-pulse">
                        <span className="text-[8px] font-black text-white">{points}</span>
                      </div>
                    )}
                  </motion.div>

                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-3 w-56 bg-[var(--background)]/95 backdrop-blur-lg border border-[var(--foreground)]/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                      >
                        <div className="px-4 py-3 border-b border-[var(--foreground)]/10 bg-[var(--foreground)]/5">
                          <p className="text-sm font-bold text-[var(--foreground)] truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-[var(--foreground)]/60 truncate mt-0.5">
                            {user.email}
                          </p>
                          {points > 0 && (
                            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-[var(--foreground)]/10">
                              <Star size={12} className="text-yellow-500" />
                              <span className="text-xs font-semibold text-[var(--foreground)]/80">
                                {points} {language === "ar" ? "نقطة" : "points"}
                              </span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 transition-all group"
                        >
                          <LogOut size={16} className="group-hover:scale-110 transition-transform" />
                          <span className="font-medium">
                            {language === "ar" ? "تسجيل الخروج" : "Logout"}
                          </span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <motion.button
                  onClick={() => setIsAuthOpen(true)}
                  className="w-9 h-9 rounded-full border-2 border-[var(--primary)]/30 text-[var(--foreground)] hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)] transition-all flex items-center justify-center shadow-lg hover:shadow-xl"
                  aria-label="Sign In"
                >
                  <LogIn size={16} />
                </motion.button>
              )}
            </div>

            {/* Mobile menu toggle */}
            <div className="flex lg:hidden items-center">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className="text-[var(--foreground)] p-2 hover:bg-[var(--foreground)]/10 rounded-lg transition-colors"
                aria-label={isOpen ? "Close menu" : "Open menu"}
              >
                {isOpen ? <X size={28} /> : <Menu size={28} />}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden bg-[var(--background)]/98 backdrop-blur-lg border-t border-[var(--foreground)]/10 overflow-hidden"
            >
              <div className="px-4 py-6 space-y-2 max-h-[calc(100vh-5rem)] overflow-y-auto">
                {/* Mobile: First half (Home to Academy) */}
                {navItemsConfig.slice(0, 5).map((item, index) => {
                  const navItem = navItems[index];
                  if (!navItem) return null;
                  return (
                    <motion.a
                      key={item.key}
                      href={item.href}
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavClick(item.href);
                      }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`block text-[var(--foreground)] opacity-80 hover:text-[var(--primary)] text-lg py-3 px-2 transition-colors font-bold uppercase tracking-[-0.05em] hover:bg-[var(--foreground)]/5 rounded-xl ${isRTL ? "text-right" : "text-left"
                        }`}
                    >
                      {language === "ar" ? (
                        <span className="text-lg font-bold uppercase font-arabic nav-label">
                          {navItem}
                        </span>
                      ) : (
                        <TextRoll center className="text-lg font-bold uppercase tracking-[-0.05em]">
                          {navItem}
                        </TextRoll>
                      )}
                    </motion.a>
                  );
                })}

                {/* Search Button (Between Academy and Standings) */}
                <motion.button
                  key="search-mobile"
                  onClick={() => {
                    setIsSearchOpen(true);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 text-[var(--foreground)] opacity-80 hover:text-[var(--primary)] text-lg py-3 px-2 transition-colors font-bold uppercase tracking-[-0.05em] hover:bg-[var(--foreground)]/5 rounded-xl ${isRTL ? "justify-end" : "justify-start"
                    }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <Search size={20} />
                  {language === "ar" ? (
                    <span className="text-lg font-bold uppercase font-arabic nav-label">
                      بحث
                    </span>
                  ) : (
                    <TextRoll center className="text-lg font-bold uppercase tracking-[-0.05em]">
                      Search
                    </TextRoll>
                  )}
                </motion.button>

                {/* Mobile: Second half (Standings to Contact) */}
                {navItemsConfig.slice(5).map((item, index) => {
                  const navItem = navItems[index + 5]; // Offset by 5
                  if (!navItem) return null;

                  return (
                    <motion.a
                      key={item.key}
                      href={item.href}
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavClick(item.href);
                      }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (index + 6) * 0.05 }}
                      className={`block text-[var(--foreground)] opacity-80 hover:text-[var(--primary)] text-lg py-3 px-2 transition-colors font-bold uppercase tracking-[-0.05em] hover:bg-[var(--foreground)]/5 rounded-xl ${isRTL ? "text-right" : "text-left"
                        }`}
                    >
                      {language === "ar" ? (
                        <span className="text-lg font-bold uppercase font-arabic nav-label">
                          {navItem}
                        </span>
                      ) : (
                        <TextRoll center className="text-lg font-bold uppercase tracking-[-0.05em]">
                          {navItem}
                        </TextRoll>
                      )}
                    </motion.a>
                  );
                })}

                {/* Mobile auth button */}
                {!user && (
                  <motion.button
                    onClick={() => {
                      setIsAuthOpen(true);
                      setIsOpen(false);
                    }}
                    className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 text-white font-bold hover:opacity-90 transition-all uppercase tracking-[-0.05em] shadow-lg"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <LogIn size={18} />
                    <TextRoll center className="text-sm font-bold uppercase tracking-[-0.05em]">
                      {language === "ar" ? "تسجيل الدخول" : "Sign In"}
                    </TextRoll>
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}



function HeroSection({ language, theme }: { language: "en" | "fr" | "ar", theme: string }) {
  // Mock translations (replace with your actual object)
  const translations = {
    en: { hero: { tagline: "Olympique Béja's official website", stats: ["Since", "Trophies", "Fans"] } },
    fr: { hero: { tagline: "Site officiel de l'Olympique Béja", stats: ["Depuis", "Trophées", "Fans"] } },
    ar: { hero: { tagline: "الموقع الرسمي للأولمبي الباجي", stats: ["منذ", "ألقاب", "مشجع"] } }
  };
  const t = translations[language].hero;

  // Framer Motion Variants for clean, staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 },
    },
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 60, damping: 15 } },
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[var(--background)]">

      {/* Dynamic Background Glow */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className={`w-[600px] h-[600px] rounded-full blur-[120px] opacity-20 ${theme === 'light' ? 'bg-[#C41E3A]' : 'bg-[#C41E3A]'}`} />
      </div>

      {/* Lion watermark — left side of the background */}
      <div className="absolute left-[0%] bottom-[27%] -translate-y-1/2 w-1/3 max-w-[400px] min-h-[50vh] pointer-events-none opacity-15 hidden md:block">
        <NextImage
          src="/icon/lion-red.png"
          alt=""
          fill
          priority
          className="object-contain object-left drop-shadow-[0_0_40px_rgba(255,215,0,0.35)]"
        />
      </div>
      <div className="absolute right-[0%] top-[56%] -translate-y-1/2 w-1/3 max-w-[400px] min-h-[50vh] pointer-events-none opacity-15 hidden md:block">
        <NextImage
          src="/icon/naw.png"
          alt=""
          fill
          priority
          className="object-contain object-left drop-shadow-[0_0_40px_rgba(255,215,0,0.35)]"
        />
      </div>

      {/* Main Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full px-4"
      >
        {/* Center Logo - Above the Title */}
        <motion.div
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 40, damping: 10, delay: 0.4 }}
          className="relative w-40 h-40 sm:w-40 sm:h-40 lg:w-40 lg:h-40 mb-4 mx-auto"
        >
          <NextImage
            src="/clubs/beja.png"
            alt="Olympique Béja Logo"
            fill
            className="object-contain drop-shadow-[0_10px_30px_rgba(255,215,0,0.4)]"
            priority
          />
        </motion.div>

        {/* Title & Logo Header — stacks on mobile, side-by-side on larger screens */}
        <motion.div
          variants={itemVariants}
          // Flips layout for Arabic to read RTL correctly
          className={`flex items-center justify-center text-center mx-auto gap-2 sm:gap-3 md:gap-8 px-2 ${language === 'ar' ? 'flex-col sm:flex-row-reverse' : 'flex-col sm:flex-row'}`}
        >
          {/* First Word (Left in LTR, Right in RTL) */}
          <span
            className={`font-black tracking-tighter text-[2.6rem] sm:text-6xl md:text-7xl lg:text-7xl xl:text-8xl 2xl:text-[9rem] leading-none transition-colors duration-500 ${theme === "light"
              ? "text-slate-800 drop-shadow-xl"
              : "text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.2)]"
              }`}
          >
            {language === "ar" ? "الأولمبي" : "Olympique"}
          </span>
          {/* Second Word (Right in LTR, Left in RTL) */}
          <span className="font-black tracking-tighter text-[2.6rem] sm:text-6xl md:text-7xl lg:text-7xl xl:text-8xl 2xl:text-[9rem] leading-none text-[#C41E3A] drop-shadow-[0_0_40px_rgba(196,30,58,0.4)]">
            {language === "ar" ? "الباجي" : "Béja"}
          </span>
        </motion.div>
        {/* Tagline */}
        <motion.p
          variants={itemVariants}
          className="text-base sm:text-xl md:text-2xl text-[#808080] opacity-80 mt-6 md:mt-10 max-w-2xl mx-auto text-center font-medium px-4"
        >
          {t.tagline}
        </motion.p>

        {/* Stats Section */}
        <motion.div
          variants={itemVariants}
          className="flex flex-wrap justify-center gap-8 sm:gap-16 mt-12"
        >
          {[
            { label: t.stats[0], value: 1929, suffix: "" },
            { label: t.stats[1], value: 5, suffix: "" },
            { label: t.stats[2], value: 1, suffix: "M+" },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              whileHover={{ scale: 1.05, y: -5 }}
              className="text-center group"
            >
              <p className="text-4xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#C41E3A] to-[#8B0000] drop-shadow-sm transition-transform">
                <AnimatedCounter end={stat.value} suffix={stat.suffix} />
              </p>
              <p className="text-[var(--foreground)] opacity-60 text-sm font-bold uppercase tracking-[0.2em] mt-2 group-hover:opacity-100 transition-opacity">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Buttons */} 
      </motion.div>

      {/* Floating Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2 text-[var(--foreground)] opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
        >
          <span className="text-xs font-bold uppercase tracking-[0.2em]">
            {language === "ar" ? "اكتشف المزيد" : language === "fr" ? "Découvrir" : "Scroll Down"}
          </span>
          <ChevronDown size={24} className="text-[#C41E3A]" />
        </motion.div>
      </motion.div>
    </section>
  );
}

// Trophies section
// Trophies section
function TrophiesSection({
  language,
  theme,
}: {
  language: "en" | "fr" | "ar";
  theme: string;
}) {
  const t = translations[language].trophies;
  const trophyRef = useRef(null);
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const trophyWikiMap: Record<number, string> = {
    0: "https://fr.wikipedia.org/wiki/Coupe_de_Tunisie_de_football",
    1: "https://fr.wikipedia.org/wiki/Supercoupe_de_Tunisie_de_football",
    2: "https://fr.wikipedia.org/wiki/Championnat_de_Tunisie_de_football",
    3: "https://www.colours-of-football.com/",
    4: "https://fr.wikipedia.org/wiki/Championnat_de_Tunisie_de_football",
    5: "https://fr.wikipedia.org/wiki/Championnat_de_Tunisie_de_football",
  };

  const trophies = {
    coupeTunisie: {
      image: "/cups/Coupe de Tunisie.png",
      title: t.items[0],
      count: 3,
      color: "#ffffff",
      wiki: trophyWikiMap[0],
    },
    superCoupe: {
      image: "/cups/Supercoupe de Tunisie.png",
      title: t.items[1],
      count: 2,
      color: "#C41E3A",
      wiki: trophyWikiMap[1],
    },
  };

  const openWiki = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  /*
  ============================================================
  INDEPENDENT TROPHY
  Each trophy has its own motion state.
  Hovering one trophy never animates the others.
  ============================================================
  */
  const TrophyItem = ({
    image,
    title,
    index,
    delay,
    rotation,
  }: {
    image: string;
    title: string;
    index: number;
    delay: number;
    rotation: number;
  }) => {
    return (
      <motion.div
        initial={{
          opacity: 0,
          y: 30,
          scale: 0.75,
        }}
        animate={
          inView
            ? {
                opacity: 1,
                y: 0,
                scale: 1,
              }
            : {}
        }
        transition={{
          opacity: {
            duration: 0.2,
            delay,
          },
          y: {
            duration: 0.3,
            delay,
            ease: "easeOut",
          },
          scale: {
            duration: 0.3,
            delay,
            ease: "easeOut",
          },
        }}
        whileHover={{
          scale: 1.14,
          y: -12,
          rotateZ: rotation,
          zIndex: 50,
          transition: {
            duration: 0.12,
            ease: "easeOut",
          },
        }}
        whileTap={{
          scale: 1.05,
        }}
        className="
          relative
          z-10
          flex
          items-end
          justify-center
          flex-shrink-0
          w-[180px]
          h-[195px]
          sm:w-[180px]
          sm:h-[300px]
          -mx-[35px]
          cursor-pointer
        "
        style={{
          transformOrigin: "center bottom",
        }}
        title={`${title} ${index + 1}`}
      >
        <NextImage
          src={image}
          alt={`${title} ${index + 1}`}
          width={130}
          height={180}
          className="
            w-full
            h-full
            object-contain
            drop-shadow-[0_20px_20px_rgba(0,0,0,0.55)]
            pointer-events-none
            select-none
          "
          sizes="130px"
          draggable={false}
        />
      </motion.div>
    );
  };

  return (
    <section ref={ref} className="relative py-24 overflow-hidden">
      {/* ===================================================== */}
      {/* BACKGROUND */}
      {/* ===================================================== */}

      <div className="absolute inset-0 bg-[var(--background)]">
        <div
          className="
            absolute
            top-1/4
            left-1/4
            w-96
            h-96
            bg-[var(--primary)]
            rounded-full
            blur-[150px]
            opacity-10
          "
        />

        <div
          className="
            absolute
            bottom-1/4
            right-1/4
            w-80
            h-80
            bg-[var(--primary)]
            rounded-full
            blur-[120px]
            opacity-5
          "
        />
      </div>

      {/* ===================================================== */}
      {/* DIAGONAL STRIPES */}
      {/* ===================================================== */}

      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                -45deg,
                #ffffff,
                #ffffff 1px,
                transparent 1px,
                transparent 20px
              )
            `,
          }}
        />
      </div>

      <FloatingParticles />

      {/* ===================================================== */}
      {/* MAIN CONTENT */}
      {/* ===================================================== */}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* =================================================== */}
        {/* HEADER */}
        {/* =================================================== */}

        <motion.div
          initial={{
            opacity: 0,
            y: 35,
          }}
          animate={
            inView
              ? {
                  opacity: 1,
                  y: 0,
                }
              : {}
          }
          transition={{
            duration: 0.35,
            ease: "easeOut",
          }}
          className="text-center mb-14"
        >
          <motion.span
            initial={{
              opacity: 0,
              scale: 0.8,
            }}
            animate={
              inView
                ? {
                    opacity: 1,
                    scale: 1,
                  }
                : {}
            }
            transition={{
              duration: 0.25,
              ease: "easeOut",
            }}
            className="
              inline-block
              px-4
              py-2
              bg-[#D4AF37]/10
              border
              border-[#D4AF37]/30
              rounded-full
              text-[#D4AF37]
              text-sm
              font-semibold
              mb-3
            "
          >
            THE TROPHY
          </motion.span>

          <br />

          <div
            ref={trophyRef}
            className="inline-block"
          >
            <p
              className="
                text-5xl
                lg:text-7xl
                font-display
                font-black
                uppercase
                tracking-tighter
                italic
                text-[#D4AF37]
              "
              style={{
                WebkitTextStroke: "1px black",
                textShadow: "0 0 1px #000",
              }}
            >
              <VariableProximityText
                label={t.title}
                fromFontVariationSettings="'wght' 300, 'opsz' 9"
                toFontVariationSettings="'wght' 1000, 'opsz' 40"
                containerRef={trophyRef}
                radius={150}
                falloff="gaussian"
              />
            </p>
          </div>

          <p className="text-[var(--foreground)] opacity-80 max-w-2xl mx-auto text-lg mt-4">
            {t.subtitle}
          </p>
        </motion.div>

        {/* =================================================== */}
        {/* TROPHY CABINET */}
        {/* =================================================== */}

        <div className="flex flex-col lg:flex-row justify-center items-stretch gap-6">

          {/* ================================================= */}
          {/* COUPE DE TUNISIE */}
          {/* ================================================= */}

          <motion.div
            initial={{
              opacity: 0,
              y: 25,
              scale: 0.96,
            }}
            animate={
              inView
                ? {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                  }
                : {}
            }
            transition={{
              duration: 0.3,
              delay: 0.05,
              ease: "easeOut",
            }}
            className="w-full lg:w-[400px]"
          >
            <ElectricBorder
              color="#ffffff"
              speed={1.2}
              chaos={0.08}
              borderRadius={24}
            >
              <div
                onClick={() =>
                  openWiki(trophies.coupeTunisie.wiki)
                }
                className="
                  relative
                  overflow-hidden
                  glass
                  bg-white/10
                  rounded-3xl
                  min-h-[410px]
                  px-3
                  pt-5
                  pb-5
                  text-center
                  cursor-pointer
                  flex
                  flex-col
                  justify-end
                "
              >
                {/* ========================================= */}
                {/* GLASS LIGHT */}
                {/* ========================================= */}

                <div
                  className="
                    absolute
                    inset-0
                    bg-gradient-to-b
                    from-white/[0.12]
                    via-transparent
                    to-black/10
                    pointer-events-none
                  "
                />

                {/* ========================================= */}
                {/* TROPHIES */}
                {/* ========================================= */}

                <div
                  className="
                    relative
                    z-10
                    flex
                    flex-row
                    justify-center
                    items-end
                    flex-nowrap
                    h-[260px]
                    mb-[-8px]
                  "
                >
                  <TrophyItem
                    image={trophies.coupeTunisie.image}
                    title={trophies.coupeTunisie.title}
                    index={0}
                    delay={0.08}
                    rotation={-3}
                  />

                  <TrophyItem
                    image={trophies.coupeTunisie.image}
                    title={trophies.coupeTunisie.title}
                    index={1}
                    delay={0.12}
                    rotation={0}
                  />

                  <TrophyItem
                    image={trophies.coupeTunisie.image}
                    title={trophies.coupeTunisie.title}
                    index={2}
                    delay={0.16}
                    rotation={3}
                  />
                </div>

                {/* ========================================= */}
                {/* GLASS COUNTER (watermark number only) */}
                {/* ========================================= */}

                <motion.div
                  initial={{
                    opacity: 0,
                    scale: 0.9,
                  }}
                  animate={
                    inView
                      ? {
                          opacity: 1,
                          scale: 1,
                        }
                      : {}
                  }
                  transition={{
                    duration: 0.35,
                    delay: 0.28,
                    ease: "easeOut",
                  }}
                  className="
                    absolute
                    inset-0
                    z-0
                    pointer-events-none
                    flex
                    flex-col
                    items-center
                    justify-center
                    overflow-hidden
                  "
                >
                  <p
                    className="
                      absolute
                      top-1/2
                      left-1/2
                      -translate-x-1/2
                      -translate-y-[58%]
                      text-[240px]
                      sm:text-[290px]
                      leading-none
                      font-black
                      tracking-tighter
                      text-white/[0.08]
                      select-none
                    "
                  >
                    <AnimatedCounter
                      end={trophies.coupeTunisie.count}
                    />
                  </p>
                </motion.div>

                {/* ========================================= */}
                {/* TITLE */}
                {/* ========================================= */}

                <motion.p
                  initial={{
                    opacity: 0,
                    y: 8,
                  }}
                  animate={
                    inView
                      ? {
                          opacity: 1,
                          y: 0,
                        }
                      : {}
                  }
                  transition={{
                    duration: 0.2,
                    delay: 0.35,
                  }}
                  className="
                    relative
                    z-20
                    font-display
                    font-black
                    uppercase
                    italic
                    tracking-tight
                    text-lg
                    mt-4
                  "
                  style={{
                    color: "#ffffff",
                    WebkitTextStroke: "1px black",
                    textShadow: "0 0 1px #000",
                  }}
                >
                  {trophies.coupeTunisie.title}
                </motion.p>
              </div>
            </ElectricBorder>
          </motion.div>

          {/* ================================================= */}
          {/* SUPER COUPE */}
          {/* ================================================= */}

          <motion.div
            initial={{
              opacity: 0,
              y: 25,
              scale: 0.96,
            }}
            animate={
              inView
                ? {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                  }
                : {}
            }
            transition={{
              duration: 0.3,
              delay: 0.1,
              ease: "easeOut",
            }}
            className="w-full lg:w-[400px]"
          >
            <ElectricBorder
              color="#C41E3A"
              speed={1.2}
              chaos={0.08}
              borderRadius={24}
            >
              <div
                onClick={() =>
                  openWiki(trophies.superCoupe.wiki)
                }
                className="
                  relative
                  overflow-hidden
                  glass
                  bg-white/10
                  rounded-3xl
                  min-h-[410px]
                  px-3
                  pt-5
                  pb-5
                  text-center
                  cursor-pointer
                  flex
                  flex-col
                  justify-end
                "
              >
                {/* ========================================= */}
                {/* GLASS LIGHT */}
                {/* ========================================= */}

                <div
                  className="
                    absolute
                    inset-0
                    bg-gradient-to-b
                    from-white/[0.12]
                    via-transparent
                    to-black/10
                    pointer-events-none
                  "
                />

                {/* ========================================= */}
                {/* TROPHIES */}
                {/* ========================================= */}

                <div
                  className="
                    relative
                    z-10
                    flex
                    flex-row
                    justify-center
                    items-end
                    flex-nowrap
                    h-[260px]
                    mb-[-8px]
                  "
                >
                  <TrophyItem
                    image={trophies.superCoupe.image}
                    title={trophies.superCoupe.title}
                    index={0}
                    delay={0.1}
                    rotation={-3}
                  />

                  <TrophyItem
                    image={trophies.superCoupe.image}
                    title={trophies.superCoupe.title}
                    index={1}
                    delay={0.15}
                    rotation={3}
                  />
                </div>

                {/* ========================================= */}
                {/* GLASS COUNTER (watermark number only) */}
                {/* ========================================= */}

                <motion.div
                  initial={{
                    opacity: 0,
                    scale: 0.9,
                  }}
                  animate={
                    inView
                      ? {
                          opacity: 1,
                          scale: 1,
                        }
                      : {}
                  }
                  transition={{
                    duration: 0.35,
                    delay: 0.32,
                    ease: "easeOut",
                  }}
                  className="
                    absolute
                    inset-0
                    z-0
                    pointer-events-none
                    flex
                    flex-col
                    items-center
                    justify-center
                    overflow-hidden
                  "
                >
                  <p
                    className="
                      absolute
                      top-1/2
                      left-1/2
                      -translate-x-1/2
                      -translate-y-[58%]
                      text-[240px]
                      sm:text-[290px]
                      leading-none
                      font-black
                      tracking-tighter
                      text-white/[0.08]
                      select-none
                    "
                  >
                    <AnimatedCounter
                      end={trophies.superCoupe.count}
                    />
                  </p>
                </motion.div>

                {/* ========================================= */}
                {/* TITLE */}
                {/* ========================================= */}

                <motion.p
                  initial={{
                    opacity: 0,
                    y: 8,
                  }}
                  animate={
                    inView
                      ? {
                          opacity: 1,
                          y: 0,
                        }
                      : {}
                  }
                  transition={{
                    duration: 0.2,
                    delay: 0.38,
                  }}
                  className="
                    relative
                    z-20
                    font-display
                    font-black
                    uppercase
                    italic
                    tracking-tight
                    text-lg
                    mt-4
                  "
                  style={{
                    color: "#C41E3A",
                    WebkitTextStroke: "1px black",
                    textShadow: "0 0 1px #000",
                  }}
                >
                  {trophies.superCoupe.title}
                </motion.p>
              </div>
            </ElectricBorder>
          </motion.div>
        </div>

        {/* =================================================== */}
        {/* TOTAL */}
        {/* =================================================== */}

        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={
            inView
              ? {
                  opacity: 1,
                  y: 0,
                }
              : {}
          }
          transition={{
            duration: 0.3,
            delay: 0.45,
            ease: "easeOut",
          }}
          className="text-center mt-12"
        >
          <p
            className="
              text-6xl
              sm:text-8xl
              font-black
              text-[var(--foreground)]
              tracking-tighter
            "
          >
            <AnimatedCounter end={5} />+
          </p>

          <p className="text-[var(--foreground)] opacity-80 text-xl mt-2">
            {t.total}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
// Helper to get flag emoji
const getFlagEmoji = (country: string) => {
  const codePoints = country
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

const getCountryFlag = (nationality: string) => {
  const map: { [key: string]: string } = {
    "Tunisia": "/clubs/tunisia.png",
    "Algeria": "/clubs/algerie.png",
    "Libya": "/clubs/libya.png",
    "Cameroon": "/clubs/cameroun.png",
    "France": "/clubs/france.png",
    "Belgium": "/clubs/belgium.png",
    "Gambia": "/clubs/gambia.webp",
    "England": "/clubs/england.png",
    "DR Congo": "/clubs/congo.png",
  };
  // Handle compound nationalities
  const primary = nationality.split('/')[0];
  // Fallback to Tunisia if not found (or generic earth icon if you had one in images, but keeping safe fallback)
  return map[primary] || "/clubs/tunisia.png";
}

// FC26-style card image map (filename without extension => /cards/<name>.png)
const playerCardImages: Record<string, string> = {
  "Chahine Smaoui": "/cards/smaoui.png",
  "Islem Chelghoumi": "/cards/chelghoumi.png",
  "Nassim Hasni": "/cards/hasni.png",
  "Youssef Melki": "/cards/ymelki.png",
  "Hamza Houiji": "/cards/houiji.png",
  "Ofufu Ibeh": "/cards/ibeh.png",
  "Mohamed Hedi Hadouchi": "/cards/hadouchi.png",
  "Yahia Achouri": "/cards/achouri.png",
  "Ayoub Saidi": "/cards/saidi.png",
  "Ahmed Fatnassi": "/cards/fatnassi.png",
  "Mehrez Ben Rajeh": "/cards/rajeh.png",
  "Youssef Azib": "/cards/azib.png",
  "Hamza Mabrouk": "/cards/mabrouk.png",
  "Amine Melki": "/cards/melki.png",
  "Majd Hedhli": "/cards/hedhli.png",
  "Mohamed Amine Ammar": "/cards/ammar.png",
  "Firas Fadhli": "/cards/fadhli.png",
  "Haythem Mbarek": "/cards/mbarek.png",
  "Bechir Hasni": "/cards/bhasni.png",
  "El Houcine Gafsi": "/cards/gafsi.png",
  "Baha Cherni": "/cards/cherni.png",
  "Chérif Camara": "/cards/camara.png",
  "Rayane Hammami": "/cards/hammami.png",
  "Mohamed Amine Marzouki": "/cards/marzouki.png",
  "Ayoub Nasri": "/cards/nasri.png",
  "Mohamed Ali Nefzi": "/cards/nefzi.png",
  "Sadate Abdoul Salam Miziyawa": "/cards/miziyawa.png",
  "Achref Afli": "/cards/afli.png",
  "Ravel Djoumekou": "/cards/djoumekou.png",
  "Hamdi Chairet": "/cards/chairet.png",
  "Hamza Soumer": "/cards/soumer.png",
  "Idriss Haboubi": "/cards/haboubi.png",
  "Seydina Mouhamed Diouf": "/cards/diouf.png",
} as Record<string, string>;

const playerTransfermarktMap: Record<string, string> = {
  "Chahine Smaoui": "https://www.transfermarkt.fr/abdelmouhib-chamakh/profil/spieler/584250",
  "Nassim Hasni": "https://www.transfermarkt.fr/ghaith-zaalouni/profil/spieler/842998",
  "Islem Chelghoumi": "https://www.transfermarkt.fr/yassine-meriah/profil/spieler/306330",
  "Chérif Camara": "https://www.transfermarkt.fr/ammar-abdelhak/profil/spieler/1258262",
  "Mehrez Ben Rajeh": "https://www.transfermarkt.fr/houssem-ben-ali/profil/spieler/415510",
  "Hamza Houiji": "https://www.transfermarkt.fr/hamza-houiji/profil/spieler/123488",
  "Firas Fadhli": "https://www.transfermarkt.fr/saidou-khan/profil/spieler/623126",
  "Mohamed Amine Ammar": "https://www.transfermarkt.fr/mohamed-amine-ammar/profil/spieler/123487",
  "Ofufu Ibeh": "https://www.transfermarkt.fr/aymen-harzi/profil/spieler/266205",
  "Baha Cherni": "https://www.transfermarkt.fr/taddeus-nkeng/profil/spieler/624831",
  "Mohamed Hedi Hadouchi": "https://www.transfermarkt.fr/philippe-kinzumbi/profil/spieler/824364",
  "Ayoub Saidi": "https://www.transfermarkt.fr/ghaith-yeferni/profil/spieler/392942",
  "Ahmed Fatnassi": "https://www.transfermarkt.fr/malek-saada/profil/spieler/1166901",
  "Hamza Mabrouk": "https://www.transfermarkt.fr/yassine-bouabid/profil/spieler/624639",
  "Rayane Hammami": "https://www.transfermarkt.fr/ismaila-simpara/profil/spieler/568734",
  "Mohamed Amine Marzouki": "https://www.transfermarkt.fr/mamadou-diatta/profil/spieler/1464909",
  "Youssef Azib": "https://www.transfermarkt.fr/wills-tene-nkingne/profil/spieler/1286950",
  "Ayoub Nasri": "https://www.transfermarkt.fr/mootez-zaddem/profil/spieler/750487",
  "Mohamed Ali Nefzi": "https://www.transfermarkt.fr/alain-kante/profil/spieler/1317589",
  "Achref Afli": "https://www.transfermarkt.fr/haykeul-chikhaoui/profil/spieler/290603",
  "Majd Hedhli": "https://www.transfermarkt.fr/charfeddine-ouni/profil/spieler/747683",
  "Sadate Abdoul Salam Miziyawa": "https://www.transfermarkt.fr/rayan-el-djebali/profil/spieler/1166902",
  "Amine Melki": "https://www.transfermarkt.fr/houssem-hassen-romdhane/profil/spieler/584249",
  "Yahia Achouri": "https://www.transfermarkt.fr/hamza-khadhraoui/profil/spieler/641551",
  "El Houcine Gafsi": "https://www.transfermarkt.fr/sadok-kadida/profil/spieler/1118128",
  "Bechir Hasni": "https://www.transfermarkt.fr/bassem-srarfi/profil/spieler/415537",
  "Ravel Djoumekou": "https://www.transfermarkt.fr/hamza-mnasri/profil/spieler/966141",
  "Hamdi Chairet": "https://www.transfermarkt.fr/hamdi-chairet/profil/spieler/123485",
  "Hamza Soumer": "https://www.transfermarkt.fr/hamza-soumer/profil/spieler/123486",
  "Idriss Haboubi": "https://www.transfermarkt.fr/idriss-haboubi/profil/spieler/123489",
  "Seydina Mouhamed Diouf": "https://www.transfermarkt.fr/seydina-mouhamed-diouf/profil/spieler/123490",
  "Ghassen Mahersi": "https://www.transfermarkt.fr/ghassen-mahersi/profil/spieler/1008452",
  "Wassim Maghzaoui": "https://www.transfermarkt.fr/wassim-maghzaoui/profil/spieler/1192867",
};

function FC26PlayerCard({ player, cardImg, isDraggable, onDragStart, onDragOver, onDragLeave, onDrop, dropTargetName, isBench, source, index = 0, total = 7 }: any) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rotateXValue = ((y / rect.height) - 0.5) * -25;
    const rotateYValue = ((x / rect.width) - 0.5) * 25;

    setRotateX(rotateXValue);
    setRotateY(rotateYValue);
    setGlarePosition({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlarePosition({ x: 50, y: 50 });
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://www.transfermarkt.fr/schnellsuche/ergebnis/schnellsuche?query=${encodeURIComponent(player.name)}`, '_blank', 'noopener,noreferrer');
  };

  const isDropTarget = dropTargetName === player.name;
  const rating = player.position === "Goalkeeper" ? 82 : player.position.includes("Striker") ? 87 : player.position.includes("Winger") ? 85 : 83;

  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={isBench ? {
        y: 0,
        opacity: 1,
        rotate: 0,
      } : { opacity: 1, scale: 1 }}
      whileHover={isBench ? {
        y: -30,
        scale: 1.05,
        transition: { type: 'spring', stiffness: 450, damping: 20 }
      } : { scale: 1.08, zIndex: 100 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      title={`${player.name} - Cliquez pour ouvrir le profil Transfermarkt`}
      className={`relative w-44 h-64 flex-shrink-0 cursor-pointer ${isBench ? '' : ''}`}
      draggable={isDraggable}
      onDragStart={isDraggable ? () => onDragStart(player, source) : undefined}
      onDragOver={isDraggable ? (e: any) => { e.preventDefault(); onDragOver(player.name); } : undefined}
      onDragLeave={isDraggable ? () => onDragLeave() : undefined}
      onDrop={isDraggable ? () => onDrop(player) : undefined}
      style={{
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
    >
      <div
        className="relative w-full h-full flex flex-col items-center"
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transition: 'transform 0.1s ease-out'
        }}
      >
        {/* Player Image */}
        <div className="mt-8 w-full h-[65%] relative z-10 flex justify-center items-end">
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent z-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative w-full h-full" title={player.name}>
            <NextImage
              src={cardImg || player.image || '/beja.png'}
              alt={player.name}
              title={player.name}
              fill
              className="object-contain drop-shadow-[0_20px_20px_rgba(0,0,0,0.7)]"
              sizes="200px"
              priority={!isBench}
              onError={(e: any) => {
                e.currentTarget.src = '/beja.png';
              }}
            />
          </div>
        </div>

        {/* Dynamic Glare Overlay */}
        <div />
      </div>
    </motion.div>
  );
}


function MohsenCard() {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  return (
    <motion.div
      whileHover={{ scale: 1.08, zIndex: 100 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      onClick={() => window.open('https://fr.wikipedia.org/wiki/Mohsen_Trabelsi', '_blank', 'noopener,noreferrer')}
      title="Dr. Mohsen Trabelsi - Cliquez pour voir la page Wikipédia"
      className="relative w-40 sm:w-44 h-60 sm:h-64 flex-shrink-0 cursor-pointer group"
      style={{
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
    >
      <div
        className="relative w-full h-full flex items-center justify-center"
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transition: 'transform 0.1s ease-out'
        }}
      >

        {/* Card Image */}
        <div className="relative w-full h-full z-10 flex items-center justify-center">
          <NextImage
            src="/cards/mohsen.png"
            alt="Dr. Mohsen Trabelsi"
            fill
            className="object-contain drop-shadow-[0_20px_20px_rgba(0,0,0,0.7)]"
            sizes="200px"
            priority
          />
        </div>
      </div>
    </motion.div>
  );
}

// Team section
function TeamSection({ language, theme }: { language: "en" | "fr" | "ar", theme: string }) {
  const t = translations[language].team;
  const squadRef = useRef<HTMLDivElement>(null);
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });

  // Latest played game (auto-refresh every 2 minutes)
  const [latestResult, setLatestResult] = useState<any>(null);
  useEffect(() => {
    const fetchLatest = () => {
      fetch('/api/fixtures')
        .then(res => res.json())
        .then(data => {
          if (data.recent && Array.isArray(data.recent) && data.recent.length > 0) {
            setLatestResult(data.recent[0]);
          } else if (ALL_RESULTS.length > 0) {
            setLatestResult(ALL_RESULTS[0]);
          }
        })
        .catch(() => {
          if (ALL_RESULTS.length > 0) setLatestResult(ALL_RESULTS[0]);
        });
    };
    fetchLatest();
    const interval = setInterval(fetchLatest, 120000);
    return () => clearInterval(interval);
  }, []);

  const latestTeamLogos: { [key: string]: string } = {
    "ES Metlaoui": "/clubs/esm.png",
    "ES Métlaoui": "/clubs/esm.png",
    "Olympique Béja": "/clubs/beja.png",
    "CS Hammam-Lif": "/clubs/cshl.png",
    "US Monastir": "/clubs/usm.png",
    "ES Hammam-Sousse": "/clubs/eshs.png",
    "PS Sakiet Eddaïer": "/clubs/psse.png",
    "Stade Tunisien": "/clubs/st.png",
    "Esperance Tunis": "/clubs/est.png",
    "Espérance de Tunis": "/clubs/est.png",
    "JS Omrane": "/clubs/jso.png",
    "CS Sfaxien": "/clubs/css.png",
    "CA Bizertin": "/clubs/cab.png",
    "Club Africain": "/clubs/ca.png",
    "CA": "/clubs/ca.png",
    "ES Zarzis": "/clubs/esz.png",
    "ES Sahel": "/clubs/ess.png",
    "Étoile du Sahel": "/clubs/ess.png",
    "AS Marsa": "/clubs/marsa.png",
    "US Ben Guerdane": "/clubs/usb.png",
  };
  const latestOpponentLogo = latestResult ? latestTeamLogos[latestResult.opponent] : null;

  // 11 Starters from Transfermarkt last match (4-3-3 Offensif vs Hammam Sousse 1-0) + Bench
  const fallbackPlayers = useMemo(() => [
    // 11 Starters (Formation 4-3-3 Offensif)
    { name: "Chahine Smaoui", position: "Goalkeeper", number: 1, birthDate: "25/08/2001", nationality: "Tunisia", marketValue: "€450k", previousClub: "ES Métlaoui", image: "/cards/smaoui.png", transfermarktUrl: "https://www.transfermarkt.com/abdelmouhib-chamakh/profil/spieler/584250" },
    { name: "Mehrez Ben Rajeh", position: "Left Back", number: 33, birthDate: "10/06/1996", nationality: "Tunisia", marketValue: "€400k", image: "/cards/rajeh.png", transfermarktUrl: "https://www.transfermarkt.com/houssem-ben-ali/profil/spieler/123471" },
    { name: "Chérif Camara", position: "Center Defender", number: 6, birthDate: "19/10/2001", nationality: "Tunisia", marketValue: "€150k", image: "/cards/camara.png", transfermarktUrl: "https://www.transfermarkt.com/ammare-abdelhak/profil/spieler/123459" },
    { name: "Islem Chelghoumi", position: "Center Defender", number: 5, birthDate: "14/03/1995", nationality: "Tunisia", marketValue: "€700k", image: "/cards/chelghoumi.png", transfermarktUrl: "https://www.transfermarkt.com/yassine-meriah/profil/spieler/123458" },    
    { name: "Nassim Hasni", position: "Right Back", number: 17, birthDate: "06/05/2002", nationality: "Tunisia", marketValue: "€650k", previousClub: "ES Zarzis", image: "/cards/hasni.png", transfermarktUrl: "https://www.transfermarkt.com/ghaith-zaalouni/profil/spieler/123460" },
    { name: "Alpha Sidibé", position: "Central Midfielder", number: 12, birthDate: "03/11/2004", nationality: "Côte d'Ivoire", marketValue: "€50k", image: "/cards/sidibe.png", transfermarktUrl: "https://www.transfermarkt.fr/alpha-sidibe/profil/spieler/961791" },
    { name: "Majd Hedhli", position: "Defensive Midfielder", number: 13, birthDate: "09/09/2000", nationality: "Tunisia", marketValue: "€350k", image: "/cards/hedhli.png", transfermarktUrl: "https://www.transfermarkt.com/charfeddine-ouni/profil/spieler/123476" },        
    { name: "Firas Fadhli", position: "Central Midfielder", number: 28, birthDate: "05/12/1995", nationality: "Gambia/England", marketValue: "€150k", image: "/cards/fadhli.png", transfermarktUrl: "https://www.transfermarkt.com/saidou-khan/profil/spieler/123461" },
    { name: "Mohamed Hedi Hadouchi", position: "Right Winger", number: 18, birthDate: "26/01/1999", nationality: "DR Congo", marketValue: "€550k", image: "/cards/hadouchi.png", transfermarktUrl: "https://www.transfermarkt.com/phillippe-kinzumbi/profil/spieler/123481" },
    { name: "El Houcine Gafsi", position: "Striker", number: 40, birthDate: "02/12/2003", nationality: "Tunisia", marketValue: "€300k", image: "/cards/gafsi.png", transfermarktUrl: "https://www.transfermarkt.com/sadok-kadida/profil/spieler/123484" },    
    { name: "Bechir Hasni", position: "Right Winger", number: 19, birthDate: "25/06/1997", nationality: "Tunisia", marketValue: "€450k", previousClub: "ES Sahel", image: "/cards/bhasni.png", transfermarktUrl: "https://www.transfermarkt.com/bassem-srarfi/profil/spieler/123483" },

    // Bench (9 Players from Transfermarkt)
    { name: "Ayoub Saidi", position: "Goalkeeper", number: 16, birthDate: "20/05/1998", nationality: "Tunisia", marketValue: "€300k", image: "/cards/saidi.png", transfermarktUrl: "https://www.transfermarkt.com/ghaith-yeferni/profil/spieler/123467" },
    { name: "Ahmed Fatnassi", position: "Goalkeeper", number: 22, birthDate: "07/07/2005", nationality: "Tunisia", marketValue: "-", image: "/cards/fatnassi.png", transfermarktUrl: "https://www.transfermarkt.com/malek-saada/profil/spieler/123469" },
    { name: "Hamdi Chairet", position: "Attacking Midfielder", number: 23, birthDate: "01/01/2002", nationality: "Tunisia", marketValue: "€250k", image: "/cards/chairet.png", transfermarktUrl: "https://www.transfermarkt.com/hamdi-chairet/profil/spieler/123485" },
    { name: "Hamza Mabrouk", position: "Center Defender", number: 4, birthDate: "08/05/1999", nationality: "Tunisia", marketValue: "€400k", image: "/cards/mabrouk.png", transfermarktUrl: "https://www.transfermarkt.com/yassine-bouabid/profil/spieler/123473" },
    { name: "Rayane Hammami", position: "Center Defender", number: 36, birthDate: "10/06/2004", nationality: "Mali", marketValue: "€175k", image: "/cards/hammami.png", transfermarktUrl: "https://www.transfermarkt.com/Ismaïla-Simpara/profil/spieler/123482" },
    { name: "Mohamed Amine Marzouki", position: "Center Defender", number: 3, birthDate: "01/06/1995", nationality: "Senegal", marketValue: "€450k", image: "/cards/marzouki.png", transfermarktUrl: "https://www.transfermarkt.com/Mamadou-Diatta/profil/spieler/123478" },
    { name: "Youssef Azib", position: "Left Back", number: 15, birthDate: "20/02/2003", nationality: "Cameroon/France", marketValue: "€100k", image: "/cards/azib.png", transfermarktUrl: "https://www.transfermarkt.com/wills-tene-nkingne/profil/spieler/123472" },
    { name: "Hamza Soumer", position: "Central Midfielder", number: 27, birthDate: "01/01/2001", nationality: "Tunisia", marketValue: "€150k", image: "/cards/soumer.png", transfermarktUrl: "https://www.transfermarkt.com/hamza-soumer/profil/spieler/123486" },        
    { name: "Amine Melki", position: "Right Back", number: 24, birthDate: "21/02/2000", nationality: "Tunisia", marketValue: "€400k", image: "/cards/melki.png", transfermarktUrl: "https://www.transfermarkt.com/houssem-hassen-romdhane/profil/spieler/123474" },    
    { name: "Youssef Melki", position: "Defensive Midfielder", number: 10, birthDate: "10/11/2005", nationality: "Tunisia", marketValue: "€200k", image: "/cards/ymelki.png", transfermarktUrl: "https://www.transfermarkt.com/mohamed-sadok-mahmoud/profil/spieler/123477" },    
    { name: "Sadate Abdoul Salam Miziyawa", position: "Attacking Midfielder", number: 21, birthDate: "19/08/1996", nationality: "Tunisia/France", marketValue: "€800k", previousClub: "US Monastir", image: "/cards/miziyawa.png", transfermarktUrl: "https://www.transfermarkt.com/rayan-el-djebali/profil/spieler/123479" },        
    { name: "Ayoub Nasri", position: "Central Midfielder", number: 30, birthDate: "23/11/2004", nationality: "Tunisia", marketValue: "€350k", image: "/cards/nasri.png", transfermarktUrl: "https://www.transfermarkt.com/mootaz-zaddem/profil/spieler/123470" },
    { name: "Mohamed Ali Nefzi", position: "Attacking Midfielder", number: 8, birthDate: "23/11/2004", nationality: "Burkina Faso", marketValue: "€250k", image: "/cards/nefzi.png", transfermarktUrl: "https://www.transfermarkt.com/Alain-Kanté/profil/spieler/123470" },
    { name: "Achref Afli", position: "Attacking Midfielder", number: 20, birthDate: "06/01/2003", nationality: "Tunisia", marketValue: "€75k", previousClub: "Olympique Béja", image: "/cards/afli.png", transfermarktUrl: "https://www.transfermarkt.com/haykeul-chikhaoui/profil/spieler/123475" },
    { name: "Hamza Houiji", position: "Striker", number: 9, birthDate: "26/09/2006", nationality: "Tunisia", marketValue: "€100k", image: "/cards/houiji.png", transfermarktUrl: "https://www.transfermarkt.com/hamza-houiji/profil/spieler/123488" },
    { name: "Mohamed Amine Ammar", position: "Left Back", number: 2, birthDate: "01/01/2000", nationality: "Tunisia", marketValue: "€120k", image: "/cards/ammar.png", transfermarktUrl: "https://www.transfermarkt.com/mohamed-amine-ammar/profil/spieler/123487" },
    { name: "Idriss Haboubi", position: "Defensive Midfielder", number: 6, birthDate: "01/01/1999", nationality: "Tunisia", marketValue: "€180k", image: "/cards/haboubi.png", transfermarktUrl: "https://www.transfermarkt.com/idriss-haboubi/profil/spieler/123489" },
    { name: "Seydina Mouhamed Diouf", position: "Attacking Midfielder", number: 14, birthDate: "01/01/2003", nationality: "Senegal", marketValue: "€300k", image: "/cards/diouf.png", transfermarktUrl: "https://www.transfermarkt.com/seydina-mouhamed-diouf/profil/spieler/123490" },
    { name: "Haythem Mbarek", position: "Left Winger", number: 11, birthDate: "17/10/1998", nationality: "Tunisia", marketValue: "€500k", image: "/cards/mbarek.png", transfermarktUrl: "https://www.transfermarkt.com/oussama-bouguerra/profil/spieler/123464" },
    { name: "Yahia Achouri", position: "Right Winger", number: 7, birthDate: "16/01/1999", nationality: "Tunisia", marketValue: "€800k", image: "/cards/achouri.png", transfermarktUrl: "https://www.transfermarkt.com/hamza-khadhraoui/profil/spieler/123466" },
    { name: "Ofufu Ibeh", position: "Attacking Midfielder", number: 31, birthDate: "01/03/1995", nationality: "Tunisia", marketValue: "€700k", previousClub: "Al-Khaldiya", image: "/cards/ibeh.png", transfermarktUrl: "https://www.transfermarkt.com/aymen-harzi/profil/spieler/123462" },
    { name: "Ravel Djoumekou", position: "Striker", number: 40, birthDate: "02/12/2003", nationality: "Tunisia", marketValue: "€300k", image: "/cards/djoumekou.png", transfermarktUrl: "https://www.transfermarkt.com/hamza-mnasri/profil/spieler/123484" },    
    { name: "Baha Cherni", position: "Striker", number: 34, birthDate: "08/05/1996", nationality: "Cameroon", marketValue: "€850k", previousClub: "Buducnost Podgorica", image: "/cards/cherni.png", transfermarktUrl: "https://www.transfermarkt.com/Taddeus-Nkeng/profil/spieler/123465" },
  ], []); // No language dependency here - player names don't change

  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch lineup from fixtures API (auto-refresh every 2 minutes)
  useEffect(() => {
    const fetchLineup = () => {
      setLoading(true);
      fetch('/api/fixtures')
        .then(res => res.json())
        .then(data => {
          if (data.latestLineup && data.latestLineup.starters && data.latestLineup.starters.length > 0) {
            const lineupPlayers = [...data.latestLineup.starters, ...data.latestLineup.bench].map((p: any, i: number) => ({
              name: p.name,
              position: p.position,
              number: p.number,
              birthDate: "",
              nationality: p.nationality,
              marketValue: "-",
              image: `/cards/${p.name.toLowerCase().replace(/\s+/g, "")}.png`,
              transfermarktUrl: `https://www.transfermarkt.fr/schnellsuche/ergebnis/schnellsuche?query=${encodeURIComponent(p.name)}`,
            }));
            setPlayers(lineupPlayers);
            setError(null);
          } else {
            setError(null);
          }
        })
        .catch(() => {
          setError(null);
        })
        .finally(() => setLoading(false));
    };
    fetchLineup();
    const interval = setInterval(fetchLineup, 120000);
    return () => clearInterval(interval);
  }, []);

  const allPlayers = useMemo(() => {
    if (players.length > 0) return players;
    return fallbackPlayers;
  }, [players, fallbackPlayers]);

  type Player = typeof fallbackPlayers[0];

  const [activeTab, setActiveTab] = useState<'fan' | 'real'>('real');
  const [fanFormation, setFanFormation] = useState('4-3-3');
  const [fanStarters, setFanStarters] = useState<Player[]>([]);
  const [fanBench, setFanBench] = useState<Player[]>([]);

  const formations: Record<string, number[]> = {
    '4-3-3': [1, 4, 3, 3],
    '4-3-3 (Attack)': [1, 4, 3, 3],
    '4-3-3 (Defend)': [1, 4, 3, 3],
    '4-4-2': [1, 4, 4, 2],
    '4-4-2 (Flat)': [1, 4, 4, 2],
    '4-4-2 (Diamond)': [1, 4, 1, 2, 1, 2],
    '4-4-1-1': [1, 4, 4, 1, 1],
    '4-2-3-1': [1, 4, 2, 3, 1],
    '4-2-2-2': [1, 4, 2, 2, 2],
    '4-1-2-1-2': [1, 4, 1, 2, 1, 2],
    '4-1-4-1': [1, 4, 1, 4, 1],
    '4-5-1': [1, 4, 5, 1],
    '3-5-2': [1, 3, 5, 2],
    '3-4-3': [1, 3, 4, 3],
    '3-4-2-1': [1, 3, 4, 2, 1],
    '3-4-1-2': [1, 3, 4, 1, 2],
    '3-3-4': [1, 3, 3, 4],
    '5-3-2': [1, 5, 3, 2],
    '5-4-1': [1, 5, 4, 1],
    '5-2-3': [1, 5, 2, 3],
    '5-2-1-2': [1, 5, 2, 1, 2],
  };


  useEffect(() => {
    if (allPlayers.length > 0) {
      setFanStarters(allPlayers.slice(0, 11));
      setFanBench(allPlayers.slice(11));
    }
  }, [allPlayers]);

  const [draggedPlayer, setDraggedPlayer] = useState<Player | null>(null);
  const [dragSource, setDragSource] = useState<'pitch' | 'bench' | null>(null);
  const [dropTargetName, setDropTargetName] = useState<string | null>(null);
  const [isFormationOpen, setIsFormationOpen] = useState(false);

  const realStarters = allPlayers.slice(0, 11);
  const realBench = allPlayers.slice(11);
  const realFormation = [1, 4, 3, 3];

  const buildRows = (playerList: Player[], formationArr: number[]) => {
    let c = 0;
    return formationArr.map((count) => {
      const slice = playerList.slice(c, c + count);
      c += count;
      return slice;
    });
  };

  const handleFormationChange = (newF: string) => {
    setFanFormation(newF);
    setIsFormationOpen(false);
  };

  const handleDragStart = (p: Player, s: 'pitch' | 'bench') => {
    setDraggedPlayer(p);
    setDragSource(s);
  };

  const handleDropOnPitch = (target: Player) => {
    if (!draggedPlayer) return;
    setDropTargetName(null);
    if (dragSource === 'pitch') {
      setFanStarters(prev => prev.map(p => {
        if (p.name === draggedPlayer.name) return target;
        if (p.name === target.name) return draggedPlayer;
        return p;
      }));
    } else {
      setFanStarters(prev => prev.map(p => p.name === target.name ? draggedPlayer : p));
      setFanBench(prev => prev.map(p => p.name === draggedPlayer.name ? target : p));
    }
    setDraggedPlayer(null);
    setDragSource(null);
  };

  const handleDropOnBench = (target: Player) => {
    if (!draggedPlayer) return;
    setDropTargetName(null);
    if (dragSource === 'bench') {
      setFanBench(prev => prev.map(p => {
        if (p.name === draggedPlayer.name) return target;
        if (p.name === target.name) return draggedPlayer;
        return p;
      }));
    } else {
      setFanStarters(prev => prev.map(p => p.name === draggedPlayer.name ? target : p));
      setFanBench(prev => prev.map(p => p.name === target.name ? draggedPlayer : p));
    }
    setDraggedPlayer(null);
    setDragSource(null);
  };

  const handleReset = () => {
    setFanStarters(allPlayers.slice(0, 11));
    setFanBench(allPlayers.slice(11));
    setFanFormation('4-3-3');
  };

  const renderPlayerCard = (player: Player, rIdx: number, pIdx: number, isDraggable: boolean, s: 'pitch' | 'bench', idx: number = 0, tot: number = 7) => (
    <FC26PlayerCard
      key={player.name}
      player={player}
      cardImg={playerCardImages[player.name]}
      isDraggable={isDraggable}
      onDragStart={handleDragStart}
      onDragOver={(name: string) => setDropTargetName(name)}
      onDragLeave={() => setDropTargetName(null)}
      onDrop={s === 'pitch' ? handleDropOnPitch : handleDropOnBench}
      dropTargetName={dropTargetName}
      isBench={s === 'bench'}
      source={s}
      index={idx}
      total={tot}
    />
  );

  const renderPitch = (rows: Player[][], isDraggable: boolean) => (
    <div className="flex-1 bg-[#1a3c1a] relative overflow-x-auto overflow-y-hidden border border-white/10 shadow-2xl">
      <div className="relative overflow-hidden min-h-[70vh] sm:min-w-[820px] w-full" style={{ perspective: '1000px' }}>
        {/* Grass Pattern: Alternating Green Stripes */}
        <div
          className="absolute inset-0"
          style={{
            background: `repeating-linear-gradient(
              to bottom,
              #2d5a27 0%,
              #2d5a27 10%,
              #356a2e 10%,
              #356a2e 20%
            )`,
            opacity: 0.95
          }}
        />

        {/* Subtle Grass Texture Overlay */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/grass.png")' }} />

        {/* Stadium Lighting Effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-white/10 rounded-full blur-[100px]" />
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-[100px]" />
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-white/5 rounded-full blur-[100px]" />
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-white/5 rounded-full blur-[100px]" />
        </div>

        {/* Field markings with glow effect */}
        <div className="absolute inset-0 pointer-events-none p-4">
          <div className={`relative w-full h-full border-2 [border-color:#E8E8E8]`}>
            {/* Center line */}
            <div className={`absolute top-1/2 left-0 w-full h-px bg-[#E8E8E8]`} />

            {/* Center circle & spot */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border [border-color:#E8E8E8] rounded-full flex items-center justify-center`}>
              <div className={`w-1.5 h-1.5 bg-[#E8E8E8] rounded-full shadow-[0_0_5px_#E8E8E8]`} />
            </div>

            {/* Penalty areas */}
            {/* Top */}
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-80 h-36 border [border-color:#E8E8E8]`}>
              {/* Goal area */}
              <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-36 h-14 border [border-color:#E8E8E8]`} />
              {/* Penalty spot */}
              <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#E8E8E8] rounded-full`} />
              {/* Penalty Arc (D-arc) */}
              <div className={`absolute -bottom-12 left-1/2 -translate-x-1/2 w-32 h-24 border [border-color:#E8E8E8] rounded-full`} style={{ clipPath: 'inset(50% 0 0 0)' }} />
            </div>

            {/* Bottom */}
            <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-80 h-36 border [border-color:#E8E8E8]`}>
              {/* Goal area */}
              <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-36 h-14 border [border-color:#E8E8E8]`} />
              {/* Penalty spot */}
              <div className={`absolute top-6 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#E8E8E8] rounded-full`} />
              {/* Penalty Arc (D-arc) */}
              <div className={`absolute -top-12 left-1/2 -translate-x-1/2 w-32 h-24 border [border-color:#E8E8E8] rounded-full`} style={{ clipPath: 'inset(0 0 50% 0)' }} />
            </div>

            {/* Corner Arcs */}
            <div className={`absolute top-0 left-0 w-8 h-8 border-r border-b [border-color:#E8E8E8] rounded-br-full`} />
            <div className={`absolute top-0 right-0 w-8 h-8 border-l border-b [border-color:#E8E8E8] rounded-bl-full`} />
            <div className={`absolute bottom-0 left-0 w-8 h-8 border-r border-t [border-color:#E8E8E8] rounded-tr-full`} />
            <div className={`absolute bottom-0 right-0 w-8 h-8 border-l border-t [border-color:#E8E8E8] rounded-tl-full`} />
          </div>
        </div>

        {/* Player positions flat (no slant) */}
        <div className="relative h-full w-full flex flex-col justify-between py-6 px-5 sm:min-h-[60vh]" style={{ minHeight: '50vh' }}>
          <div className="flex justify-around items-center h-1/5 sm:gap-0">
            {rows[3]?.map((p, i) => renderPlayerCard(p, 3, i, isDraggable, 'pitch'))}
          </div>
          <div className="flex justify-center gap-20 items-center h-1/5 sm:gap-0">
            {rows[2]?.map((p, i) => renderPlayerCard(p, 2, i, isDraggable, 'pitch'))}
          </div>
          <div className="flex justify-center h-1/5"></div>
          <div className="flex justify-around items-center h-1/5 sm:gap-0">
            {rows[1]?.map((p, i) => renderPlayerCard(p, 1, i, isDraggable, 'pitch'))}
          </div>
          <div className="flex justify-center items-center h-1/5 sm:gap-0">
            {rows[0]?.map((p, i) => renderPlayerCard(p, 0, i, isDraggable, 'pitch'))}
          </div>
        </div>
      </div>
    </div >
  );
  const CoachCard = () => {
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      const card = e.currentTarget;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const rotateXValue = ((y / rect.height) - 0.5) * -25;
      const rotateYValue = ((x / rect.width) - 0.5) * 25;

      setRotateX(rotateXValue);
      setRotateY(rotateYValue);
    };

    const handleMouseLeave = () => {
      setRotateX(0);
      setRotateY(0);
    };

    return (
      <div className="hidden lg:block absolute right-8 bottom-8 z-10 bench-player-wrapper">
        <motion.div
          initial={{ y: 0, opacity: 1, rotate: 0 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={() => window.open("https://www.transfermarkt.fr/nacif-beyaoui/profil/trainer/39332", "_blank", "noopener,noreferrer")}
          className="relative w-44 h-64 flex-shrink-0 cursor-pointer"
          style={{
            transformStyle: 'preserve-3d',
            perspective: 1000,
          }}
        >
          <div
            className="relative w-full h-full flex flex-col items-center"
            style={{
              transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
              transition: 'transform 0.1s ease-out'
            }}
          >
            <div className="mt-13 w-full h-[70%] relative z-10 flex justify-center items-end">
              <div className="relative w-full h-full">
                <NextImage
                  src="/cards/beyaoui.png"
                  alt="Coach Béjaoui"
                  fill
                  className="object-contain drop-shadow-2xl group-hover:grayscale-0 transition-all duration-300"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  const renderBench = (benchPlayers: Player[], isDraggable: boolean) => (
    <div className="relative w-full border-t border-[var(--border)] pt-6 pb-8 bg-[var(--background)]">
      <div className="flex items-center justify-between mb-12 px-10 border-b border-white/5 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-2 h-7 bg-[#d4af37] rounded-sm" />
          <h2 className="font-oswald font-bold text-3xl uppercase italic text-foreground" style={{ WebkitTextStroke: '1px black', textShadow: '0 0 1px #000' }}>{t.bench}</h2>
        </div>
        <div className="text-right">
          <span className="text-sm font-black text-[#d4af37] uppercase">{benchPlayers.length} / {allPlayers.length - 11}</span>
        </div>
      </div>
      <div className="overflow-x-auto overflow-y-hidden">
      <div className="flex justify-center items-end h-[300px] overflow-visible relative px-20 min-w-[900px] lg:min-w-0">
        <CoachCard />
        {benchPlayers.map((player, idx) => (
          <motion.div
            key={player.name}
            initial={{ marginLeft: idx === 0 ? 0 : -148 }}
            whileHover={{
              y: -30,
              scale: 1.05,
              zIndex: 100,
              transition: { type: "spring", stiffness: 600, damping: 25 }
            }}
            className="relative perspective-1000"
            style={{ zIndex: idx, originY: 1 }}
          >
            {renderPlayerCard(player, 0, 0, isDraggable, 'bench', idx, benchPlayers.length)}
          </motion.div>
        ))}
      </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <section id="team" className="relative py-48 bg-[var(--background)] flex flex-col items-center justify-center min-h-[60vh] overflow-hidden text-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
          <RefreshCw className="w-16 h-16 text-[var(--primary)] opacity-40" />
        </motion.div>
        <p className="mt-12 text-[var(--foreground)]/60 font-display font-black text-2xl uppercase tracking-[0.3em] animate-pulse italic">
          {t.loading}
        </p>
        {error && <p className="mt-4 text-red-500/60 text-[10px] font-mono uppercase tracking-[0.5em]">{error}</p>}
      </section>
    );
  }

  const fanRows = buildRows(fanStarters, formations[fanFormation]);
  const realRows = buildRows(realStarters, realFormation);

  return (
    <section id="team" ref={ref} className="relative py-32 overflow-hidden scroll-mt-24">
      <div className="absolute inset-0 bg-[var(--background)]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={inView ? { y: 0, opacity: 1 } : {}}
          className="text-center mb-16"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={scrollSpring}
            className="inline-block px-4 py-2 bg-[#C41E3A]/10 border border-[#C41E3A]/30 rounded-full text-[#C41E3A] text-sm font-semibold mb-3"
          >
            THE SQUAD
          </motion.span>
          <br />
          <div ref={squadRef} className="inline-block">
            <p
              className={`text-5xl lg:text-7xl font-display font-black uppercase tracking-tighter italic ${theme === 'light' ? 'text-[#8B0000]' : 'text-[#C41E3A]'}`}
              style={{ WebkitTextStroke: '1px black', textShadow: '0 0 1px #000' }}
            >
              <VariableProximityText
                label={language === 'ar' ? 'تشكيلة الفريق' : 'The Lineup'}
                fromFontVariationSettings="'wght' 300, 'opsz' 9"
                toFontVariationSettings="'wght' 1000, 'opsz' 40"
                containerRef={squadRef}
                radius={150}
                falloff="gaussian"
              />
            </p>
          </div>
          <br />

          {/* Latest match: CA logo vs latest opponent, auto-updates each fixture */}
          {latestResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...scrollTransition, delay: 0.2 }}
              className="inline-flex items-center gap-4 sm:gap-6 mt-7 px-6 sm:px-8 py-4 rounded-3xl bg-[var(--card)] border border-[var(--foreground)]/10 shadow-2xl backdrop-blur-xl"
            >
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center overflow-hidden">
                  <NextImage src="/clubs/beja.png" alt="Olympique Béja" width={40} height={40} className="object-contain" />
                </div>
                <span className="mt-1.5 text-[var(--foreground)] font-black uppercase tracking-wide text-xs sm:text-sm">Olympique Béja</span>
              </div>

              <div className="flex flex-col items-center px-2 sm:px-4">
                {latestResult.result === "Win" ? (
                  <span className="text-green-400 font-black text-2xl sm:text-3xl tracking-tight">{latestResult.score || "W"}</span>
                ) : latestResult.result === "Draw" ? (
                  <span className="text-yellow-400 font-black text-2xl sm:text-3xl tracking-tight">{latestResult.score || "D"}</span>
                ) : latestResult.result === "Loss" ? (
                  <span className="text-red-400 font-black text-2xl sm:text-3xl tracking-tight">{latestResult.score || "L"}</span>
                ) : (
                  <span className="text-[var(--primary)] font-black text-[10px] uppercase tracking-wider">{language === "ar" ? "آخر مباراة" : language === "fr" ? "Dernier match" : "Latest"}</span>
                )}
                <span className="mt-1 text-[var(--foreground)]/50 text-[10px] uppercase tracking-widest flex items-center gap-1">
                  <Calendar size={10} /> {latestResult.date}
                </span>
                {Array.isArray(latestResult.scorers) && latestResult.scorers.length > 0 && (
                  <span className="mt-1 text-[var(--foreground)]/60 text-[10px]">
                     {latestResult.scorers.map((s: any, i: number) => {
                      const txt = typeof s === 'string' ? s : s?.name ? `${s.minute ? s.minute + "' " : ""}${s.name}${s.assist ? ` (${s.assist})` : ""}` : "";
                      return txt;
                    }).filter(Boolean).join(" · ")}
                  </span>
                )}
              </div>

              <div className="flex flex-col items-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center overflow-hidden">
                  {latestOpponentLogo ? (
                    <NextImage src={latestOpponentLogo} alt={latestResult.opponent} width={40} height={40} className="object-contain p-1" />
                  ) : (
                    <span className="text-[var(--foreground)]/40 font-black text-lg">{latestResult.opponent?.slice(0, 1)}</span>
                  )}
                </div>
                <span className="mt-1.5 text-[var(--foreground)] font-black uppercase tracking-wide text-xs sm:text-sm">{latestResult.opponent}</span>
              </div>
            </motion.div>
          )}
        </motion.header>

        <AnimatePresence mode="wait">
          <motion.div key="real" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <div className="relative pt-4 rounded-[1rem] border border-[var(--border)] shadow-[0_40px_80px_rgba(0,0,0,0.4)] overflow-hidden bg-[var(--card)]">
              {/* Coach card — floating on the left side, mirroring the right coach card */}
              <div className="hidden xl:block absolute left-8 bottom-210 z-10 bench-player-wrapper pointer-events-none">
              </div>
              {renderPitch(realRows, false)}
              {renderBench(realBench, false)}
              <TransfersTable language={language} theme={theme} />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

// Transfers Table Component (Transfermarkt Data)
function TransfersTable({ language, theme }: { language: "en" | "fr" | "ar", theme: string }) {
  const [tab, setTab] = useState<'arrivals' | 'departures'>('arrivals');

  const arrivals = [
    {
      id: 1,
      name: "Seydina Mouhamed Diouf",
      pos: "Milieu offensif",
      posAr: "وسط هجومي",
      age: 21,
      nat: "Sénégal",
      natAr: "السنغال",
      club: "Al-Ettifaq SC",
      league: "Bahreïn",
      mv: "100 K €",
      fee: "Tr. libre",
      feeAr: "انتقال مجاني",
      url: "https://www.transfermarkt.fr/seydina-mouhamed-diouf/profil/spieler/1233776",
      flag: "/icon/profil.png"
    },
    {
      id: 2,
      name: "Yahia Achouri",
      pos: "Ailier gauche",
      posAr: "جناح أيسر",
      age: 25,
      nat: "Tunisie",
      natAr: "تونس",
      club: "AS Kasserine",
      league: "Ligue 1",
      mv: "150 K €",
      fee: "Tr. libre",
      feeAr: "انتقال مجاني",
      url: "https://www.transfermarkt.fr/yahia-achouri/profil/spieler/1021440",
      flag: "/icon/profil.png"
    },
    {
      id: 3,
      name: "Mohamed Amine Ammar",
      pos: "Milieu offensif",
      posAr: "وسط هجومي",
      age: 25,
      nat: "Tunisie",
      natAr: "تونس",
      club: "Libyan Stadium",
      league: "Libyan Premier League",
      mv: "50 K €",
      fee: "?",
      feeAr: "غير معلن",
      url: "https://www.transfermarkt.fr/mohamed-amine-ammar/profil/spieler/1069675",
      flag: "/icon/profil.png"
    },
    {
      id: 4,
      name: "Youssef Azib",
      pos: "Arrière gauche",
      posAr: "ظهير أيسر",
      age: 22,
      nat: "Tunisie",
      natAr: "تونس",
      club: "JS Kairouan",
      league: "Ligue 1",
      mv: "75 K €",
      fee: "?",
      feeAr: "غير معلن",
      url: "https://www.transfermarkt.fr/youssef-azib/profil/spieler/1069650",
      flag: "/icon/profil.png"
    },
    {
      id: 5,
      name: "Hamza Mabrouk",
      pos: "Défenseur central",
      posAr: "مدافع محوري",
      age: 32,
      nat: "Tunisie",
      natAr: "تونس",
      club: "Al-Kawkab",
      league: "Arabie Saoudite",
      mv: "25 K €",
      fee: "?",
      feeAr: "غير معلن",
      url: "https://www.transfermarkt.fr/hamza-mabrouk/profil/spieler/252745",
      flag: "/icon/profil.png"
    },
    {
      id: 6,
      name: "Hamdi Chairet",
      pos: "Gardien de but",
      posAr: "حارس مرمى",
      age: 26,
      nat: "Tunisie",
      natAr: "تونس",
      club: "Stade Gabèsien",
      league: "Ligue 1",
      mv: "-",
      fee: "?",
      feeAr: "غير معلن",
      url: "https://www.transfermarkt.fr/hamdi-chairet/profil/spieler/628190",
      flag: "/icon/profil.png"
    },
    {
      id: 7,
      name: "Ravel Djoumekou",
      pos: "Avant-centre",
      posAr: "مهاجم صريح",
      age: 26,
      nat: "Cameroun",
      natAr: "الكاميرون",
      club: "St-Éloi Lupopo",
      league: "RD Congo",
      mv: "50 K €",
      fee: "?",
      feeAr: "غير معلن",
      url: "https://www.transfermarkt.fr/ravel-djoumekou/profil/spieler/876494",
      flag: "/icon/profil.png"
    },
    {
      id: 8,
      name: "Alpha Sidibé",
      pos: "Milieu central",
      posAr: "وسط ميدان",
      age: 21,
      nat: "Côte d'Ivoire",
      natAr: "ساحل العاج",
      club: "US Monastir",
      league: "Ligue 1",
      mv: "75 K €",
      fee: "Prêt",
      feeAr: "إعارة",
      url: "https://www.transfermarkt.fr/alpha-sidibe/profil/spieler/961791",
      flag: "/icon/profil.png"
    },
    {
      id: 9,
      name: "Anicet Ishimwe",
      pos: "Ailier gauche",
      posAr: "جناح أيسر",
      age: 23,
      nat: "Rwanda",
      natAr: "رواندا",
      club: "Assabah SC",
      league: "Libyan Premier League",
      mv: "25 K €",
      fee: "Prêt",
      feeAr: "إعارة",
      url: "https://www.transfermarkt.fr/anicet-ishimwe/profil/spieler/844414",
      flag: "/icon/profil.png"
    }
  ];

  const departures = [
    {
      id: 1,
      name: "Achraf Krir",
      pos: "Gardien de but",
      posAr: "حارس مرمى",
      age: 34,
      nat: "Tunisie",
      natAr: "تونس",
      club: "Stade Gabèsien",
      league: "Ligue 1",
      mv: "75 K €",
      fee: "Tr. libre",
      feeAr: "انتقال مجاني",
      url: "https://www.transfermarkt.fr/achraf-krir/profil/spieler/337286",
      flag: "/icon/profil.png"
    },
    {
      id: 2,
      name: "Mohamed Ali Omri",
      pos: "Avant-centre",
      posAr: "مهاجم صريح",
      age: 24,
      nat: "Tunisie",
      natAr: "تونس",
      club: "PS Sakiet Eddaïer",
      league: "Ligue 1",
      mv: "50 K €",
      fee: "Tr. libre",
      feeAr: "انتقال مجاني",
      url: "https://www.transfermarkt.fr/mohamed-ali-omri/profil/spieler/1079252",
      flag: "/icon/profil.png"
    },
    {
      id: 3,
      name: "Mohamed Ali Ragoubi",
      pos: "Milieu offensif",
      posAr: "وسط هجومي",
      age: 33,
      nat: "Tunisie",
      natAr: "تونس",
      club: "Sans club",
      league: "Tunisie",
      mv: "125 K €",
      fee: "Tr. libre",
      feeAr: "انتقال مجاني",
      url: "https://www.transfermarkt.fr/mohamed-ali-ragoubi/profil/spieler/261348",
      flag: "/icon/profil.png"
    },
    {
      id: 4,
      name: "Elyes Mejri",
      pos: "Arrière gauche",
      posAr: "ظهير أيسر",
      age: 27,
      nat: "Tunisie",
      natAr: "تونس",
      club: "JS Omrane",
      league: "Ligue 1",
      mv: "100 K €",
      fee: "Tr. libre",
      feeAr: "انتقال مجاني",
      url: "https://www.transfermarkt.fr/elyes-mejri/profil/spieler/596183",
      flag: "/icon/profil.png"
    },
    {
      id: 5,
      name: "Firas Mahdhaoui",
      pos: "Milieu offensif",
      posAr: "وسط هجومي",
      age: 20,
      nat: "Tunisie",
      natAr: "تونس",
      club: "Stade Gabèsien",
      league: "Ligue 1",
      mv: "-",
      fee: "Tr. libre",
      feeAr: "انتقال مجاني",
      url: "https://www.transfermarkt.fr/firas-mahdhaoui/profil/spieler/1480444",
      flag: "/icon/profil.png"
    },
    {
      id: 6,
      name: "Aziz Gharbi",
      pos: "Défenseur central",
      posAr: "مدافع محوري",
      age: 23,
      nat: "Tunisie",
      natAr: "تونس",
      club: "JS Omrane",
      league: "Ligue 1",
      mv: "50 K €",
      fee: "?",
      feeAr: "غير معلن",
      url: "https://www.transfermarkt.fr/aziz-gharbi/profil/spieler/1274058",
      flag: "/icon/profil.png"
    },
    {
      id: 7,
      name: "Mohamed Aziz Nsibi",
      pos: "Gardien de but",
      posAr: "حارس مرمى",
      age: 22,
      nat: "Tunisie",
      natAr: "تونس",
      club: "Jendouba Sport",
      league: "Ligue 1",
      mv: "25 K €",
      fee: "Prêt",
      feeAr: "إعارة",
      url: "https://www.transfermarkt.fr/mohamed-aziz-nsibi/profil/spieler/1107376",
      flag: "/icon/profil.png"
    },
    {
      id: 8,
      name: "Mohamed Amine Dhouibi",
      pos: "Défenseur central",
      posAr: "مدافع محوري",
      age: 26,
      nat: "Tunisie",
      natAr: "تونس",
      club: "Sans club",
      league: "Tunisie",
      mv: "75 K €",
      fee: "-",
      feeAr: "-",
      url: "https://www.transfermarkt.fr/mohamed-amine-dhouibi/profil/spieler/855818",
      flag: "/icon/profil.png"
    },
    {
      id: 9,
      name: "Khaled Ben Oueda",
      pos: "Arrière droit",
      posAr: "ظهير أيمن",
      age: 26,
      nat: "Tunisie",
      natAr: "تونس",
      club: "Sans club",
      league: "Tunisie",
      mv: "100 K €",
      fee: "-",
      feeAr: "-",
      url: "https://www.transfermarkt.fr/khaled-ben-oueda/profil/spieler/1110740",
      flag: "/icon/profil.png"
    }
  ];

  const currentList = tab === 'arrivals' ? arrivals : departures;

  return (
    <div className="w-full border-t border-[var(--border)] pt-8 pb-10 px-4 sm:px-8 bg-[var(--background)]/90">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 border-b border-[var(--border)]/50 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-8 bg-[var(--primary)] rounded-sm" />
          <div>
            <h3 className="font-oswald font-bold text-2xl uppercase tracking-tight text-[var(--foreground)]">
              {language === 'ar' ? 'انتقالات موسم 2026/2027' : language === 'fr' ? 'Transferts 2026/2027' : 'Transfers 2026/2027'}
            </h3>
            <p className="text-xs text-[var(--foreground)]/50 font-mono">
              Source: Transfermarkt • Olympique Béja
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center p-1 bg-[var(--foreground)]/5 rounded-xl border border-[var(--foreground)]/10">
          <button
            onClick={() => setTab('arrivals')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
              tab === 'arrivals'
                ? 'bg-green-600 text-white shadow-md'
                : 'text-[var(--foreground)]/70 hover:text-[var(--foreground)]'
            }`}
          >
            {language === 'ar' ? 'أبرز القادمون (Arrivées)' : language === 'fr' ? 'Principales arrivées' : 'Key Arrivals'} ({arrivals.length})
          </button>
          <button
            onClick={() => setTab('departures')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
              tab === 'departures'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-[var(--foreground)]/70 hover:text-[var(--foreground)]'
            }`}
          >
            {language === 'ar' ? 'أبرز المغادرون (Départs)' : language === 'fr' ? 'Principaux départs' : 'Key Departures'} ({departures.length})
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--card)]/60 backdrop-blur-sm">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead>
            <tr className="bg-[var(--foreground)]/5 border-b border-[var(--border)] text-[11px] uppercase tracking-wider text-[var(--foreground)]/60 font-mono">
              <th className="py-3 px-3 w-10 text-center">#</th>
              <th className="py-3 px-4">{language === 'ar' ? 'اللاعب / المركز' : 'Joueur(s) / Poste'}</th>
              <th className="py-3 px-3 text-center">{language === 'ar' ? 'السن' : 'Âge'}</th>
              <th className="py-3 px-3">{language === 'ar' ? 'الجنسية' : 'Nationalité'}</th>
              <th className="py-3 px-4">{tab === 'arrivals' ? (language === 'ar' ? 'قادم من' : 'Venant de') : (language === 'ar' ? 'منتقل إلى' : 'Allant à')}</th>
              <th className="py-3 px-3">{language === 'ar' ? 'القيمة التسويقية' : 'VM à ce moment'}</th>
              <th className="py-3 px-4">{language === 'ar' ? 'قيمة الصفقة' : 'Montant de transfert'}</th>
              <th className="py-3 px-3 text-center">Transfermarkt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]/40">
            {currentList.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-[var(--foreground)]/5 transition-colors cursor-pointer group"
                onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
                title={`${item.name} - Ouvrir sur Transfermarkt`}
              >
                {/* # */}
                <td className="py-3 px-3 text-center font-bold text-[var(--foreground)]/40 font-mono text-xs">
                  {item.id}
                </td>

                {/* Joueur / Position */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="relative w-6 h-6 rounded-full overflow-hidden flex-shrink-0 border border-white/10">
                      <NextImage src={item.flag} alt="" fill className="object-cover" sizes="24px" />
                    </div>
                    <div>
                      <p className="font-bold text-[var(--foreground)] text-sm group-hover:text-[var(--primary)] transition-colors">
                        {item.name}
                      </p>
                      <span className="text-[11px] text-[var(--primary)] font-medium">
                        {language === 'ar' ? item.posAr : item.pos}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Âge */}
                <td className="py-3 px-3 text-center font-mono text-xs text-[var(--foreground)]/80">
                  {item.age}
                </td>

                {/* Nationalité */}
                <td className="py-3 px-3 text-xs text-[var(--foreground)]/80">
                  {language === 'ar' ? item.natAr : item.nat}
                </td>

                {/* Club & League */}
                <td className="py-3 px-4">
                  <p className="font-bold text-[var(--foreground)]/90 text-xs">{item.club}</p>
                  <span className="text-[10px] text-[var(--foreground)]/50 font-mono">{item.league}</span>
                </td>

                {/* VM */}
                <td className="py-3 px-3 text-xs font-mono font-bold text-[var(--foreground)]/80">
                  {item.mv}
                </td>

                {/* Montant de transfert */}
                <td className="py-3 px-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    item.fee.includes('Tr. libre') || item.fee.includes('مجاني')
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : item.fee.includes('Prêt') || item.fee.includes('إعارة')
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : item.fee === '-' || item.fee === '?'
                      ? 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                      : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  }`}>
                    {language === 'ar' ? item.feeAr : item.fee}
                  </span>
                </td>

                {/* Transfermarkt link */}
                <td className="py-3 px-3 text-center">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--foreground)]/5 hover:bg-[var(--primary)] text-[var(--foreground)]/60 hover:text-white transition-all text-xs"
                    title="Voir profil Transfermarkt"
                  >
                    ↗
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const FALLBACK_NEWS_IMAGES = [
  "/beja.png",
];

const FALLBACK_NEWS = (language: "en" | "fr" | "ar") => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = now.toLocaleDateString(language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US', { month: 'short' }).toUpperCase();
  const year = now.getFullYear();
  const dateStr = `${day} ${month} ${year}`;

  const day1 = new Date(now.getTime() - 86400000);
  const d1 = String(day1.getDate()).padStart(2, '0');
  const m1 = day1.toLocaleDateString(language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US', { month: 'short' }).toUpperCase();
  const dateStr1 = `${d1} ${m1} ${year}`;

  const day2 = new Date(now.getTime() - 2 * 86400000);
  const d2 = String(day2.getDate()).padStart(2, '0');
  const m2 = day2.toLocaleDateString(language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US', { month: 'short' }).toUpperCase();
  const dateStr2 = `${d2} ${m2} ${year}`;

  const day3 = new Date(now.getTime() - 3 * 86400000);
  const d3 = String(day3.getDate()).padStart(2, '0');
  const m3 = day3.toLocaleDateString(language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US', { month: 'short' }).toUpperCase();
  const dateStr3 = `${d3} ${m3} ${year}`;

  const day4 = new Date(now.getTime() - 4 * 86400000);
  const d4 = String(day4.getDate()).padStart(2, '0');
  const m4 = day4.toLocaleDateString(language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US', { month: 'short' }).toUpperCase();
  const dateStr4 = `${d4} ${m4} ${year}`;

  const day5 = new Date(now.getTime() - 5 * 86400000);
  const d5 = String(day5.getDate()).padStart(2, '0');
  const m5 = day5.toLocaleDateString(language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US', { month: 'short' }).toUpperCase();
  const dateStr5 = `${d5} ${m5} ${year}`;

  const allFallbackNews = [
    { title: language === "ar" ? "الأولمبي الباجي يستعد لمواجهة الترجي" : language === "fr" ? "Olympique Béja prépare le choc face à l'Espérance" : "Olympique Béja prepares for Espérance clash", date: dateStr, source: "Official Site", image: "/beja.png", url: "https://olympique-beja.com/actualites/preparation-esperance", timestamp: now.getTime() },
    { title: language === "ar" ? "راعي جديد لقميص الفريق للموسم 2026/27" : language === "fr" ? "Nouveau sponsor maillot pour la saison 2026/27" : "New kit sponsor for 2026/27 season", date: dateStr1, source: "Foot24", image: "/beja.png", url: "https://www.foot24.tn/equipe/olympique-beja/nouveau-sponsor-2026-27", timestamp: day1.getTime() },
    { title: language === "ar" ? "انتهاء أشغال تجديد ملعب بوجمعة كميتي" : language === "fr" ? "Travaux de rénovation du stade Boujemaa Kmiti terminés" : "Stade Boujemaa Kmiti renovation completed", date: dateStr2, source: "Tunisie Numérique", image: "/beja.png", url: "https://www.tunisienumerique.com/sport/stade-boujemaa-kmiti-renovation", timestamp: day2.getTime() },
    { title: language === "ar" ? "الميركاتو: تعاقدان جديدان مع الأولمبي الباجي" : language === "fr" ? "Mercato : deux nouvelles recrues à l'OB" : "Mercato: two new signings for OB", date: dateStr3, source: "FootTN", image: "/beja.png", url: "https://www.foottn.com/mercato/olympique-beja-deux-recrues", timestamp: day3.getTime() },
    { title: language === "ar" ? "فريق تحت 21 سنة يتوج بطلاً لتونس" : language === "fr" ? "L'équipe U21 championne de Tunisie" : "U21 team crowned Tunisia champions", date: dateStr4, source: "TunisiaSports", image: "/beja.png", url: "https://www.tunisisports.net/equipe/olympique-beja/u21-champion", timestamp: day4.getTime() },
    { title: language === "ar" ? "بليعل إيفة يمدد عقده حتى 2029" : language === "fr" ? "Bilel Ifa prolonge jusqu'en 2029" : "Bilel Ifa extends contract until 2029", date: dateStr5, source: "Nessma Sport", image: "/beja.png", url: "https://www.nessmashort.net/sport/bilel-ifa-prolongation-2029", timestamp: day5.getTime() },
  ];

  return allFallbackNews;
};

type NewsItemType = { title: string; date: string; source: string; image: string; url: string; timestamp?: number };

// News section
function NewsSection({ language, theme }: { language: "en" | "fr" | "ar", theme: string }) {
  const t = translations[language].news;
  const newsRef = useRef<HTMLDivElement>(null);
  const { ref, inView } = useInView({ threshold: 0.2, triggerOnce: true });
  const [news, setNews] = useState<NewsItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllNews, setShowAllNews] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/news')
      .then((res) => res.json())
      .then((data: { items?: NewsItemType[] }) => {
        if (cancelled) return;
        const items = data?.items ?? [];
        if (items.length > 0) {
          setNews(items.map((i) => ({ title: i.title, date: i.date, source: i.source, image: i.image, url: i.url, timestamp: i.timestamp })));
        } else {
          setNews(FALLBACK_NEWS(language));
        }
      })
      .catch(() => {
        if (!cancelled) setNews(FALLBACK_NEWS(language));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [language]);

  const allNews = (news.length > 0 ? news : FALLBACK_NEWS(language)).sort(
    (a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0)
  );
  const displayNews = showAllNews ? allNews : allNews.slice(0, 3);
  const hasMore = allNews.length > 3;

  return (
    <section id="news" ref={ref} className="relative py-10 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--background)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={scrollTransition}
          className="text-center mb-6"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={scrollSpring}
            className="inline-block px-4 py-2 bg-[var(--primary)]/10 border border-[var(--primary)]/30 rounded-full text-[var(--primary)] text-sm font-semibold mb-3"
          >
            {t.header}
          </motion.span>
          <br />
          <div ref={newsRef} className="inline-block">
            <p
              className={`text-5xl lg:text-7xl font-display font-black uppercase tracking-tighter italic ${theme === 'light' ? 'text-[#8B0000]' : 'text-[#C41E3A]'}`}
              style={{ WebkitTextStroke: '1px black', textShadow: '0 0 1px #000' }}
            >
              <VariableProximityText
                label={t.title}
                fromFontVariationSettings="'wght' 300, 'opsz' 9"
                toFontVariationSettings="'wght' 1000, 'opsz' 40"
                containerRef={newsRef}
                radius={150}
                falloff="gaussian"
              />
            </p>
          </div>
          <p className="text-[var(--foreground)] opacity-60 max-w-xl mx-auto text-sm mt-3">
            {t.subtitle}
          </p>
        </motion.div>

        {/* News grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {loading
            ? [1, 2, 3].map((i) => (
              <motion.div
                key={`skeleton-${i}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="group"
              >
                <div className="aspect-video rounded-2xl bg-[var(--foreground)]/10 animate-pulse" />
                <div className="mt-4 h-4 w-1/3 rounded bg-[var(--foreground)]/10 animate-pulse" />
                <div className="mt-3 h-6 w-full rounded bg-[var(--foreground)]/10 animate-pulse" />
                <div className="mt-2 h-4 w-2/3 rounded bg-[var(--foreground)]/10 animate-pulse" />
              </motion.div>
            ))
            : displayNews.map((item, index) => (
              <motion.article
                key={`${item.url}-${index}`}
                initial={{ opacity: 0, y: 48 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: index * 0.12, ...scrollTransitionFast }}
                whileHover={{ y: -10, transition: scrollTransitionFast }}
                className="group rounded-3xl border border-[var(--foreground)]/15 hover:border-[var(--primary)]/50 bg-[var(--card)] p-4 shadow-xl transition-all duration-300"
              >
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block cursor-pointer"
                >
                  <div className="relative overflow-hidden rounded-2xl">
                    <div className="aspect-video overflow-hidden">
                      <motion.img
                        src="/beja.png"
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <motion.span
                      initial={{ x: -100 }}
                      animate={inView ? { x: 0 } : {}}
                      transition={{ delay: index * 0.12 + 0.25, ...scrollTransitionFast }}
                      className="absolute top-4 left-4 bg-[var(--primary)] text-white px-3 py-1 rounded-full text-sm font-semibold"
                    >
                      {item.source}
                    </motion.span>
                  </div>
                  <div className="mt-4">
                    <p className="text-[var(--foreground)] opacity-50 text-sm flex items-center gap-2">
                      <Calendar size={14} />
                      {item.date}
                    </p>
                    <h3 className="text-[var(--foreground)] font-bold text-xl mt-2 group-hover:text-[var(--primary)] transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                    <span className="inline-flex items-center gap-1 text-[var(--primary)] mt-3 font-semibold">
                      {t.more} <ArrowRight size={16} />
                    </span>
                  </div>
                </a>
              </motion.article>
            ))}
        </div>

        {hasMore && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            className="text-center mt-12"
          >
            <button
              onClick={() => setShowAllNews(!showAllNews)}
              className="px-8 py-3 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 border border-[var(--primary)]/30 rounded-xl text-[var(--primary)] font-bold transition-all"
            >
              {showAllNews ? (language === 'ar' ? 'عرض أقل' : language === 'fr' ? 'Voir moins' : 'Show Less') : (language === 'ar' ? 'عرض كل الأخبار' : language === 'fr' ? 'Voir toutes les actualités' : 'Show All News')}
            </button>
          </motion.div>
        )}
      </div>
    </section>
  );
}

// ============================================================
// OLYMPIQUE BÉJA — 2026/27 SEASON
// Ligue 1
// ============================================================

const ALL_RESULTS = [
  // =========================
  // LIGUE 1
  // =========================

  {
    opponent: "US Ben Guerdane",
    score: "1-2",
    date: "30 Août 2026",
    time: "16:30",
    competition: "Ligue 1",
    result: "Loss",
    venue: "Stade Boujemaa Kmiti",
    matchday: "J2",
    scorers: [{ name: "Hasni B.", minute: 69, assist: "Gafsi H." }],
    highlightUrl:
      "https://www.youtube.com/results?search_query=Olympique+B%C3%A9ja+1-2+US+Ben+Guerdane+2026",
  },

  {
    opponent: "ES Zarzis",
    score: "0-1",
    date: "23 Août 2026",
    time: "16:30",
    competition: "Ligue 1",
    result: "Loss",
    venue: "Stade Abdessalam Kazouz (Zlidi)",
    matchday: "J1",
    scorers: [],
    highlightUrl:
      "https://www.youtube.com/results?search_query=ES+Zarzis+1-0+Olympique+B%C3%A9ja+2026",
  },
];


// ============================================================
// UPCOMING MATCHES
// ============================================================

const DEFAULT_UPCOMING_MATCHES: Array<{
  opponent: string;
  date: string;
  time: string;
  competition: string;
  venue: string;
  matchday: string;
  conditional?: boolean;
}> = [

  // =========================
  // LIGUE 1
  // =========================

  {
    opponent: "CA Bizertin",
    date: "05 Septembre 2026",
    time: "16:30",
    competition: "Ligue 1",
    venue: "Stade 15 Octobre",
    matchday: "J3",
  },

  {
    opponent: "PS Sakiet Eddaïer",
    date: "12 Septembre 2026",
    time: "16:30",
    competition: "Ligue 1",
    venue: "Stade Boujemaa Kmiti",
    matchday: "J4",
  },

  {
    opponent: "Espérance de Tunis",
    date: "10 Octobre 2026",
    time: "16:30",
    competition: "Ligue 1",
    venue: "Stade Olympique de Radès",
    matchday: "J5",
  },

  {
    opponent: "ES Sahel",
    date: "17 Octobre 2026",
    time: "16:30",
    competition: "Ligue 1",
    venue: "Stade Boujemaa Kmiti",
    matchday: "J6",
  },

  {
    opponent: "JS Omrane",
    date: "24 Octobre 2026",
    time: "16:30",
    competition: "Ligue 1",
    venue: "Stade El Menzah",
    matchday: "J7",
  },

  {
    opponent: "AS Marsa",
    date: "21 Novembre 2026",
    time: "17:30",
    competition: "Ligue 1",
    venue: "Stade Boujemaa Kmiti",
    matchday: "J8",
  },

  {
    opponent: "CS Hammam-Lif",
    date: "28 Novembre 2026",
    time: "17:30",
    competition: "Ligue 1",
    venue: "Stade Bou Kornine",
    matchday: "J9",
  },

  {
    opponent: "ES Métlaoui",
    date: "05 Décembre 2026",
    time: "17:30",
    competition: "Ligue 1",
    venue: "Stade Boujemaa Kmiti",
    matchday: "J10",
  },

  {
    opponent: "CS Sfaxien",
    date: "12 Décembre 2026",
    time: "17:30",
    competition: "Ligue 1",
    venue: "Stade Boujemaa Kmiti",
    matchday: "J11",
  },

  {
    opponent: "US Monastir",
    date: "19 Décembre 2026",
    time: "17:30",
    competition: "Ligue 1",
    venue: "Stade Mustapha Ben Jannet",
    matchday: "J12",
  },

  {
    opponent: "Club Africain",
    date: "26 Décembre 2026",
    time: "17:30",
    competition: "Ligue 1",
    venue: "Stade Boujemaa Kmiti",
    matchday: "J13",
  },

  {
    opponent: "ES Hammam Sousse",
    date: "30 Décembre 2026",
    time: "17:30",
    competition: "Ligue 1",
    venue: "Stade Boujemaa Kmiti",
    matchday: "J14",
  },

  {
    opponent: "Stade Tunisien",
    date: "02 Janvier 2027",
    time: "16:30",
    competition: "Ligue 1",
    venue: "Stade Boujemaa Kmiti",
    matchday: "J15",
  },
];

// Matches section (Results and Next Matches)
function MatchesSection({ language, theme }: { language: "en" | "fr" | "ar", theme: string }) {
  const t = translations[language].matches;
  const matchdayRef = useRef<HTMLDivElement>(null);
  const { ref, inView } = useInView({ threshold: 0.2, triggerOnce: true });
  const [activeTab, setActiveTab] = useState<"upcoming" | "results">("upcoming");
  const [activeCompetition, setActiveCompetition] = useState("All");
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [showAllResults, setShowAllResults] = useState(false);
  const [allUpcomingMatches, setAllUpcomingMatches] = useState(DEFAULT_UPCOMING_MATCHES);
  const [allResults, setAllResults] = useState(ALL_RESULTS);

  // Fetch real fixtures from API (auto-refresh every 2 minutes)
  useEffect(() => {
    const fetchFixtures = () => {
      fetch('/api/fixtures')
        .then(res => res.json())
        .then(data => {
          if (data.upcoming && Array.isArray(data.upcoming) && data.upcoming.length > 0) {
            setAllUpcomingMatches(data.upcoming);
          }
          if (data.recent && Array.isArray(data.recent) && data.recent.length > 0) {
            setAllResults(data.recent);
          }
        })
        .catch(() => {});
    };
    fetchFixtures();
    const interval = setInterval(fetchFixtures, 120000);
    return () => clearInterval(interval);
  }, []);

  // Club Logo Mapping
  const clubLogos: { [key: string]: string } = {
    "ES Metlaoui": "/clubs/esm.png",
    "ES Métlaoui": "/clubs/esm.png",
    "Olympique Béja": "/clubs/beja.png",
    "CS Hammam-Lif": "/clubs/cshl.png",
    "US Monastir": "/clubs/usm.png",
    "ES Hammam-Sousse": "/clubs/eshs.png",
    "ES Hammam Sousse": "/clubs/eshs.png",
    "PS Sakiet Eddaïer": "/clubs/psse.png",
    "Stade Tunisien": "/clubs/st.png",
    "Esperance Tunis": "/clubs/est.png",
    "Espérance de Tunis": "/clubs/est.png",
    "JS Omrane": "/clubs/jso.png",
    "CS Sfaxien": "/clubs/css.png",
    "CA Bizertin": "/clubs/cab.png",
    "Club Africain": "/clubs/ca.png",
    "CA": "/clubs/ca.png",
    "ES Zarzis": "/clubs/esz.png",
    "ES Sahel": "/clubs/ess.png",
    "AS Marsa": "/clubs/marsa.png",
    "US Ben Guerdane": "/clubs/usb.png",
  };

  const getClubLogo = (teamName: string) => clubLogos[teamName] || null;

  // Competition filter options (custom priority order, then alphabetical)
  const competitionOptions = useMemo(() => {
    const priority = ["Ligue 1"];
    const set = new Set<string>();
    [...allUpcomingMatches, ...allResults].forEach(m => {
      if (m.competition) set.add(m.competition);
    });
    const others = [...set].filter(c => !priority.includes(c)).sort();
    return ["All", ...priority.filter(c => set.has(c)), ...others];
  }, [allUpcomingMatches, allResults]);

  const filteredUpcoming =
    activeCompetition === "All"
      ? allUpcomingMatches
      : allUpcomingMatches.filter(m => m.competition === activeCompetition);

  const filteredResults =
    activeCompetition === "All"
      ? allResults
      : allResults.filter(m => m.competition === activeCompetition);

  const visibleUpcoming = showAllUpcoming ? filteredUpcoming : filteredUpcoming.slice(0, 2);
  const visibleResults = showAllResults ? filteredResults : filteredResults.slice(0, 3);

  // Recent form guide (last 5 results)
  const form = allResults.slice(0, 5).map(r => r.result);

  const formColor = (result: string) => {
    if (result === "Win") return "bg-green-500/15 border border-green-500/40 text-green-400";
    if (result === "Draw") return "bg-yellow-500/15 border border-yellow-500/40 text-yellow-400";
    return "bg-red-500/15 border border-red-500/40 text-red-400";
  };

  const resultColor = (result: string) => {
    if (result === "Win") return { chip: formColor(result), label: "✓" };
    if (result === "Draw") return { chip: formColor(result), label: "=" };
    return { chip: formColor(result), label: "✗" };
  };

  const langLabel = (en: string, fr: string, ar: string) =>
    language === "ar" ? ar : language === "fr" ? fr : en;

  return (
    <section id="matches" ref={ref} className="relative py-20 overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-[var(--background)]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[var(--primary)] rounded-full blur-[180px] opacity-[0.07] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-[#D4AF37] rounded-full blur-[200px] opacity-[0.05] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={scrollTransition}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/30 text-[var(--primary)] text-xs font-bold uppercase tracking-widest">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--primary)]" />
            </span>
            {langLabel("Season 2026/27", "Saison 2026/27", "موسم 2026/27")}
          </span>
          <br />
          <div ref={matchdayRef} className="inline-block mt-4">
            <p
              className={`text-5xl lg:text-7xl font-display font-black uppercase tracking-tighter italic ${theme === 'light' ? 'text-[#8B0000]' : 'text-[#C41E3A]'}`}
              style={{ WebkitTextStroke: '1px black', textShadow: '0 0 1px #000' }}
            >
              <VariableProximityText
                label={t.title}
                fromFontVariationSettings="'wght' 300, 'opsz' 9"
                toFontVariationSettings="'wght' 1000, 'opsz' 40"
                containerRef={matchdayRef}
                radius={150}
                falloff="gaussian"
              />
            </p>
          </div>
          <p className="text-[var(--foreground)] opacity-60 text-sm mt-3 tracking-wide">
            <span className="inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
              {t.stats}
            </span>
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...scrollTransition, delay: 0.05 }}
          className="flex justify-center mb-6"
        >
          <div className="inline-flex items-center gap-1 p-1.5 rounded-full bg-[var(--card)]/80 border border-[var(--foreground)]/10 shadow-xl backdrop-blur-xl">
            {(["upcoming", "results"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setShowAllUpcoming(false);
                  setShowAllResults(false);
                }}
                className={`relative px-6 sm:px-8 py-2.5 rounded-full text-sm font-black uppercase tracking-wider transition-colors ${
                  activeTab === tab ? "text-white" : "text-[var(--foreground)]/50 hover:text-[var(--foreground)]"
                }`}
              >
                {activeTab === tab && (
                  <motion.span
                    layoutId="matchesTabPill"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/85 shadow-lg shadow-[var(--primary)]/30"
                    transition={{ type: "spring", bounce: 0.25, duration: 0.55 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {tab === "upcoming" ? <Calendar size={14} /> : <Trophy size={14} />}
                  {tab === "upcoming" ? t.upcoming : t.results}
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.5 leading-none rounded-full ${
                      activeTab === tab ? "bg-white/20 text-white" : "bg-[var(--primary)]/15 text-[var(--primary)]"
                    }`}
                  >
                    {tab === "upcoming" ? filteredUpcoming.length : filteredResults.length}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Competition filter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ ...scrollTransition, delay: 0.1 }}
          className="flex flex-wrap justify-center gap-2 mb-12"
        >
          {competitionOptions.map(comp => (
            <button
              key={comp}
              onClick={() => {
                setActiveCompetition(comp);
                setShowAllUpcoming(false);
                setShowAllResults(false);
              }}
              className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider border transition-all ${
                activeCompetition === comp
                  ? "bg-[var(--primary)] border-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/30 scale-105"
                  : "bg-[var(--card)]/70 border-[var(--foreground)]/10 text-[var(--foreground)]/60 hover:border-[var(--primary)]/40 hover:text-[var(--foreground)]"
              }`}
            >
              {comp}
            </button>
          ))}
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === "upcoming" ? (
              <motion.div
                key={`upcoming-${activeCompetition}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={scrollTransitionFast}
                className="space-y-5"
              >
                {visibleUpcoming.map((match, index) => (
                  <motion.div key={index} whileHover={{ y: -5 }} className="group relative">
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[var(--primary)]/30 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative overflow-hidden rounded-3xl bg-[var(--card)]/90 backdrop-blur-xl border border-[var(--foreground)]/10 hover:border-[var(--primary)]/40 p-5 sm:p-6 shadow-xl transition-all duration-300">
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-[var(--primary)]/5 blur-2xl pointer-events-none" />

                      {/* Header row */}
                      <div className="relative flex flex-wrap items-center justify-between gap-2 mb-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--primary)]/15 border border-[var(--primary)]/25 text-[var(--primary)] text-[11px] font-bold uppercase tracking-wider">
                            <Trophy size={11} /> {match.competition}
                          </span>
                          {match.matchday && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 text-[var(--foreground)]/60 text-[10px] font-bold uppercase tracking-wider">
                              {match.matchday}
                            </span>
                          )}
                          {match.conditional && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-[10px] font-bold uppercase tracking-wider">
                              {langLabel("Conditional", "Sous condition", "مشروط")}
                            </span>
                          )}
                        </div>
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 text-[var(--foreground)]/70 text-[11px] font-bold">
                          <Calendar size={11} /> {match.date}
                          <span className="opacity-30">•</span>
                          <Clock size={11} /> {match.time}
                        </span>
                      </div>

                      {/* Teams row with VS in the center */}
                      <div className="relative flex items-center justify-between gap-2 sm:gap-4">
                        {/* Home team */}
                        <div className="flex flex-col items-center justify-center flex-1 min-w-0 py-1.5">
                          <div className="relative w-12 h-12 sm:w-16 sm:h-16 mb-2 flex items-center justify-center">
                            <NextImage src="/clubs/beja.png" alt="Olympique Béja" width={56} height={56} className="object-contain" />
                          </div>
                          <p className="text-[var(--foreground)] font-black uppercase tracking-wide text-sm sm:text-base truncate">Olympique Béja</p>
                        </div>

                        {/* VS badge — between the two clubs */}
                        <div className="relative flex flex-col items-center justify-center">
                          <motion.span
                            animate={{ scale: [1, 1.08, 1] }}
                            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                            className="text-[var(--primary)] font-black italic text-2xl sm:text-3xl tracking-widest drop-shadow-[0_2px_6px_rgba(200,16,46,0.35)]"
                          >
                            VS
                          </motion.span>
                        </div>

                        {/* Away team */}
                        <div className="flex flex-col items-center justify-center flex-1 min-w-0 py-1.5">
                          <div className="relative w-12 h-12 sm:w-16 sm:h-16 mb-2 flex items-center justify-center">
                            {getClubLogo(match.opponent) ? (
                              <NextImage src={getClubLogo(match.opponent)!} alt={match.opponent} width={56} height={56} className="object-contain" />
                            ) : (
                              <span className="text-[var(--foreground)]/40 font-black text-lg">{match.opponent.slice(0, 1)}</span>
                            )}
                          </div>
                          <p className="text-[var(--foreground)] font-black uppercase tracking-wide text-sm sm:text-base truncate text-right">{match.opponent}</p>
                        </div>
                      </div>

                      {/* Footer row */}
                      <div className="relative mt-5 pt-4 border-t border-[var(--foreground)]/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <span className="inline-flex items-center gap-1.5 text-[var(--foreground)]/50 text-sm">
                          <MapPin size={13} /> {match.venue}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {visibleUpcoming.length === 0 && (
                  <div className="text-center py-16 text-[var(--foreground)]/40">
                    {langLabel("No fixtures for this competition.", "Aucune rencontre pour cette compétition.", "لا توجد مباريات لهذه المسابقة.")}
                  </div>
                )}

                {filteredUpcoming.length > 2 && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowAllUpcoming(!showAllUpcoming)}
                    className="w-full mt-2 bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10 border border-[var(--foreground)]/10 hover:border-[var(--primary)]/50 text-[var(--foreground)] py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                  >
                    {showAllUpcoming
                      ? langLabel("Show Less", "Voir moins", "عرض أقل")
                      : langLabel(`Show All ${filteredUpcoming.length} Upcoming`, `Voir les ${filteredUpcoming.length} rencontres`, `عرض كل ${filteredUpcoming.length} مباريات`)}
                    <ChevronDown className={`transform transition-transform ${showAllUpcoming ? "rotate-180" : ""}`} size={18} />
                  </motion.button>
                )}
              </motion.div>
            ) : (
              <motion.div
                key={`results-${activeCompetition}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={scrollTransitionFast}
                className="space-y-5"
              >
                {/* Form guide */}
                <div className="flex items-center justify-center gap-4 py-4 rounded-2xl bg-[var(--card)]/70 border border-[var(--foreground)]/10 backdrop-blur-xl mb-8">
                  <span className="text-[var(--foreground)]/50 text-[10px] font-black uppercase tracking-[0.2em]">
                    {langLabel("Form", "Forme", "النتائج الأخيرة")}
                  </span>
                  <div className="flex gap-1.5">
                    {form.length === 0 && <span className="text-[var(--foreground)]/30 text-xs">—</span>}
                    {form.map((r, i) => (
                      <div key={i} title={r} className={`w-7 h-7 rounded-lg ${formColor(r)} flex items-center justify-center text-[11px] font-black`}>
                        {r === "Win" ? "W" : r === "Draw" ? "D" : "L"}
                      </div>
                    ))}
                  </div>
                </div>

                {visibleResults.map((result, index) => (
                  <motion.div key={index} whileHover={{ y: -4 }} className="group">
                    <a href={result.highlightUrl} target="_blank" rel="noopener noreferrer" className="block h-full">
                      <div
                        className={`relative overflow-hidden rounded-3xl bg-[var(--card)]/90 backdrop-blur-xl border p-5 sm:p-6 shadow-xl transition-all duration-300 ${
                          result.result === "Win"
                            ? "border-green-500/20 hover:border-green-500/50"
                            : result.result === "Draw"
                            ? "border-yellow-500/20 hover:border-yellow-500/50"
                            : "border-red-500/20 hover:border-red-500/50"
                        }`}
                      >
                        <div
                          className={`absolute -right-12 -top-12 w-44 h-44 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${
                            result.result === "Win"
                              ? "bg-green-500/10"
                              : result.result === "Draw"
                              ? "bg-yellow-500/10"
                              : "bg-red-500/10"
                          }`}
                        />

                        {/* Highlights hint */}
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0 z-10">
                          <span className="bg-[var(--primary)] text-white text-[10px] uppercase font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg">
                            <Play size={9} fill="currentColor" /> {langLabel("Highlights", "Résumé", "الملخص")}
                          </span>
                        </div>

                        {/* Header row */}
                        <div className="flex items-center justify-between mb-4 pr-16 gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--primary)]/15 border border-[var(--primary)]/25 text-[var(--primary)] text-[11px] font-bold uppercase">
                              <Trophy size={11} />
                              {(() => {
                                const c = String(result.competition || 'Ligue 1 Pro').toLowerCase();
                                if (c === 'amical') return 'Amical';
                                if (c.includes('cup') || c.includes('coupe')) return 'Coupe de Tunisie';
                                return result.matchday ? (String(result.matchday).startsWith('J') || String(result.matchday).startsWith('MD') ? result.matchday : `MD${result.matchday}`) : 'Ligue 1 Pro';
                              })()}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border font-black text-[10px] uppercase ${resultColor(result.result).chip}`}>
                              {resultColor(result.result).label} {result.result === "Win" ? langLabel("Win", "Victoire", "فوز") : result.result === "Draw" ? langLabel("Draw", "Nul", "تعادل") : result.result === "Loss" ? langLabel("Loss", "Défaite", "خسارة") : result.result || "Terminé"}
                            </span>
                          </div>
                          <span className="hidden sm:inline-flex items-center gap-1.5 text-[var(--foreground)]/50 text-xs">
                            <Calendar size={11} /> {result.date}
                          </span>
                        </div>

                        {/* Teams & score */}
                        <div className="flex items-center justify-between gap-3 sm:gap-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              <NextImage src="/clubs/beja.png" alt="OB" width={24} height={24} className="object-contain" />
                            </div>
                            <p className="text-[var(--foreground)] font-black tracking-wide text-sm sm:text-base truncate">Olympique Béja</p>
                          </div>

                          <div className={`hidden sm:block font-black text-2xl tracking-widest px-4 py-1.5 rounded-xl ${resultColor(result.result).chip}`}>
                            {result.score}
                          </div>

                          <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
                            <p className="text-[var(--foreground)] font-black tracking-wide text-sm sm:text-base truncate text-right">{result.opponent}</p>
                            <div className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                              {getClubLogo(result.opponent) ? (
                                <NextImage src={getClubLogo(result.opponent)!} alt={result.opponent} fill className="object-contain p-1.5" sizes="40px" />
                              ) : (
                                <span className="text-[var(--foreground)]/40 font-black text-sm">{result.opponent.slice(0, 1)}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Mobile score */}
                        <div className="sm:hidden flex items-center justify-center my-3">
                          <div className={`font-black text-xl tracking-widest px-4 py-1 rounded-lg ${resultColor(result.result).chip}`}>{result.score}</div>
                        </div>

                        {/* Scorers & date */}
                        <div className="mt-5 pt-4 border-t border-[var(--foreground)]/10 flex items-center justify-between gap-3 text-xs">
                          <div className="text-[var(--foreground)]/60 flex items-center gap-2 min-w-0">
                            {Array.isArray(result.scorers) && result.scorers.length > 0 ? (
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span className="text-sm leading-none"></span>
                                {result.scorers.map((scorerItem: any, idx: number) => {
                                  let text = '';
                                  if (typeof scorerItem === 'string') {
                                    text = scorerItem;
                                  } else if (scorerItem?.name) {
                                    const minute = scorerItem.minute ? `${scorerItem.minute}' ` : '';
                                    const assist = scorerItem.assist ? ` (${scorerItem.assist})` : '';
                                    text = `${minute}${scorerItem.name}${assist}`;
                                  }
                                  if (!text) return null;
                                  return (
                                    <span key={idx} className="inline-flex items-center gap-1">
                                      <span className="text-sm font-semibold">{text}</span>
                                      {idx < result.scorers.length - 1 && " · "}
                                    </span>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-[var(--foreground)]/40 text-xs">{langLabel("No scorers listed", "Aucun buteur", "لا يوجد مسجلين")}</span>
                            )}
                          </div>
                          <span className="sm:hidden inline-flex items-center gap-1 text-[var(--foreground)]/40 text-[10px]">
                            <Calendar size={10} /> {result.date}
                          </span>
                        </div>

                        {/* Venue & time strip */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 -mt-1 text-[11px] text-[var(--foreground)]/45 border-t border-[var(--foreground)]/5">
                          <span className="inline-flex items-center gap-1.5 min-w-0">
                            <MapPin size={11} /> <span className="truncate">{result.venue || langLabel("Venue TBA", "Stade à définir", "الملعب يحدد لاحقاً")}</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Clock size={11} /> {result.time || "--:--"}
                            <span className="opacity-40">•</span>
                            <Calendar size={11} /> <span className="sm:hidden">{result.date}</span>
                          </span>
                        </div>
                      </div>
                    </a>
                  </motion.div>
                ))}

                {visibleResults.length === 0 && (
                  <div className="text-center py-16 text-[var(--foreground)]/40">
                    {langLabel("No results for this competition.", "Aucun résultat pour cette compétition.", "لا توجد نتائج لهذه المسابقة.")}
                  </div>
                )}

                {filteredResults.length > 3 && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowAllResults(!showAllResults)}
                    className="w-full mt-2 bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10 border border-[var(--foreground)]/10 hover:border-[var(--primary)]/50 text-[var(--foreground)] py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                  >
                    {showAllResults
                      ? langLabel("Show Less", "Voir moins", "عرض أقل")
                      : langLabel(`Show All ${filteredResults.length} Results`, `Voir les ${filteredResults.length} résultats`, `عرض كل ${filteredResults.length} نتائج`)}
                    <ChevronDown className={`transform transition-transform ${showAllResults ? "rotate-180" : ""}`} size={18} />
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
// Shop section component
//
// The authoritative purchase data (id, name, price, sizes, inStock) comes from
// the server-side catalog (lib/shop/catalog.ts) — the SAME source the checkout
// endpoint uses to compute totals. The object below carries ONLY display
// metadata (image, category, rating, reviews, originalPrice, discount, isNew).
// This guarantees the client can never override server prices/stock/sizes and
// the two can never drift apart.
type DisplayProduct = {
  id: number;
  image: string;
  category: string;
  rating: number;
  reviews: number;
  originalPrice?: number;
  discount?: string;
  isNew?: boolean;
};

const DISPLAY_PRODUCTS: DisplayProduct[] = [
  { id: 1, image: "/1.jpg", category: "Maillots", rating: 4.9, reviews: 248 },
  { id: 2, image: "/1.jpg", category: "Casual", rating: 4.8, reviews: 134, isNew: true },
  { id: 3, image: "/1.jpg", category: "Maillots", rating: 4.7, reviews: 62 },
  { id: 4, image: "/1.jpg", category: "Maillots", rating: 4.9, reviews: 401, originalPrice: 110, discount: "-55%" },
  { id: 5, image: "/1.jpg", category: "Casual", rating: 4.8, reviews: 87, isNew: true },
  { id: 6, image: "/1.jpg", category: "Casual", rating: 4.6, reviews: 53 },
  { id: 7, image: "/1.jpg", category: "Casual", rating: 4.9, reviews: 178, isNew: true },
  { id: 8, image: "/1.jpg", category: "Training", rating: 4.8, reviews: 122 },
  { id: 9, image: "/1.jpg", category: "Training", rating: 4.7, reviews: 95, isNew: true },
  { id: 10, image: "/1.jpg", category: "Casual", rating: 4.6, reviews: 44 },
  { id: 11, image: "/1.jpg", category: "Training", rating: 4.7, reviews: 68 },
  { id: 12, image: "/1.jpg", category: "Maillots", rating: 4.9, reviews: 214, isNew: true },
  { id: 13, image: "/1.jpg", category: "Maillots", rating: 4.8, reviews: 189, isNew: true },
  { id: 14, image: "/1.jpg", category: "Training", rating: 4.7, reviews: 56 },
  { id: 15, image: "/1.jpg", category: "Casual", rating: 4.8, reviews: 74 },
];

const products = SERVER_PRODUCTS.map((p) => {
  const display: Partial<DisplayProduct> =
    DISPLAY_PRODUCTS.find((d) => d.id === p.id) ?? {};
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    sizes: p.sizes,
    inStock: p.inStock,
    image: display.image,
    category: display.category,
    rating: display.rating,
    reviews: display.reviews,
    originalPrice: display.originalPrice,
    discount: display.discount,
    isNew: display.isNew,
  };
});

type CartItemType = { product: typeof products[number]; size: string; qty: number };

const ShopSection = React.memo(({ language, theme, user, points, setPoints }: { language: "en" | "fr" | "ar"; theme: string, user: any; points: number; setPoints: any }) => {
  const t = translations[language].shop;
  const shopRef = useRef<HTMLDivElement>(null);
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });
  const [activeCategory, setActiveCategory] = useState("Tous");
  const [showAll, setShowAll] = useState(false);
  const [cart, setCart] = useState<CartItemType[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<Record<number, string>>({});
  const [addedToCart, setAddedToCart] = useState<Record<number, boolean>>({});

  // Checkout modal states
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);
  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoError, setPromoError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card' | 'points'>('cod');
  const [customerData, setCustomerData] = useState({
    name: user?.name || user?.displayName || '',
    phone: '',
    city: 'Tunis',
    address: ''
  });
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [cardClientSecret, setCardClientSecret] = useState<string | null>(null);
  const [pendingOrder, setPendingOrder] = useState<any>(null);
  const [pointsCheckoutToken, setPointsCheckoutToken] = useState("");

  const generateCheckoutToken = () =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const openCheckout = () => {
    setPointsCheckoutToken(generateCheckoutToken());
    setIsCheckoutOpen(true);
  };

  const categories = language === "ar"
    ? ["الكل", "قمصان", "تدريب", "كاجوال"]
    : ["Tous", "Maillots", "Training", "Casual"];

  const categoryMap: Record<string, string> = {
    "Tous": "Tous", "Maillots": "Maillots", "Training": "Training", "Casual": "Casual",
    "الكل": "Tous", "قمصان": "Maillots", "تدريب": "Training", "كاجوال": "Casual",
  };

  const filteredProducts = products.filter((p) => {
    const mapped = categoryMap[activeCategory];
    return mapped === "Tous" || p.category === activeCategory || p.category === mapped;
  });
  const displayedProducts = showAll ? filteredProducts : filteredProducts.slice(0, 3);

  const totalCartItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotalPrice = cart.reduce((sum, item) => sum + (item.product as any).price * item.qty, 0);
  const discountAmount = Math.round(subtotalPrice * (discountPercent / 100));
  const shippingPrice = subtotalPrice >= 150 ? 0 : 7;
  const finalPrice = Math.max(0, subtotalPrice - discountAmount + shippingPrice);

  const addToCart = (product: any, customSize?: string) => {
    const size = customSize || selectedSizes[product.id] || (product.sizes[0] ?? "L");
    setCart((prev: CartItemType[]) => {
      const existing = prev.find(c => (c.product as any).id === product.id && c.size === size);
      if (existing) return prev.map(c => (c.product as any).id === product.id && c.size === size ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { product, size, qty: 1 }];
    });
    setAddedToCart(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => setAddedToCart(prev => ({ ...prev, [product.id]: false })), 1500);
    setCartOpen(true);
  };

  const buyNow = (product: any) => {
    addToCart(product);
    setCartOpen(false);
    openCheckout();
  };

  const removeFromCart = (productId: number, size: string) => {
    setCart((prev: CartItemType[]) => prev.filter(c => !((c.product as any).id === productId && c.size === size)));
  };

  const changeQty = (productId: number, size: string, delta: number) => {
    setCart((prev: CartItemType[]) => prev.map(c => {
      if ((c.product as any).id === productId && c.size === size) {
        const newQty = c.qty + delta;
        if (newQty <= 0) return null as any;
        return { ...c, qty: newQty };
      }
      return c;
    }).filter(Boolean));
  };

  const applyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoCode.trim().toUpperCase();
    // Server-authoritative discount map (lib/shop/catalog.ts) — the same map the
    // checkout endpoint uses. The client value is display-only; the server
    // recomputes the actual discount.
    const pct = PROMO_CODES[code];
    if (pct != null) {
      setDiscountPercent(pct);
      setPromoError('');
    } else {
      setPromoError(language === 'ar' ? 'رمز غير صالح' : 'Code promo invalide');
      setDiscountPercent(0);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerData.name.trim() || !customerData.phone.trim() || !customerData.address.trim()) {
      setCheckoutError(language === 'ar' ? 'يرجى ملء جميع بيانات التوصيل' : 'Veuillez remplir toutes les informations de livraison');
      return;
    }
    setCheckoutError("");

    setIsSubmittingOrder(true);
    try {
      let idToken: string | null = null;
      if (fAuth) {
        await fAuth.authStateReady();
        idToken = fAuth.currentUser ? await fAuth.currentUser.getIdToken(true) : null;
      }
      if (!idToken) {
        setCheckoutError(language === 'ar' ? 'يرجى تسجيل الدخول لتأكيد طلبك' : 'Veuillez vous connecter pour confirmer votre commande');
        setIsSubmittingOrder(false);
        return;
      }

      const items = cart.map((item) => ({
        productId: (item.product as any).id,
        size: item.size,
        qty: item.qty,
      }));

      const orderPayload: Record<string, unknown> = {
        items,
        customer: { ...customerData },
        promoCode: promoCode.trim() || null,
        paymentMethod,
      };
      if (paymentMethod === 'points') {
        orderPayload.checkoutToken = pointsCheckoutToken;
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCheckoutError(data.error || (language === 'ar' ? 'تعذر تأكيد الطلب' : 'Impossible de confirmer la commande'));
        setIsSubmittingOrder(false);
        return;
      }

      const baseSuccess = {
        id: data.orderId,
        orderId: data.orderId,
        items: data.items || [],
        total: data.total,
        customer: { ...customerData },
        paymentMethod: data.paymentMethod || paymentMethod,
        paymentStatus: data.paymentStatus || "unpaid",
        pointsEarned: data.pointsEarned || 0,
        pointsCost: data.pointsCost || 0
      };

      setCart([]);
      setPromoCode('');
      setDiscountPercent(0);

      // Points orders are paid immediately server-side; refresh the authoritative
      // balance for the header/club display.
      if ((data.paymentMethod || paymentMethod) === 'points') {
        try {
          const ptsRes = await fetch("/api/points", {
            headers: { Authorization: `Bearer ${idToken}` },
          });
          const ptsData = await ptsRes.json().catch(() => ({}));
          if (ptsRes.ok && typeof ptsData.points === "number") {
            setPoints(ptsData.points);
          }
        } catch (_) {
          // Non-fatal: the server stays authoritative.
        }
        setOrderSuccess(baseSuccess);
        setIsSubmittingOrder(false);
        return;
      }

      // Card orders need an authenticated server-created PaymentIntent for this
      // specific order before the card can be charged.
      if ((data.paymentMethod || paymentMethod) === 'card') {
        const payRes = await fetch("/api/payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ orderId: data.orderId }),
        });
        const payData = await payRes.json().catch(() => ({}));
        if (!payRes.ok || !payData.clientSecret) {
          setCheckoutError(payData.error || (language === 'ar' ? 'تعذر تأكيد الطلب' : 'Impossible de confirmer la commande'));
          setIsSubmittingOrder(false);
          return;
        }
        setCardClientSecret(payData.clientSecret);
        setPendingOrder(baseSuccess);
        setIsSubmittingOrder(false);
        return;
      }

      // Cash on delivery: the order is created unpaid; nothing is charged.
      setOrderSuccess(baseSuccess);
      setIsSubmittingOrder(false);
    } catch {
      setCheckoutError(language === 'ar' ? 'حدث خطأ. حاول مجدداً' : 'Une erreur est survenue. Réessayez');
      setIsSubmittingOrder(false);
    }
  };

  const StarRating = ({ rating, reviews }: { rating: number; reviews: number }) => (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1,2,3,4,5].map(s => (
          <Star key={s} size={11} className={s <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-gray-500"} />
        ))}
      </div>
      <span className="text-[11px] text-[var(--foreground)]/50 font-medium">{rating} ({reviews})</span>
    </div>
  );

  return (
    <section id="shop" ref={ref} className="relative py-16 overflow-hidden">
      <div className="absolute inset-0 bg-[var(--background)]" />

      {/* Checkout Modal */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsCheckoutOpen(false); setOrderSuccess(null); }}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative z-10 w-full max-w-lg bg-[var(--card)] rounded-3xl border border-[var(--primary)]/30 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-[var(--primary)] to-red-800 p-5 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <ShoppingBag size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight">
                      {orderSuccess ? (language === 'ar' ? 'تم تأكيد طلبك بنجاح! 🏆' : 'Commande Confirmée ! 🏆') : (language === 'ar' ? 'إتمام الشراء — مغازة الباجي' : 'Finaliser la commande')}
                    </h3>
                    <p className="text-xs text-white/70">
                      {orderSuccess ? (language === 'ar' ? 'شكراً لوفائك للغالية' : 'Merci pour votre fidélité au Club') : (language === 'ar' ? 'توصيل سريع لكافة أنحاء الجمهورية' : 'Livraison express partout en Tunisie')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setIsCheckoutOpen(false); setOrderSuccess(null); }}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6">
                {cardClientSecret ? (
                  <div className="space-y-4">
                    <div className="text-center py-2">
                      <div className="w-16 h-16 bg-[var(--primary)]/15 text-[var(--primary)] rounded-2xl mx-auto mb-3 flex items-center justify-center">
                        <CreditCard size={30} />
                      </div>
                      <h4 className="text-lg font-black text-[var(--foreground)]">
                        {language === 'ar' ? 'إتمام الدفع بالبطاقة' : language === 'en' ? 'Card Payment' : 'Paiement par carte'}
                      </h4>
                      <p className="text-sm text-[var(--foreground)]/60 mt-1">
                        Montant : <span className="font-black text-[var(--primary)]">{pendingOrder?.total},000 DT</span>
                      </p>
                      <p className="text-xs text-[var(--foreground)]/50 mt-1">
                        Commande <span className="font-mono font-bold">{pendingOrder?.orderId}</span>
                      </p>
                    </div>
                    <Elements stripe={stripePromise}>
                      <CardEntry
                        clientSecret={cardClientSecret}
                        language={language}
                        onSuccess={() => {
                          setOrderSuccess({ ...pendingOrder });
                          setCardClientSecret(null);
                          setPendingOrder(null);
                        }}
                      />
                    </Elements>
                  </div>
                ) : orderSuccess ? (
                  <div className="text-center py-4 space-y-5">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto border-2 border-green-500/40 shadow-xl"
                    >
                      <CheckCircle2 size={44} />
                    </motion.div>

                    <div>
                      <h4 className="text-2xl font-black text-[var(--foreground)]">
                        {language === 'ar' ? 'مبروك! تم تسجيل طلبك' : 'Félicitations ! Commande enregistrée'}
                      </h4>
                      <p className="text-sm text-[var(--foreground)]/60 mt-1">
                        Numéro de commande : <span className="font-mono font-bold text-[var(--primary)]">{orderSuccess.id}</span>
                      </p>
                    </div>

                    <div className="bg-[var(--foreground)]/5 rounded-2xl p-4 text-left text-sm space-y-2 border border-[var(--foreground)]/10">
                      <div className="flex justify-between">
                        <span className="text-[var(--foreground)]/60">Destinataire :</span>
                        <span className="font-bold text-[var(--foreground)]">{orderSuccess.customer.name} ({orderSuccess.customer.phone})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--foreground)]/60">Adresse :</span>
                        <span className="font-bold text-[var(--foreground)]">{orderSuccess.customer.address}, {orderSuccess.customer.city}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--foreground)]/60">Mode de paiement :</span>
                        <span className="font-bold text-[var(--primary)]">
                          {orderSuccess.paymentMethod === 'cod' ? 'Paiement à la livraison' : orderSuccess.paymentMethod === 'points' ? 'Points Clubiste' : 'Carte Bancaire'}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-[var(--foreground)]/10 pt-2 font-black text-base">
                        <span>Total TTC :</span>
                        <span className="text-[var(--primary)]">{orderSuccess.total},000 DT</span>
                      </div>
                    </div>

                    {orderSuccess.pointsEarned > 0 && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center justify-center gap-2 text-amber-500 text-xs font-bold">
                      <Award size={16} />
                      <span>+{orderSuccess.pointsEarned} Points Clubistes ajoutés à votre compte !</span>
                    </div>
                    )}

                    {orderSuccess.paymentMethod === 'points' && orderSuccess.pointsCost > 0 && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center justify-center gap-2 text-red-500 text-xs font-bold">
                      <Award size={16} />
                      <span>-{orderSuccess.pointsCost} Points Clubistes déduits de votre solde.</span>
                    </div>
                    )}

                    {orderSuccess.paymentMethod === 'card' && orderSuccess.paymentStatus === 'unpaid' && (
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 flex items-center justify-center gap-2 text-blue-500 text-xs font-bold">
                        <ShieldCheck size={16} />
                        <span>Votre paiement est en cours de confirmation côté serveur.</span>
                      </div>
                    )}

                    <button
                      onClick={() => { setIsCheckoutOpen(false); setOrderSuccess(null); }}
                      className="w-full bg-[var(--primary)] text-white py-3.5 rounded-xl font-bold shadow-lg shadow-[var(--primary)]/30 hover:opacity-90 transition-all"
                    >
                      {language === 'ar' ? 'العودة للمغازة' : 'Continuer mes achats'}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handlePlaceOrder} className="space-y-5">
                    {/* Order summary mini */}
                    <div className="bg-[var(--foreground)]/5 rounded-2xl p-4 border border-[var(--foreground)]/10 space-y-2">
                      <h4 className="text-xs font-black uppercase text-[var(--foreground)]/60 tracking-wider">
                        {language === 'ar' ? 'ملخص المشتريات' : 'Récapitulatif'} ({totalCartItems} articles)
                      </h4>
                      <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
                        {cart.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <span className="text-[var(--foreground)]/80 line-clamp-1 flex-1">
                              {item.qty}x {(item.product as any).name} ({item.size})
                            </span>
                            <span className="font-bold text-[var(--foreground)] ml-2">
                              {(item.product as any).price * item.qty},000 DT
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Promo code */}
                      <div className="pt-2 border-t border-[var(--foreground)]/10 flex gap-2">
                        <input
                          type="text"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          placeholder={language === 'ar' ? 'كود الخصم (مثال: OB1920)' : 'Code promo (ex: OB1920)'}
                          className="flex-1 px-3 py-1.5 rounded-lg text-xs bg-[var(--card)] border border-[var(--foreground)]/20 text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
                        />
                        <button
                          type="button"
                          onClick={applyPromo}
                          className="px-3 py-1.5 rounded-lg bg-[var(--primary)]/20 text-[var(--primary)] text-xs font-bold hover:bg-[var(--primary)]/30 transition-colors"
                        >
                          {language === 'ar' ? 'تطبيق' : 'Appliquer'}
                        </button>
                      </div>
                      {promoError && <p className="text-[10px] text-red-500 font-bold">{promoError}</p>}
                      {discountPercent > 0 && (
                        <p className="text-[10px] text-green-500 font-bold">✓ Remise de {discountPercent}% appliquée !</p>
                      )}

                      <div className="flex justify-between items-center pt-2 border-t border-[var(--foreground)]/10 font-bold text-sm">
                        <span>Total :</span>
                        <span className="text-[var(--primary)] text-base font-black">{finalPrice},000 DT</span>
                      </div>
                    </div>

                    {/* Customer Information */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase text-[var(--foreground)]/60 tracking-wider">
                        {language === 'ar' ? 'بيانات التوصيل' : 'Informations de livraison'}
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-[var(--foreground)]/70 block mb-1">
                            {language === 'ar' ? 'الاسم الكامل *' : 'Nom & Prénom *'}
                          </label>
                          <input
                            type="text"
                            required
                            value={customerData.name}
                            onChange={(e) => setCustomerData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Mohamed Ben Ali"
                            className="w-full px-3 py-2 rounded-xl text-sm bg-[var(--foreground)]/5 border border-[var(--foreground)]/15 text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-[var(--foreground)]/70 block mb-1">
                            {language === 'ar' ? 'رقم الهاتف *' : 'Téléphone *'}
                          </label>
                          <input
                            type="tel"
                            required
                            value={customerData.phone}
                            onChange={(e) => setCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="+216 98 123 456"
                            className="w-full px-3 py-2 rounded-xl text-sm bg-[var(--foreground)]/5 border border-[var(--foreground)]/15 text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-[var(--foreground)]/70 block mb-1">
                            {language === 'ar' ? 'الولاية / المدينة' : 'Gouvernorat / Ville'}
                          </label>
                          <select
                            value={customerData.city}
                            onChange={(e) => setCustomerData(prev => ({ ...prev, city: e.target.value }))}
                            className="w-full px-3 py-2 rounded-xl text-sm bg-[var(--card)] border border-[var(--foreground)]/15 text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
                          >
                            {["Tunis", "Ariana", "Ben Arous", "Manouba", "Sousse", "Sfax", "Bizerte", "Nabeul", "Monastir", "Kairouan", "Autre"].map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-[var(--foreground)]/70 block mb-1">
                            {language === 'ar' ? 'العنوان بالتفصيل *' : 'Adresse complète *'}
                          </label>
                          <input
                            type="text"
                            required
                            value={customerData.address}
                            onChange={(e) => setCustomerData(prev => ({ ...prev, address: e.target.value }))}
                            placeholder="Rue, N° maison / étage"
                            className="w-full px-3 py-2 rounded-xl text-sm bg-[var(--foreground)]/5 border border-[var(--foreground)]/15 text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Payment method selector */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-black uppercase text-[var(--foreground)]/60 tracking-wider">
                        {language === 'ar' ? 'طريقة الدفع' : 'Mode de paiement'}
                      </h4>

                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('cod')}
                          className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                            paymentMethod === 'cod'
                              ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] font-bold shadow-md'
                              : 'border-[var(--foreground)]/10 text-[var(--foreground)]/70 hover:border-[var(--foreground)]/30'
                          }`}
                        >
                          <Truck size={18} />
                          <span className="text-[10px] leading-tight">À la livraison</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod('card')}
                          className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                            paymentMethod === 'card'
                              ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] font-bold shadow-md'
                              : 'border-[var(--foreground)]/10 text-[var(--foreground)]/70 hover:border-[var(--foreground)]/30'
                          }`}
                        >
                          <CreditCard size={18} />
                          <span className="text-[10px] leading-tight">Carte Bancaire</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod('points')}
                          className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                            paymentMethod === 'points'
                              ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] font-bold shadow-md'
                              : 'border-[var(--foreground)]/10 text-[var(--foreground)]/70 hover:border-[var(--foreground)]/30'
                          }`}
                        >
                          <Award size={18} />
                          <span className="text-[10px] leading-tight">Points Club</span>
                        </button>
                      </div>

                      {paymentMethod === 'points' && (
                        <p className="text-[11px] text-[var(--foreground)]/60 pt-1">
                          Coût : <span className="font-bold text-[var(--primary)]">{Math.max(1, Math.ceil(finalPrice / 100))} pts</span>
                          {' · '}Solde : <span className="font-bold">{points} pts</span>
                        </p>
                      )}
                    </div>

                    {checkoutError && (
                      <p className="text-[12px] text-red-500 font-bold text-center bg-red-500/10 border border-red-500/30 rounded-xl py-2">
                        {checkoutError}
                      </p>
                    )}

                    <motion.button
                      type="submit"
                      disabled={isSubmittingOrder || cart.length === 0}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-gradient-to-r from-[var(--primary)] to-red-800 text-white py-4 rounded-2xl font-black text-base shadow-xl shadow-[var(--primary)]/30 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSubmittingOrder ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 size={18} />
                          {language === 'ar' ? `تأكيد الطلب (${finalPrice},000 DT)` : `Confirmer la commande (${finalPrice},000 DT)`}
                        </>
                      )}
                    </motion.button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[80] backdrop-blur-sm"
              onClick={() => setCartOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-[var(--card)] z-[81] flex flex-col shadow-2xl border-l border-[var(--primary)]/20"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--foreground)]/10">
                <div className="flex items-center gap-3">
                  <ShoppingBag size={20} className="text-[var(--primary)]" />
                  <h3 className="font-bold text-[var(--foreground)] text-lg">
                    {language === "ar" ? "سلة التسوق" : language === "fr" ? "Mon Panier" : "My Cart"}
                    {totalCartItems > 0 && (
                      <span className="ml-2 bg-[var(--primary)] text-white text-xs font-black px-2 py-0.5 rounded-full">{totalCartItems}</span>
                    )}
                  </h3>
                </div>
                <button onClick={() => setCartOpen(false)} className="p-2 rounded-full hover:bg-[var(--foreground)]/10 transition-colors">
                  <X size={18} className="text-[var(--foreground)]" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4 opacity-40">
                    <ShoppingBag size={48} />
                    <p className="font-semibold text-[var(--foreground)]">
                      {language === "ar" ? "سلتك فارغة" : language === "fr" ? "Votre panier est vide" : "Your cart is empty"}
                    </p>
                  </div>
                ) : cart.map((item) => (
                  <motion.div
                    key={`${(item.product as any).id}-${item.size}`}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center gap-3 bg-[var(--background)] rounded-2xl p-3 border border-[var(--foreground)]/8"
                  >
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-[var(--foreground)]/10">
                      <NextImage src={(item.product as any).image} alt={(item.product as any).name} fill className="object-cover" sizes="64px" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[var(--foreground)] text-sm line-clamp-1">{(item.product as any).name}</p>
                      <p className="text-[var(--primary)] font-black text-sm">{(item.product as any).price},000 DT</p>
                      <p className="text-[10px] text-[var(--foreground)]/40 uppercase font-bold mt-0.5">
                        {language === "ar" ? "المقاس:" : "Taille:"} {item.size}
                      </p>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-1 bg-[var(--foreground)]/5 rounded-lg p-0.5">
                        <button onClick={() => changeQty((item.product as any).id, item.size, -1)} className="w-6 h-6 flex items-center justify-center hover:bg-[var(--primary)]/20 rounded transition-colors">
                          <Minus size={10} />
                        </button>
                        <span className="text-sm font-bold w-6 text-center">{item.qty}</span>
                        <button onClick={() => changeQty((item.product as any).id, item.size, 1)} className="w-6 h-6 flex items-center justify-center hover:bg-[var(--primary)]/20 rounded transition-colors">
                          <Plus size={10} />
                        </button>
                      </div>
                      <button onClick={() => removeFromCart((item.product as any).id, item.size)} className="text-red-500 hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {cart.length > 0 && (
                <div className="px-4 pb-6 pt-4 border-t border-[var(--foreground)]/10 space-y-4">
                  <div className="flex items-center gap-2 text-[var(--foreground)]/60 text-xs">
                    <Truck size={14} className="text-green-500" />
                    <span>{language === "ar" ? "توصيل مجاني فوق 150 DT" : language === "fr" ? "Livraison gratuite dès 150 DT" : "Free delivery over 150 DT"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--foreground)]/60 text-xs">
                    <ShieldCheck size={14} className="text-blue-500" />
                    <span>{language === "ar" ? "إرجاع مجاني 30 يوم" : language === "fr" ? "Retour gratuit sous 30 jours" : "Free returns within 30 days"}</span>
                  </div>
                  <div className="flex items-center justify-between font-black text-[var(--foreground)] text-lg border-t border-[var(--foreground)]/10 pt-3">
                    <span>{language === "ar" ? "المجموع" : language === "fr" ? "Total" : "Total"}</span>
                    <span className="text-[var(--primary)]">{subtotalPrice},000 DT</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setCartOpen(false); openCheckout(); }}
                    className="w-full bg-gradient-to-r from-[var(--primary)] to-red-700 text-white py-4 rounded-2xl font-black text-base shadow-lg shadow-[var(--primary)]/30 flex items-center justify-center gap-2"
                  >
                    <ShoppingBag size={18} />
                    {language === "ar" ? "إتمام الشراء" : language === "fr" ? "Passer la commande" : "Checkout"}
                  </motion.button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Cart Button */}
      <AnimatePresence>
        {totalCartItems > 0 && !cartOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCartOpen(true)}
            className="fixed bottom-24 right-6 z-[70] bg-[var(--primary)] text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl shadow-[var(--primary)]/40"
          >
            <ShoppingBag size={22} />
            <span className="absolute -top-1.5 -right-1.5 bg-white text-[var(--primary)] text-xs font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[var(--primary)]">
              {totalCartItems}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={scrollTransition}
          className="text-center mb-10"
        >
          <span className="inline-block px-4 py-2 bg-[var(--primary)]/10 border border-[var(--primary)]/30 rounded-full text-[var(--primary)] text-sm font-semibold mb-3 text-center">
            {t.header}
          </span>
          <br />
          <div ref={shopRef} className="inline-block">
            <p
              className={`text-5xl lg:text-7xl font-display font-black uppercase tracking-tighter italic ${theme === 'light' ? 'text-[#8B0000]' : 'text-[#C41E3A]'}`}
              style={{ WebkitTextStroke: '1px black', textShadow: '0 0 1px #000' }}
            >
              <VariableProximityText
                label={language === "ar" ?"المتجر الرسمي" : language === "fr" ? "BOUTIQUE OFFICIELLE" : "OFFICIAL SHOP"}
                fromFontVariationSettings="'wght' 300, 'opsz' 9"
                toFontVariationSettings="'wght' 1000, 'opsz' 40"
                containerRef={shopRef}
                radius={150}
                falloff="gaussian"
              />
            </p>
          </div>
          <p className="text-[var(--foreground)] opacity-60 max-w-2xl mx-auto text-lg mt-3">
            {t.subtitle}
          </p>
        </motion.div>

        {/* Category Filter Pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...scrollTransition, delay: 0.15 }}
          className="flex flex-wrap justify-center gap-3 mb-10"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setShowAll(false); }}
              className={`px-5 py-2 rounded-full font-bold text-sm transition-all border ${
                activeCategory === cat
                  ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-lg shadow-[var(--primary)]/30"
                  : "bg-[var(--foreground)]/5 text-[var(--foreground)]/70 border-[var(--foreground)]/15 hover:border-[var(--primary)]/50 hover:text-[var(--primary)]"
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* Products grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="wait">
            {displayedProducts.map((product: any, index: number) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 44 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                exit={{ opacity: 0, scale: 0.9 }}
                layout
                transition={{ delay: index * 0.06, ...scrollTransitionFast }}
                className="flex justify-center"
              >
                <div className="w-full">
                  <div className="flex w-full flex-col items-stretch rounded-[20px] border border-[var(--border)] bg-[var(--card)] overflow-hidden group/shop-card shadow-sm hover:shadow-lg transition-shadow duration-300">
                    {/* Image Container */}
                    <div className="relative aspect-[4/5] w-full overflow-hidden bg-[var(--foreground)]/5">
                      <NextImage
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover/shop-card:scale-105"
                      />
                      <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                        {product.discount && (
                          <span className="bg-red-600 text-white px-2.5 py-1 rounded-full text-xs font-black shadow-lg">
                            {product.discount}
                          </span>
                        )}
                        {product.isNew && !product.discount && (
                          <span className="bg-[var(--primary)] text-white px-2.5 py-1 rounded-full text-xs font-black shadow-lg">NEW</span>
                        )}
                      </div>
                      <div className="absolute top-3 right-3">
                        {product.inStock ? (
                          <span className="bg-green-500/90 text-white px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 backdrop-blur-sm">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            {language === "ar" ? "متوفر" : language === "fr" ? "En stock" : "In stock"}
                          </span>
                        ) : (
                          <span className="bg-gray-800/90 text-gray-300 px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-sm">
                            {language === "ar" ? "نفد" : language === "fr" ? "Épuisé" : "Out of stock"}
                          </span>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/shop-card:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => addToCart(product)}
                          disabled={!product.inStock}
                          className="bg-white text-[var(--primary)] font-black px-5 py-2.5 rounded-full text-sm shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <Plus size={14} />
                          {language === "ar" ? "أضف للسلة" : language === "fr" ? "Ajouter" : "Add to cart"}
                        </motion.button>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${theme === 'dark' ? 'bg-white/10 text-white/60' : 'bg-black/8 text-black/60'}`}>
                          {product.category}
                        </span>
                        <StarRating rating={product.rating} reviews={product.reviews} />
                      </div>
                      <h3 className="font-bold text-[var(--foreground)] text-sm leading-snug line-clamp-2">
                        {translations[language].shop.products[index]?.name || product.name}
                      </h3>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-black text-[var(--primary)]">{product.price},000 DT</span>
                        {product.originalPrice && (
                          <span className="text-sm text-[var(--foreground)]/40 line-through">{product.originalPrice},000 DT</span>
                        )}
                      </div>
                      {product.sizes.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-[var(--foreground)]/50 uppercase mb-1.5">
                            {language === "ar" ? "المقاس:" : language === "fr" ? "Taille:" : "Size:"}
                            {selectedSizes[product.id] && <span className="ml-1 text-[var(--primary)]">{selectedSizes[product.id]}</span>}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {product.sizes.map((size: string) => (
                              <button
                                key={size}
                                onClick={() => setSelectedSizes(prev => ({ ...prev, [product.id]: size }))}
                                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                                  selectedSizes[product.id] === size
                                    ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                                    : "border-[var(--foreground)]/15 text-[var(--foreground)]/60 hover:border-[var(--primary)]/50"
                                }`}
                              >
                                {size}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => addToCart(product)}
                          disabled={!product.inStock}
                          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all border ${
                            addedToCart[product.id]
                              ? "bg-green-500 text-white border-green-500 shadow-green-500/30"
                              : "bg-[var(--foreground)]/5 border-[var(--foreground)]/15 text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                          }`}
                        >
                          {addedToCart[product.id] ? (
                            <><Check size={14} /> {language === "ar" ? "تمت الإضافة!" : language === "fr" ? "Ajouté !" : "Added!"}</>
                          ) : (
                            <><Plus size={14} /> {language === "ar" ? "أضف للسلة" : language === "fr" ? "Panier" : "Add"}</>
                          )}
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => buyNow(product)}
                          disabled={!product.inStock}
                          className="flex-1 py-2.5 bg-[var(--primary)] text-white hover:bg-red-700 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[var(--primary)]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ShoppingBag size={14} />
                          {language === "ar" ? "شراء الآن" : language === "fr" ? "Commander" : "Buy Now"}
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* See All Button */}
        {filteredProducts.length > 3 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            className="mt-12 text-center"
          >
            <button
              onClick={() => setShowAll(!showAll)}
              className="px-10 py-4 bg-[var(--foreground)]/5 border border-[var(--foreground)]/20 opacity-80 hover:opacity-100 hover:border-[var(--primary)] rounded-full text-[var(--foreground)] font-bold transition-all flex items-center justify-center gap-3 mx-auto group shadow-md"
            >
              {showAll ? t.less : t.more}
              <ChevronDown className={`transform transition-transform duration-300 ${showAll ? "rotate-180" : ""}`} />
            </button>
          </motion.div>
        )}
      </div>

      {/* Full Screen Width Sponsor/Partner Logo Slider */}
      <div className="slider mt-16">
        <div className="slide-track">
          {["coca","hummel","ooredoo","warda","cma",
            "coca","hummel","ooredoo","warda","cma",
            "coca","hummel","ooredoo","warda","cma"
          ].map((logo, i) => (
            <div key={i} className="slide">
              <img src={`/logos/${logo}.png`} alt={logo} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

ShopSection.displayName = "ShopSection";


// History Section - Draggable Cards version
function HistorySection({ language, theme }: { language: "en" | "fr" | "ar", theme: string }) {
  const ticketsRef = useRef<HTMLDivElement>(null);
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });
  const t = translations[language].history;
  const milestones = t.milestones;

  // Pre-defined random-ish positions to mimic the "scattered" look
  const positions = [
    "top-10 left-[5%] rotate-[-5deg]",
    "top-40 left-[15%] rotate-[-8deg]",
    "top-5 left-[30%] rotate-[10deg]",
    "top-32 left-[45%] rotate-[7deg]",
    "top-20 right-[10%] rotate-[-4deg]",
    "top-48 right-[25%] rotate-[6deg]",
    "top-12 left-[55%] rotate-[-12deg]",
    "top-60 left-[10%] rotate-[5deg]",
    "top-5 right-[40%] rotate-[-7deg]",
    "top-40 right-[45%] rotate-[15deg]",
    "top-70 right-[15%] rotate-[-10deg]",
    "top-15 left-[75%] rotate-[8deg]",
    "bottom-10 left-[20%] rotate-[-6deg]",
    "bottom-32 left-[40%] rotate-[9deg]",
    "bottom-20 right-[30%] rotate-[-11deg]",
    "bottom-40 right-[10%] rotate-[4deg]",
    "bottom-60 left-[60%] rotate-[-8deg]",
  ];

  return (
    <section id="history" ref={ref} className="relative pt-24 pb-8 bg-[var(--background)] min-h-[900px] flex flex-col">
      {/* Header Area */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-20 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={scrollTransition}
        >
          <span className="inline-block px-4 py-2 bg-[var(--primary)]/10 border border-[var(--primary)]/30 rounded-full text-[var(--primary)] text-sm font-semibold mb-4">
            {t.header}
          </span>
          <br />
          <div ref={ticketsRef} className="inline-block">
            <p
              className={`text-5xl lg:text-7xl font-display font-black uppercase tracking-tighter italic ${theme === 'light' ? 'text-[#8B0000]' : 'text-[#C41E3A]'}`}
              style={{ WebkitTextStroke: '1px black', textShadow: '0 0 1px #000' }}
            >
              <VariableProximityText
                label={t.title}
                fromFontVariationSettings="'wght' 300, 'opsz' 9"
                toFontVariationSettings="'wght' 1000, 'opsz' 40"
                containerRef={ticketsRef}
                radius={150}
                falloff="gaussian"
              />
            </p>
          </div>
          <p className="text-[var(--foreground)] opacity-60 max-w-2xl mx-auto text-lg mt-3">
            {t.subtitle}
          </p>
          <p className="text-[var(--primary)] font-bold text-sm mt-8 opacity-40 animate-pulse">
            (Drag the cards to explore our legacy)
          </p>
        </motion.div>
      </div>

      {/* Visual Separator & Boundary */}
      <div className="relative w-full h-px">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--primary)]/30 to-transparent" />
        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      </div>

      {/* Constraints Area for Draggable Cards */}
      <div className="relative flex-1 w-full overflow-x-auto overscroll-x-contain xl:overflow-hidden">
        <DraggableCardContainer className="absolute top-0 left-0 z-10 h-full w-full min-w-[560px] xl:inset-0">
          {milestones.map((item: any, idx: number) => (
            <DraggableCardBody
              key={idx}
              className={cn(
                "w-52 xl:w-72",
                positions[idx % positions.length]
              )}
            >
              <motion.div
                animate={{ y: [0, -8, 0], rotate: [0, 0.8, 0] }}
                transition={{ duration: 5 + (idx % 4) * 1.6, repeat: Infinity, ease: "easeInOut", delay: (idx % 5) * 0.7 }}
              >
              <div className="relative overflow-hidden rounded-xl bg-black/40 backdrop-blur-md p-6 border border-white/5 select-none">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-3xl font-black text-[#C41E3A]">{item.year}</span>
                  <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center">
                    <Trophy size={14} className="text-white/40" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 leading-tight uppercase">{item.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed italic">{item.desc}</p>

                {/* Decorative dots */}
                <div className="mt-4 flex gap-1">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-1 h-1 rounded-full bg-[#C41E3A]/40" />
                  ))}
                </div>
              </div>
              </motion.div>
            </DraggableCardBody>
          ))}
        </DraggableCardContainer>
      </div>
    </section>
  );
}
// 3. The Academy - Youth Development
function AcademySection({ language, theme }: { language: "en" | "fr" | "ar", theme: string }) {
  const academyRef = useRef<HTMLDivElement>(null);
  const { ref, inView } = useInView({ threshold: 0.2, triggerOnce: true });
  const t = translations[language].academy;

  // State for player of the month voting
  const votingPlayers = [
    "-",
  ];

  const [playerInput, setPlayerInput] = useState("");
  const [playerVotes, setPlayerVotes] = useState<{ name: string, count: number }[]>(
    votingPlayers.map(name => ({
      name,
      count: name === "Fedi Tayechi" ? 15 : 0
    })).sort((a, b) => b.count - a.count)
  );
  const [hasVoted, setHasVoted] = useState(false);
  const [votedFor, setVotedFor] = useState("");

  const handleVote = () => {
    if (playerInput && !hasVoted) {
      const playerName = playerInput;
      setPlayerVotes(prev => {
        const existing = prev.find(p => p.name === playerName);
        if (existing) {
          return prev.map(p =>
            p.name === playerName
              ? { ...p, count: p.count + 1 }
              : p
          ).sort((a, b) => b.count - a.count);
        }
        return [...prev, { name: playerName, count: 1 }].sort((a, b) => b.count - a.count);
      });
      setVotedFor(playerName);
      setHasVoted(true);
      setPlayerInput("");
    }
  };

  interface AcademyPlayer {
    id: string;
    name: string;
    birthDate: string;
  }

  const academyPlayers: AcademyPlayer[] = [
    { id: "a1", name: "Elyes Dhaoui", birthDate: "15 avr. 2008" },
    { id: "a2", name: "Fares Labidi", birthDate: "13 sept. 2008" },
  ];

  return (
    <section id="academy" ref={ref} className="py-24 bg-[var(--background)] relative overflow-hidden">
      {/* Decorative glows */}
      <div className="absolute top-1/3 -left-40 w-96 h-96 bg-[var(--primary)] rounded-full blur-[180px] opacity-[0.08] pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-[#D4AF37] rounded-full blur-[200px] opacity-[0.06] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={scrollSpring}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/30 text-[var(--primary)] text-xs font-black uppercase tracking-widest"
          >
            <Star size={12} className="fill-current" /> {t.futureStar}
          </motion.span>
          <br />
          <div ref={academyRef} className="inline-block mt-4">
            <p
              className={`text-5xl lg:text-7xl font-display font-black uppercase tracking-tighter italic ${theme === 'light' ? 'text-[#8B0000]' : 'text-[#C41E3A]'}`}
              style={{ WebkitTextStroke: '1px black', textShadow: '0 0 1px #000' }}
            >
              <VariableProximityText
                label={t.title}
                fromFontVariationSettings="'wght' 300, 'opsz' 9"
                toFontVariationSettings="'wght' 1000, 'opsz' 40"
                containerRef={academyRef}
                radius={150}
                falloff="gaussian"
              />
            </p>
          </div>
          <p className="text-[var(--foreground)]/70 text-lg max-w-2xl mx-auto mt-5">
            {t.subtitle}
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 items-start">
          {/* Player prospects — 4 cards */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {academyPlayers.map((player, i) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.12, ...scrollTransitionFast }}
                whileHover={{ y: -10 }}
                className="group relative"
              >
                <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-[var(--primary)]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-2xl" />
                <div className="relative rounded-[2rem] bg-[var(--card)] border border-[var(--foreground)]/10 group-hover:border-[var(--primary)]/50 overflow-hidden shadow-xl transition-all duration-300 p-5">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Avatar */}
                  <div className="relative mx-auto w-24 h-24 mb-5">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/40" style={{ padding: 2 }}>
                      <div className="w-full h-full rounded-full bg-[var(--background)] overflow-hidden flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--primary)]/60">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <h4 className="text-center font-black text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors truncate">
                    {player.name}
                  </h4>
                  <p className="text-center text-[11px] opacity-50 mt-1.5 font-semibold">
                    {player.birthDate}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* POTM Voting Card */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={scrollSpring}
          >
            <div className="relative group">
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-[var(--primary)] via-[var(--primary)]/60 to-[#D4AF37]/40 opacity-40 blur-lg" />
              <div className="relative rounded-[2rem] bg-gradient-to-br from-[var(--primary)] to-red-950 p-7 text-white overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-56 h-56 bg-white/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none" />
                <div className="absolute bottom-0 -left-10 w-40 h-40 bg-[#D4AF37]/20 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10">
                  <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold tracking-widest">
                    <Trophy size={11} /> {t.potm}
                  </span>
                  <h3 className="text-2xl font-black mt-3 mb-1">
                    {t.voteText}
                  </h3>
                  <p className="opacity-70 text-sm mb-6">
                    {t.topPlayers}
                  </p>

                  <div className="relative mb-4">
                    <input
                      type="text"
                      value={playerInput}
                      onChange={(e) => setPlayerInput(e.target.value)}
                      placeholder={t.enterPlayer}
                      disabled={hasVoted}
                      className="w-full px-4 py-3 rounded-xl bg-white/15 border-2 border-white/30 text-white font-bold text-base placeholder:text-white/50 focus:outline-none focus:border-white/60 focus:bg-white/25 transition-all disabled:opacity-50"
                    />
                  </div>

                  {hasVoted ? (
                    <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-green-300 font-bold text-center">
                      {t.thankYou} {votedFor}!
                    </motion.p>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleVote}
                      disabled={!playerInput}
                      className="w-full bg-white text-[var(--primary)] py-3 rounded-xl font-black text-base hover:bg-gray-100 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {t.voteBtn}
                    </motion.button>
                  )}
                </div>
              </div>
            </div>

            {/* Top voted list removed per request */}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Footer
function Footer({ language, theme }: { language: "en" | "fr" | "ar"; theme: string }) {
  const t = translations[language].footer;
  const socials = [
    { icon: Facebook, href: "https://www.facebook.com/OfficielOB", hoverClass: "hover:bg-[#1877F2]" },
    { icon: SiX, href: "https://x.com/olympiqueBeja?fbclid=IwY2xjawUFL3ZwZG9mBWV4dG4DYWVtAjEwAGJyaWQRMTFNRkFRbGZndm5JOGhLWlVzcnRjBmFwcF9pZBAyMjIwMzkxNzg4MjAwODkyAAEeoXomee8d3S9LeAxAGgKEQQ70a3wfG3aWI1MXH-vaxre5jz1Rpsc26GbfWQA_aem_R4lDdf3aAgzylEIVg58Y7w", hoverClass: "hover:bg-[#000000]" },
    { icon: Instagram, href: "https://www.instagram.com/olympique__de__beja?fbclid=IwY2xjawUFLv5wZG9mBWV4dG4DYWVtAjEwAGJyaWQRMWNCcVdiQ2JMRE44bXV6SVFzcnRjBmFwcF9pZBAyMjIwMzkxNzg4MjAwODkyAAEeqHoi00Oi2QGROhbvqroktI01EfOzVjHUZlRiqpaS3XZu66BMd1-qkXp0t_s_aem_KP3RoYfJfMa9ukfzMyECWQ", hoverClass: "hover:bg-[#E1306C]" },
  ];

  return (
    <footer id="contact" className="relative py-20 overflow-hidden border-t border-[var(--primary)]/20">
      {/* Background */}
      <div className="absolute inset-0 bg-[var(--background)]" />
      {/* Red stripe */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent opacity-30" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Logo */}
          <div>
            <motion.div
              className="flex items-center gap-3 mb-6"
            >
              <div className="w-15 h-2 flex items-center gap-4">
                <img style={{ width: "43px", height: "43px" }} src="/clubs/beja.png" alt="Olympique Béja" />
                <img style={{ width: "45px", height: "45px" }} src="/clubs/Ligue1.png" alt="Ligue 1 Tunisienne" />
              </div>
            </motion.div>
            <p className="text-[var(--foreground)] opacity-60">
              {t.tagline}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <Skiper58 language={language} />
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[var(--foreground)] font-bold text-lg mb-4">{t.contact}</h4>
            <ul className="space-y-2 text-[var(--foreground)] opacity-60">
              <li className="flex items-center gap-2">
                <MapPin size={16} className="text-[var(--primary)]" />
                {language === "ar" ? "باجة، تونس" : language === "fr" ? "Béja, Tunisie" : "Béja, Tunisia"}
              </li>
              <li>contact@olympiquedebeja.tn</li>
              <li>+216 78 458 308</li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-[var(--foreground)] font-bold text-lg mb-4">{t.subscribe}</h4>
            <p className="text-[var(--foreground)] opacity-60 mb-4">{t.subText}</p>
            <div className="flex flex-wrap gap-2">
              <input
                type="email"
                placeholder={t.placeholder}
                className="flex-1 min-w-[160px] bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 rounded-full px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--foreground)]/40 focus:outline-none focus:border-[var(--primary)]"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-[var(--primary)] text-white px-6 py-2 rounded-full font-semibold whitespace-nowrap shrink-0"
                onClick={(e) => {
                  e.preventDefault();
                  const input = e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement;
                  if (input && input.value.includes('@')) {
                    input.value = '';
                    alert(language === 'ar' ? 'تم الاشتراك بنجاح!' : language === 'fr' ? 'Inscription réussie !' : 'Successfully subscribed!');
                  }
                }}
              >
                {t.button}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-12 border-t border-white/10" />

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className={`text-sm ${theme === 'light' ? 'text-[#003366]' : 'text-white/40'}`}>
            &copy; 2026 Olympique Béja. {t.rights}
          </p>

          {/* Socials */}
          <div className="flex items-center gap-4">
            {socials.map((social, index) => (
              <motion.a
                key={index}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.2, y: -5 }}
                whileTap={{ scale: 0.9 }}
                className={`w-10 h-10 bg-[var(--foreground)]/10 rounded-full flex items-center justify-center text-[var(--foreground)] ${social.hoverClass} hover:text-white transition-all`}
              >
                <social.icon size={18} />
              </motion.a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// Main page component
export default function Home() {
  const [theme, setTheme] = useState("dark");
  const [language, setLanguage] = useState<"en" | "fr" | "ar">("en");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [points, setPoints] = useState(0);

  // Loading state for better UX
  const [isLoading, setIsLoading] = useState(true);
  const [contentReady, setContentReady] = useState(false);

  // Refs for VariableProximityText sections
  const standingsRef = useRef<HTMLDivElement>(null);
  const trophyRef = useRef<HTMLDivElement>(null);
  const squadRef = useRef<HTMLDivElement>(null);
  const newsRef = useRef<HTMLDivElement>(null);
  const matchdayRef = useRef<HTMLDivElement>(null);
  const shopRef = useRef<HTMLDivElement>(null);
  const ticketsRef = useRef<HTMLDivElement>(null);
  const academyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("ca_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (_) {
        // Corrupt/untrusted local data: ignore and fall back to logged-out state.
        localStorage.removeItem("ca_user");
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user || !fAuth) return;
      try {
        await fAuth.authStateReady();
        const current = fAuth.currentUser;
        if (!current || cancelled) return;
        const token = await current.getIdToken(true);
        
        // Fetch current points balance
        const res = await fetch("/api/points", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = (await res.json()) as { points?: unknown };
        if (!cancelled && typeof data.points === "number") {
          setPoints(data.points);
        }

        // Award daily login/visit points (once per day)
        const dailyRes = await fetch("/api/points/daily", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (dailyRes.ok) {
          const dailyData = (await dailyRes.json()) as { points?: number; awarded?: number };
          if (!cancelled && typeof dailyData.points === "number") {
            setPoints(dailyData.points);
          }
        }
      } catch {
        // Keep the server-derived balance as-is; no client fallback is trusted.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Loading effect - preload critical images and show loading screen
  useEffect(() => {
    // Preload critical images
    const preloadImages = [
      '/clubs/beja.png',
      '/beja.png',
    ];

    const imagePromises = preloadImages.map((src) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = resolve;
        img.onerror = resolve; // Don't block on error
      });
    });

    // Wait for images and minimum time
    Promise.all(imagePromises).then(() => {
      setIsLoading(false);
      // Small delay to ensure smooth transition
      setTimeout(() => setContentReady(true), 100);
    });

    // Fallback timeout - show content after 2 seconds max
    setTimeout(() => {
      setIsLoading(false);
      setContentReady(true);
    }, 2000);
  }, []);

  const handleLogout = async () => {
    try {
      if (fAuth) {
        await signOut(fAuth);
      }
      setUser(null);
      setPoints(0);
      localStorage.removeItem("ca_user");
      // Optional: force clear session if needed
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  function getTodayDate() {
    const d = new Date()
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0")
  }



  useEffect(() => {
    // Apply theme
    document.documentElement.className = theme;
  }, [theme]);

  useEffect(() => {
    // Apply language and text direction dynamically
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    window.dispatchEvent(new Event('languageChange'));
  }, [language]);

  const isRTL = language === "ar";
  const t = translations[language];

  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 0.98], [0, 1]);

  // Reveal logic removed or simplified


  return (
    <>
      {/* Loading Screen */}
      <AnimatePresence mode="wait">
        {!contentReady && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-background"
            suppressHydrationWarning
            style={{
              backgroundColor: theme === 'dark' ? '#0a0a0a' : '#ffffff'
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center"
              suppressHydrationWarning
            >
              <div className="relative w-32 h-32 mx-auto mb-8" suppressHydrationWarning>
                <NextImage
                  src="/clubs/beja.png"
                  alt="Olympique Béja Logo"
                  fill
                  className="object-contain animate-pulse"
                  suppressHydrationWarning
                />
              </div>
              <motion.div
                animate={{ width: ['0%', '100%'] }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="h-1 bg-[#C41E3A] rounded-full w-48 mx-auto"
                suppressHydrationWarning
              />
              <p className="mt-4 opacity-60 font-mono text-sm" style={{ color: theme === 'dark' ? '#ffffff' : '#000000' }} suppressHydrationWarning>
                CHARGEMENT...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content - only render when ready */}
      {contentReady && (
        <motion.main
          initial={{ opacity: 0 }}
          suppressHydrationWarning
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className={`overflow-x-hidden pt-20 ${isRTL ? "font-arabic" : ""}`}
          dir={isRTL ? "rtl" : "ltr"}
        >
          <style jsx global>{`
        html {
          scroll-padding-top: 6rem;
        }
        section {
          scroll-margin-top: 6rem;
        }
      `}</style>
          {/* Scroll progress bar - encourages "scroll more" feel */}
          <motion.div
            className="fixed top-0 left-0 right-0 h-1 bg-[#C41E3A] origin-left z-[100] shadow-[0_0_12px_rgba(255,215,0,0.6)]"
            style={{ scaleX }}
          />
          <Navigation
            theme={theme}
            setTheme={setTheme}
            language={language}
            setLanguage={setLanguage}
            setIsSearchOpen={setIsSearchOpen}
            setIsAuthOpen={setIsAuthOpen}
            user={user}
            points={points}
            onLogout={handleLogout}
          />

          <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} language={language} />
          <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} language={language}            onLogin={(u) => { setUser(u); }} />
          <ErrorBoundary>
            <ClientOnly>
              <HeroSection language={language} theme={theme} />
            </ClientOnly>
          </ErrorBoundary>
          <ErrorBoundary>
            <HistorySection language={language} theme={theme} />
          </ErrorBoundary>
          <ErrorBoundary>
            <ClientOnly>
              <TrophiesSection language={language} theme={theme} />
            </ClientOnly>
          </ErrorBoundary>
          <ErrorBoundary>
            <TeamSection language={language} theme={theme} />
          </ErrorBoundary>
          <ErrorBoundary>
            <AcademySection language={language} theme={theme} />
          </ErrorBoundary>
          <ErrorBoundary>
            <NewsSection language={language} theme={theme} />
          </ErrorBoundary>

          <ErrorBoundary>
            <HeroScrollDemo language={language} theme={theme} />
          </ErrorBoundary>


          <ErrorBoundary>
            <MatchesSection language={language} theme={theme} />
          </ErrorBoundary>
          <ErrorBoundary>
            <ShopSection language={language} theme={theme} user={user} points={points} setPoints={setPoints} />
          </ErrorBoundary>

          <div className="mb-20" /> {/* Spacer replacement */}

          <ErrorBoundary>
            <Footer language={language} theme={theme} />
          </ErrorBoundary>
        </motion.main>
      )}

      {/* AI Chat — always visible floating widget */}
      <ClientOnly>
        <AIChat />
      </ClientOnly>
    </>
  );
}
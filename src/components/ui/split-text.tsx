'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface SplitTextProps {
    text?: string;
    className?: string;
    delay?: number;
    duration?: number;
    animationFrom?: any;
    animationTo?: any;
    easing?: string;
    threshold?: number;
    rootMargin?: string;
    textAlign?: 'left' | 'right' | 'center' | 'justify';
    onLetterAnimationComplete?: () => void;
    start?: boolean;
    type?: 'chars' | 'words';
}

export const SplitText: React.FC<SplitTextProps> = ({
    text = '',
    className = '',
    delay = 0.05, // delay between each letter in seconds
    duration = 0.5,
    animationFrom = { opacity: 0, y: 40 },
    animationTo = { opacity: 1, y: 0 },
    easing = 'easeOut',
    threshold = 0.1,
    rootMargin = '-100px',
    textAlign = 'center',
    onLetterAnimationComplete,
    start,
    type = 'chars',
}) => {
    const words = text.split(' ');
    const [inView, setInView] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    observer.unobserve(entry.target);
                }
            },
            { threshold, rootMargin }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, [threshold, rootMargin]);

    const containerVariants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: delay,
            },
        },
    };

    const letterVariants = {
        hidden: animationFrom,
        visible: {
            ...animationTo,
            transition: { duration, ease: easing },
        },
    };

    return (
        <motion.div
            ref={ref}
            className={`block w-full flex flex-wrap gap-[0.25em] ${className}`}
            style={{
                textAlign,
                justifyContent: textAlign === 'center' ? 'center' : 'flex-start'
            }}
            initial="hidden"
            animate={(inView && (start !== false)) ? "visible" : "hidden"}
            variants={containerVariants}
            onAnimationComplete={() => {
                if (onLetterAnimationComplete) onLetterAnimationComplete();
            }}
        >
            {words.map((word, wordIndex) => (
                <span key={wordIndex} className="inline-flex whitespace-nowrap">
                    {type === 'chars' ? (
                        word.split('').map((char, charIndex) => (
                            <motion.span
                                key={charIndex}
                                variants={letterVariants}
                                className="inline-block"
                            >
                                {char}
                            </motion.span>
                        ))
                    ) : (
                        <motion.span
                            variants={letterVariants}
                            className="inline-block"
                        >
                            {word}
                        </motion.span>
                    )}
                </span>
            ))}
        </motion.div>
    );
};

export default SplitText;

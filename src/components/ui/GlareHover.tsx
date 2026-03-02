'use client'

import React, { useMemo } from 'react';
import './GlareHover.css';

interface GlareHoverProps {
    children: React.ReactNode;
    width?: string;
    height?: string;
    background?: string;
    borderRadius?: string;
    borderColor?: string;
    glareColor?: string;
    glareOpacity?: number;
    glareAngle?: number;
    glareSize?: number;
    transitionDuration?: number;
    playOnce?: boolean;
    className?: string;
    style?: React.CSSProperties;
}

function hexToRgba(color: string, opacity: number): string {
    const hex = color.replace('#', '');
    if (/^[0-9A-Fa-f]{6}$/.test(hex)) {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    if (/^[0-9A-Fa-f]{3}$/.test(hex)) {
        const r = parseInt(hex[0] + hex[0], 16);
        const g = parseInt(hex[1] + hex[1], 16);
        const b = parseInt(hex[2] + hex[2], 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    return color;
}

function GlareHover({
    width = '100%',
    height = '100%',
    background = 'transparent',
    borderRadius = 'inherit',
    borderColor = 'transparent',
    children,
    glareColor = '#ffffff',
    glareOpacity = 0.5,
    glareAngle = -45,
    glareSize = 250,
    transitionDuration = 650,
    playOnce = false,
    className = '',
    style = {}
}: GlareHoverProps) {
    const rgba = useMemo(
        () => hexToRgba(glareColor, glareOpacity),
        [glareColor, glareOpacity]
    );

    const vars = useMemo(() => ({
        '--gh-width': width,
        '--gh-height': height,
        '--gh-bg': background,
        '--gh-br': borderRadius,
        '--gh-angle': `${glareAngle}deg`,
        '--gh-duration': `${transitionDuration}ms`,
        '--gh-size': `${glareSize}%`,
        '--gh-rgba': rgba,
        '--gh-border': borderColor
    }) as React.CSSProperties, [width, height, background, borderRadius, glareAngle, transitionDuration, glareSize, rgba, borderColor]);

    return (
        <div
            className={`glare-hover ${playOnce ? 'glare-hover--play-once' : ''} ${className}`}
            style={{ ...vars, ...style }}
        >
            {children}
        </div>
    );
}

export default GlareHover;

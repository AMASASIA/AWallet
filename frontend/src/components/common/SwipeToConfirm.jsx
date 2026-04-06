import React, { useState, useRef, useEffect, useCallback } from 'react';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckIcon from '@mui/icons-material/Check';

const VALIDATION = {
    MIN_PROGRESS: 0.8,
    MIN_DURATION_MS: 500
};

/**
 * SwipeToConfirm — 物理的な同意証明
 * スワイプ操作(80%以上 + 500ms以上) でbot防止と人間の同意を証明する
 */
const SwipeToConfirm = ({ onConfirm, label = 'Slide to confirm →' }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [progress, setProgress] = useState(0);
    const [completed, setCompleted] = useState(false);
    const containerRef = useRef(null);
    const startTimeRef = useRef(0);
    const inputMethodRef = useRef('touch');

    const handleStart = (clientX, type) => {
        if (completed) return;
        setIsDragging(true);
        startTimeRef.current = Date.now();
        inputMethodRef.current = type;
    };

    const handleMove = useCallback((clientX) => {
        if (!isDragging || !containerRef.current || completed) return;
        const rect = containerRef.current.getBoundingClientRect();
        const offsetX = clientX - rect.left;
        const maxDrag = rect.width - 48;
        const p = Math.max(0, Math.min(1, offsetX / maxDrag));
        setProgress(p);
    }, [isDragging, completed]);

    const handleEnd = () => {
        if (!isDragging || completed) return;
        setIsDragging(false);
        const duration = Date.now() - startTimeRef.current;

        if (progress >= VALIDATION.MIN_PROGRESS && duration >= VALIDATION.MIN_DURATION_MS) {
            setCompleted(true);
            setProgress(1);
            onConfirm({
                method: 'swipe',
                progress,
                duration_ms: duration,
                input_type: inputMethodRef.current
            });
        } else {
            setProgress(0);
        }
    };

    // Keyboard: hold ArrowRight to confirm
    useEffect(() => {
        let kbProgress = 0;
        const handleKeyDown = (e) => {
            if (completed) return;
            if (e.key === 'ArrowRight' && document.activeElement === containerRef.current) {
                if (kbProgress === 0) {
                    startTimeRef.current = Date.now();
                    inputMethodRef.current = 'keyboard';
                }
                kbProgress = Math.min(1, kbProgress + 0.05);
                setProgress(kbProgress);
            }
        };
        const handleKeyUp = (e) => {
            if (e.key === 'ArrowRight' && !completed) {
                const duration = Date.now() - startTimeRef.current;
                if (kbProgress >= VALIDATION.MIN_PROGRESS && duration >= VALIDATION.MIN_DURATION_MS) {
                    setCompleted(true);
                    onConfirm({ method: 'keyboard', progress: kbProgress, duration_ms: duration, input_type: 'keyboard' });
                } else {
                    kbProgress = 0;
                    setProgress(0);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [completed, onConfirm]);

    return (
        <div
            ref={containerRef}
            role="slider"
            tabIndex={0}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
            aria-label="Swipe right to confirm action"
            onMouseDown={(e) => handleStart(e.clientX, 'mouse')}
            onMouseMove={(e) => handleMove(e.clientX)}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={(e) => handleStart(e.touches[0].clientX, 'touch')}
            onTouchMove={(e) => handleMove(e.touches[0].clientX)}
            onTouchEnd={handleEnd}
            style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
        >
            <div className="if-swipe-track">
                {/* Fill */}
                <div
                    className="if-swipe-fill"
                    style={{ width: `${progress * 100}%` }}
                />
                {/* Text */}
                <span
                    className="if-swipe-text"
                    style={{
                        color: progress > 0.5 ? '#fff' : '#9ca3af',
                        opacity: completed ? 0 : Math.max(0, 1 - progress * 1.5)
                    }}
                >
                    {completed ? 'Confirmed ✓' : label}
                </span>
                {/* Handle */}
                <div
                    className="if-swipe-handle"
                    style={{ left: `calc(${progress} * (100% - 48px))` }}
                >
                    {completed
                        ? <CheckIcon style={{ fontSize: 18, color: '#10b981' }} />
                        : <ArrowForwardIcon style={{ fontSize: 18, color: progress > 0.1 ? '#666' : '#ccc' }} />
                    }
                </div>
            </div>
        </div>
    );
};

export default SwipeToConfirm;

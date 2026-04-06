import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { ConfirmationMetrics, ConfirmationMethod } from '../types';
import { VALIDATION_RULES } from '../constants';

interface SwipeToConfirmProps {
  onConfirm: (metrics: ConfirmationMetrics) => void;
  label?: string;
}

const SwipeToConfirm: React.FC<SwipeToConfirmProps> = ({ 
  onConfirm, 
  label = "Slide to confirm" 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 1
  const [completed, setCompleted] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(0);
  const inputMethodRef = useRef<string>("touch");

  // Keyboard accessibility state
  const keyboardProgressRef = useRef(0);
  const animationFrameRef = useRef<number>();

  const handleStart = (clientX: number, type: string) => {
    if (completed) return;
    setIsDragging(true);
    startTimeRef.current = Date.now();
    inputMethodRef.current = type;
  };

  const handleMove = useCallback((clientX: number) => {
    if (!isDragging || !containerRef.current || completed) return;

    const rect = containerRef.current.getBoundingClientRect();
    const offsetX = clientX - rect.left;
    const maxDrag = rect.width - 56; // handle width (approx 56px)
    
    // Clamp
    let newProgress = Math.max(0, Math.min(1, offsetX / maxDrag));
    
    setProgress(newProgress);
  }, [isDragging, completed]);

  const handleEnd = () => {
    if (!isDragging || completed) return;
    setIsDragging(false);

    const duration = Date.now() - startTimeRef.current;

    // Validate locally for UI feedback, but Backend is source of truth
    if (progress >= VALIDATION_RULES.MIN_SWIPE_PROGRESS) {
      setCompleted(true);
      setProgress(1); // Snap to end
      
      onConfirm({
        method: ConfirmationMethod.SWIPE,
        progress: progress,
        duration_ms: duration,
        input_type: inputMethodRef.current
      });
    } else {
      // Snap back
      setProgress(0);
    }
  };

  // Mouse Events
  const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientX, "mouse");
  const onMouseMove = (e: React.MouseEvent) => handleMove(e.clientX);
  const onMouseUp = () => handleEnd();
  const onMouseLeave = () => handleEnd();

  // Touch Events
  const onTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientX, "touch");
  const onTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX);
  const onTouchEnd = () => handleEnd();

  // Keyboard Accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (completed) return;
      if (e.key === 'ArrowRight' && document.activeElement === containerRef.current) {
        if (keyboardProgressRef.current === 0) {
           startTimeRef.current = Date.now();
           inputMethodRef.current = "keyboard";
        }
        // Increment
        keyboardProgressRef.current = Math.min(1, keyboardProgressRef.current + 0.05);
        setProgress(keyboardProgressRef.current);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && document.activeElement === containerRef.current) {
        if (completed) return;
        
        const duration = Date.now() - startTimeRef.current;
        if (keyboardProgressRef.current >= VALIDATION_RULES.MIN_SWIPE_PROGRESS) {
          setCompleted(true);
          onConfirm({
            method: ConfirmationMethod.KEYBOARD,
            progress: keyboardProgressRef.current,
            duration_ms: duration,
            input_type: "keyboard"
          });
        } else {
          keyboardProgressRef.current = 0;
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
      className="w-full select-none"
      role="slider"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
      aria-label="Swipe right to confirm action"
      tabIndex={0}
      ref={containerRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className={`relative h-14 rounded-full transition-colors duration-300 ${
        completed ? 'bg-emerald-50' : 'bg-gray-100 border border-gray-200'
      }`}>
        
        {/* Background Text */}
        <div 
          className={`absolute inset-0 flex items-center justify-center text-sm font-medium tracking-wide uppercase transition-opacity duration-300 ${
            completed ? 'text-emerald-600 opacity-100' : 'text-gray-400'
          }`}
          style={{ opacity: completed ? 1 : 1 - progress * 1.5 }}
        >
          {completed ? "Confirmed" : label}
        </div>

        {/* The Handle / Track */}
        <div 
          className="absolute top-1 left-1 bottom-1 w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center cursor-grab active:cursor-grabbing transition-transform duration-75 z-10 border border-gray-100"
          style={{ 
            transform: `translateX(calc(${progress * 100}% * (var(--slide-width) - 56px) / 56px))`,
            left: `calc(${progress} * (100% - 56px))` // Simplified logic for inline style
          }}
        >
          {completed ? (
            <Check className="w-5 h-5 text-emerald-500" />
          ) : (
            <ArrowRight className={`w-5 h-5 text-gray-400 ${progress > 0.1 ? 'opacity-100' : 'opacity-50'}`} />
          )}
        </div>
        
        {/* Progress Fill */}
        <div 
          className="absolute top-0 left-0 bottom-0 rounded-full bg-emerald-500/10 pointer-events-none transition-all duration-75"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      
      {/* Keyboard Hint */}
      <div className="text-center mt-2 h-4">
        <span className="text-[10px] text-gray-400 sr-only md:not-sr-only">
          Hold Right Arrow to confirm
        </span>
      </div>
    </div>
  );
};

export default SwipeToConfirm;
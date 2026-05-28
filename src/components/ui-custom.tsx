"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { X, CheckCircle2, AlertTriangle, Info, Trophy } from "lucide-react";

// --- BUTTON COMPONENT ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-display rounded-lg font-semibold tracking-wide uppercase transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-primary text-background hover:bg-primary-hover hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] border border-primary",
    secondary: "bg-secondary text-foreground hover:bg-zinc-800 border border-border",
    accent: "bg-accent text-foreground hover:bg-accent-hover hover:shadow-[0_0_15px_rgba(185,28,28,0.4)] border border-accent",
    ghost: "bg-transparent text-foreground hover:bg-white/5",
    outline: "bg-transparent border border-primary text-primary hover:bg-primary/10 hover:shadow-[0_0_10px_rgba(212,175,55,0.2)]"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3 text-base"
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// --- CARD COMPONENT ---
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "gold" | "red" | "dark";
  hoverable?: boolean;
}

export function Card({
  children,
  variant = "gold",
  hoverable = true,
  className = "",
  ...props
}: CardProps) {
  const baseStyles = "rounded-xl p-5 overflow-hidden transition-all duration-300";
  
  const glassClasses = {
    gold: "glass gold-glow",
    red: "glass-red red-glow",
    dark: "bg-secondary/80 border border-border"
  };

  const hoverClass = hoverable ? "glass-hover cursor-pointer" : "";

  return (
    <div
      className={`${baseStyles} ${glassClasses[variant]} ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// --- INPUT COMPONENT ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({
  label,
  error,
  className = "",
  ...props
}: InputProps) {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label className="text-xs uppercase tracking-wider font-semibold text-muted font-display">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-3 bg-zinc-900/60 border border-zinc-800 rounded-lg text-foreground text-sm font-sans placeholder:text-zinc-600 transition-all duration-300 focus:border-primary focus:shadow-[0_0_10px_rgba(212,175,55,0.2)] focus:outline-none disabled:opacity-40 disabled:pointer-events-none ${
          error ? "border-accent/80 focus:border-accent focus:shadow-[0_0_10px_rgba(185,28,28,0.2)]" : ""
        } ${className}`}
        {...props}
      />
      {error && (
        <span className="text-xs text-accent font-medium mt-0.5 animate-pulse">
          {error}
        </span>
      )}
    </div>
  );
}

// --- DIALOG COMPONENT (MODAL) ---
interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Dialog({ isOpen, onClose, title, children }: DialogProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-md p-6 glass gold-glow rounded-xl z-10 border border-primary/20 animate-in fade-in zoom-in duration-300">
        <div className="flex items-center justify-between mb-4 border-b border-zinc-800/80 pb-3">
          <h3 className="text-lg font-display uppercase tracking-wider font-bold text-primary flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors p-1 rounded-full hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

// --- TOAST NOTIFICATION SYSTEM ---
export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 left-4 md:left-auto z-[999] flex flex-col gap-2 max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start justify-between gap-3 p-4 rounded-xl shadow-lg border animate-in slide-in-from-bottom duration-300 ${
              toast.type === "success"
                ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/30"
                : toast.type === "error"
                ? "bg-accent/15 text-red-300 border-accent/20"
                : toast.type === "warning"
                ? "bg-amber-950/80 text-amber-300 border-amber-500/30"
                : "bg-zinc-900/90 text-zinc-300 border-zinc-800"
            }`}
          >
            <div className="flex gap-2.5 items-start mt-0.5">
              {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
              {toast.type === "error" && <AlertTriangle className="w-5 h-5 text-accent flex-shrink-0" />}
              {toast.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />}
              {toast.type === "info" && <Info className="w-5 h-5 text-primary flex-shrink-0" />}
              <p className="text-xs font-medium leading-relaxed font-sans">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-zinc-500 hover:text-zinc-300 transition-colors p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast deve ser usado dentro de um ToastProvider");
  }
  return context;
}

// --- LOADING SPINNER COMPONENT ---
export function Loading({ size = "md", className = "" }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizes = {
    sm: "w-5 h-5 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4"
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div className={`animate-spin rounded-full border-t-primary border-r-transparent border-b-transparent border-l-transparent ${sizes[size]}`}></div>
    </div>
  );
}

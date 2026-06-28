"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { X, AlertTriangle } from "lucide-react"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  variant?: "default" | "destructive"
}

export function Modal({ isOpen, onClose, title, children, variant = "default" }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div 
        className={cn(
          "relative z-50 w-full max-w-lg rounded-lg bg-white p-6 shadow-lg shadow-black/10 overflow-hidden animate-in fade-in zoom-in-95",
          variant === "destructive" && "border-t-4 border-t-red-600"
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {variant === "destructive" && <AlertTriangle className="h-6 w-6 text-red-600" />}
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full p-1 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>
        <div>
          {children}
        </div>
      </div>
    </div>
  )
}

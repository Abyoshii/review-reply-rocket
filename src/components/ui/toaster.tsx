
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useEffect, useState } from "react"

// Declare global window type for toast settings
declare global {
  interface Window {
    toastSettings?: {
      duration: number;
      important: boolean;
      disabled: boolean;
    };
  }
}

export function Toaster() {
  const { toasts } = useToast()
  const [settings, setSettings] = useState({
    opacity: 0.9,
    duration: 5000
  })

  // Load settings from localStorage
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem("notification_settings")
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings)
        setSettings({
          opacity: parsedSettings.transparency || 0.9,
          duration: parsedSettings.displayTime || 5000
        })
      }
    } catch (e) {
      console.error("Failed to parse notification settings", e)
    }
  }, [])

  // Use the settings from localStorage or default
  const toastDuration = window.toastSettings?.duration || settings.duration

  return (
    <ToastProvider duration={toastDuration}>
      <div className="toast-container" style={{ opacity: settings.opacity }}>
        {toasts.map(function ({ id, title, description, action, important, ...props }) {
          // Skip toast if notifications are disabled or if this is not important and only important should be shown
          if (window.toastSettings?.disabled || 
              (window.toastSettings?.important && 
               !important && 
               props.variant !== "destructive")) {
            return null
          }
          
          return (
            <Toast key={id} {...props} className="opacity-90 rounded-lg pointer-events-auto z-30">
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
              {action}
              <ToastClose />
            </Toast>
          )
        })}
      </div>
      <ToastViewport className="fixed top-0 z-30 flex max-h-screen w-full flex-col-reverse p-4 sm:right-0 sm:top-0 sm:flex-col md:max-w-[420px]" />
    </ToastProvider>
  )
}

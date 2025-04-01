
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
          opacity: parsedSettings.opacity || 0.9,
          duration: parsedSettings.duration || 5000
        })
      }
    } catch (e) {
      console.error("Failed to parse notification settings", e)
    }
  }, [])

  return (
    <ToastProvider duration={window.toastSettings?.duration || settings.duration}>
      <div className="toast-container" style={{ opacity: settings.opacity }}>
        {toasts.map(function ({ id, title, description, action, ...props }) {
          // Skip toast if notifications are disabled or if this is not important and only important should be shown
          if (window.toastSettings?.disabled || 
              (window.toastSettings?.important && 
               !props.important && 
               props.variant !== "destructive")) {
            return null
          }
          
          return (
            <Toast key={id} {...props} className="opacity-90 rounded-lg">
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
      <ToastViewport className="right-0 top-0" />
    </ToastProvider>
  )
}

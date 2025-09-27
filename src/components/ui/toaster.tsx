import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      <div role="region" aria-label="Notifications" className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
        <ol className="toaster-list">
          {toasts.map(function ({ id, title, description, action, variant, ...props }) {
            return (
              <li key={id}>
                <Toast {...props} variant={variant} className={variant === 'destructive' ? 'high-contrast' : ''}>
                  <div className="grid gap-1">
                    {title && <ToastTitle>{title}</ToastTitle>}
                    {description && (
                      <ToastDescription>{description}</ToastDescription>
                    )}
                  </div>
                  {action}
                  <ToastClose />
                </Toast>
              </li>
            )
          })}
        </ol>
      </div>
      <ToastViewport />
    </ToastProvider>
  )
}

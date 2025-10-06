import React from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { logger } from '@/utils/logger';


interface EmailFormLayoutProps {
  description: string;
  isSubmitting: boolean;
  submitLabel: string;
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  footer?: React.ReactNode;
}

export const EmailFormLayout = ({
  description,
  isSubmitting,
  submitLabel,
  children,
  onSubmit,
  footer,
}: EmailFormLayoutProps) => {
  logger.debug('EmailFormLayout utilisé');
  return (
    <>
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{description}</AlertDescription>
      </Alert>

      <form onSubmit={onSubmit} className="space-y-4">
        {children}
        <div className="flex gap-4 mt-6">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Enregistrement..." : submitLabel}
          </Button>
          {footer}
        </div>
      </form>
    </>
  );
};

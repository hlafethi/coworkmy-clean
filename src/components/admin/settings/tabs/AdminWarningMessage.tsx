import { Info } from "lucide-react";

interface AdminWarningMessageProps {
  isDisabled: boolean;
}

export function AdminWarningMessage({ isDisabled }: AdminWarningMessageProps) {
  if (!isDisabled) return null;
  
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 flex items-start gap-2">
      <Info className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
      <div className="text-sm text-yellow-700">
        <p className="font-medium">Mode lecture seule</p>
        <p>Vous pouvez visualiser les paramètres, mais vous n'avez pas les droits nécessaires pour les modifier.</p>
      </div>
    </div>
  );
}

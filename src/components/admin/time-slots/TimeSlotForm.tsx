import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { timeSlotFormSchema, type TimeSlotFormValues } from "./timeSlotSchema";
import { type TimeSlot } from "../types";

interface TimeSlotFormProps {
  timeSlot?: TimeSlot;
  isEditing: boolean;
  onSubmit: (values: TimeSlotFormValues) => void;
  onCancel: () => void;
}

export function TimeSlotForm({ timeSlot, isEditing, onSubmit, onCancel }: TimeSlotFormProps) {
  const form = useForm<TimeSlotFormValues>({
    resolver: zodResolver(timeSlotFormSchema),
    defaultValues: {
      id: timeSlot?.id || undefined,
      label: timeSlot?.label || "",
      start_time: timeSlot?.start_time || "",
      end_time: timeSlot?.end_time || "",
      display_order: timeSlot?.display_order || undefined,
    },
  });

  // Fonction pour pré-remplir les champs
  const setPreset = (preset: "morning" | "afternoon" | "full") => {
    if (preset === "morning") {
      form.setValue("label", "Matin (9h-13h)");
      form.setValue("start_time", "09:00");
      form.setValue("end_time", "13:00");
    } else if (preset === "afternoon") {
      form.setValue("label", "Après-midi (14h-18h)");
      form.setValue("start_time", "14:00");
      form.setValue("end_time", "18:00");
    } else if (preset === "full") {
      form.setValue("label", "Journée complète (9h-18h)");
      form.setValue("start_time", "09:00");
      form.setValue("end_time", "18:00");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Boutons de presets */}
        <div className="flex gap-2 mb-2">
          <Button type="button" variant="secondary" onClick={() => setPreset("morning")}>Matin</Button>
          <Button type="button" variant="secondary" onClick={() => setPreset("afternoon")}>Après-midi</Button>
          <Button type="button" variant="secondary" onClick={() => setPreset("full")}>Journée entière</Button>
        </div>
        <FormField
          control={form.control}
          name="label"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Libellé</FormLabel>
              <FormControl>
                <Input placeholder="ex: Journée complète (9h-18h)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="start_time"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Heure de début</FormLabel>
              <FormControl>
                <Input placeholder="ex: 09:00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="end_time"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Heure de fin</FormLabel>
              <FormControl>
                <Input placeholder="ex: 18:00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
          >
            Annuler
          </Button>
          <Button type="submit">
            {isEditing ? "Mettre à jour" : "Ajouter"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

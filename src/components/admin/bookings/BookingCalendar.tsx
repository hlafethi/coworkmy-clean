import React, { useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { format } from "date-fns";
import { parse } from "date-fns";
import { startOfWeek } from "date-fns";
import { getDay } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Booking } from "./types";
import { BookingStatusBadge } from "./BookingStatusBadge";
// Logger supprimé - utilisation de console directement
// Setup localization for the calendar
const locales = {
  'fr': fr,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }), // Week starts on Monday
  getDay,
  locales,
});

interface BookingCalendarProps {
  bookings: Booking[];
  loading: boolean;
  onUpdateStatus: (id: string, status: string) => void;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Booking;
}

export const BookingCalendar: React.FC<BookingCalendarProps> = ({
  bookings,
  loading,
  onUpdateStatus,
}) => {
  const [view, setView] = useState<"month" | "week" | "day" | "agenda">("month");
  
  // Transform bookings into calendar events
  const events: CalendarEvent[] = bookings.map(booking => ({
    id: booking.id,
    title: `${booking.space_name || "Espace"} - ${booking.user_name || "Utilisateur"}`,
    start: new Date(booking.start_time),
    end: new Date(booking.end_time),
    resource: booking,
  }));

  // Custom event component to display booking details
  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    const booking = event.resource;
    return (
      <div className="text-xs p-1 overflow-hidden h-full">
        <div className="font-semibold truncate">{event.title}</div>
        <div className="flex items-center gap-1 mt-1">
          <BookingStatusBadge status={booking.status} />
          <select
            value={booking.status}
            onChange={(e) => onUpdateStatus(booking.id, e.target.value)}
            className="text-xs bg-transparent border-none focus:ring-0"
            onClick={(e) => e.stopPropagation()}
          >
            <option value="pending">En attente</option>
            <option value="confirmed">Confirmé</option>
            <option value="cancelled">Annulé</option>
          </select>
        </div>
      </div>
    );
  };

  // Custom toolbar to add view options
  const CustomToolbar = (toolbar: any) => {
    const goToBack = () => {
      toolbar.onNavigate('PREV');
    };

    const goToNext = () => {
      toolbar.onNavigate('NEXT');
    };

    const goToCurrent = () => {
      toolbar.onNavigate('TODAY');
    };

    return (
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={goToBack}>
            Précédent
          </Button>
          <Button variant="outline" size="sm" onClick={goToCurrent}>
            Aujourd'hui
          </Button>
          <Button variant="outline" size="sm" onClick={goToNext}>
            Suivant
          </Button>
        </div>
        <h2 className="text-lg font-semibold">
          {toolbar.label}
        </h2>
        <div className="flex gap-2">
          <Button 
            variant={view === "month" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setView("month")}
          >
            Mois
          </Button>
          <Button 
            variant={view === "week" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setView("week")}
          >
            Semaine
          </Button>
          <Button 
            variant={view === "day" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setView("day")}
          >
            Jour
          </Button>
          <Button 
            variant={view === "agenda" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setView("agenda")}
          >
            Agenda
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-[600px] w-full bg-gray-100 animate-pulse rounded-md"></div>
    );
  }

  return (
    <div className="h-[600px]">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%" }}
        views={['month', 'week', 'day', 'agenda']}
        view={view}
        onView={(newView: any) => setView(newView)}
        components={{
          event: EventComponent,
          toolbar: CustomToolbar,
        }}
        popup
        onSelectEvent={(event: CalendarEvent) => {
          // Show event details in a modal or popover
          console.log("Selected event:", event);
        }}
        eventPropGetter={(event: CalendarEvent) => {
          const booking = event.resource;
          let backgroundColor = "#3174ad"; // Default blue
          
          // Color based on status
          if (booking.status === "confirmed") {
            backgroundColor = "#10b981"; // Green
          } else if (booking.status === "pending") {
            backgroundColor = "#f59e0b"; // Yellow
          } else if (booking.status === "cancelled") {
            backgroundColor = "#ef4444"; // Red
          }
          
          return { style: { backgroundColor } };
        }}
        messages={{
          month: "Mois",
          week: "Semaine",
          day: "Jour",
          agenda: "Agenda",
          today: "Aujourd'hui",
          previous: "Précédent",
          next: "Suivant",
          showMore: (total) => `+ ${total} autres`,
        }}
        culture="fr"
      />
    </div>
  );
};

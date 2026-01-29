"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock } from "lucide-react";
import { WeeklySchedule } from "./components/weekly-schedule";
import { ExceptionsSection } from "./components/exceptions-section";
import { BookingSettings } from "./components/booking-settings";

export default function DisponibilidadPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Clock className="h-8 w-8" />
            Disponibilidad
          </h1>
          <p className="text-muted-foreground">
            Configura tus horarios de atencion y excepciones
          </p>
        </div>
      </div>

      <Tabs defaultValue="horarios" className="space-y-6">
        <TabsList>
          <TabsTrigger value="horarios">Horarios Semanales</TabsTrigger>
          <TabsTrigger value="excepciones">Excepciones</TabsTrigger>
          <TabsTrigger value="config">Configuracion</TabsTrigger>
        </TabsList>

        <TabsContent value="horarios">
          <WeeklySchedule />
        </TabsContent>

        <TabsContent value="excepciones">
          <ExceptionsSection />
        </TabsContent>

        <TabsContent value="config">
          <BookingSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

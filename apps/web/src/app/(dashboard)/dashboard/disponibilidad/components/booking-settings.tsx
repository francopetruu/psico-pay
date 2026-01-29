"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Settings, Save, Loader2 } from "lucide-react";

export function BookingSettings() {
  const utils = trpc.useUtils();
  const { data: settings, isLoading } = trpc.availability.getBookingSettings.useQuery();

  const [bufferBefore, setBufferBefore] = useState(0);
  const [bufferAfter, setBufferAfter] = useState(15);
  const [minAdvanceHours, setMinAdvanceHours] = useState(24);
  const [maxAdvanceDays, setMaxAdvanceDays] = useState(60);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (settings) {
      setBufferBefore(settings.bufferBeforeMinutes);
      setBufferAfter(settings.bufferAfterMinutes);
      setMinAdvanceHours(settings.minAdvanceBookingHours);
      setMaxAdvanceDays(settings.maxAdvanceBookingDays);
    }
  }, [settings]);

  useEffect(() => {
    if (settings) {
      const changed =
        bufferBefore !== settings.bufferBeforeMinutes ||
        bufferAfter !== settings.bufferAfterMinutes ||
        minAdvanceHours !== settings.minAdvanceBookingHours ||
        maxAdvanceDays !== settings.maxAdvanceBookingDays;
      setHasChanges(changed);
    }
  }, [settings, bufferBefore, bufferAfter, minAdvanceHours, maxAdvanceDays]);

  const updateSettings = trpc.availability.updateBookingSettings.useMutation({
    onSuccess: () => {
      utils.availability.getBookingSettings.invalidate();
      setHasChanges(false);
    },
  });

  const handleSave = () => {
    updateSettings.mutate({
      bufferBeforeMinutes: bufferBefore,
      bufferAfterMinutes: bufferAfter,
      minAdvanceBookingHours: minAdvanceHours,
      maxAdvanceBookingDays: maxAdvanceDays,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-muted-foreground text-center">
            Cargando configuracion...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuracion de Reservas
          </CardTitle>
          <CardDescription>
            Configura los tiempos de buffer y limites para las reservas de pacientes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bufferBefore">
                Tiempo buffer antes de sesion (minutos)
              </Label>
              <Input
                id="bufferBefore"
                type="number"
                min={0}
                max={60}
                value={bufferBefore}
                onChange={(e) => setBufferBefore(parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Tiempo libre antes de cada sesion para preparacion
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bufferAfter">
                Tiempo buffer despues de sesion (minutos)
              </Label>
              <Input
                id="bufferAfter"
                type="number"
                min={0}
                max={60}
                value={bufferAfter}
                onChange={(e) => setBufferAfter(parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Tiempo libre despues de cada sesion para notas
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minAdvanceHours">
                Anticipacion minima para reservar (horas)
              </Label>
              <Input
                id="minAdvanceHours"
                type="number"
                min={0}
                max={168}
                value={minAdvanceHours}
                onChange={(e) => setMinAdvanceHours(parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Tiempo minimo de antelacion para que un paciente reserve
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxAdvanceDays">
                Anticipacion maxima para reservar (dias)
              </Label>
              <Input
                id="maxAdvanceDays"
                type="number"
                min={1}
                max={365}
                value={maxAdvanceDays}
                onChange={(e) => setMaxAdvanceDays(parseInt(e.target.value) || 1)}
              />
              <p className="text-xs text-muted-foreground">
                Hasta cuantos dias en el futuro pueden reservar los pacientes
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={!hasChanges || updateSettings.isPending}
            >
              {updateSettings.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">Duracion de sesion</p>
              <p className="text-2xl font-bold">{settings?.defaultSessionDuration || 50} min</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">Zona horaria</p>
              <p className="text-lg font-medium">{settings?.timezone || "America/Argentina/Buenos_Aires"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

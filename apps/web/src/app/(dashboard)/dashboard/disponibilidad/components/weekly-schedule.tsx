"use client";

import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Plus, Trash2, Calendar } from "lucide-react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

const DAYS_OF_WEEK = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miercoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sabado" },
];

export function WeeklySchedule() {
  const utils = trpc.useUtils();
  const { data: rules, isLoading } = trpc.availability.listRules.useQuery();

  const [showAddDialog, setShowAddDialog] = useState(false);

  const createRule = trpc.availability.createRule.useMutation({
    onSuccess: () => {
      utils.availability.listRules.invalidate();
      setShowAddDialog(false);
    },
  });

  const deleteRule = trpc.availability.deleteRule.useMutation({
    onSuccess: () => {
      utils.availability.listRules.invalidate();
    },
  });

  // Group rules by day
  const rulesByDay = DAYS_OF_WEEK.map((day) => ({
    ...day,
    rules: rules?.filter((r) => r.dayOfWeek === day.value) || [],
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Horarios Semanales
            </CardTitle>
            <CardDescription>
              Define tus horarios de atencion para cada dia de la semana
            </CardDescription>
          </div>
          <AddRuleDialog
            open={showAddDialog}
            onOpenChange={setShowAddDialog}
            onAdd={(data) => createRule.mutate(data)}
            isPending={createRule.isPending}
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">
            Cargando horarios...
          </p>
        ) : !rules || rules.length === 0 ? (
          <div className="text-center py-8 space-y-4">
            <p className="text-muted-foreground">
              No has configurado horarios de atencion
            </p>
            <p className="text-sm text-muted-foreground">
              Agrega tus horarios disponibles para que los pacientes puedan agendar citas
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {rulesByDay.map((day) => (
              <DaySchedule
                key={day.value}
                day={day}
                onDelete={(id) => deleteRule.mutate({ id })}
                isDeleting={deleteRule.isPending}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DaySchedule({
  day,
  onDelete,
  isDeleting,
}: {
  day: { value: number; label: string; rules: Array<{ id: string; startTime: string; endTime: string; isAvailable: boolean }> };
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (day.rules.length === 0) {
    return (
      <div className="flex items-center justify-between py-2 border-b last:border-0">
        <span className="font-medium w-24">{day.label}</span>
        <span className="text-muted-foreground text-sm">No disponible</span>
      </div>
    );
  }

  return (
    <div className="py-2 border-b last:border-0">
      <div className="flex items-start gap-4">
        <span className="font-medium w-24 pt-1">{day.label}</span>
        <div className="flex-1 space-y-2">
          {day.rules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2"
            >
              <span className="text-sm">
                {rule.startTime} - {rule.endTime}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setDeleteId(rule.id)}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
              <ConfirmationDialog
                open={deleteId === rule.id}
                onOpenChange={(open) => !open && setDeleteId(null)}
                title="Eliminar horario"
                description={`¿Eliminar el horario ${rule.startTime} - ${rule.endTime} del ${day.label}?`}
                confirmLabel="Eliminar"
                cancelLabel="Cancelar"
                onConfirm={() => {
                  onDelete(rule.id);
                  setDeleteId(null);
                }}
                variant="destructive"
                isLoading={isDeleting}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AddRuleDialog({
  open,
  onOpenChange,
  onAdd,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: { dayOfWeek: number; startTime: string; endTime: string }) => void;
  isPending: boolean;
}) {
  const [dayOfWeek, setDayOfWeek] = useState<string>("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");

  const handleSubmit = () => {
    if (!dayOfWeek) return;
    onAdd({
      dayOfWeek: parseInt(dayOfWeek),
      startTime,
      endTime,
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setDayOfWeek("");
      setStartTime("09:00");
      setEndTime("18:00");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Horario
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Horario</DialogTitle>
          <DialogDescription>
            Define un bloque de disponibilidad para un dia de la semana
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Dia de la semana</Label>
            <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar dia..." />
              </SelectTrigger>
              <SelectContent>
                {DAYS_OF_WEEK.map((day) => (
                  <SelectItem key={day.value} value={day.value.toString()}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Hora inicio</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Hora fin</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !dayOfWeek || !startTime || !endTime}
          >
            {isPending ? "Agregando..." : "Agregar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

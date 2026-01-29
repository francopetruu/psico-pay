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
import { Checkbox } from "@/components/ui/checkbox";
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
import { Plus, Trash2, CalendarOff, CalendarPlus } from "lucide-react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Badge } from "@/components/ui/badge";

export function ExceptionsSection() {
  const utils = trpc.useUtils();

  // Get exceptions for next 90 days
  const today = new Date().toISOString().split("T")[0];
  const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const { data: exceptions, isLoading } = trpc.availability.listExceptions.useQuery({
    startDate: today,
    endDate,
  });

  const [showAddDialog, setShowAddDialog] = useState(false);

  const createException = trpc.availability.createException.useMutation({
    onSuccess: () => {
      utils.availability.listExceptions.invalidate();
      setShowAddDialog(false);
    },
  });

  const deleteException = trpc.availability.deleteException.useMutation({
    onSuccess: () => {
      utils.availability.listExceptions.invalidate();
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarOff className="h-5 w-5" />
              Excepciones
            </CardTitle>
            <CardDescription>
              Bloquea fechas especificas (vacaciones, feriados) o agrega disponibilidad extra
            </CardDescription>
          </div>
          <AddExceptionDialog
            open={showAddDialog}
            onOpenChange={setShowAddDialog}
            onAdd={(data) => createException.mutate(data)}
            isPending={createException.isPending}
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">
            Cargando excepciones...
          </p>
        ) : !exceptions || exceptions.length === 0 ? (
          <div className="text-center py-8 space-y-4">
            <p className="text-muted-foreground">
              No hay excepciones programadas
            </p>
            <p className="text-sm text-muted-foreground">
              Usa excepciones para bloquear vacaciones o agregar horarios especiales
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {exceptions.map((exception) => (
              <ExceptionCard
                key={exception.id}
                exception={exception}
                onDelete={() => deleteException.mutate({ id: exception.id })}
                isDeleting={deleteException.isPending}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ExceptionCard({
  exception,
  onDelete,
  isDeleting,
}: {
  exception: {
    id: string;
    exceptionDate: string;
    startTime: string | null;
    endTime: string | null;
    allDay: boolean;
    exceptionType: "block" | "available";
    reason: string | null;
  };
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const formattedDate = new Date(exception.exceptionDate + "T12:00:00").toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const isBlock = exception.exceptionType === "block";

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-lg ${isBlock ? "bg-red-100" : "bg-green-100"}`}>
          {isBlock ? (
            <CalendarOff className={`h-5 w-5 ${isBlock ? "text-red-600" : "text-green-600"}`} />
          ) : (
            <CalendarPlus className="h-5 w-5 text-green-600" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium capitalize">{formattedDate}</p>
            <Badge variant={isBlock ? "destructive" : "default"}>
              {isBlock ? "Bloqueado" : "Disponible"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {exception.allDay
              ? "Todo el dia"
              : `${exception.startTime} - ${exception.endTime}`}
            {exception.reason && ` - ${exception.reason}`}
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowDeleteConfirm(true)}
        disabled={isDeleting}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Eliminar excepcion"
        description={`¿Eliminar la excepcion del ${formattedDate}?`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={onDelete}
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  );
}

function AddExceptionDialog({
  open,
  onOpenChange,
  onAdd,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: {
    exceptionDate: string;
    startTime?: string | null;
    endTime?: string | null;
    allDay: boolean;
    exceptionType: "block" | "available";
    reason?: string | null;
  }) => void;
  isPending: boolean;
}) {
  const [exceptionDate, setExceptionDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [allDay, setAllDay] = useState(true);
  const [exceptionType, setExceptionType] = useState<"block" | "available">("block");
  const [reason, setReason] = useState("");

  const handleSubmit = () => {
    if (!exceptionDate) return;
    onAdd({
      exceptionDate,
      startTime: allDay ? null : startTime,
      endTime: allDay ? null : endTime,
      allDay,
      exceptionType,
      reason: reason || null,
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setExceptionDate("");
      setStartTime("09:00");
      setEndTime("18:00");
      setAllDay(true);
      setExceptionType("block");
      setReason("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Excepcion
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Excepcion</DialogTitle>
          <DialogDescription>
            Bloquea una fecha o agrega disponibilidad extra
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Tipo de excepcion</Label>
            <Select value={exceptionType} onValueChange={(v) => setExceptionType(v as "block" | "available")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="block">Bloquear (No disponible)</SelectItem>
                <SelectItem value="available">Disponible (Horario extra)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Fecha</Label>
            <Input
              type="date"
              value={exceptionDate}
              onChange={(e) => setExceptionDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="allDay"
              checked={allDay}
              onCheckedChange={(checked) => setAllDay(checked === true)}
            />
            <Label htmlFor="allDay">Todo el dia</Label>
          </div>

          {!allDay && (
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
          )}

          <div className="space-y-2">
            <Label>Motivo (opcional)</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Vacaciones, Feriado, Congreso..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !exceptionDate}
          >
            {isPending ? "Agregando..." : "Agregar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

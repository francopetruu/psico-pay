"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { AlertCircle } from "lucide-react";

interface PatientPricingDialogProps {
  open: boolean;
  onOpenChange: () => void;
  editingPatient: {
    patientId: string;
    patientName: string;
    price: number;
    reason: string | null;
    validFrom: Date | null;
    validUntil: Date | null;
  } | null;
  patientsWithoutPricing: Array<{
    id: string;
    name: string;
    email: string | null;
  }>;
  defaultPrice: number;
  currency: string;
}

export function PatientPricingDialog({
  open,
  onOpenChange,
  editingPatient,
  patientsWithoutPricing,
  defaultPrice,
  currency,
}: PatientPricingDialogProps) {
  const utils = trpc.useUtils();

  const [patientId, setPatientId] = useState("");
  const [price, setPrice] = useState("");
  const [reason, setReason] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");

  const setPatientPricing = trpc.pricing.setPatientPricing.useMutation({
    onSuccess: () => {
      utils.pricing.listPatientPricing.invalidate();
      utils.pricing.getPriceHistory.invalidate();
      onOpenChange();
      resetForm();
    },
  });

  const resetForm = () => {
    setPatientId("");
    setPrice("");
    setReason("");
    setValidFrom("");
    setValidUntil("");
  };

  useEffect(() => {
    if (editingPatient) {
      setPatientId(editingPatient.patientId);
      setPrice(editingPatient.price.toString());
      setReason(editingPatient.reason || "");
      setValidFrom(
        editingPatient.validFrom
          ? new Date(editingPatient.validFrom).toISOString().split("T")[0]
          : ""
      );
      setValidUntil(
        editingPatient.validUntil
          ? new Date(editingPatient.validUntil).toISOString().split("T")[0]
          : ""
      );
    } else {
      resetForm();
    }
  }, [editingPatient, open]);

  const handleSubmit = () => {
    if (!patientId || !price) return;

    setPatientPricing.mutate({
      patientId,
      price: parseFloat(price),
      reason: reason || null,
      validFrom: validFrom ? new Date(validFrom) : null,
      validUntil: validUntil ? new Date(validUntil) : null,
    });
  };

  const isEditing = !!editingPatient;
  const priceNum = parseFloat(price) || 0;
  const difference = priceNum - defaultPrice;
  const percentDifference = defaultPrice > 0 ? ((difference / defaultPrice) * 100).toFixed(0) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Precio Especial" : "Agregar Precio Especial"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? `Modificar el precio especial para ${editingPatient?.patientName}`
              : "Asignar un precio personalizado a un paciente"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!isEditing && (
            <div className="space-y-2">
              <Label>Paciente</Label>
              {patientsWithoutPricing.length === 0 ? (
                <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p>Todos tus pacientes ya tienen un precio especial asignado.</p>
                </div>
              ) : (
                <Select value={patientId} onValueChange={setPatientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar paciente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {patientsWithoutPricing.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.name}
                        {patient.email && (
                          <span className="text-muted-foreground ml-2">
                            ({patient.email})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="price">Precio</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
              <Input
                id="price"
                type="number"
                className="pl-8"
                placeholder={defaultPrice.toString()}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min={0}
              />
            </div>
            {price && (
              <div className="text-sm">
                <span className="text-muted-foreground">
                  Precio base: ${defaultPrice.toLocaleString("es-AR")} {currency}
                </span>
                {difference !== 0 && (
                  <span
                    className={`ml-2 ${difference < 0 ? "text-green-600" : "text-amber-600"}`}
                  >
                    ({difference < 0 ? "" : "+"}
                    {percentDifference}% = {difference < 0 ? "-" : "+"}$
                    {Math.abs(difference).toLocaleString("es-AR")})
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Razon (opcional)</Label>
            <Input
              id="reason"
              placeholder="Ej: Descuento estudiante, Paquete mensual..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="validFrom">Vigencia desde (opcional)</Label>
              <Input
                id="validFrom"
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="validUntil">Vigencia hasta (opcional)</Label>
              <Input
                id="validUntil"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                min={validFrom || undefined}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Si no especificas fechas de vigencia, el precio sera permanente.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onOpenChange}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              setPatientPricing.isPending ||
              !patientId ||
              !price ||
              (patientsWithoutPricing.length === 0 && !isEditing)
            }
          >
            {setPatientPricing.isPending
              ? "Guardando..."
              : isEditing
                ? "Guardar Cambios"
                : "Agregar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

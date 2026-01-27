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
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Plus, User, Pencil, Trash2, AlertCircle } from "lucide-react";
import { format, differenceInDays, isPast, isFuture } from "date-fns";
import { es } from "date-fns/locale";
import { PatientPricingDialog } from "./patient-pricing-dialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

export function PatientPricingSection() {
  const utils = trpc.useUtils();
  const { data: patientPricingList, isLoading } = trpc.pricing.listPatientPricing.useQuery();
  const { data: defaults } = trpc.pricing.getDefaults.useQuery();
  const { data: patientsList } = trpc.patients.list.useQuery();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<{
    patientId: string;
    patientName: string;
    price: number;
    reason: string | null;
    validFrom: Date | null;
    validUntil: Date | null;
  } | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    open: boolean;
    patientId: string;
    patientName: string;
  }>({ open: false, patientId: "", patientName: "" });

  const removePatientPricing = trpc.pricing.removePatientPricing.useMutation({
    onSuccess: () => {
      utils.pricing.listPatientPricing.invalidate();
      utils.pricing.getPriceHistory.invalidate();
    },
  });

  const handleEdit = (pricing: typeof patientPricingList extends (infer T)[] | undefined ? T : never) => {
    if (!pricing) return;
    setEditingPatient({
      patientId: pricing.patientId,
      patientName: pricing.patientName,
      price: Number(pricing.price),
      reason: pricing.reason,
      validFrom: pricing.validFrom,
      validUntil: pricing.validUntil,
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = (patientId: string, patientName: string) => {
    setDeleteConfirmation({ open: true, patientId, patientName });
  };

  const handleDeleteConfirm = async () => {
    await removePatientPricing.mutateAsync({ patientId: deleteConfirmation.patientId });
    setDeleteConfirmation({ open: false, patientId: "", patientName: "" });
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingPatient(null);
  };

  const getStatusBadge = (validFrom: Date | null, validUntil: Date | null) => {
    const now = new Date();

    // If validFrom is in the future
    if (validFrom && isFuture(validFrom)) {
      return <Badge variant="secondary">Pendiente</Badge>;
    }

    // If validUntil is in the past
    if (validUntil && isPast(validUntil)) {
      return <Badge variant="destructive">Expirado</Badge>;
    }

    // If validUntil is within 15 days
    if (validUntil) {
      const daysUntilExpiry = differenceInDays(validUntil, now);
      if (daysUntilExpiry <= 15 && daysUntilExpiry >= 0) {
        return <Badge variant="outline" className="border-amber-500 text-amber-600">Vence en {daysUntilExpiry}d</Badge>;
      }
    }

    return <Badge variant="default" className="bg-green-600">Activo</Badge>;
  };

  const getVigenciaText = (validFrom: Date | null, validUntil: Date | null) => {
    if (!validFrom && !validUntil) {
      return "Permanente";
    }

    const fromText = validFrom
      ? format(new Date(validFrom), "dd/MM/yyyy", { locale: es })
      : "Inicio";
    const untilText = validUntil
      ? format(new Date(validUntil), "dd/MM/yyyy", { locale: es })
      : "Sin fin";

    return `${fromText} - ${untilText}`;
  };

  // Get patients that don't have special pricing yet
  const patientsWithoutPricing = patientsList?.patients?.filter(
    (patient) => !patientPricingList?.some((pp) => pp.patientId === patient.id)
  );

  const defaultPrice = Number(defaults?.defaultSessionPrice) || 0;
  const currency = defaults?.currency || "ARS";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Precios por Paciente
            </CardTitle>
            <CardDescription>
              Define precios personalizados para pacientes especificos
            </CardDescription>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Precio
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">
            Cargando precios por paciente...
          </p>
        ) : !patientPricingList || patientPricingList.length === 0 ? (
          <div className="text-center py-8 space-y-4">
            <p className="text-muted-foreground">
              No has definido precios especiales para ningun paciente
            </p>
            <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg max-w-md mx-auto">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p className="text-left">
                Los pacientes sin precio especial usan el precio base o el precio del tipo de sesion asignado.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {patientPricingList.map((pricing) => (
              <div
                key={pricing.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{pricing.patientName}</h4>
                      {getStatusBadge(pricing.validFrom, pricing.validUntil)}
                    </div>
                    <p className="text-lg font-semibold text-primary">
                      ${Number(pricing.price).toLocaleString("es-AR")} {currency}
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        (Base: ${defaultPrice.toLocaleString("es-AR")})
                      </span>
                    </p>
                    {pricing.reason && (
                      <p className="text-sm text-muted-foreground">
                        Razon: {pricing.reason}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Vigencia: {getVigenciaText(pricing.validFrom, pricing.validUntil)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(pricing)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(pricing.patientId, pricing.patientName)}
                    disabled={removePatientPricing.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg mt-6">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>
                Los pacientes sin precio especial usan el precio base o el precio del tipo de sesion asignado.
              </p>
            </div>
          </div>
        )}
      </CardContent>

      <PatientPricingDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        editingPatient={editingPatient}
        patientsWithoutPricing={patientsWithoutPricing || []}
        defaultPrice={defaultPrice}
        currency={currency}
      />

      <ConfirmationDialog
        open={deleteConfirmation.open}
        onOpenChange={(open) =>
          setDeleteConfirmation((prev) => ({ ...prev, open }))
        }
        title="Eliminar precio especial"
        description={`¿Estas seguro de eliminar el precio especial para ${deleteConfirmation.patientName}? Esta accion no se puede deshacer.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
        isLoading={removePatientPricing.isPending}
      />
    </Card>
  );
}

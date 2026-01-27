"use client";

import { useState, useMemo } from "react";
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Plus, Trash2, Settings, Clock, AlertCircle } from "lucide-react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  PREDEFINED_SESSION_TYPES,
  SESSION_TYPE_CATEGORIES,
  getSessionTypesByCategory,
  getSessionTypeById,
} from "@/lib/session-types";

export function SessionTypesSection() {
  const utils = trpc.useUtils();
  const { data: defaults } = trpc.pricing.getDefaults.useQuery();
  const { data: sessionTypesList, isLoading } = trpc.pricing.listSessionTypes.useQuery();

  const [showTypeDialog, setShowTypeDialog] = useState(false);

  const createSessionType = trpc.pricing.createSessionType.useMutation({
    onSuccess: () => {
      utils.pricing.listSessionTypes.invalidate();
      utils.pricing.getPriceHistory.invalidate();
      setShowTypeDialog(false);
    },
  });

  const updateSessionType = trpc.pricing.updateSessionType.useMutation({
    onSuccess: () => {
      utils.pricing.listSessionTypes.invalidate();
      utils.pricing.getPriceHistory.invalidate();
    },
  });

  const deleteSessionType = trpc.pricing.deleteSessionType.useMutation({
    onSuccess: () => {
      utils.pricing.listSessionTypes.invalidate();
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Tipos de Sesion
            </CardTitle>
            <CardDescription>
              Define precios personalizados por tipo de sesion
            </CardDescription>
          </div>
          <AddSessionTypeDialog
            open={showTypeDialog}
            onOpenChange={setShowTypeDialog}
            onAdd={(type) => createSessionType.mutate(type)}
            isPending={createSessionType.isPending}
            defaultPrice={Number(defaults?.defaultSessionPrice) || 15000}
            currency={defaults?.currency || "ARS"}
            existingTypeNames={sessionTypesList?.map((t) => t.name) || []}
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">
            Cargando tipos de sesion...
          </p>
        ) : !sessionTypesList || sessionTypesList.length === 0 ? (
          <div className="text-center py-8 space-y-4">
            <p className="text-muted-foreground">
              No has agregado tipos de sesion con precios diferenciados
            </p>
            <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg max-w-md mx-auto">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p className="text-left">
                Agrega tipos de sesion como Terapia de Pareja, Sesion Individual - Niño, etc.
                para definir precios especificos segun el tipo de atencion.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sessionTypesList.map((type) => (
              <SessionTypeCard
                key={type.id}
                sessionType={type}
                defaultPrice={Number(defaults?.defaultSessionPrice) || 15000}
                currency={defaults?.currency || "ARS"}
                onUpdate={(data) => updateSessionType.mutate({ id: type.id, ...data })}
                onDelete={() => deleteSessionType.mutate({ id: type.id })}
                isUpdating={updateSessionType.isPending}
                isDeleting={deleteSessionType.isPending}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SessionTypeCard({
  sessionType,
  defaultPrice,
  currency,
  onUpdate,
  onDelete,
  isUpdating,
  isDeleting,
}: {
  sessionType: {
    id: string;
    name: string;
    description: string | null;
    durationMinutes: number;
    price: string | null;
    isActive: boolean;
  };
  defaultPrice: number;
  currency: string;
  onUpdate: (data: { price?: number | null; isActive?: boolean }) => void;
  onDelete: () => void;
  isUpdating: boolean;
  isDeleting: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState(sessionType.price || "");
  const [useDefault, setUseDefault] = useState(sessionType.price === null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = () => {
    onUpdate({
      price: useDefault ? null : parseFloat(price),
    });
    setEditing(false);
  };

  const displayPrice = sessionType.price
    ? Number(sessionType.price)
    : defaultPrice;

  return (
    <div className={`p-4 border rounded-lg ${!sessionType.isActive ? "opacity-50" : ""}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-medium">{sessionType.name}</h4>
          <p className="text-sm text-muted-foreground">
            {sessionType.durationMinutes} min
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Eliminar tipo de sesion"
        description={`¿Estas seguro de eliminar el tipo de sesion "${sessionType.name}"? Esta accion no se puede deshacer.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={onDelete}
        variant="destructive"
        isLoading={isDeleting}
      />

      {sessionType.description && (
        <p className="text-sm text-muted-foreground mb-3">
          {sessionType.description}
        </p>
      )}

      {editing ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`useDefault-${sessionType.id}`}
              checked={useDefault}
              onChange={(e) => setUseDefault(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor={`useDefault-${sessionType.id}`} className="text-sm">
              Usar precio base (${defaultPrice.toLocaleString("es-AR")})
            </Label>
          </div>
          {!useDefault && (
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
              <Input
                type="number"
                className="pl-8"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={isUpdating}>
              Guardar
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold">
              {currency} ${displayPrice.toLocaleString("es-AR")}
            </p>
            {sessionType.price === null && (
              <p className="text-xs text-muted-foreground">(Precio base)</p>
            )}
          </div>
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            Editar
          </Button>
        </div>
      )}
    </div>
  );
}

function AddSessionTypeDialog({
  open,
  onOpenChange,
  onAdd,
  isPending,
  defaultPrice,
  currency,
  existingTypeNames,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (type: {
    name: string;
    description?: string;
    durationMinutes: number;
    price?: number | null;
  }) => void;
  isPending: boolean;
  defaultPrice: number;
  currency: string;
  existingTypeNames: string[];
}) {
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [price, setPrice] = useState("");
  const [useDefault, setUseDefault] = useState(true);

  // Filtrar tipos que ya existen
  const availableTypes = useMemo(() => {
    return PREDEFINED_SESSION_TYPES.filter(
      (type) => !existingTypeNames.includes(type.name)
    );
  }, [existingTypeNames]);

  const selectedType = selectedTypeId ? getSessionTypeById(selectedTypeId) : null;
  const typesByCategory = getSessionTypesByCategory();

  const handleSubmit = () => {
    if (!selectedType) return;

    onAdd({
      name: selectedType.name,
      description: selectedType.description,
      durationMinutes: selectedType.defaultDurationMinutes,
      price: useDefault ? null : parseFloat(price),
    });

    // Reset form
    setSelectedTypeId("");
    setPrice("");
    setUseDefault(true);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setSelectedTypeId("");
      setPrice("");
      setUseDefault(true);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button disabled={availableTypes.length === 0}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Tipo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar Tipo de Sesion</DialogTitle>
          <DialogDescription>
            Selecciona un tipo de sesion y define su precio
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {availableTypes.length === 0 ? (
            <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>Ya has agregado todos los tipos de sesion disponibles.</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Tipo de Sesion</Label>
                <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo de sesion..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(typesByCategory).map(([category, types]) => {
                      const availableInCategory = types.filter(
                        (t) => !existingTypeNames.includes(t.name)
                      );
                      if (availableInCategory.length === 0) return null;

                      return (
                        <SelectGroup key={category}>
                          <SelectLabel>
                            {SESSION_TYPE_CATEGORIES[category as keyof typeof SESSION_TYPE_CATEGORIES]?.label}
                          </SelectLabel>
                          {availableInCategory.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {selectedType && (
                <>
                  <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {selectedType.description}
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Duracion: {selectedType.defaultDurationMinutes} minutos</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="useDefaultPrice"
                        checked={useDefault}
                        onChange={(e) => setUseDefault(e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="useDefaultPrice">
                        Usar precio base ({currency} ${defaultPrice.toLocaleString("es-AR")})
                      </Label>
                    </div>
                    {!useDefault && (
                      <div className="relative mt-2">
                        <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                        <Input
                          type="number"
                          className="pl-8"
                          placeholder="20000"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          min={0}
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !selectedTypeId || (!useDefault && !price)}
          >
            {isPending ? "Agregando..." : "Agregar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

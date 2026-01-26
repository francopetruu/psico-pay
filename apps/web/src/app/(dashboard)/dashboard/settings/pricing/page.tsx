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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import {
  DollarSign,
  Clock,
  Plus,
  Trash2,
  Save,
  History,
  Settings,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function PricingSettingsPage() {
  const utils = trpc.useUtils();
  const { data: defaults, isLoading: loadingDefaults } = trpc.pricing.getDefaults.useQuery();
  const { data: sessionTypesList, isLoading: loadingTypes } = trpc.pricing.listSessionTypes.useQuery();
  const { data: priceHistoryData } = trpc.pricing.getPriceHistory.useQuery({ limit: 10 });

  const updateDefaults = trpc.pricing.updateDefaults.useMutation({
    onSuccess: () => {
      utils.pricing.getDefaults.invalidate();
      utils.pricing.getPriceHistory.invalidate();
    },
  });

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

  // Form states
  const [defaultPrice, setDefaultPrice] = useState("");
  const [defaultDuration, setDefaultDuration] = useState("");
  const [currency, setCurrency] = useState("");
  const [showTypeDialog, setShowTypeDialog] = useState(false);

  // Initialize form when defaults load
  useState(() => {
    if (defaults) {
      setDefaultPrice(defaults.defaultSessionPrice?.toString() || "");
      setDefaultDuration(defaults.defaultSessionDuration?.toString() || "");
      setCurrency(defaults.currency || "ARS");
    }
  });

  const handleSaveDefaults = async () => {
    await updateDefaults.mutateAsync({
      defaultSessionPrice: defaultPrice ? parseFloat(defaultPrice) : undefined,
      defaultSessionDuration: defaultDuration ? parseInt(defaultDuration) : undefined,
      currency: currency || undefined,
    });
  };

  if (loadingDefaults) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Cargando configuracion...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuracion de Precios</h1>
          <p className="text-muted-foreground">
            Administra tus tarifas por sesion
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Default Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Precio Base por Sesion
            </CardTitle>
            <CardDescription>
              Tarifa predeterminada para todas las sesiones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="defaultPrice">Precio</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                  <Input
                    id="defaultPrice"
                    type="number"
                    className="pl-8"
                    placeholder="15000"
                    value={defaultPrice || defaults?.defaultSessionPrice || ""}
                    onChange={(e) => setDefaultPrice(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Moneda</Label>
                <Input
                  id="currency"
                  placeholder="ARS"
                  maxLength={3}
                  value={currency || defaults?.currency || "ARS"}
                  onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultDuration">Duracion (minutos)</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="defaultDuration"
                  type="number"
                  className="pl-10"
                  placeholder="50"
                  min={15}
                  max={240}
                  value={defaultDuration || defaults?.defaultSessionDuration || ""}
                  onChange={(e) => setDefaultDuration(e.target.value)}
                />
              </div>
            </div>
            <Button
              onClick={handleSaveDefaults}
              disabled={updateDefaults.isPending}
              className="w-full"
            >
              <Save className="mr-2 h-4 w-4" />
              {updateDefaults.isPending ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </CardContent>
        </Card>

        {/* Price History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historial de Cambios
            </CardTitle>
            <CardDescription>
              Ultimos cambios de precios
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!priceHistoryData || priceHistoryData.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No hay cambios de precio registrados
              </p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {priceHistoryData.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between text-sm border-b pb-2"
                  >
                    <div>
                      <p className="font-medium">
                        {record.entityType === "therapist"
                          ? "Precio base"
                          : record.entityType === "session_type"
                            ? "Tipo de sesion"
                            : "Paciente"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(record.changedAt), "dd/MM/yyyy HH:mm", { locale: es })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-muted-foreground line-through">
                        ${Number(record.oldPrice || 0).toLocaleString("es-AR")}
                      </span>
                      <span className="ml-2 text-primary font-medium">
                        ${Number(record.newPrice).toLocaleString("es-AR")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Session Types */}
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
            />
          </div>
        </CardHeader>
        <CardContent>
          {loadingTypes ? (
            <p className="text-muted-foreground text-center py-8">
              Cargando tipos de sesion...
            </p>
          ) : !sessionTypesList || sessionTypesList.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No has creado tipos de sesion personalizados
            </p>
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
    </div>
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
          onClick={onDelete}
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

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
}) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    durationMinutes: "50",
    price: "",
    useDefault: true,
  });

  const handleSubmit = () => {
    onAdd({
      name: form.name,
      description: form.description || undefined,
      durationMinutes: parseInt(form.durationMinutes),
      price: form.useDefault ? null : parseFloat(form.price),
    });
    setForm({
      name: "",
      description: "",
      durationMinutes: "50",
      price: "",
      useDefault: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Tipo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo Tipo de Sesion</DialogTitle>
          <DialogDescription>
            Crea un nuevo tipo de sesion con precio personalizado
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input
              placeholder="Ej: Terapia de Pareja"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Descripcion (opcional)</Label>
            <Textarea
              placeholder="Descripcion del tipo de sesion..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Duracion (minutos)</Label>
            <Input
              type="number"
              min={15}
              max={240}
              value={form.durationMinutes}
              onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="useDefaultPrice"
                checked={form.useDefault}
                onChange={(e) => setForm({ ...form, useDefault: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="useDefaultPrice">
                Usar precio base ({currency} ${defaultPrice.toLocaleString("es-AR")})
              </Label>
            </div>
            {!form.useDefault && (
              <div className="relative mt-2">
                <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                <Input
                  type="number"
                  className="pl-8"
                  placeholder="20000"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !form.name || (!form.useDefault && !form.price)}
          >
            {isPending ? "Creando..." : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

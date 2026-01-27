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
import { DollarSign, Clock, Save } from "lucide-react";

export function DefaultPricingCard() {
  const utils = trpc.useUtils();
  const { data: defaults, isLoading } = trpc.pricing.getDefaults.useQuery();

  const updateDefaults = trpc.pricing.updateDefaults.useMutation({
    onSuccess: () => {
      utils.pricing.getDefaults.invalidate();
      utils.pricing.getPriceHistory.invalidate();
    },
  });

  const [defaultPrice, setDefaultPrice] = useState("");
  const [defaultDuration, setDefaultDuration] = useState("");
  const [currency, setCurrency] = useState("");

  useEffect(() => {
    if (defaults) {
      setDefaultPrice(defaults.defaultSessionPrice?.toString() || "");
      setDefaultDuration(defaults.defaultSessionDuration?.toString() || "");
      setCurrency(defaults.currency || "ARS");
    }
  }, [defaults]);

  const handleSaveDefaults = async () => {
    await updateDefaults.mutateAsync({
      defaultSessionPrice: defaultPrice ? parseFloat(defaultPrice) : undefined,
      defaultSessionDuration: defaultDuration ? parseInt(defaultDuration) : undefined,
      currency: currency || undefined,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <p className="text-muted-foreground">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
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
                value={defaultPrice}
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
              value={currency}
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
              value={defaultDuration}
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
  );
}

"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Receipt } from "lucide-react";
import { DefaultPricingCard } from "./components/default-pricing-card";
import { PriceHistoryCard } from "./components/price-history-card";
import { SessionTypesSection } from "./components/session-types-section";
import { PatientPricingSection } from "./components/patient-pricing-section";

export default function TarifasPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Receipt className="h-8 w-8" />
            Tarifas
          </h1>
          <p className="text-muted-foreground">
            Administra tus precios por sesion, tipos de sesion y precios especiales por paciente
          </p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">Precio Base</TabsTrigger>
          <TabsTrigger value="tipos">Tipos de Sesion</TabsTrigger>
          <TabsTrigger value="pacientes">Por Paciente</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <DefaultPricingCard />
            <PriceHistoryCard />
          </div>
        </TabsContent>

        <TabsContent value="tipos">
          <SessionTypesSection />
        </TabsContent>

        <TabsContent value="pacientes">
          <PatientPricingSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

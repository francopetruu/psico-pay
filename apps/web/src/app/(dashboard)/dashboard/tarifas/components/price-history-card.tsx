"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { History } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function PriceHistoryCard() {
  const { data: priceHistoryData } = trpc.pricing.getPriceHistory.useQuery({ limit: 10 });

  return (
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
  );
}

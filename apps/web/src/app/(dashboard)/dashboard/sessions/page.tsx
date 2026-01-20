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
import { Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const PAGE_SIZE = 10;

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    no_show: "bg-gray-100 text-gray-800",
  };

  const labels: Record<string, string> = {
    scheduled: "Programada",
    completed: "Completada",
    cancelled: "Cancelada",
    no_show: "No asistio",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] || styles.scheduled}`}
    >
      {labels[status] || status}
    </span>
  );
}

function getPaymentBadge(status: string) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    paid: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    refunded: "bg-purple-100 text-purple-800",
  };

  const labels: Record<string, string> = {
    pending: "Pendiente",
    paid: "Pagado",
    failed: "Fallido",
    refunded: "Reembolsado",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] || styles.pending}`}
    >
      {labels[status] || status}
    </span>
  );
}

export default function SessionsPage() {
  const [page, setPage] = useState(0);

  const { data, isLoading } = trpc.sessions.list.useQuery({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sesiones</h1>
          <p className="text-muted-foreground">
            Gestiona y visualiza todas las sesiones de terapia
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Sesion
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Sesiones</CardTitle>
              <CardDescription>
                {data ? `${data.total} sesiones en total` : "Cargando..."}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar sesiones..."
                  className="pl-8 w-[250px]"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-muted-foreground">Cargando sesiones...</p>
            </div>
          ) : data?.sessions.length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-muted-foreground">No hay sesiones registradas</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left text-sm font-medium">Paciente</th>
                      <th className="p-3 text-left text-sm font-medium">Fecha</th>
                      <th className="p-3 text-left text-sm font-medium">Hora</th>
                      <th className="p-3 text-left text-sm font-medium">Monto</th>
                      <th className="p-3 text-left text-sm font-medium">Estado</th>
                      <th className="p-3 text-left text-sm font-medium">Pago</th>
                      <th className="p-3 text-left text-sm font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.sessions.map((session) => (
                      <tr key={session.id} className="border-b">
                        <td className="p-3 text-sm">
                          {session.patient?.name || "Sin paciente"}
                        </td>
                        <td className="p-3 text-sm">
                          {format(new Date(session.scheduledAt), "dd/MM/yyyy", { locale: es })}
                        </td>
                        <td className="p-3 text-sm">
                          {format(new Date(session.scheduledAt), "HH:mm", { locale: es })}
                        </td>
                        <td className="p-3 text-sm font-medium">
                          ${Number(session.amount).toLocaleString("es-AR")}
                        </td>
                        <td className="p-3">
                          {getStatusBadge(session.status)}
                        </td>
                        <td className="p-3">
                          {getPaymentBadge(session.paymentStatus)}
                        </td>
                        <td className="p-3">
                          <Button variant="ghost" size="sm">Ver</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Pagina {page + 1} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

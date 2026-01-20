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
import { CreditCard, DollarSign, Plus, Search, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { startOfMonth, endOfMonth } from "date-fns";

const PAGE_SIZE = 10;

function getPaymentBadge(status: string) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    paid: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    refunded: "bg-purple-100 text-purple-800",
  };

  const labels: Record<string, string> = {
    pending: "Pendiente",
    paid: "Aprobado",
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

export default function PaymentsPage() {
  const [page, setPage] = useState(0);
  const now = new Date();

  const { data: stats } = trpc.payments.stats.useQuery({
    from: startOfMonth(now),
    to: endOfMonth(now),
  });

  const { data, isLoading } = trpc.payments.list.useQuery({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pagos</h1>
          <p className="text-muted-foreground">
            Gestiona los pagos de tus sesiones
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Registrar Pago Manual
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Cobrado (Mes)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats?.totalPaid.toLocaleString("es-AR") ?? "0"}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.paidCount ?? 0} pagos recibidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pendiente de Cobro
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats?.totalPending.toLocaleString("es-AR") ?? "0"}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.pendingCount ?? 0} pagos pendientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tasa de Cobro
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.collectionRate ?? 0}%</div>
            <p className="text-xs text-muted-foreground">
              Del total de sesiones
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Historial de Pagos</CardTitle>
              <CardDescription>
                {data ? `${data.total} pagos registrados` : "Cargando..."}
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar pagos..."
                className="pl-8 w-[250px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-muted-foreground">Cargando pagos...</p>
            </div>
          ) : data?.payments.length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-muted-foreground">No hay pagos registrados</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left text-sm font-medium">Paciente</th>
                      <th className="p-3 text-left text-sm font-medium">Fecha</th>
                      <th className="p-3 text-left text-sm font-medium">Monto</th>
                      <th className="p-3 text-left text-sm font-medium">Metodo</th>
                      <th className="p-3 text-left text-sm font-medium">Estado</th>
                      <th className="p-3 text-left text-sm font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.payments.map((payment) => (
                      <tr key={payment.id} className="border-b">
                        <td className="p-3 text-sm">{payment.patient?.name || "Sin paciente"}</td>
                        <td className="p-3 text-sm">
                          {format(new Date(payment.scheduledAt), "dd/MM/yyyy HH:mm", { locale: es })}
                        </td>
                        <td className="p-3 text-sm font-medium">
                          ${Number(payment.amount).toLocaleString("es-AR")}
                        </td>
                        <td className="p-3 text-sm">
                          {payment.paymentId?.startsWith("MANUAL")
                            ? "Manual"
                            : payment.paymentId
                              ? "Mercado Pago"
                              : "-"}
                        </td>
                        <td className="p-3">
                          {getPaymentBadge(payment.paymentStatus)}
                        </td>
                        <td className="p-3">
                          {payment.paymentStatus === "pending" ? (
                            <Button variant="ghost" size="sm">Enviar Recordatorio</Button>
                          ) : (
                            <Button variant="ghost" size="sm">Ver</Button>
                          )}
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

"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, Users, CreditCard, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";

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

export default function DashboardPage() {
  const now = new Date();

  // Get stats for the current month
  const { data: monthStats } = trpc.payments.stats.useQuery({
    from: startOfMonth(now),
    to: endOfMonth(now),
  });

  // Get today's sessions
  const { data: todaySessions } = trpc.sessions.list.useQuery({
    from: startOfDay(now),
    to: endOfDay(now),
    limit: 10,
  });

  // Get upcoming sessions
  const { data: upcomingSessions } = trpc.sessions.list.useQuery({
    from: now,
    limit: 5,
    status: "scheduled",
  });

  // Get patient count
  const { data: patientsData } = trpc.patients.list.useQuery({
    limit: 1,
  });

  const completedToday = todaySessions?.sessions.filter(s => s.status === "completed").length ?? 0;
  const pendingToday = todaySessions?.sessions.filter(s => s.status === "scheduled").length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenido a PsicoPay. Aqui puedes gestionar tus sesiones y pagos.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Sesiones Hoy
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaySessions?.total ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              {completedToday} completadas, {pendingToday} pendientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pacientes Activos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patientsData?.total ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Total registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pagos Pendientes
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${monthStats?.totalPending.toLocaleString("es-AR") ?? "0"}
            </div>
            <p className="text-xs text-muted-foreground">
              {monthStats?.pendingCount ?? 0} sesiones sin pagar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos del Mes
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${monthStats?.totalPaid.toLocaleString("es-AR") ?? "0"}
            </div>
            <p className="text-xs text-muted-foreground">
              {monthStats?.paidCount ?? 0} pagos recibidos
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Proximas Sesiones</CardTitle>
            <CardDescription>
              Sesiones programadas para los proximos dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingSessions?.sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay sesiones programadas
              </p>
            ) : (
              <div className="space-y-4">
                {upcomingSessions?.sessions.map((session, index) => (
                  <div
                    key={session.id}
                    className={`flex items-center justify-between ${
                      index < (upcomingSessions?.sessions.length ?? 0) - 1 ? "border-b pb-4" : ""
                    }`}
                  >
                    <div>
                      <p className="font-medium">{session.patient?.name || "Sin paciente"}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(session.scheduledAt), "EEEE, dd 'de' MMMM - HH:mm", { locale: es })}
                      </p>
                    </div>
                    {getPaymentBadge(session.paymentStatus)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen del Mes</CardTitle>
            <CardDescription>
              Estadisticas de {format(now, "MMMM yyyy", { locale: es })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total de sesiones</span>
                <span className="font-medium">{monthStats?.totalCount ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Sesiones pagadas</span>
                <span className="font-medium">{monthStats?.paidCount ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Sesiones pendientes</span>
                <span className="font-medium">{monthStats?.pendingCount ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tasa de cobro</span>
                <span className="font-medium">{monthStats?.collectionRate ?? 0}%</span>
              </div>
              <div className="border-t pt-4 flex items-center justify-between">
                <span className="text-sm font-medium">Total recaudado</span>
                <span className="text-lg font-bold">
                  ${monthStats?.totalPaid.toLocaleString("es-AR") ?? "0"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

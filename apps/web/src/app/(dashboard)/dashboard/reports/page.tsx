"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, BarChart3 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  paid: "#22c55e",
  pending: "#eab308",
  failed: "#ef4444",
  refunded: "#a855f7",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  paid: "Pagado",
  pending: "Pendiente",
  failed: "Fallido",
  refunded: "Reembolsado",
};

export default function ReportsPage() {
  const { data: overview } = trpc.reports.overview.useQuery({ months: 3 });
  const { data: revenueData } = trpc.reports.revenueByMonth.useQuery({ months: 6 });
  const { data: statusDistribution } = trpc.reports.paymentStatusDistribution.useQuery({});
  const { data: topPatients } = trpc.reports.topPatients.useQuery({ limit: 5 });

  const pieData = statusDistribution
    ?.filter(item => item.count > 0)
    .map(item => ({
      name: PAYMENT_STATUS_LABELS[item.status] || item.status,
      value: item.count,
      color: PAYMENT_STATUS_COLORS[item.status] || "#94a3b8",
    })) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
          <p className="text-muted-foreground">
            Analiza el rendimiento de tu practica
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos Totales
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${overview?.totalRevenue.toLocaleString("es-AR") ?? "0"}
            </div>
            <p className="text-xs text-muted-foreground">
              Ultimos {overview?.period.months ?? 3} meses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Sesiones Completadas
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.completedSessions ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Ultimos {overview?.period.months ?? 3} meses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Promedio por Sesion
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${overview?.averagePerSession.toLocaleString("es-AR") ?? "0"}
            </div>
            <p className="text-xs text-muted-foreground">
              Promedio general
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tasa de Cancelacion
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.cancellationRate ?? 0}%</div>
            <p className="text-xs text-muted-foreground">
              Del total de sesiones
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ingresos Mensuales</CardTitle>
            <CardDescription>
              Tendencia de ingresos en los ultimos 6 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {revenueData && revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      `$${value.toLocaleString("es-AR")}`,
                      "Ingresos",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ fill: "#2563eb" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center border rounded-lg bg-muted/20">
                <p className="text-muted-foreground text-sm">
                  No hay datos para mostrar
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado de Pagos</CardTitle>
            <CardDescription>
              Distribucion de pagos por estado
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center border rounded-lg bg-muted/20">
                <p className="text-muted-foreground text-sm">
                  No hay datos para mostrar
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Pacientes por Ingresos</CardTitle>
          <CardDescription>
            Pacientes con mayor cantidad de sesiones y pagos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topPatients && topPatients.length > 0 ? (
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left text-sm font-medium">#</th>
                    <th className="p-3 text-left text-sm font-medium">Paciente</th>
                    <th className="p-3 text-left text-sm font-medium">Sesiones</th>
                    <th className="p-3 text-left text-sm font-medium">Total Pagado</th>
                    <th className="p-3 text-left text-sm font-medium">Ultima Sesion</th>
                  </tr>
                </thead>
                <tbody>
                  {topPatients.map((patient) => (
                    <tr key={patient.patientId} className="border-b last:border-b-0">
                      <td className="p-3 text-sm font-medium">{patient.rank}</td>
                      <td className="p-3 text-sm">{patient.patientName || "Sin nombre"}</td>
                      <td className="p-3 text-sm">{patient.sessionCount}</td>
                      <td className="p-3 text-sm font-medium">
                        ${patient.totalPaid.toLocaleString("es-AR")}
                      </td>
                      <td className="p-3 text-sm">
                        {patient.lastSession
                          ? format(new Date(patient.lastSession), "dd/MM/yyyy", { locale: es })
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48">
              <p className="text-muted-foreground">No hay datos de pacientes</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

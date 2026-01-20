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
import { Plus, Search, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const PAGE_SIZE = 9;

export default function PatientsPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");

  const { data, isLoading } = trpc.patients.list.useQuery({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    search: search || undefined,
  });

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
          <p className="text-muted-foreground">
            Gestiona la informacion de tus pacientes
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Paciente
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Pacientes</CardTitle>
              <CardDescription>
                {data ? `${data.total} pacientes registrados` : "Cargando..."}
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar pacientes..."
                className="pl-8 w-[250px]"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-muted-foreground">Cargando pacientes...</p>
            </div>
          ) : data?.patients.length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-muted-foreground">
                {search ? "No se encontraron pacientes" : "No hay pacientes registrados"}
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data?.patients.map((patient) => (
                  <Card key={patient.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="rounded-full bg-primary/10 p-3">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{patient.name}</h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {patient.phone}
                          </p>
                          {patient.email && (
                            <p className="text-sm text-muted-foreground truncate">
                              {patient.email}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="text-xs text-muted-foreground">
                              {patient.totalSessions} sesiones
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ${Number(patient.totalPaid).toLocaleString("es-AR")} pagados
                            </span>
                          </div>
                          {patient.lastSessionAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Ultima sesion: {format(new Date(patient.lastSessionAt), "dd/MM/yyyy", { locale: es })}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Button variant="outline" size="sm">Ver Perfil</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
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

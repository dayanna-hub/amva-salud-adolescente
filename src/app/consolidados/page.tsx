import { PageHeader } from "@/components/PageHeader";
import { SubmissionsTable } from "@/components/SubmissionsTable";

export default function ConsolidatedPage() {
  return <>
    <PageHeader title="Consolidados mensuales" description="Cada municipio, período y tipo de evento admite una sola fuente oficial activa. Aquí se controla el estado y cierre del reporte." />
    <SubmissionsTable />
  </>;
}

import { PageHeader } from "@/components/PageHeader";
import { SubmissionsTable } from "@/components/SubmissionsTable";

export default function ConsolidatedPage() {
  return (
    <>
      <PageHeader
        eyebrow="Períodos"
        title="Consolidados"
        description="Cada municipio, período y tipo de evento admite una sola fuente oficial. Aquí controlas el estado y el cierre de cada reporte."
      />
      <SubmissionsTable />
    </>
  );
}

import { DashboardClient } from "@/components/DashboardClient";
import { PageHeader } from "@/components/PageHeader";

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        eyebrow="Panel epidemiológico"
        title="Dashboard"
        description="Indicadores agregados de morbilidad y mortalidad adolescente del Área Metropolitana del Valle de Aburrá. Solo se cuentan períodos validados o cerrados."
      />
      <DashboardClient />
    </>
  );
}

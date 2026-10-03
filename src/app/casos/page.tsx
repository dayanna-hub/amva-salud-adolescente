import { CasesTable } from "@/components/CasesTable";
import { PageHeader } from "@/components/PageHeader";

export default function CasesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Operación"
        title="Casos individuales"
        description="Consulta los casos de morbilidad y mortalidad ingresados como registros individuales por período."
      />
      <CasesTable />
    </>
  );
}

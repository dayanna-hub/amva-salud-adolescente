import { CasesTable } from "@/components/CasesTable";
import { PageHeader } from "@/components/PageHeader";

export default function CasesPage() {
  return <>
    <PageHeader title="Casos individuales" description="Consulta los casos ingresados durante los períodos cuya fuente oficial es registro individual." />
    <CasesTable />
  </>;
}

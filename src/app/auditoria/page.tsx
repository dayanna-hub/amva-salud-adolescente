import { AuditTable } from "@/components/AuditTable";
import { PageHeader } from "@/components/PageHeader";

export default function AuditPage() {
  return <>
    <PageHeader title="Auditoría" description="Historial de creación, importación y cierre para preservar la trazabilidad de la información." />
    <AuditTable />
  </>;
}

import { DashboardClient } from "@/components/DashboardClient";
import { PageHeader } from "@/components/PageHeader";

export default function DashboardPage() {
  return <>
    <PageHeader title="Panel epidemiológico" description="Vista consolidada de morbilidad, mortalidad y población adolescente a partir de los reportes registrados en la plataforma." />
    <DashboardClient />
  </>;
}

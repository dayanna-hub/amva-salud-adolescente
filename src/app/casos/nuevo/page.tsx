import { CaseForm } from "@/components/CaseForm";
import { PageHeader } from "@/components/PageHeader";

export default function NewCasePage() {
  return <><PageHeader title="Registrar caso individual" description="Formulario base para registrar morbilidad o mortalidad durante el mes. La fase de adolescencia se deriva automáticamente de la edad." /><CaseForm /></>;
}

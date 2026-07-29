import PatientForm from "../../components/patient/PatientForm";

export const metadata = {
  title: "Check-in \u2014 Agnos",
};

export default function PatientPage() {
  return (
    <main className="min-h-screen bg-paper">
      <PatientForm />
    </main>
  );
}

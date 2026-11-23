import { StudentProfileForm } from "../components/StudentProfileForm";

export default function AlunoPerfilPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Meu perfil</h1>
      <StudentProfileForm />
    </main>
  );
}
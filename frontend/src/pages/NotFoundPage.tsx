import { Link } from "react-router-dom";

export default function NotFoundPage() {
    return (
        <main className="mx-auto max-w-xl p-6 text-center">
            <h1 className="text-2xl font-bold">Página não encontrada</h1>
            <p className="mt-2 text-sm text-gray-600">
                O endereço que você abriu não existe.
            </p>
            <Link to="/instrutores" className="mt-4 inline-block font-semibold underline">
                Ir para a busca de instrutores
            </Link>
        </main>
    );
}
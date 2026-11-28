import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom";

export default function RouteError() {
    const error = useRouteError();
    const notFound = isRouteErrorResponse(error) && error.status === 404;

    return (
        <main className="mx-auto max-w-xl p-6 text-center">
            <h1 className="text-2xl font-bold">
                {notFound ? "Página não encontrada" : "Algo deu errado"}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
                {notFound
                    ? "O endereço que você abriu não existe."
                    : "Tente recarregar a página."}
            </p>
            <Link to="/instrutores" className="mt-4 inline-block font-semibold underline">
                Voltar para a busca
            </Link>
        </main>
    );
}
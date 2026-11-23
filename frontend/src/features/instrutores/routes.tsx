import type { RouteObject } from "react-router-dom";
import InstrutorPerfilPage from "./pages/InstrutorPerfilPage";

export const instrutoresRoutes: RouteObject[] = [
    { path: "/instrutores/:id", element: <InstrutorPerfilPage /> },
];

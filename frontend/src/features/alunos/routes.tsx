import type { RouteObject } from "react-router-dom";
import AlunoPerfilPage from "./pages/AlunoPerfilPage";

export const alunosRoutes: RouteObject[] = [
  { path: "/aluno/perfil", element: <AlunoPerfilPage /> },
];
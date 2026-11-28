import type { RouteObject } from "react-router-dom";
import StudentProfilePage from "./pages/StudentProfilePage";

export const studentsRoutes: RouteObject[] = [
    { path: "/aluno/perfil", element: <StudentProfilePage /> },
];

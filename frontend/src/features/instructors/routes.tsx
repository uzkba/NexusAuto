import type { RouteObject } from "react-router-dom";
import InstructorProfilePage from "./pages/InstructorProfilePage";
import { InstructorSearchPage } from "./pages/InstructorSearchPage";

export const instructorsRoutes: RouteObject[] = [
    { path: "/instrutores", element: <InstructorSearchPage /> },
    { path: "/instrutores/:id", element: <InstructorProfilePage /> },
];
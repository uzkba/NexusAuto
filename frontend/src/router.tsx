import { createBrowserRouter, Navigate } from "react-router-dom";

import { instructorsRoutes } from "./features/instructors/routes";
import { studentsRoutes } from "./features/students/routes";
import NotFoundPage from "./pages/NotFoundPage";
import RouteError from "./pages/RouteError";

export const router = createBrowserRouter([
    {
        errorElement: <RouteError />,
        children: [
            { path: "/", element: <Navigate to="/instrutores" replace /> },
            ...instructorsRoutes,
            ...studentsRoutes,
            { path: "*", element: <NotFoundPage /> },
        ],
    },
]);
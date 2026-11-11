import {createBrowserRouter} from "react-router";
import {Layout} from "../shared/ui/Layout.tsx";
import {TasksPage} from "../pages/tasks/TasksPage.tsx";
import {ProjectsPage} from "../pages/projects/ProjectsPage.tsx";
export const router = createBrowserRouter
([
    {
        path: '/',
        element: <Layout/>,
        children:
        [
            {index:true,element:<TasksPage/>},
            {path:'projects',element:<ProjectsPage/>},
        ]
    }
])
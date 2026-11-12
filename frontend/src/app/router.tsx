import {createBrowserRouter} from "react-router";
import {Layout} from "../shared/ui/Layout.tsx";
import {ExpensePage} from "../pages/expense/ExpensePage.tsx";
import {TripPage} from "../pages/trip/TripPage.tsx";
export const router = createBrowserRouter
([
    {
        path: '/',
        element: <Layout/>,
        children:
        [
            {index:true,element:<ExpensePage/>},
            {path:'trips',element:<TripPage/>},
        ]
    }
])
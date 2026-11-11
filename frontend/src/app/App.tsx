import {MantineProvider} from './providers/MantineProvider';
import {RouterProvider} from "react-router";
import {router} from "./router.tsx";
export const App = () =>
{
    return(
        <MantineProvider>
            <RouterProvider router={router}/>
        </MantineProvider>
    );
};
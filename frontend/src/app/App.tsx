import {MantineProvider} from './providers/MantineProvider';
import {AuthProvider} from './providers/AuthProvider';
import {RouterProvider} from "react-router";
import {router} from "./router.tsx";
export const App = () =>
{
    return(
        <MantineProvider>
            <AuthProvider>
                <RouterProvider router={router}/>
            </AuthProvider>
        </MantineProvider>
    );
};

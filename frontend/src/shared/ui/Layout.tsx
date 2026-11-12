import {AppShell,Group,Title, NavLink} from "@mantine/core";
import {Outlet, Link, useLocation} from "react-router";

export  const Layout = () =>
{
    const location = useLocation();

    return(
        <AppShell header ={{ height: 60}} padding = "md">
            {/*шапка*/}
            <AppShell.Header>
                <Group h = "100%" px = "md" justify={"space-between"}>
                    <Title order = {3}>comApp</Title>
                    {/* Меню */}
                    <Group>
                        <NavLink
                            component = {Link}
                            to = "/"
                            label = "Расходы"
                            active = {location.pathname === '/'}
                        />
                        <NavLink
                            component = {Link}
                            to = "/trips"
                            label = "Командировки"
                            active = {location.pathname === '/trips'}
                        />
                        </Group>
                </Group>
            </AppShell.Header>
            {/*main*/}
            <AppShell.Main>
                <Outlet/>
            </AppShell.Main>
        </AppShell>

    );
};
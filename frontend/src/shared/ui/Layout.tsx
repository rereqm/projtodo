import { AppShell, Group, Title, NavLink, Burger, Drawer, Stack, Box } from "@mantine/core";
import { Outlet, Link, useLocation } from "react-router";
import { useDisclosure } from '@mantine/hooks';

export const Layout = () => {
    const location = useLocation();
    const [opened, { toggle, close }] = useDisclosure(false);

    const linkStyle = {
        width: 'auto',
        borderRadius: '4px',
        padding: '8px 16px',
    };

    const navLinks = (
        <>
            <NavLink
                component={Link}
                to="/"
                label="Расходы"
                active={location.pathname === '/'}
                onClick={close}
                style={linkStyle}
            />
            <NavLink
                component={Link}
                to="/trips"
                label="Командировки"
                active={location.pathname === '/trips'}
                onClick={close}
                style={linkStyle}
            />
        </>
    );

    return (
        <AppShell header={{ height: 60 }} padding="md">
            <AppShell.Header bg="white" withBorder>
                <Group h="100%" px="md" justify="space-between">
                    <Title order={3}>comApp</Title>

                    <Group visibleFrom="sm" gap="xs">
                        {navLinks}
                    </Group>

                    <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
                </Group>
            </AppShell.Header>

            <Drawer opened={opened} onClose={close} title="Меню" padding="md">
                <Stack>
                    {navLinks}
                </Stack>
            </Drawer>

            <AppShell.Main>
                <Box pt="md">
                    <Outlet />
                </Box>
            </AppShell.Main>
        </AppShell>
    );
};
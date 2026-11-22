import { AppShell, Group, Title, NavLink, Burger, Drawer, Stack, Box, Container, Text, ThemeIcon } from "@mantine/core";
import { Outlet, Link, useLocation } from "react-router";
import { useDisclosure } from '@mantine/hooks';
import { IconPlane, IconReceipt, IconBriefcase2, IconUsers } from '@tabler/icons-react';
import { AccountPanel } from './AccountPanel';
import { useAuth } from '../../app/providers/auth-context';

export const Layout = () => {
    const location = useLocation();
    const { user } = useAuth();
    const [opened, { toggle, close }] = useDisclosure(false);

    const linkStyle = {
        width: 'auto',
        borderRadius: '10px',
        padding: '9px 14px',
    };

    const navLinks = (
        <>
            <NavLink
                component={Link}
                to="/"
                label="Расходы"
                leftSection={<IconReceipt size={17} stroke={1.8} />}
                active={location.pathname === '/'}
                onClick={close}
                style={linkStyle}
            />
            {user?.role === 2 && <NavLink
                component={Link}
                to="/users"
                label="Сотрудники"
                leftSection={<IconUsers size={17} stroke={1.8} />}
                active={location.pathname === '/users'}
                onClick={close}
                style={linkStyle}
            />}
            <NavLink
                component={Link}
                to="/trips"
                label="Командировки"
                leftSection={<IconPlane size={17} stroke={1.8} />}
                active={location.pathname === '/trips'}
                onClick={close}
                style={linkStyle}
            />
        </>
    );

    return (
        <AppShell className="app-shell" header={{ height: 76 }}>
            <AppShell.Header className="app-header" withBorder>
                <Container size="lg" h="100%" px={{ base: 'md', sm: 'xl' }}>
                <Group h="100%" justify="space-between">
                    <Group gap="sm" wrap="nowrap">
                        <ThemeIcon className="brand-mark" size={40} radius="12px" variant="filled">
                            <IconBriefcase2 size={20} stroke={1.8} />
                        </ThemeIcon>
                        <Box>
                            <Title order={4} className="brand-title">Командировки</Title>
                            <Text className="brand-caption" size="xs">Расходы и поездки</Text>
                        </Box>
                    </Group>

                    <Group visibleFrom="sm" gap={6} className="main-nav">
                        {navLinks}
                    </Group>

                    <Group gap="xs" wrap="nowrap">
                        <AccountPanel />
                        <Burger className="mobile-menu" opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" aria-label="Открыть меню" />
                    </Group>
                </Group>
                </Container>
            </AppShell.Header>

            <Drawer opened={opened} onClose={close} title="Меню" padding="md">
                <Stack>
                    {navLinks}
                </Stack>
            </Drawer>

            <AppShell.Main className="app-main">
                <Container size="lg" px={{ base: 'md', sm: 'xl' }} py={{ base: 'xl', sm: 40 }}>
                    <Box><Outlet /></Box>
                </Container>
            </AppShell.Main>
        </AppShell>
    );
};

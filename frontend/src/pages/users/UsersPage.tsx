import { useCallback, useEffect, useState } from 'react';
import { Alert, Avatar, Badge, Box, Button, Group, Loader, Paper, Stack, Text, Title } from '@mantine/core';
import { IconInfoCircle, IconUserCheck, IconUserOff } from '@tabler/icons-react';
import { ApiError, api, type UserProfile } from '../../shared/api/client';
import { useAuth } from '../../app/providers/auth-context';

export const UsersPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadUsers = useCallback(async () => {
    if (user?.role !== 2) return;
    setLoading(true);
    setError(null);
    try {
      setUsers(await api.getEmployees());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось загрузить сотрудников.');
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    let cancelled = false;
    if (!authLoading) void Promise.resolve().then(() => { if (!cancelled) return loadUsers(); });
    return () => { cancelled = true; };
  }, [authLoading, loadUsers]);

  const toggleActivation = async (employee: UserProfile) => {
    setUpdatingId(employee.id);
    setError(null);
    try {
      const updated = await api.updateUserActivation(employee.id, !employee.is_active);
      setUsers((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Не удалось изменить статус сотрудника.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (authLoading) return <Group justify="center" py="xl"><Loader size="sm" /></Group>;
  if (user?.role !== 2) return <Alert color="red" variant="light" icon={<IconInfoCircle size={18} />}>Страница доступна только администратору.</Alert>;

  return <>
    <Group className="page-heading" justify="space-between" align="end" mb="xl">
      <Box><Text className="eyebrow">УПРАВЛЕНИЕ ДОСТУПОМ</Text><Title order={1} className="page-title">Сотрудники</Title><Text className="page-description">Активация и деактивация учётных записей</Text></Box>
      <Button variant="default" onClick={() => void loadUsers()} loading={loading}>Обновить</Button>
    </Group>
    {error && <Alert color="red" variant="light" mb="md">{error}</Alert>}
    {loading ? <Group justify="center" py="xl"><Loader size="sm" /><Text size="sm" c="dimmed">Загружаем сотрудников…</Text></Group> : users.length === 0 ? (
      <Paper className="empty-state" withBorder radius="lg" p="xl" ta="center"><Text fw={600}>Сотрудников пока нет</Text></Paper>
    ) : <Stack gap="sm">{users.map((employee) => <Paper className="employee-row" withBorder radius="lg" p="md" key={employee.id}>
      <Group justify="space-between" wrap="nowrap">
        <Group wrap="nowrap" className="employee-identity">
          <Avatar radius="xl" color="blue">{employee.full_name.trim().slice(0, 1).toUpperCase()}</Avatar>
          <Box style={{ minWidth: 0 }}><Text fw={600} truncate>{employee.full_name}</Text><Text size="sm" c="dimmed" truncate>{employee.email}</Text></Box>
        </Group>
        <Group wrap="nowrap" gap="sm"><Badge color={employee.is_active ? 'teal' : 'yellow'} variant="light">{employee.is_active ? 'Активен' : 'Ожидает активации'}</Badge>
          <Button size="xs" variant="light" color={employee.is_active ? 'red' : 'teal'} loading={updatingId === employee.id} leftSection={employee.is_active ? <IconUserOff size={15} /> : <IconUserCheck size={15} />} onClick={() => void toggleActivation(employee)}>{employee.is_active ? 'Деактивировать' : 'Активировать'}</Button>
        </Group>
      </Group>
    </Paper>)}</Stack>}
  </>;
};

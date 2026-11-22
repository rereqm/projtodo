import { useCallback, useEffect, useState } from 'react';
import { Alert, SimpleGrid, Title, Button, Modal, Group, Text, Paper, ThemeIcon, Box, Loader } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconPlane, IconWallet, IconInfoCircle } from '@tabler/icons-react';
import { TripCard } from '../../entities/trip/ui/TripCard';
import { TripDetailsModal } from '../../entities/trip/ui/TripDetailsModal';
import { AddTripForm } from '../../features/add-trip/AddTripForm';
import type { Trip } from '../../entities/trip/model/types';
import { api, mapExpense, mapTrip } from '../../shared/api/client';
import type { Expense } from '../../entities/expense/model/types';
import { useAuth } from '../../app/providers/auth-context';

export const TripPage = () => {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const [trips, setTrips] = useState<Trip[]>([]);
  const [spendingByTrip, setSpendingByTrip] = useState<Record<string, number>>({});
  const [expensesByTrip, setExpensesByTrip] = useState<Record<string, Expense[]>>({});
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTrips = useCallback(async () => {
    if (!userId) {
      setTrips([]);
      setSpendingByTrip({});
      setExpensesByTrip({});
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = (await api.getTrips()).map(mapTrip);
      setTrips(result);
      const expenseLists = await Promise.all(result.map((trip) => api.getTripExpenses(Number(trip.id))));
      const spending: Record<string, number> = {};
      const mappedExpenses: Record<string, Expense[]> = {};
      result.forEach((trip, index) => {
        mappedExpenses[trip.id] = expenseLists[index].map(mapExpense);
        spending[trip.id] = mappedExpenses[trip.id]
          .filter((expense) => expense.status !== 2)
          .reduce((sum, expense) => sum + expense.amount, 0);
      });
      setSpendingByTrip(spending);
      setExpensesByTrip(mappedExpenses);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось загрузить командировки.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    if (!authLoading) {
      void Promise.resolve().then(() => { if (!cancelled) return loadTrips(); });
    }
    return () => { cancelled = true; };
  }, [authLoading, loadTrips]);

  const handleAddTrip = async (draft: Omit<Trip, 'id' | 'color'>) => {
    setError(null);
    try {
      const created = mapTrip(await api.createTrip({
        title: draft.title,
        description: draft.description.trim() || null,
        budget: draft.budget,
      }));
      setTrips((current) => [created, ...current]);
      setSpendingByTrip((current) => ({ ...current, [created.id]: 0 }));
      setExpensesByTrip((current) => ({ ...current, [created.id]: [] }));
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Не удалось создать командировку.';
      setError(message);
      throw cause;
    }
  };

  const handleDeleteTrip = async (id: string) => {
    if (!window.confirm('Удалить эту командировку?')) return;
    setError(null);
    try {
      await api.deleteTrip(Number(id));
      setTrips((current) => current.filter((trip) => trip.id !== id));
      setSpendingByTrip((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      setExpensesByTrip((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось удалить командировку.');
    }
  };

  const totalBudget = trips.reduce((sum, trip) => sum + trip.budget, 0);
  const formatMoney = (amount: number) => new Intl.NumberFormat('ru-RU', {
    style: 'currency', currency: 'RUB', maximumFractionDigits: 0,
  }).format(amount);

  return (
    <>
      <Group className="page-heading" justify="space-between" align="end" mb="xl">
        <Box>
          <Text className="eyebrow">ПОЕЗДКИ</Text>
          <Title order={1} className="page-title">Командировки</Title>
          <Text className="page-description">Планы и бюджеты ваших рабочих поездок</Text>
        </Box>
        <Button className="primary-button" leftSection={<IconPlus size={17} />} onClick={open} disabled={!user || loading}>
          Добавить поездку
        </Button>
      </Group>

      {!user && !authLoading && (
        <Alert mb="lg" color="blue" variant="light" icon={<IconInfoCircle size={18} />}>
          Войдите в аккаунт через меню в шапке, чтобы увидеть свои командировки.
        </Alert>
      )}
      {error && <Alert mb="lg" color="red" variant="light" title="Ошибка запроса">{error}</Alert>}

      <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="md" mb="xl" className="trip-summary">
        <Paper className="summary-card" withBorder radius="lg" p="md">
          <Group wrap="nowrap" gap="sm">
            <ThemeIcon className="summary-icon summary-icon-blue" size={42} radius="md" variant="light"><IconPlane size={20} stroke={1.8} /></ThemeIcon>
            <Box><Text className="summary-label">Запланировано поездок</Text><Text className="summary-value">{trips.length}</Text></Box>
          </Group>
        </Paper>
        <Paper className="summary-card" withBorder radius="lg" p="md">
          <Group wrap="nowrap" gap="sm">
            <ThemeIcon className="summary-icon summary-icon-teal" size={42} radius="md" variant="light"><IconWallet size={20} stroke={1.8} /></ThemeIcon>
            <Box><Text className="summary-label">Общий бюджет</Text><Text className="summary-value">{formatMoney(totalBudget)}</Text></Box>
          </Group>
        </Paper>
      </SimpleGrid>

      {authLoading || loading ? (
        <Group justify="center" py="xl"><Loader size="sm" /><Text size="sm" c="dimmed">Загружаем командировки…</Text></Group>
      ) : trips.length === 0 ? (
        <Paper className="empty-state" withBorder radius="lg" p="xl" ta="center">
          <Text fw={600}>{user ? 'Командировок пока нет' : 'Нет данных для отображения'}</Text>
          <Text c="dimmed" size="sm" mt={4}>{user ? 'Добавьте поездку, чтобы запланировать бюджет.' : 'Войдите, чтобы открыть рабочее пространство.'}</Text>
        </Paper>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {trips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              spent={spendingByTrip[trip.id] ?? 0}
              onDelete={handleDeleteTrip}
              onOpen={setSelectedTrip}
            />
          ))}
        </SimpleGrid>
      )}

      <Modal opened={opened} onClose={close} title="Новая командировка" centered radius="lg">
        <AddTripForm onAdd={handleAddTrip} onClose={close} />
      </Modal>
      <TripDetailsModal
        trip={selectedTrip}
        expenses={selectedTrip ? expensesByTrip[selectedTrip.id] ?? [] : []}
        onClose={() => setSelectedTrip(null)}
      />
    </>
  );
};

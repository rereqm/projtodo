import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Title, Stack, Button, Modal, Group, Text, SimpleGrid, Paper, ThemeIcon, Box, Loader, Textarea } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconReceipt, IconClock, IconCircleCheck, IconInfoCircle } from '@tabler/icons-react';
import { ExpenseCard } from '../../entities/expense/ui/ExpenseCard';
import { AddExpenseForm } from '../../features/add-expense/AddExpenseForm';
import type { Expense } from '../../entities/expense/model/types';
import type { Trip } from '../../entities/trip/model/types';
import { api, mapExpense, mapTrip } from '../../shared/api/client';
import { useAuth } from '../../app/providers/auth-context';

export const ExpensePage = () => {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [opened, { open, close }] = useDisclosure(false);
  const [rejectOpened, rejectControls] = useDisclosure(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hideApproved, setHideApproved] = useState(false);

  const loadExpenses = useCallback(async () => {
    if (!userId) {
      setTrips([]);
      setExpenses([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const tripResults = (await api.getTrips()).map(mapTrip);
      const expenseLists = await Promise.all(tripResults.map((trip) => api.getTripExpenses(Number(trip.id))));
      setTrips(tripResults);
      setExpenses(expenseLists.flat().map(mapExpense));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось загрузить расходы.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    if (!authLoading) {
      void Promise.resolve().then(() => { if (!cancelled) return loadExpenses(); });
    }
    return () => { cancelled = true; };
  }, [authLoading, loadExpenses]);

  const handleAddExpense = async (draft: { title: string; amount: number; tripId: string }) => {
    setError(null);
    try {
      const created = mapExpense(await api.createExpense({
        title: draft.title,
        amount: draft.amount,
        trip_id: Number(draft.tripId),
      }));
      setExpenses((current) => [created, ...current]);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Не удалось создать расход.';
      setError(message);
      throw cause;
    }
  };

  const handleReview = async (id: string, status: 1 | 2) => {
    if (status === 2) {
      setRejectingId(id);
      setReviewComment('');
      setError(null);
      rejectControls.open();
      return;
    }

    setError(null);
    try {
      const updated = mapExpense(await api.reviewExpense(Number(id), 1));
      setExpenses((current) => current.map((expense) => expense.id === id ? updated : expense));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось согласовать расход.');
    }
  };

  const submitRejection = async () => {
    if (!rejectingId || !reviewComment.trim()) {
      setError('Укажите причину отказа.');
      return;
    }
    setError(null);
    try {
      const updated = mapExpense(await api.reviewExpense(Number(rejectingId), 2, reviewComment.trim()));
      setExpenses((current) => current.map((expense) => expense.id === rejectingId ? updated : expense));
      rejectControls.close();
      setRejectingId(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось отклонить расход.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Удалить этот расход?')) return;
    setError(null);
    try {
      await api.deleteExpense(Number(id));
      setExpenses((current) => current.filter((expense) => expense.id !== id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось удалить расход.');
    }
  };

  const tripTitles = useMemo(() => new Map(trips.map((trip) => [trip.id, trip.title])), [trips]);
  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const pendingAmount = expenses.filter((expense) => expense.status === 0).reduce((sum, expense) => sum + expense.amount, 0);
  const approvedAmount = expenses.filter((expense) => expense.status === 1).reduce((sum, expense) => sum + expense.amount, 0);
  const formatMoney = (amount: number) => new Intl.NumberFormat('ru-RU', {
    style: 'currency', currency: 'RUB', maximumFractionDigits: 0,
  }).format(amount);
  const summary = [
    { label: 'Всего расходов', value: formatMoney(totalAmount), icon: IconReceipt, tone: 'blue' },
    { label: 'На проверке', value: formatMoney(pendingAmount), icon: IconClock, tone: 'orange' },
    { label: 'Согласовано', value: formatMoney(approvedAmount), icon: IconCircleCheck, tone: 'teal' },
  ] as const;

  return (
    <>
      <Group className="page-heading" justify="space-between" align="end" mb="xl">
        <Box>
          <Text className="eyebrow">ФИНАНСЫ</Text>
          <Title order={1} className="page-title">Расходы</Title>
          <Text className="page-description">Список трат по вашим командировкам</Text>
        </Box>
        <Button className="primary-button" leftSection={<IconPlus size={17} />} onClick={open} disabled={!user || loading || trips.length === 0}>
          Добавить расход
        </Button>
      </Group>

      {!user && !authLoading && (
        <Alert mb="lg" color="blue" variant="light" icon={<IconInfoCircle size={18} />}>
          Войдите в аккаунт через меню в шапке, чтобы увидеть расходы.
        </Alert>
      )}
      {user && trips.length === 0 && !loading && (
        <Alert mb="lg" color="blue" variant="light" icon={<IconInfoCircle size={18} />}>
          Сначала создайте командировку — к ней можно будет добавить расходы.
        </Alert>
      )}
      {error && <Alert mb="lg" color="red" variant="light" title="Ошибка запроса">{error}</Alert>}

      <SimpleGrid cols={{ base: 1, xs: 3 }} spacing="md" mb="xl">
        {summary.map(({ label, value, icon: Icon, tone }) => (
          <Paper className="summary-card" key={label} withBorder radius="lg" p="md">
            <Group wrap="nowrap" align="center" gap="sm">
              <ThemeIcon className={`summary-icon summary-icon-${tone}`} size={42} radius="md" variant="light">
                <Icon size={20} stroke={1.8} />
              </ThemeIcon>
              <Box>
                <Text className="summary-label">{label}</Text>
                <Text className="summary-value">{value}</Text>
              </Box>
            </Group>
          </Paper>
        ))}
      </SimpleGrid>

      {user && expenses.some((expense) => expense.status === 1) && <Group justify="flex-end" mb="sm">
        <Button variant="subtle" size="sm" onClick={() => setHideApproved((value) => !value)}>
          {hideApproved ? 'Показать согласованные' : 'Скрыть согласованные'}
        </Button>
      </Group>}
      {authLoading || loading ? (
        <Group justify="center" py="xl"><Loader size="sm" /><Text size="sm" c="dimmed">Загружаем расходы…</Text></Group>
      ) : expenses.filter((expense) => !hideApproved || expense.status !== 1).length === 0 ? (
        <Paper className="empty-state" withBorder radius="lg" p="xl" ta="center">
          <Text fw={600}>{hideApproved && expenses.length > 0 ? 'Согласованные расходы скрыты' : user ? 'Расходов пока нет' : 'Нет данных для отображения'}</Text>
          <Text c="dimmed" size="sm" mt={4}>{hideApproved && expenses.length > 0 ? 'Включите их отображение кнопкой выше.' : user ? 'Добавьте первую трату к командировке.' : 'Войдите, чтобы открыть рабочее пространство.'}</Text>
        </Paper>
      ) : (
        <Stack gap="sm">
          {expenses.filter((expense) => !hideApproved || expense.status !== 1).map((expense) => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              tripTitle={tripTitles.get(expense.tripId)}
              canReview={user?.role === 2}
              onReview={handleReview}
              canDelete={user?.role === 2 || expense.status === 0}
              onDelete={handleDelete}
            />
          ))}
        </Stack>
      )}

      <Modal opened={opened} onClose={close} title="Новый расход" centered radius="lg">
        <AddExpenseForm trips={trips} onAdd={handleAddExpense} onClose={close} />
      </Modal>

      <Modal opened={rejectOpened} onClose={rejectControls.close} title="Отклонить расход" centered radius="lg">
        <Stack>
          <Text size="sm" c="dimmed">Укажите причину отказа. Она будет сохранена в карточке расхода.</Text>
          <Textarea
            label="Причина"
            placeholder="Например, отсутствует подтверждающий документ"
            minRows={3}
            value={reviewComment}
            onChange={(event) => setReviewComment(event.currentTarget.value)}
            error={error?.includes('причину') ? error : undefined}
          />
          <Button color="red" onClick={() => void submitRejection()}>Отклонить расход</Button>
        </Stack>
      </Modal>
    </>
  );
};

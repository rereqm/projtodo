import { Badge, Group, Modal, Paper, Stack, Text, Title } from '@mantine/core';
import { IconCalendar, IconWallet } from '@tabler/icons-react';
import type { Trip } from '../model/types';
import type { Expense } from '../../expense/model/types';

type TripDetailsModalProps = {
  trip: Trip | null;
  expenses: Expense[];
  onClose: () => void;
};

const formatMoney = (amount: number) => new Intl.NumberFormat('ru-RU', {
  style: 'currency', currency: 'RUB', maximumFractionDigits: 0,
}).format(amount);

export const TripDetailsModal = ({ trip, expenses, onClose }: TripDetailsModalProps) => {
  const totalSpent = expenses
    .filter((expense) => expense.status !== 2)
    .reduce((sum, expense) => sum + expense.amount, 0);
  const remaining = Math.max((trip?.budget ?? 0) - totalSpent, 0);

  return (
    <Modal opened={trip !== null} onClose={onClose} title={trip?.title ?? 'Командировка'} centered radius="lg" size="lg">
      {trip && (
        <Stack gap="lg">
          <Text size="sm" c="dimmed">{trip.description || 'Описание поездки не добавлено'}</Text>

          <Group grow>
            <Paper className="trip-detail-stat" withBorder radius="md" p="sm">
              <Group gap="xs"><IconWallet size={16} /><Text size="xs" c="dimmed">Бюджет</Text></Group>
              <Text fw={700} mt={5}>{formatMoney(trip.budget)}</Text>
            </Paper>
            <Paper className="trip-detail-stat" withBorder radius="md" p="sm">
              <Group gap="xs"><IconCalendar size={16} /><Text size="xs" c="dimmed">Потрачено</Text></Group>
              <Text fw={700} mt={5}>{formatMoney(totalSpent)}</Text>
            </Paper>
            <Paper className="trip-detail-stat" withBorder radius="md" p="sm">
              <Group gap="xs"><IconWallet size={16} /><Text size="xs" c="dimmed">Остаток</Text></Group>
              <Text fw={700} mt={5}>{formatMoney(remaining)}</Text>
            </Paper>
          </Group>

          <Stack gap="sm">
            <Group justify="space-between" align="baseline">
              <Title order={4} c="#243650">Расходы</Title>
              <Text size="xs" c="dimmed">{expenses.length} записей</Text>
            </Group>
            {expenses.length === 0 ? (
              <Paper className="empty-state" withBorder radius="md" p="md" ta="center">
                <Text size="sm" c="dimmed">Пока нет расходов по этой командировке.</Text>
              </Paper>
            ) : expenses.map((expense) => {
              const statusLabel = expense.status === 1 ? 'Согласован' : expense.status === 2 ? 'Отклонён' : 'На проверке';
              const statusColor = expense.status === 1 ? 'teal' : expense.status === 2 ? 'red' : 'yellow';
              return (
                <Paper key={expense.id} className="trip-expense-row" withBorder radius="md" p="sm">
                  <Group justify="space-between" wrap="nowrap" align="flex-start">
                    <div className="trip-expense-copy">
                      <Text size="sm" fw={600} truncate>{expense.title}</Text>
                      <Text size="xs" c="dimmed" mt={3}>
                        {new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(expense.createdAt))}
                      </Text>
                      {expense.reviewComment && <Text size="xs" c="red" mt={5}>Причина: {expense.reviewComment}</Text>}
                    </div>
                    <Stack gap={5} align="flex-end">
                      <Text size="sm" fw={700} c="#263b5c" style={{ whiteSpace: 'nowrap' }}>{formatMoney(expense.amount)}</Text>
                      <Badge size="xs" color={statusColor} variant="light">{statusLabel}</Badge>
                    </Stack>
                  </Group>
                </Paper>
              );
            })}
          </Stack>
        </Stack>
      )}
    </Modal>
  );
};

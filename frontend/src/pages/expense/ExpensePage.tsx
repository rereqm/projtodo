import { Title, Stack, Button, Modal, Group, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useState } from 'react';
import { ExpenseCard } from '../../entities/expense/ui/ExpenseCard';
import { mockExpenses, mockTrips } from '../../shared/lib/mockData';
import { AddExpenseForm } from '../../features/add-expense/AddExpenseForm';
import type { Expense } from '../../entities/expense/model/types';

export const ExpensePage = () => {
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  const [opened, { open, close }] = useDisclosure(false);

  const handleAddExpense = (newExpense: Expense) => setExpenses([newExpense, ...expenses]);

  // Функция удаления
  const handleDeleteExpense = (id: string) => {
    if (window.confirm("Удалить этот расход?")) {
      setExpenses(expenses.filter(e => e.id !== id));
    }
  };

  return (
    <>
      <Group justify="space-between" mb="xl">
        <Title order={2}>Мои расходы</Title>
        <Button color="green" onClick={open}>+ Добавить расход</Button>
      </Group>

      {expenses.length === 0 ? (
        <Text c="dimmed" ta="center" mt="xl">Нет расходов.</Text>
      ) : (
        <Stack>
          {expenses.map((expense) => (
            // Передаем onDelete
            <ExpenseCard key={expense.id} expense={expense} onDelete={handleDeleteExpense} />
          ))}
        </Stack>
      )}

      <Modal opened={opened} onClose={close} title="Новый расход" centered>
        <AddExpenseForm trips={mockTrips} onAdd={handleAddExpense} onClose={close} />
      </Modal>
    </>
  );
};
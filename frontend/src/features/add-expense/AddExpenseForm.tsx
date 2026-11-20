import { TextInput, NumberInput, Button, Stack, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import type { Expense } from '../../entities/expense/model/types';
import type { Trip } from '../../entities/trip/model/types';

export const AddExpenseForm = ({
  trips,
  onAdd,
  onClose
}: {
  trips: Trip[],
  onAdd: (expense: Expense) => void,
  onClose: () => void
}) => {
  const form = useForm({
    initialValues: {
      title: '',
      amount: 0,
      tripId: '',
    },
    validate: {
      title: (value) => (value.length < 2 ? 'Название слишком короткое' : null),
      amount: (value) => (value <= 0 ? 'Сумма должна быть больше нуля' : null),
      tripId: (value) => (!value ? 'Выберите командировку' : null),
    },
  });

  const handleSubmit = (values: typeof form.values) => {
    const newExpense: Expense = {
      id: Date.now().toString(),
      title: values.title,
      amount: values.amount,
      isApproved: false,
      tripId: values.tripId,
      createdAt: new Date().toISOString(),
    };
    onAdd(newExpense);
    form.reset();
    onClose();
  };

  const tripOptions = trips.map(t => ({ value: t.id, label: t.title }));

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        <Select
          label="Командировка"
          placeholder="Выберите поездку"
          data={tripOptions}
          required
          {...form.getInputProps('tripId')}
        />
        <TextInput
          label="На что потрачено?"
          placeholder="Например, Билеты"
          required
          {...form.getInputProps('title')}
        />
        <NumberInput
          label="Сумма (₽)"
          placeholder="1500"
          required
          min={0}
          {...form.getInputProps('amount')}
        />
        <Button type="submit" color="green" mt="md">
          Добавить расход
        </Button>
      </Stack>
    </form>
  );
};
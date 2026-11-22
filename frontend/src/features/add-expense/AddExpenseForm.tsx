import { TextInput, NumberInput, Button, Stack, Select, Alert } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState } from 'react';
import type { Expense } from '../../entities/expense/model/types';
import type { Trip } from '../../entities/trip/model/types';

type ExpenseDraft = Pick<Expense, 'title' | 'amount'> & { tripId: string };

export const AddExpenseForm = ({
  trips,
  onAdd,
  onClose
}: {
  trips: Trip[],
  onAdd: (expense: ExpenseDraft) => Promise<void>,
  onClose: () => void
}) => {
  const [submitError, setSubmitError] = useState<string | null>(null);
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

  const handleSubmit = async (values: typeof form.values) => {
    setSubmitError(null);
    try {
      await onAdd({ title: values.title, amount: values.amount, tripId: values.tripId });
      form.reset();
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Не удалось сохранить расход.');
    }
  };

  const tripOptions = trips.map(t => ({ value: t.id, label: t.title }));

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        {submitError && <Alert color="red" variant="light">{submitError}</Alert>}
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
        <Button type="submit" className="primary-button form-submit" mt="md">
          Добавить расход
        </Button>
      </Stack>
    </form>
  );
};

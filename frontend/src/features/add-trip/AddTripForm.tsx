import { TextInput, NumberInput, Button, Stack, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import type { Trip } from '../../entities/trip/model/types';

export const AddTripForm = ({ onAdd, onClose }: { onAdd: (trip: Trip) => void, onClose: () => void }) =>
{
  const form = useForm
  ({
    initialValues: {
      title: '',
      description: '',
      budget: 0,
    },
    validate: {
      title: (value) => (value.length < 3 ? 'Название должно быть не короче 3 символов' : null),
      budget: (value) => (value <= 0 ? 'Бюджет должен быть больше нуля' : null),
    },
  });

  const handleSubmit = (values: typeof form.values) =>
  {
    const newTrip: Trip = {
      id: Date.now().toString(),
      title: values.title,
      description: values.description,
      budget: values.budget,
      color: 'blue',
    };

    onAdd(newTrip);
    form.reset();
    onClose();
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        <TextInput
          label="Куда едем?"
          placeholder="Например, Москва"
          required
          {...form.getInputProps('title')}
        />
        <Textarea
          label="Цель поездки"
          placeholder="Опишите цель"
          {...form.getInputProps('description')}
        />
        <NumberInput
          label="Бюджет (₽)"
          placeholder="50000"
          required
          min={0}
          {...form.getInputProps('budget')}
        />
        <Button type="submit" color="blue" mt="md">
          Сохранить командировку
        </Button>
      </Stack>
    </form>
  );
};
import { TextInput, NumberInput, Button, Stack, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState } from 'react';
import { Alert } from '@mantine/core';
import type { Trip } from '../../entities/trip/model/types';

type TripDraft = Omit<Trip, 'id' | 'color'>;

export const AddTripForm = ({ onAdd, onClose }: { onAdd: (trip: TripDraft) => Promise<void>, onClose: () => void }) => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm({
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

  const handleSubmit = async (values: typeof form.values) => {
    setSubmitError(null);
    try {
      await onAdd({
      title: values.title,
      description: values.description,
      budget: values.budget,
      });
      form.reset();
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Не удалось сохранить командировку.');
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        {submitError && <Alert color="red" variant="light">{submitError}</Alert>}
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
        <Button type="submit" className="primary-button form-submit" mt="md">
          Сохранить командировку
        </Button>
      </Stack>
    </form>
  );
};

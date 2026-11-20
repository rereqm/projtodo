import { SimpleGrid, Title, Button, Modal, Group, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useState } from 'react';
import { mockTrips } from "../../shared/lib/mockData";
import { TripCard } from "../../entities/trip/ui/TripCard";
import { AddTripForm } from '../../features/add-trip/AddTripForm';
import type { Trip } from '../../entities/trip/model/types';

export const TripPage = () => {
  const [trips, setTrips] = useState<Trip[]>(mockTrips);
  const [opened, { open, close }] = useDisclosure(false);

  const handleAddTrip = (newTrip: Trip) => setTrips([newTrip, ...trips]);

  const handleDeleteTrip = (id: string) => {
    if (window.confirm("Вы уверены, что хотите удалить командировку?")) {
      setTrips(trips.filter(t => t.id !== id));
    }
  };

  return (
    <>
      <Group justify="space-between" mb="xl">
        <Title order={2}>Мои командировки</Title>
        <Button color="blue" onClick={open}>+ Добавить</Button>
      </Group>

      {trips.length === 0 ? (
        <Text c="dimmed" ta="center" mt="xl">У вас пока нет командировок.</Text>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
          {trips.map((trip) => (
            // Передаем onDelete
            <TripCard key={trip.id} trip={trip} onDelete={handleDeleteTrip} />
          ))}
        </SimpleGrid>
      )}

      <Modal opened={opened} onClose={close} title="Новая командировка" centered>
        <AddTripForm onAdd={handleAddTrip} onClose={close} />
      </Modal>
    </>
  );
};
import { Card, Text, Badge, ActionIcon, Group } from "@mantine/core";
import { IconTrash } from '@tabler/icons-react'; // <-- Иконка корзины
import type { Trip } from "../model/types";
import classes from './TripCard.module.css';

export const TripCard = ({ trip, onDelete }: { trip: Trip, onDelete: (id: string) => void }) => {
    return (
        <Card className={classes.card} shadow="sm" padding="lg" radius="md" withBorder h="100%">
            <Group justify="space-between" mb="sm">
                <Badge color={trip.color}>командировка</Badge>
                {/* Кнопка удаления */}
                <ActionIcon color="red" variant="subtle" onClick={() => onDelete(trip.id)}>
                    <IconTrash size={16} />
                </ActionIcon>
            </Group>
            <Text fw={500} size="lg">{trip.title}</Text>
            <Text size="sm" c="dimmed" mt="xs">{trip.description}</Text>
            <Text fw={700} c="blue" mt="sm">Бюджет: {trip.budget} ₽</Text>
        </Card>
    );
}
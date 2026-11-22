import { Card, Text, Badge, ActionIcon, Group, Box, Progress, Button } from "@mantine/core";
import { IconTrash, IconMapPin, IconArrowRight } from '@tabler/icons-react';
import type { Trip } from "../model/types";
import classes from './TripCard.module.css';

export const TripCard = ({ trip, spent = 0, onDelete, onOpen }: {
    trip: Trip;
    spent?: number;
    onDelete: (id: string) => void;
    onOpen: (trip: Trip) => void;
}) => {
    const budgetPercent = trip.budget > 0 ? Math.min((spent / trip.budget) * 100, 100) : 0;
    const formatMoney = (amount: number) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(amount);

    return (
        <Card className={`${classes.card} trip-card`} padding="lg" radius="lg" withBorder h="100%">
            <Group justify="space-between" mb="lg">
                <Badge className="trip-label" color={trip.color} variant="light" leftSection={<IconMapPin size={13} />}>
                    Командировка
                </Badge>
                <ActionIcon className="delete-button" aria-label="Удалить командировку" color="gray" variant="subtle" onClick={() => onDelete(trip.id)}>
                    <IconTrash size={17} stroke={1.8} />
                </ActionIcon>
            </Group>
            <Text className="trip-title" lineClamp={2}>{trip.title}</Text>
            <Text className="trip-description" size="sm" c="dimmed" lineClamp={2} mt={6}>
                {trip.description || 'Описание поездки не добавлено'}
            </Text>
            <Box className="trip-budget" mt="lg">
                <Group justify="space-between" align="baseline" mb={8}>
                    <Text size="xs" c="dimmed">Бюджет</Text>
                    <Text className="trip-budget-total">{formatMoney(trip.budget)} ₽</Text>
                </Group>
                <Progress value={budgetPercent} size={6} radius="xl" color={budgetPercent >= 90 ? 'orange' : 'blue'} />
                <Group justify="space-between" mt={8}>
                    <Text size="xs" c="dimmed">Потрачено</Text>
                    <Text size="xs" fw={600}>{formatMoney(spent)} ₽</Text>
                </Group>
            </Box>
            <Button
                className="trip-details-button"
                variant="subtle"
                color="blue"
                size="xs"
                rightSection={<IconArrowRight size={15} />}
                onClick={() => onOpen(trip)}
                mt="sm"
            >
                Подробнее
            </Button>
        </Card>
    );
}

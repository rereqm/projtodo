import { Card, Group, Text, Badge, Box, Button } from "@mantine/core";
import { IconCalendar, IconCheck, IconTrash, IconX } from '@tabler/icons-react';
import type { Expense } from '../model/types';
import classes from './ExpenseCard.module.css';

type ExpenseCardProps = {
    expense: Expense;
    tripTitle?: string;
    canReview?: boolean;
    onReview?: (id: string, status: 1 | 2) => void;
    canDelete?: boolean;
    onDelete?: (id: string) => void;
};

export const ExpenseCard = ({ expense, tripTitle, canReview = false, onReview, canDelete = false, onDelete }: ExpenseCardProps) => {
    const formattedDate = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
        .format(new Date(expense.createdAt));
    const isApproved = expense.status === 1;
    const statusLabel = expense.status === 1 ? 'Согласован' : expense.status === 2 ? 'Отклонён' : 'На проверке';
    const statusColor = expense.status === 1 ? 'teal' : expense.status === 2 ? 'red' : 'yellow';

    return (
        <Card className={`${classes.card} expense-row`} padding="lg" radius="lg" withBorder>
            <Group justify="space-between" wrap="nowrap" align="center">
                <Group gap="md" wrap="nowrap" style={{ minWidth: 0 }}>
                    <Box className={`expense-mark ${isApproved ? 'expense-mark-approved' : expense.status === 2 ? 'expense-mark-rejected' : ''}`} aria-hidden="true" />
                    <Box style={{ minWidth: 0 }}>
                        <Text className="expense-title" truncate>{expense.title}</Text>
                        <Group className="expense-meta" gap="xs" mt={5} wrap="wrap">
                            {tripTitle && <Text size="xs" c="dimmed" truncate>{tripTitle}</Text>}
                            <Text size="xs" c="dimmed" className="expense-date"><IconCalendar size={13} />{formattedDate}</Text>
                        </Group>
                    </Box>
                </Group>
                <Group gap="sm" wrap="nowrap">
                    <Box className="expense-amount-group">
                        <Text className="expense-amount">{new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(expense.amount)} ₽</Text>
                        <Badge className="expense-status" color={statusColor} variant="light" radius="sm">
                            {statusLabel}
                        </Badge>
                    </Box>
                </Group>
            </Group>
            {((canReview && expense.status === 0 && onReview) || (canDelete && onDelete)) && (
                <Group className="review-actions" justify="flex-end" gap="xs" mt="md">
                    {canDelete && onDelete && <Button size="xs" variant="light" color="red" leftSection={<IconTrash size={14} />} onClick={() => onDelete(expense.id)}>Удалить</Button>}
                    {canReview && expense.status === 0 && onReview && <>
                    <Button size="xs" variant="light" color="red" leftSection={<IconX size={14} />} onClick={() => onReview(expense.id, 2)}>
                        Отклонить
                    </Button>
                    <Button size="xs" variant="light" color="teal" leftSection={<IconCheck size={14} />} onClick={() => onReview(expense.id, 1)}>
                        Согласовать
                    </Button>
                    </>}
                </Group>
            )}
        </Card>
    );
}

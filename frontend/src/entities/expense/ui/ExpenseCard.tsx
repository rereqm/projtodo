import { Card, Group, Text, Badge, Checkbox, ActionIcon } from "@mantine/core";
import { IconTrash } from '@tabler/icons-react';
import type { Expense } from '../model/types';
import classes from './ExpenseCard.module.css';

export const ExpenseCard = ({ expense, onDelete }: { expense: Expense, onDelete: (id: string) => void }) => {
    return (
        <Card className={classes.card} shadow="sm" padding="md" radius="md" withBorder mb="sm">
            <Group justify="space-between">
                <Group>
                    <Checkbox checked={expense.isApproved} readOnly onChange={() => {}} />
                    <Text fw={500} td={expense.isApproved ? 'line-through' : 'none'} c={expense.isApproved ? 'dimmed' : 'dark'}>
                        {expense.title}
                    </Text>
                </Group>
                <Group>
                    <Text fw={700} c="blue">{expense.amount} ₽</Text>
                    <Badge color={expense.isApproved ? 'green' : 'orange'}>
                        {expense.isApproved ? 'Утвержден' : 'На проверке'}
                    </Badge>
                    {/* Кнопка удаления */}
                    <ActionIcon color="red" variant="subtle" onClick={() => onDelete(expense.id)}>
                        <IconTrash size={16} />
                    </ActionIcon>
                </Group>
            </Group>
        </Card>
    );
}
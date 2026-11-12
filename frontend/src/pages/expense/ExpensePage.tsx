import {Title, Stack} from "@mantine/core";
import {ExpenseCard} from '../../entities/expense/ui/ExpenseCard.tsx';
import {mockExpenses} from '../../shared/lib/mockData';

export const ExpensePage = () => {
    return (
        <>
            <Title order={2} mb="md">Мои расходы</Title>
            <Stack>
                {
                    mockExpenses.map((expense) =>
                            (
                                <ExpenseCard key = {expense.id} expense={expense}/>
                            )
                    )
                }
            </Stack>
        </>
    );
};
import {Card, Group,Text,Badge,Checkbox} from "@mantine/core";
import type {Expense} from '../model/types';


export const ExpenseCard = ({expense}:{expense:Expense}) =>
{
    return(
        <Card shadow = "sm" padding = "md" radius = "md" withBorder mb = "sm">
            <Group justify = "space-between">
                {/*лч*/}
                <Group>
                    <Checkbox checked = {expense.isApproved} readOnly onChange={()=>{}} />
                        <Text
                            fw = {500}
                            td = {expense.isApproved ? 'line-through':'none'}
                            c = {expense.isApproved ? 'dimmed' : 'dark'}
                        >
                            {expense.title}
                        </Text>
                </Group>
                {/*пч*/}
                <Badge color = {expense.isApproved ? 'green' : 'blue'}>
                    {expense.isApproved ? 'Утвержден':'На проверке'}
                </Badge>

            </Group>
            {expense.amount >0  &&
                (
                    <Text size = "sm" c = "dimmed" mt = "sm">
                        Сумма: {expense.amount} ₽
                    </Text>
                )
            }
        </Card>
    )
}
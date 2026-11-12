import {Card, Group,Text,Badge,Checkbox} from "@mantine/core";
import type {Task} from '../model/types';


export const TaskCard = ({task}:{task:Task}) =>
{
    return(
        <Card shadow = "sm" padding = "md" radius = "md" withBorder mb = "sm">
            <Group justify = "space-between">
                {/*лч*/}
                <Group>
                    <Checkbox checked = {task.isDone} readOnly onChange={()=>{}} />
                        <Text
                            fw = {500}
                            td = {task.isDone ? 'line-throught':'none'}
                            c = {task.isDone ? 'dimmed' : 'dark'}
                        >
                            {task.title}
                        </Text>
                </Group>
                {/*пч*/}
                <Badge color = {task.isDone ? 'green' : 'blue'}>
                    {task.isDone ? 'Готово':'В работе'}
                </Badge>

            </Group>
            {task.description &&
                (
                    <Text size = "sm" c = "dimmed" mt = "sm">
                        {task.description}
                    </Text>
                )
            }
        </Card>
    )
}
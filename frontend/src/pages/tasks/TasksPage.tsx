import {Title, Stack} from "@mantine/core";
import {TaskCard} from '../../entities/task/ui/TaskCard';
import {mockTasks} from '../../shared/lib/mockData';

export const TasksPage = () => {
    return (
        <>
            <Title order={2} mb="md">Мои задачи</Title>
            <Stack>
                {
                    mockTasks.map((task) =>
                            (
                                <TaskCard key = {task.id} task={task}/>
                            )
                    )
                }
            </Stack>
        </>
    );
};
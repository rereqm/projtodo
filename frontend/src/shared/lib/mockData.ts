import type {Project} from "../../entities/project/model/types.ts";
import type {Task} from "../../entities/task/model/types.ts";

export const mockProjects: Project[] =
    [
        {
            id: "p1",
            title: "проект1",
            description: "сделать проект 1!!!!!",
            color: "blue"
        },
        {
            id: "p2",
            title: "проект2",
            description: "сделать проект 2!",
            color: "green"
        },
        {
            id: "p3",
            title: "проект3",
            description: "сделать проект 3!!!!!",
            color: "grape"
        },
    ];
export const mockTasks: Task[] =
    [
        {
            id: "t1",
            title: "сделать задачу1",
            description: "по сумашедшему сделать задачачу 1 проекта 1",
            isDone: false,
            projectId: "1",
            createdAt: "2026-11-01"
        },
        {
            id: "t2",
            title: "сделать задачу2",
            description: "по сумашедшему сделать задачачу 2 проекта 1",
            isDone: true,
            projectId: "1",
            createdAt: "2026-11-01"
        },
        {
            id: "t3",
            title: "сделать задачу1",
            description: "по сумашедшему сделать задачачу 1 проекта 2",
            isDone: false,
            projectId: "2",
            createdAt: "2026-11-10"
        },
        {
            id: "t4",
            title: "сделать задачу2",
            description: "по сумашедшему сделать задачачу 1 проекта 3",
            isDone: true,
            projectId: "3",
            createdAt: "2026-11-11"
        },

    ];
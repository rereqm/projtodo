export interface Project
{
    id: string;
    title:string;
    description:string;
    color:string;
}
export interface Task
{
    id:string;
    title:string;
    description?:string;
    isDone:boolean;
    projectId:string;
    createdAt:string;
}
export interface Expense
{
    id: string;
    title: string;
    amount: number;
    isApproved: boolean;
    tripId: string;
    createdAt: string;
}
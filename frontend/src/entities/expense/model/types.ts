export interface Expense
{
    id: string;
    title: string;
    amount: number;
    status: 0 | 1 | 2;
    tripId: string;
    createdAt: string;
    reviewComment?: string | null;
}

import type { Trip } from "../../entities/trip/model/types";
import type { Expense } from "../../entities/expense/model/types";

export const mockTrips: Trip[] =
    [
        {
            id: "trip1",
            title: "Москва (IT-конференция)",
            description: "Поездка на ежегодную конференцию разработчиков",
            budget: 50000,
            color: "blue",
        },
        {
            id: "trip2",
            title: "Санкт-Петербург (Встреча с клиентом)",
            description: "Презентация нового продукта",
            budget: 25000,
            color: "green",
        },
        {
            id: "trip3",
            title: "Казань (Форум)",
            description: "Обмен опытом",
            budget: 30000,
            color: "grape",
        },
    ];

export const mockExpenses: Expense[] = [
    {
        id: "exp1",
        title: "Авиабилеты туда-обратно",
        amount: 15000,
        isApproved: true,
        tripId: "trip1",
        createdAt: "2026-11-10",
    },
    {
        id: "exp2",
        title: "Бронирование отеля (3 ночи)",
        amount: 12000,
        isApproved: false,
        tripId: "trip1",
        createdAt: "2026-11-11",
    },
    {
        id: "exp3",
        title: "Такси до аэропорта",
        amount: 1500,
        isApproved: false,
        tripId: "trip2",
        createdAt: "2026-11-11",
    },
];
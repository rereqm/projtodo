import {Card,Text,Badge} from "@mantine/core";
import type {Trip} from "../model/types.ts";
export const TripCard = ({trip}:{trip:Trip}) =>
{
    return(
        <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
            <Badge color = {trip.color} mb="sm">
                коммандировка
            </Badge>
            {/*название коммандировок*/}
            <Text fw = {500} size = "lg">{trip.title}</Text>
            <Text size ="sm" c ="dimmed" mt ="xs">
                {trip.description}
            </Text>
            <Text size="sm" c="dimmed" mt="xs">
                {trip.description}
            </Text>
            <Text fw={700} c="blue" mt="sm">
                Бюджет: {trip.budget} ₽
            </Text>
        </Card>
    );
}
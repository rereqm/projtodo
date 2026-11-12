import {SimpleGrid, Title} from '@mantine/core'
import {mockTrips} from "../../shared/lib/mockData.ts";
import {TripCard} from "../../entities/trip/ui/TripCard.tsx";

export const TripPage = () =>
{
    return (
        <>
            <Title order={2} mb = "md">Мои командировки</Title>
            <SimpleGrid cols = {{base:1,sm:2,md:3}} spacing ="md">
                {
                    mockTrips.map((trip)=>
                    (
                        <TripCard key={trip.id} trip={trip}/>
                    ))
                }
            </SimpleGrid>
        </>
    );
};
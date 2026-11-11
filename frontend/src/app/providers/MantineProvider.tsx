import { MantineProvider as MantineProviderBase } from '@mantine/core';
import '@mantine/core/styles.css' ;
export const MantineProvider = ({children}: {children: React.ReactNode}) =>
{
    return <MantineProviderBase>{children}</MantineProviderBase>;
};
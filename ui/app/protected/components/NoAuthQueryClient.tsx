import React, { FunctionComponent } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';

const queryClient = new QueryClient()

export const NoAuthQueryClient: FunctionComponent = (props) => {
  return (
    <QueryClientProvider client={queryClient}>
      {props.children}
    </QueryClientProvider>
  )
}

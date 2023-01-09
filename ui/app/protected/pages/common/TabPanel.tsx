import { Box, BoxProps } from '@mui/material';
import * as React from 'react';

type TabPanelProps = {
    children?: React.ReactNode;
    index: number;
    value: number;
  } & BoxProps

export function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
    >
      {value === index && (
        <Box sx={{ p: 2 }}
          {...other}
        >
          {children}
        </Box>
      )}
    </div>
  );
}

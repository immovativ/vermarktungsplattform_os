import { SvgIconComponent } from '@mui/icons-material'
import { Paper, Stack, Box, Typography } from '@mui/material'
import React, { ReactChild, FC } from 'react'

interface StatCardProps {
  IconComponent?: SvgIconComponent
  label: ReactChild
  preline: ReactChild
}

export const StatCard: FC<StatCardProps> = ({IconComponent, label, preline}) => {
  return (
    <Paper sx={{py: 1, px: 1.5}} variant='outlined'>
      <Stack direction="row" alignItems='center' spacing={1.5}>
        {IconComponent && <Box display='flex' fontSize={28} flexGrow={'0'}>
          <IconComponent fontSize='inherit' sx={{color: 'primary.light'}}/>
        </Box>}
        <Stack direction='column'>
          <Typography variant='caption' lineHeight={1.3} color="grey.700">{preline}</Typography>
          {typeof label === 'string' ? <Typography variant='body1' fontWeight={500} >{label}</Typography> : label}
        </Stack>
      </Stack>
    </Paper>
  )
}

export const PoorMansStatCard: FC<{
  label: string,
  value: string
}> = ({label, value}) => {
  return <Paper sx={{py: 1, px: 1.5}} variant='outlined'>
    <Stack direction="row" alignItems='center' spacing={1.5}>
      <Stack direction='column' spacing={0.5}>
        <Typography variant='body1' fontWeight={500} >{label}</Typography>
        <Typography variant='body2' lineHeight={1.3} color="grey.800" whiteSpace="break-spaces">{value ? value : '-'}</Typography>
      </Stack>
    </Stack>
  </Paper>
}

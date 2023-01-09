import { ConstructionSiteDetailStats } from '@common/component/construction-site/ConstructionSiteDetailStats';
import { PoorMansStatCard } from '@common/component/StatCard';
import { Grid, Stack, Typography } from '@mui/material';
import React, { FunctionComponent } from 'react';
import { AdminConceptAssignmentDetailWithAttachments } from '../queries/concept-assignment';

interface Props {
    detail: AdminConceptAssignmentDetailWithAttachments
}


export const ReadonlyDetail: FunctionComponent<Props> = ({
  detail,
}) => {
  const d = detail.assignment.details
  return <>
    <ConstructionSiteDetailStats
      constructionSiteKey={detail.assignment.parcels[0]}
    />
    <Grid display='grid' gridTemplateColumns='1fr 1fr' columnGap={2} rowGap={1}>
      {d.allowedFloors !== null && <PoorMansStatCard label='Zulässige Geschosse' value={d.allowedFloors.toLocaleString('de-DE')} />}
      {d.allowedBuildingHeightMeters !== null && <PoorMansStatCard label='Zulässige Gebäudehöhe'
        value={d.allowedBuildingHeightMeters.toLocaleString('de-DE') + ' m'} />}
    </Grid>
    {d.energyText && <Typography sx={{pt: 4, pb: 2}} variant="h6">Besondere Vorgaben</Typography>}
    {d.energyText && <Stack direction="column">
      <Typography variant='caption'>Energetische Vorgaben</Typography>
      <Typography variant='body2' sx={{whiteSpace: 'pre-line'}}>{d.energyText}</Typography>
    </Stack>}
  </>
}

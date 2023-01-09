import { StatCard } from '@common/component/StatCard'
import { AnchorOutlined, Close, EventOutlined, HouseSidingOutlined, LinkOutlined, MapsHomeWorkOutlined } from '@mui/icons-material'
import { Card, Stack, Typography, IconButton, CardContent, Grid, CardActions, styled, lighten, CardMedia } from '@mui/material'
import { BuildingTypeTranslations } from '@protected/pages/projectgroup/queries/concept-assignment'
import { ConceptAssignmentDetail } from '@public/models/ConceptAssignmentDetail'
import { DateTime } from 'luxon'
import React from 'react'

interface AssignmentDetailCardProps {
  assignment: ConceptAssignmentDetail
  active?: boolean
  disableElevation?: boolean
  locationPreview?: boolean
  clearAssignment?: () => void
  footer?: React.ReactChild
}

function prettyBuildingHeight(height: number | undefined): string {
  if (height) {
    return (Math.ceil(height*100)/100).toString()
  } else {
    return '-'
  }
}

const SyledConceptAssignmentDetailCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'active',
})<Pick<AssignmentDetailCardProps, 'active' | 'disableElevation'>>(({theme, active})=> ({
  'minWidth': '250px',
  'backgroundColor': active ? lighten(theme.palette.primary.light, 0.95) : undefined,
  '&.MuiPaper-elevation': {
    boxShadow: active ? '0px 2px 1px -1px rgba(120, 15, 30, 0.4),0px 1px 1px 0px rgba(120, 15, 30, 0.14),0px 1px 3px 0px rgba(120, 15, 30, 0.18)' : undefined,
  },
}))

export const ConceptAssignmentDetailCard = React.forwardRef<HTMLDivElement, AssignmentDetailCardProps>(
    ({assignment, active, locationPreview, clearAssignment, disableElevation, footer}, ref) => {
      return <SyledConceptAssignmentDetailCard ref={ref} active={active} variant={(disableElevation || !active) ? 'outlined' : 'elevation'}>
        <Stack direction="row" alignItems='stretch'>
          {locationPreview && assignment.previewImage && <CardMedia
            component="img"
            sx={{ maxWidth: '250px' }}
            image={`/api/assignment/${assignment.id}/preview`}
          />}
          <Stack direction="column" flexGrow="1">
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="nowrap" sx={{pb: 2}}>
                <Typography
                  variant="h5"
                  component="div"
                  color={active ? 'primary.dark' : undefined}
                  fontWeight={active ? 500 : undefined}
                >
                  {assignment.name}
                </Typography>
                {clearAssignment && <IconButton size="small" onClick={clearAssignment}>
                  <Close fontSize="inherit"/>
                </IconButton>}
              </Stack>
              <Stack direction="column" spacing={2}>
                <Grid container columnSpacing={1} rowSpacing={1}>
                  <Grid item xs={12}>
                    <StatCard
                      IconComponent={MapsHomeWorkOutlined}
                      preline="Gebäudetypologie"
                      label={BuildingTypeTranslations[assignment.conceptDetails.buildingType]}
                    />
                  </Grid>
                  {assignment.assignmentEnd && <Grid item xs={6}>
                    <StatCard
                      IconComponent={EventOutlined}
                      preline="Ende der Bewerbungsfrist"
                      label={DateTime.fromISO(assignment.assignmentEnd).setLocale('de').toLocaleString(DateTime.DATETIME_MED)}
                    />
                  </Grid>}
                  <Grid item xs={6}>
                    <StatCard
                      IconComponent={assignment.conceptAssignmentType === 'ANCHOR' ? AnchorOutlined : LinkOutlined}
                      preline="Projekttyp"
                      label={assignment.conceptAssignmentType === 'ANCHOR' ? 'Ankerprojekt' : 'Anliegerprojekt'}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <StatCard
                      IconComponent={HouseSidingOutlined}
                      preline="Zulässige Geschosse"
                      label={assignment.conceptDetails.allowedFloors ?? '-'}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <StatCard
                      IconComponent={HouseSidingOutlined}
                      preline="Zulässige Gebäudehöhe (in Meter)"
                      label={prettyBuildingHeight(assignment.conceptDetails.allowedBuildingHeightMeters)}
                    />
                  </Grid>
                </Grid>
              </Stack>
            </CardContent>
            {footer && <CardActions sx={{p: 2}}>
              {footer}
            </CardActions>}
          </Stack>
        </Stack>
      </SyledConceptAssignmentDetailCard>
    },
)

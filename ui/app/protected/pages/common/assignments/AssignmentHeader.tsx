import { Stack, Typography, Box, Paper, Divider } from '@mui/material'
import { FeatureMap } from '@protected/components/map/FeatureMap'
import {
  AdminConceptAssignmentDetail,
  BuildingTypeTranslations,
  ConceptAssignmentState,
  ConceptAssignmentStateTranslation,
} from '@protected/pages/projectgroup/queries/concept-assignment'
import { DateTime } from 'luxon'
import React, { FC, useMemo } from 'react'
import {
  AnchorOutlined,
  CancelOutlined,
  CheckCircleOutlineOutlined,
  EventOutlined,
  HourglassEmptyOutlined,
  LinkOutlined,
  ConstructionOutlined,
  MapsHomeWorkOutlined,
  ModeOutlined,
  PublicOutlined,
  SvgIconComponent,
  Visibility,
} from '@mui/icons-material';
import { StatCard } from '@common/component/StatCard'
import {MapModal} from '@protected/pages/common/MapModal';
import {Feature} from 'ol';
import { parcelsToFeatures } from '@protected/model/Parcel'
import { Link } from 'react-router-dom'

interface AssignmentHeaderProps {
  concept: AdminConceptAssignmentDetail
  actionBar?: React.ReactChild
}

const getStateIcon = (state: ConceptAssignmentState): SvgIconComponent => {
  switch (state) {
    case 'ACTIVE':
      return PublicOutlined
    case 'DRAFT':
      return ModeOutlined
    case 'REVIEW':
      return Visibility
    case 'WAITING':
      return HourglassEmptyOutlined
    case 'FINISHED':
      return CheckCircleOutlineOutlined
    case 'ABORTED':
      return CancelOutlined
  }
}


export const AssignmentHeader: FC<AssignmentHeaderProps> = ({concept, actionBar}) => {
  const [showMapModal, setShowMapModal] = React.useState(false)

  const features: Feature[] = useMemo(
      () => parcelsToFeatures(concept.parcels),
      [JSON.stringify(concept.parcels)],
  )

  return (
    <>
      {showMapModal &&
        <MapModal
          feature={features}
          onClose={() => setShowMapModal(false)}
        />
      }
      <Box sx={{bgcolor: 'grey.50', px: 2, py: 3, borderRadius: 2}}>
        <Stack direction="column">
          <Stack direction="row" justifyContent='space-between'>
            <Stack direction="row" spacing={2} >
              <Paper sx={{
                'cursor': 'pointer',
                'borderRadius': 50,
                'overflow': 'hidden',
                'aspectRatio': '1/1',
                'flex': '1 0 auto',
                '&:hover': {
                  boxShadow: 6,
                },
              }}>
                <Box sx={{width: '100%', height: '100%'}} onClick={() => setShowMapModal(true)}>
                  <FeatureMap features={features} />
                </Box>
              </Paper>
              <Stack direction="column" spacing={1} flex="1 0 auto">
                <Typography variant="h3" color="text.primary">
                  {concept.name}
                </Typography>
                <Stack direction='row' spacing={1}>
                  <StatCard
                    IconComponent={getStateIcon(concept.state)}
                    preline='Status'
                    label={ConceptAssignmentStateTranslation[concept.state]}
                  />
                  <StatCard
                    IconComponent={MapsHomeWorkOutlined}
                    preline='Gebäudetypologie'
                    label={BuildingTypeTranslations[concept.details.buildingType]}
                  />
                  <StatCard
                    IconComponent={concept.conceptAssignmentType === 'ANCHOR' ? AnchorOutlined : LinkOutlined}
                    preline='Projekttyp'
                    label={concept.conceptAssignmentType === 'ANCHOR' ? 'Ankerprojekt' : 'Anliegerprojekt'}
                  />
                  {concept.parcels.length >0 &&
                  <StatCard
                    IconComponent={ConstructionOutlined}
                    preline='Baufeld'
                    label={<Link to={`/protected/admin/construction-sites/${concept.parcels[0].constructionAreaId}/${concept.parcels[0].constructionSiteId}`}>
                      {concept.parcels[0].constructionAreaId}.{concept.parcels[0].constructionSiteId}
                    </Link>}
                  />}

                  {concept.assignmentStart &&
                      <StatCard
                        IconComponent={EventOutlined}
                        preline='Start der Bewerbungsfrist'
                        label={DateTime.fromISO(concept.assignmentStart).setLocale('de').toLocaleString(DateTime.DATETIME_MED)}
                      />
                  }
                  {concept.assignmentEnd &&
                      <StatCard
                        IconComponent={EventOutlined}
                        preline='Ende der Bewerbungsfrist'
                        label={DateTime.fromISO(concept.assignmentEnd).setLocale('de').toLocaleString(DateTime.DATETIME_MED)}
                      />
                  }
                </Stack>
              </Stack>
            </Stack>
            {actionBar && <Box>{actionBar}</Box>}
          </Stack>
        </Stack>
      </Box>
      <Divider sx={{my: 2}} />
    </>
  )
}

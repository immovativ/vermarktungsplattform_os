
import { StatCard } from '@common/component/StatCard'
import {
  EventOutlined, MapsHomeWorkOutlined,
} from '@mui/icons-material'
import { Box, Paper, Stack, Typography } from '@mui/material'
import { FeatureMap } from '@protected/components/map/FeatureMap'
import { ConceptAssignmentWithAttachments,
} from '@protected/model/candidature/Candidature'
import { MapModal } from '@protected/pages/common/MapModal'
import {
  BuildingTypeTranslations,
} from '@protected/pages/projectgroup/queries/concept-assignment'
import { DateTime } from 'luxon'
import { Feature } from 'ol'
import React, { FC, useMemo } from 'react'
import {CandidatureProgress} from '@protected/pages/candidate/CandidatureProgress';
import { parcelsToFeatures } from '@protected/model/Parcel'

interface Props {
  concept: ConceptAssignmentWithAttachments
  actionBar?: React.ReactChild
  formErrors: { [key: string]: string }
}

export const CandidatureAssignmentHeader: FC<Props> = ({formErrors, concept, actionBar}) => {
  const [showMapModal, setShowMapModal] = React.useState(false)

  const features: Feature[] = useMemo(
      () => parcelsToFeatures(concept.assignment.parcels),
      [JSON.stringify(concept.assignment.parcels)],
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
                  {concept.assignment.name}
                </Typography>
                <Stack direction='row' spacing={1}>
                  <StatCard
                    IconComponent={MapsHomeWorkOutlined}
                    preline='Gebäudetypologie'
                    label={BuildingTypeTranslations[concept.assignment.details.buildingType]}
                  />

                  {concept.assignment.assignmentEnd &&
                      <StatCard
                        IconComponent={EventOutlined}
                        preline='Ende der Bewerbungsfrist'
                        label={DateTime.fromISO(concept.assignment.assignmentEnd).setLocale('de').toLocaleString(DateTime.DATETIME_MED)}
                      />
                  }

                  <StatCard
                    preline='Fortschritt'
                    label={
                      <CandidatureProgress errors={formErrors} questions={concept.assignment.questions}/>
                    } />
                </Stack>
              </Stack>
            </Stack>
            {actionBar && <Box>{actionBar}</Box>}
          </Stack>
        </Stack>
      </Box>
    </>
  )
}

import { OSMLayer } from '@common/component/map/layer/OSMLayer'
import { OpenLayerMap } from '@common/component/map/OpenLayerMap'
import {Alert, Box, Card, CardContent, Chip, CircularProgress, Paper, Stack} from '@mui/material'
import React, {FunctionComponent} from 'react'
import { useQuery } from 'react-query'
import {
  AdminConceptAssignmentListResult,
  listForOverviewMap,
} from '../queries/concept-assignment'
import { GeoJSONLayer } from '@common/component/map/layer/GeoJSONLayer'
import { AssignmentOnMapModal } from './AssignmentOnMapModal'
import {dietenbachGeoJsonUrl, dietenbachWmsUrl} from '@common/urls';
import {StateStylesWithLabel} from '@common/component/map/styles';
import { parcelsToFeatures } from '@protected/model/Parcel'
import {WMSLayer} from '@common/component/map/layer/WMSLayer';

export const OverviewMapPage: FunctionComponent = () => {
  const query = useQuery(['getCAOverviewMap'], () => listForOverviewMap())

  const activeFeatures = React.useMemo(() => query.data && query.data.flatMap((i) =>
    parcelsToFeatures(i.assignment.parcels).map((feature) => {
      feature.setProperties({data: i})
      feature.setStyle(StateStylesWithLabel[i.assignment.state].style)

      return feature
    }),
  ),
  [JSON.stringify(query.data)])

  const [selection, setSelection] = React.useState<AdminConceptAssignmentListResult | null>(null)

  return <Stack direction='column' spacing={1}>
    {query.isLoading && <CircularProgress />}
    {query.isError && <Alert severity='error'>Die Vergaben konnten nicht geladen werden. Bitte versuchen sie es erneut.</Alert>}
    {query.data && <Card>
      <CardContent>
        <Stack direction='column' spacing={1}>
          {query.data.length === 0 && <Alert variant='outlined' severity='info'>Es wurden keine Vergaben gefunden.</Alert>}

          {query.data.length > 0 && <Box sx={{height: '70vh'}}>
            <OpenLayerMap>
              <GeoJSONLayer
                features={activeFeatures}
                activeOnStartup
                zIndex={2}
                onClick={(a) => {
                  if (a && a.getProperties() && a.getProperties().data) {
                    setSelection(a.getProperties().data)
                  }
                }}
              />
              <GeoJSONLayer
                url={dietenbachGeoJsonUrl}
                activeOnStartup
                zIndex={1}
              />
              <WMSLayer
                activeOnStartup
                url={dietenbachWmsUrl}
                layers={'rahmenplan'}
                opacity={0.75}
                parameters={'TRANSPARENT=true'}
                zIndex={1}
              />
              <OSMLayer/>
            </OpenLayerMap>
          </Box>}
          <Paper sx={{p: 1}} variant="outlined">
            <Stack direction="row" spacing={1}>
              {Object.entries(StateStylesWithLabel)
                  .filter((entry) => entry[0] !== 'ABORTED' && entry[0] !== 'DRAFT')
                  .map((entry) => {
                    const [_, style] = entry

                    return <Chip
                      key={style.name}
                      label={style.label}
                      sx={{backgroundColor: `rgba(${style.fillColor})`}}
                      variant="outlined"
                    />
                  })}
            </Stack>
          </Paper>
        </Stack>
      </CardContent>
    </Card>}
    {selection && <AssignmentOnMapModal data={selection} onClose={() => setSelection(null)}/>}
  </Stack>
}

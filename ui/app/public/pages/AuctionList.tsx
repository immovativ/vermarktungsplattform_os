import React, { useState } from 'react';
import {useQuery} from 'react-query';
import axios from 'axios';
import { ConceptAssignmentDetail } from '@public/models/ConceptAssignmentDetail';
import {Button, Card, CardContent, Chip, Container, Grid, Paper, Stack} from '@mui/material';
import { LazyComponentLoader } from '@common/component/LazyComponentLoader';
import {PublicStateStyles} from '@common/component/map/styles';
import CardHeader from '@mui/material/CardHeader';


(window as any).CESIUM_BASE_URL = 'static/Source';

const LazyConceptAssignmentList = React.lazy(() => import('../components/ConceptAssignmentList'))
const LazyConceptAssignment2DMap = React.lazy(() => import('../components/ConceptAssignment2DMap'))
const LazyConceptAssignment3DMap = React.lazy(() => import('../components/ConceptAssignment3DMap'))

export const AuctionList: React.FC = () => {
  const data = useQuery(['public-assignments'], async () => (await axios.get<ConceptAssignmentDetail[]>('/api/assignments')).data)
  const [activeView, setActiveView] = useState< '2d' | '3d' | 'list'>('2d')
  const [activeAssignment, setActiveAssignment] = useState<ConceptAssignmentDetail | null>(null)

  const showOn2DMap = (assignment: ConceptAssignmentDetail | null) => {
    if (assignment) {
      setActiveAssignment(assignment)
      if (activeView != '2d') {
        setActiveView('2d')
      }
    }
  }

  const showOn3DMap = (assignment: ConceptAssignmentDetail | null) => {
    if (assignment) {
      setActiveAssignment(assignment)
      if (activeView != '3d') {
        setActiveView('3d')
      }
    }
  }

  const activeAssignments = data.data?.filter((assignment) => assignment.state === 'ACTIVE')

  const styles = {
    bgInfoBox: {backgroundColor: 'aliceblue', marginTop: '16px', paddingBottom: '16px'},
    bgInfoBox2: {backgroundColor: 'aliceblue', marginTop: '16px', marginBottom: '8px', padding: '8px'},
  };

  return <Container maxWidth={false}>
    <Grid container spacing={2}>
      <Grid item lg={3}>
        <Card sx={styles.bgInfoBox} variant="outlined">
          <CardHeader title="Interesse an einem Grundstück? Bewerben Sie sich hier!"/>
          <CardContent>
            <p>
              Auf dieser Seite erhalten Sie alle relevanten Informationen zur Grundstücksvergabe in Dietenbach.
            </p>
            <p>
              Auf der Karte sehen Sie die derzeit zur Vergabe ausgeschriebenen Grundstücke.
            </p>
            <p>
              Durch Anklicken des gewünschten Grundstücks kommen Sie auf den Steckbrief, in dem alle relevanten
              Informationen zusammengefasst sind und Sie zudem das Expose sowie weitere Informationen herunterladen können.
            </p>
            <p>
              <small>
                Die öffentliche Bekanntmachung zur Ausschreibung der Grundstücke ist unter dem entsprechenden Menüpukt zu finden.
              </small>
            </p>
            <p>
              <small>
                Informationen zum Vergabeverfahren sowie zur Bewerbung finden Sie unter dem jeweiligen Menüpunkt.
              </small>
            </p>
            <p>
              Wenn Sie sich auf ein Grundstück bewerben wollen, registrieren Sie sich einfach und laden die ausgefüllten Bewerbungsunterlagen hoch!
            </p>
          </CardContent>
        </Card>
      </Grid>
      <Grid item lg={9}>
        <Stack direction="column" sx={{maxHeight: 'calc(100vh - 180px)'}} spacing={2}>
          <Stack direction="column" flex="0 0 auto">
            <Paper sx={styles.bgInfoBox2} variant="outlined">
              <Stack direction="row" spacing={1}>
                <Stack sx={{p: 1}}>
                  INFORMATIONEN:
                </Stack>
                <a href="/ablauf-bewerbung">
                  <Button disableElevation>
                    Ablauf Bewerbung
                  </Button>
                </a>
                <a href="#">
                  <Button disableElevation>
                    Öffentliche Bekanntmachungen
                  </Button>
                </a>
                <a href="#">
                  <Button disableElevation>
                    News
                  </Button>
                </a>
                <a href="#">
                  <Button disableElevation>
                    Kontakt
                  </Button>
                </a>
              </Stack>
            </Paper>
            <Paper sx={{p: 1}} variant="outlined">
              <Stack direction="row" spacing={1}>
                <Stack sx={{p: 1}}>
                  ANSICHT ÄNDERN:
                </Stack>
                <Button
                  disableElevation
                  variant={activeView === '2d' ? 'contained' : 'text'}
                  onClick={() => setActiveView('2d')}
                >
                  2D Karte
                </Button>
                <Button
                  disableElevation
                  variant={activeView === '3d' ? 'contained' : 'text'}
                  onClick={() => setActiveView('3d')}
                >
                  3D Karte
                </Button>
                <Button
                  disableElevation
                  variant={activeView === 'list' ? 'contained' : 'text'}
                  onClick={() => setActiveView('list')}
                >
                  Listenansicht
                </Button>
              </Stack>
            </Paper>
          </Stack>
          <Stack direction="column" flex="0 1 auto" sx={{overflowY: 'auto', px: '8px !important', mx: '-8px !important'}}>
            {activeView === 'list' && <LazyComponentLoader>
              <LazyConceptAssignmentList
                assignments={activeAssignments || []}
                activeAssignment={activeAssignment ?? undefined}
                onSelectAssignment={showOn2DMap}
              />
            </LazyComponentLoader>
            }
            {activeView === '2d' && <Grid
              display="grid"
              columnGap={1}
              gridTemplateColumns="1fr 1fr"
              sx={{
                position: 'relative',
              }}
            >
              <Grid item sx={{position: 'relative'}}>
                <div style={{position: 'sticky', top: 0}}>
                  <LazyComponentLoader
                    additionalText='Die Karte wird geladen.'
                  >
                    <Stack direction="column" spacing={1}>
                      <LazyConceptAssignment2DMap
                        assignments={data.data || []}
                        activeAssignment={activeAssignment ?? undefined}
                        onSelectAssignment={setActiveAssignment}
                      />

                      <Paper sx={{p: 1}} variant="outlined">
                        <Stack direction="row" spacing={1}>
                          {Object.values(PublicStateStyles).map((style) => {
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
                  </LazyComponentLoader>
                </div>
              </Grid>
              <Grid item>
                <LazyComponentLoader>
                  <LazyConceptAssignmentList
                    assignments={activeAssignments || []}
                    activeAssignment={activeAssignment ?? undefined}
                    onSelectAssignment={showOn2DMap}
                    disableLocationPreview
                  />
                </LazyComponentLoader>
              </Grid>
            </Grid>
            }

            {activeView === '3d' &&
              <Grid
                display="grid"
                columnGap={1}
                gridTemplateColumns="1fr 1fr"
                sx={{
                  position: 'relative',
                }}
              >
                <Grid item sx={{position: 'relative'}}>
                  <div style={{position: 'sticky', top: 0}}>
                    <LazyComponentLoader
                      additionalText='Die 3D-Karte wird geladen.'
                    >
                      <Stack direction="column" spacing={1}>
                        <LazyConceptAssignment3DMap
                          assignments={data.data || []}
                          activeAssignment={activeAssignment ?? undefined}
                          onSelectAssignment={showOn3DMap}
                        />
                        <Paper sx={{p: 1}} variant="outlined">
                          <Stack direction="row" spacing={1}>
                            {Object.values(PublicStateStyles).map((style) => {
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
                    </LazyComponentLoader>
                  </div>
                </Grid>
                <Grid item>
                  <LazyComponentLoader>
                    <LazyConceptAssignmentList
                      assignments={activeAssignments || []}
                      activeAssignment={activeAssignment ?? undefined}
                      onSelectAssignment={showOn3DMap}
                      disableLocationPreview
                    />
                  </LazyComponentLoader>
                </Grid>
              </Grid>
            }
          </Stack>
        </Stack>
      </Grid>
    </Grid>
  </Container>
}

export default AuctionList

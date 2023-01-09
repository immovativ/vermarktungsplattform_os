import React, {FunctionComponent, useEffect, useRef} from 'react';
import { Box, Card, CardActionArea, CardContent, CardMedia, Container, Stack, Typography} from '@mui/material';
import CardHeader from '@mui/material/CardHeader';

interface TextPageProps {
  title: string
}

export const StartPage: FunctionComponent<TextPageProps> = (props) => {
  const initialTitle = useRef('')
  const {title} = props;

  useEffect(() => {
    initialTitle.current = document.title
    document.title = title

    return () => {
      document.title = initialTitle.current
    }
  }, [])

  return (
    <Container maxWidth="lg">
      <Stack direction="column" spacing={1} justifyContent="space-between">
        <Typography variant="h3" textAlign={'center'} sx={{mt: 6}}>Der neue Stadtteil Dietenbach</Typography>
        <Typography variant="h4" textAlign={'center'}>– sozial – ökologisch – lebenswert –</Typography>
        <CardActionArea href="/vergabe">
          <CardMedia component="img" image="https://www.immovativ.de/freiburg/images/startseite_title.jpg" />
        </CardActionArea>
        <Typography variant="h6" textAlign={'center'}>Hier erhalten Sie umfassende Informationen zum neuen Stadtteil Dietenbach</Typography>
      </Stack>
      <Box
        sx={{
          display: 'grid',
          gap: 1,
          gridTemplateColumns: {
            xs: 'repeat(1, 1fr)',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          },
        }}
      >
        <Card sx={{m: 2}}>
          <CardActionArea href="#">
            <CardHeader title="Planungsprozess"/>
            <CardMedia component="img" image="https://www.immovativ.de/freiburg/images/startseite_planungsprozess.jpg" />
            <CardContent>
              Informationen rund um den Planungsprozess zum neuen Stadtteil Dietenbach
            </CardContent>
          </CardActionArea>
        </Card>
        <Card sx={{m: 2}}>
          <CardActionArea href="#">
            <CardHeader title="Leben in Dietenbach"/>
            <CardMedia component="img" image="https://www.immovativ.de/freiburg/images/startseite_leben.jpg" />
            <CardContent>
              Dietenbach auf dem Weg in ein lebenswertes Quartier
            </CardContent>
          </CardActionArea>
        </Card>
        <Card sx={{m: 2}}>
          <CardActionArea href="/vergabe">
            <CardHeader title="Grundstücksvergabe"/>
            <CardMedia component="img" image="https://www.immovativ.de/freiburg/images/startseite_vergabe.jpg" />
            <CardContent>
              Aktuelle Vergabeverfahren im Projekt
            </CardContent>
          </CardActionArea>
        </Card>
        <Card sx={{m: 2}}>
          <CardActionArea href="#">
            <CardHeader title="Mediathek"/>
            <CardMedia component="img" image="https://www.immovativ.de/freiburg/images/startseite_impressionen.jpg" />
            <CardContent>
              Impressionen, Dokumente und Bilder zum Download
            </CardContent>
          </CardActionArea>
        </Card>
        <Card sx={{m: 2}}>
          <CardActionArea href="#">
            <CardHeader title="Terminvereinbarung"/>
            <CardMedia component="img" image="https://www.immovativ.de/freiburg/images/startseite_termine.jpg" />
            <CardContent>
              Vereinbarung von persönlichen Beratungsgesprächen
            </CardContent>
          </CardActionArea>
        </Card>
        <Card sx={{m: 2}}>
          <CardActionArea href="https://mitmachen.freiburg.de/stadtfreiburg/de/mapsurvey/53285">
            <CardHeader title="Schwarzes Brett"/>
            <CardMedia component="img" image="https://www.immovativ.de/freiburg/images/startseite_mach_mit.jpg" />
            <CardContent>
              Forum für gemeinschaftliche Wohnprojekte
            </CardContent>
          </CardActionArea>
        </Card>
      </Box>
    </Container>
  )
}

export default StartPage

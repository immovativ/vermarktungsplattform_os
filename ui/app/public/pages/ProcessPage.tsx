import React, {FunctionComponent, useEffect, useRef} from 'react';
import {Card, CardContent, Container, Grid, Stack, Typography} from '@mui/material';
import CardHeader from '@mui/material/CardHeader';

interface TextPageProps {
  title: string
}

export const ProcessPage: FunctionComponent<TextPageProps> = (props) => {
  const initialTitle = useRef('')
  const {title} = props;

  useEffect(() => {
    initialTitle.current = document.title
    document.title = title

    return () => {
      document.title = initialTitle.current
    }
  }, [])

  const styles = {
    bgInfoBox: {backgroundColor: 'aliceblue', marginTop: '16px', paddingBottom: '16px'},
    bgInfoBox2: {backgroundColor: 'white', marginTop: '16px', marginBottom: '8px', padding: '8px'},
  };

  return (
    <Container maxWidth="lg">
      <Stack direction="column" spacing={1} justifyContent="space-between">
        <Typography variant="h3" textAlign={'center'} sx={{mt: 6}}>Ablauf Bewerbungsprozess</Typography>
        <Typography variant="h6" textAlign={'center'}>
          Hier erhalten Sie umfassende Informationen zum Prozess der Bewerbung für die Grundstücksvergabe
        </Typography>
      </Stack>
      <Grid container spacing={2}>
        <Grid item lg={12}>
          <Card sx={styles.bgInfoBox} variant="outlined">
            <CardHeader title="Bewerbung für die Grundstücksvergabe"/>
            <CardContent>
              <p><strong>
                Für Grundstücke, bei denen das Vergabeverfahren ausgeschrieben ist, können Sie sich mit Ihrem geplanten Hochbauprojekt bewerben.
              </strong></p>
              <p><strong>
                Füllen Sie dazu unseren Bewerbungsbogen aus und laden die Unterlagen innerhalb der angegebenen
                Frist auf Ihrem Bewerberzugang der Vermarktungsplattform hoch.
                Ggfls. Können Sie die Unterlagen auch postalisch an uns senden (siehe nachfolgende Adresse).
              </strong></p>
              <p>
                In manchen Baublöcke werden sog. „Ankernutzer“ ausgewiesen.
                Auf diesen Grundstücken ist vorgesehen, dass neben dem eigenen Hochbauprojekt zusätzlich auch die
                Konzeption und Koordination der im Baublock anstehenden Querschnittsaufgaben zu übernehmen ist.
                Diese Grundstücke werden zuerst ausgeschrieben und vergeben. Sobald der Ankernutzer feststeht
                und das Konzept für die Querschnittsaufgaben feststeht, findet die Vergabe der restlichen Grundstücke des
                Baublocks für die sog. Anlieger statt. Die Ankerkonzeption wird dann ein Bestandteil der Bewerbung für die restlichen Hochbauprojekte.
              </p>
              <p>
                Sofern Sie Fragen haben, wenden Sie sich bitte an:<br/>
                Frau Eva Adam<br/>
                Telefon: +49 1234 5678<br/>
                E-Mail: e.adam@freiburg.de
              </p>
              <p>
                Sofern Sie die Bewerbungsunterlagen über die Bewerbungsplattform einreichen können,
                senden Sie uns Ihre Unterlagen (digital auf CD Rom oder USB-Stick sowie ausgedruckt mit 2 Ausfertigungen) an folgende Adresse:<br/>
                PG Dietenbach<br/>
                Fehrenbachallee 12<br/>
                12345 Freiburg
              </p>
            </CardContent>
          </Card>
        </Grid>
        <Grid item lg={6}>
          <Card sx={styles.bgInfoBox2}variant="outlined">
            <CardHeader title="Bewerbung für ein Hochbauprojekt"/>
            <CardContent>
              <p>
                Die Ausschreibung der Grundstücke zur Vergabe für ein Hochbauprojekt wird auf dem Vermarktungsportal Dietenbach
                der Stadt Freiburg sowie im Amtsblatt der Stadt Freiburg / Bundesanzeiger bekannt gegeben.
              </p>
              <p><strong>
                Für den ersten Vermarktungsabschnitt findet die Vergabe der
                Grundstücke für die Anliegerprojekte voraussichtlich ab 01.05. statt
              </strong></p>
              <p>
                Wenn Sie Interesse an einem Grundstück haben, um Ihr Hochbauprojekt zu verwirklichen,
                bitten wir Sie, die folgenden Unterlagen auszufüllen bzw. herunterzuladen und auszufüllen:
              </p>
              <ol>
                <li>Bewerberbogen</li>
                <li>Bewerbungsunterlagen für ein Hochbauprojekt</li>
                <li>Ankerkonzeption</li>
              </ol>
              <p>
                 Eine ausführliche Beschreibung des Verfahrens finden Sie unter „Verfahren zur Auswahl des Anliegerprojekts“
              </p>
              <p>
                Ihre Bewerbungsunterlagen laden Sie auf der Vermarktungsplattform unter Ihrem geschützten Bewerberzugang hoch.
              </p>
            </CardContent>
          </Card>
        </Grid>
        <Grid item lg={6}>
          <Card sx={styles.bgInfoBox2}variant="outlined">
            <CardHeader title="Bewerbung für ein Hochbauprojekt inklusive der gemeinschaftlich anstehenden Querschnittsaufgaben (Ankerprojekt)"/>
            <CardContent>
              <p>
                Die Ausschreibung der Grundstücke zur Vergabe für ein Hochbauprojekt
                inklusive der anstehend Querschnittsaufgaben wird auf dem Vermarktungsportal Dietenbach
                der Stadt Freiburg sowie im Amtsblatt der Stadt Freiburg / Bundesanzeiger bekannt gegeben.
              </p>
              <p>
                Der Anker bewirbt sich um ein Grundstück für sein eigenes Hochbauprojekt.
                Zusätzlich ist er verantwortlich für die im Baublock zu regelnden Querschnittsaufgaben
                und erstellt ein Konzept für die Organisation und Finanzierung der Gemeinschaftsaufgaben.
              </p>
              <p>
                <strong>
                  Für den ersten Vermarktungsabschnitt findet die Vergabe der Grundstücke für die Ankerprojekte voraussichtlich ab 01.01. statt
                </strong>
              </p>
              <p>
                Wenn Sie Interesse an einem der für Ankerprojekte ausgewiesenen Grundstücke haben, um Ihr Hochbauprojekt
                in Zusammenhang mit den Querschnittsaufgaben zu verwirklichen, bitten wir Sie, die folgenden Unterlagen auszufüllen:
              </p>
              <ol>
                <li>Bewerberbogen</li>
                <li>Bewerbungsunterlagen für ein Hochbauprojekt</li>
                <li>Bewerbung für Querschnittsaufgaben</li>
              </ol>
              <p>
                Eine ausführliche Beschreibung des Verfahrens finden Sie unter „Verfahren zur Auswahl des Ankerprojekts“
              </p>
              <p>
                Ihre Bewerbungsunterlagen laden Sie auf der Vermarktungsplattform unter Ihrem geschützten Bewerberzugang hoch.
              </p>
            </CardContent>
          </Card>
        </Grid>
      </Grid>


      <Stack direction="column" spacing={1} justifyContent="space-between">

      </Stack>
    </Container>
  )
}

export default ProcessPage

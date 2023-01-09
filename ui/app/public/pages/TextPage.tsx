import React, {FunctionComponent, useEffect, useRef} from 'react';
import {useQuery} from 'react-query';
import {Alert, Card, CardContent, CircularProgress, Stack} from '@mui/material';
import CardHeader from '@mui/material/CardHeader';
import { fetchText, TextName } from '@protected/pages/common/queries/texts';

interface TextPageProps {
  textName: TextName
  title: string
}

export const TextPage: FunctionComponent<TextPageProps> = (props) => {
  const initialTitle = useRef('')
  const {textName, title} = props;

  useEffect(() => {
    initialTitle.current = document.title
    document.title = title

    return () => {
      document.title = initialTitle.current
    }
  }, [])

  const query = useQuery(['texts', textName], () =>
    fetchText(textName),
  {
    refetchOnWindowFocus: false,
  })

  return (
    <Card elevation={0}>
      <CardHeader title={title}/>
      <CardContent>
        <Stack direction="column" spacing={1}>
          {query.isError && <Alert severity="error">Text {textName} konnte nicht geladen werden.</Alert>}
          {query.isSuccess && <div dangerouslySetInnerHTML={{__html: query.data}} />}
          {query.isLoading && <CircularProgress/>}
        </Stack>
      </CardContent>
    </Card>
  )
}

export default TextPage

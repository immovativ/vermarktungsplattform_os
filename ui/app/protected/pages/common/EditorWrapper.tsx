import React, {FunctionComponent} from 'react';
import {fetchText, TextName, updateText} from '@protected/pages/common/queries/texts';
import {useQuery} from 'react-query';
import {useBetterMutation} from '@common/hooks/useBetterMutationHook';
import CardHeader from '@mui/material/CardHeader';
import {
  Alert,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  Stack,
  Tooltip,
} from '@mui/material';
import {Save} from '@mui/icons-material';
import JoditEditor from 'jodit-react';
import {Config} from 'jodit/types/config';


interface EditorWrapperProps {
  textName: TextName
  title: string
}

function editorConfig(name: string): Partial<Config> {
  return {
    editorCssClass: `texts-editor-${name}`,
    buttons: [
      'undo', 'redo', '|',
      'bold', 'italic', 'underline', 'strikethrough', '|',
      'superscript', 'subscript', '|',
      'ul', 'ol', '|',
      'outdent', 'indent', '|',
      'font', 'fontsize', 'brush', 'paragraph', '|',
      'table', 'link', '|',
      'align', '|',
      'fullsize', 'source', '|',
      'selectall', 'cut', 'copy', 'paste', '|',
      'symbol', 'hr', 'eraser', '|',
      'print', 'about',
    ],

    style: {
      height: 500,
    },
  }
}

export const EditorWrapper: FunctionComponent<EditorWrapperProps> = React.memo((props) => {
  const {textName, title} = props;

  const query = useQuery(['texts', textName], () => fetchText(textName),
      {
        onSuccess: (text) => setValue(text),
        refetchOnWindowFocus: false,
      },
  );

  const [value, setValue] = React.useState<string | null>(null);

  const mutation = useBetterMutation(
      (value: string) => updateText(textName, value),
      {
        onSuccess: () => {
          query.refetch()
        },
      },
  )

  return (
    <Card>
      <CardHeader
        title={title}
        action={
          <Tooltip title={`${title} speichern`}>
            <IconButton onClick={() => value && mutation.mutate(value)}>
              <Save/>
            </IconButton>
          </Tooltip>
        }
      />
      <CardContent>
        <Stack direction="column" spacing={1}>
          <JoditEditor
            {...{id: `editor-${textName}`} as any}
            value={value || ''}
            config={editorConfig(textName)}
            onBlur={(value) => setValue(value)}
          />

          {query.isLoading ? <div><CircularProgress/></div> : null}
          {query.isError ? <Alert severity="error">Fehler beim Laden des {textName} - Texts</Alert> : null}
        </Stack>
      </CardContent>
    </Card>
  )
})

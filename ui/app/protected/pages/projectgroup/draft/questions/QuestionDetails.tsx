import { Chip, Stack } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Question } from '@protected/pages/common/questions/questions';
import React, {FunctionComponent} from 'react';

export const QuestionDetails: FunctionComponent<{question: Question}> = ({question})=> {
  switch (question.type) {
    case 'enumQuestion': {
      const {values} = question
      return <Box sx={{mt: 1}}>
        <Stack direction="row" spacing={1}>
          {values.slice(0, 3).map((v, i) => <Chip key={`${question.id}-chip-${i}`} label={v} />)}
          {values.length > 3 &&
          <Chip
            variant='outlined'
            label={`+${values.length-3} weitere`}
            sx={{borderStyle: 'dashed'}}
          />
          }
        </Stack>
      </Box>
    }
    case 'intRangeQuestion': {
      const {range} = question
      return <Stack direction="row" spacing={2} sx={{mt: 1}}>
        <Stack>
          <Typography variant="caption">Von</Typography>
          <Typography>{range.start}</Typography>
        </Stack>
        <Stack>
          <Typography variant="caption">Bis</Typography>
          <Typography>{range.endInclusive}</Typography>
        </Stack>
      </Stack>
    }
    case 'fileUploadQuestion': {
      return <Stack direction="row" spacing={2} sx={{mt: 1}}>
        <Typography variant="caption">Datei</Typography>
        <Typography variant="caption">{question?.attachmentMetadata?.name || '-'}</Typography>
      </Stack>
    }
    default: {
      return null
    }
  }
}

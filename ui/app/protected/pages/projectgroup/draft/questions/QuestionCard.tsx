import { ArrowDownward, ArrowUpward, Delete, Edit, MoreVert } from '@mui/icons-material';
import {
  Box,
  CardContent,
  Chip,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import Card from '@mui/material/Card';
import { Question, QuestionTypeTranslations } from '@protected/pages/common/questions/questions';
import React, { FunctionComponent } from 'react';
import { QuestionTypeIcon } from '../QuestionEdit';
import { QuestionDetails } from './QuestionDetails';

interface QuestionCardProps {
  question: Question
  moveUpEnabled: boolean
  moveDownEnabled: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onEdit: () => void
  onDelete: () => void
  readonly?: boolean
}

export const QuestionCard: FunctionComponent<QuestionCardProps> = (
    {question, onMoveDown, onMoveUp, moveDownEnabled, moveUpEnabled, onDelete, onEdit, readonly},
) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{
          p: 1, backgroundColor: '#f3f3f3', borderRadius: 2, display: 'flex',
          alignContent: 'center', color: 'primary.600', justifyContent: 'space-between',
        }}>
          <Box sx={{display: 'flex', alignItems: 'center'}}>
            <Box sx={{mr: 1, display: 'flex', alignItems: 'center'}}>
              {QuestionTypeIcon[question.type]}
            </Box>
            <Typography component='span' lineHeight={1} variant='overline'>
              {QuestionTypeTranslations[question.type].name}
            </Typography>
          </Box>
          {!readonly && <Box>
            <IconButton color="primary" disabled={!moveUpEnabled} size="small" onClick={() => onMoveUp && onMoveUp()}>
              <ArrowUpward fontSize='small'/>
            </IconButton>
            <IconButton color="primary" disabled={!moveDownEnabled} size="small"
              onClick={() => onMoveDown && onMoveDown()}
            >
              <ArrowDownward fontSize='small'/>
            </IconButton>
            <IconButton color="primary" component="span" size="small" onClick={handleClick}>
              <MoreVert fontSize='small'/>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              anchorOrigin={{horizontal: 'right', vertical: 'bottom'}}
              transformOrigin={{horizontal: 'right', vertical: 'top'}}
            >
              <MenuItem onClick={() => {
                onEdit()
                handleClose()
              }}>
                <ListItemIcon>
                  <Edit fontSize="small" />
                </ListItemIcon>
                <ListItemText>Bearbeiten</ListItemText>
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => {
                onDelete()
                handleClose()
              }}>
                <ListItemIcon>
                  <Delete fontSize="small" />
                </ListItemIcon>
                <ListItemText>Löschen</ListItemText>
              </MenuItem>
            </Menu>
          </Box>}
        </Box>
        <>
          <Box sx={{mt: 2}}>
            <Typography variant='subtitle1' fontWeight={500}>
              {question.text}&nbsp;<Chip color='info' size='small' variant='outlined' label={question.required ? 'Pflichtfrage' : 'Optional'} />
            </Typography>
            <Typography variant='body2'>
              {question.description}
            </Typography>
          </Box>
          <Box>
            <QuestionDetails
              question={question}
            />
          </Box>
        </>
      </CardContent>
    </Card>

  )
}

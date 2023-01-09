import { ExpandLess, ExpandMore } from '@mui/icons-material'
import { Box, Button, Card, CardActionArea, ClickAwayListener, List, ListItem, ListItemButton, Popper, Stack, Typography } from '@mui/material'
import React, { FC, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminCandidatureView } from '../queries/candidature'
import { CandidatureWithUser } from '../queries/concept-assignment'
import { EditableRating } from './EditableRating'

interface CandidatePickerProps {
  activeCandidate: string,
  candidates: CandidatureWithUser[]
  onSelectCandidate?: (c: CandidatureWithUser) => void
  updateFromMutation: (ca: AdminCandidatureView) => void
}

interface CandidateItemProps {
  active: boolean
  candidate: CandidatureWithUser
  onSelectCandidate?: (c: CandidatureWithUser) => void

  updateFromMutation: (ca: AdminCandidatureView) => void
}

const CandidateItem: FC<CandidateItemProps> = ({active, candidate, onSelectCandidate, updateFromMutation}) => {
  const navigate = useNavigate()
  if (active) {
    const u = candidate.user
    return (
      <ListItem sx={{bgcolor: (theme) => theme.palette.grey[100]}}>
        <Box>
          <Typography variant='body1'> {u.firstName} {u.lastName}</Typography>
          {u.company && <Typography variant='body1'> {u.company}</Typography>}
          <Stack direction='column' spacing={1}>
            <EditableRating rating={candidate.rating} candidatureId={candidate.candidature.id} onEdit={updateFromMutation} />
            <Button
              sx={{mt: 1}}
              size="small"
              onClick={() => navigate(`profile/${candidate.candidature.userId}`)}
              variant="contained"
            >Zum Profil</Button>
          </Stack>
        </Box>
      </ListItem>
    )
  } else {
    return <ListItemButton
      onClick={() => onSelectCandidate && onSelectCandidate(candidate)}
    >
      <Typography variant="body2">{candidate.user.company || `${candidate.user.firstName} ${candidate.user.lastName}`}</Typography>
    </ListItemButton>
  }
}

export const CandidatePicker: FC<CandidatePickerProps> = ({activeCandidate, candidates, onSelectCandidate, updateFromMutation}) => {
  const popperRef = useRef<HTMLDivElement>(null)
  const [popperOpen, setPopperOpen] = useState(false)
  const active = candidates.find((i) => i.candidature.id === activeCandidate)

  useEffect(() => {
    setPopperOpen(false)
  }, [activeCandidate])

  if (active === undefined) {
    console.error(`No candidature for provided id ${activeCandidate} was found`)
    return null
  }

  return (
    <>
      <Popper
        anchorEl={popperRef.current}
        open={popperOpen}
        keepMounted={false}
        placement="top-start"
        sx={{zIndex: 1300}}
      >
        <ClickAwayListener onClickAway={() => setPopperOpen(false)}>
          <Card variant="outlined">
            <List sx={{p: 1}}>
              {candidates.map((i) =>
                <CandidateItem
                  key={i.candidature.id}
                  active={i.candidature.id === activeCandidate}
                  candidate={i}
                  onSelectCandidate={onSelectCandidate}

                  updateFromMutation={updateFromMutation}
                />)
              }
            </List>
          </Card>
        </ClickAwayListener>
      </Popper>
      <Card ref={popperRef} onClick={() => setPopperOpen(true)} sx={{minWidth: '200px'}}>
        <CardActionArea>
          <Stack direction="row" sx={{p: 1, pr: 1.5}} alignItems="center" spacing={1}>
            {popperOpen ? <ExpandMore /> : <ExpandLess/>}
            <Stack direction="column">
              <Typography variant="caption">Bewerbung von</Typography>
              <Typography variant="body2" color="primary" fontWeight={500}>
                {active.user.company || `${active.user.firstName} ${active.user.lastName}`}
              </Typography>
            </Stack>
          </Stack>
        </CardActionArea>
      </Card>
    </>
  )
}

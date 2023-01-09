import { ButtonLink } from '@common/component/ButtonLink'
import { Alert, Button, Stack } from '@mui/material'
import { ConceptAssignmentDetail as ConceptAssignmentDetailModel } from '@public/models/ConceptAssignmentDetail'
import React, {FC, RefObject, useMemo, useRef } from 'react'
import { useEffect } from 'react'
import { ConceptAssignmentDetailCard } from './ConceptAssignmentDetailCard'

interface ConceptAssignmentListProps {
  assignments: ConceptAssignmentDetailModel[]
  activeAssignment?: ConceptAssignmentDetailModel
  onSelectAssignment?: (assignment: ConceptAssignmentDetailModel) => void
  disableLocationPreview?: boolean
}


export const ConceptAssignmentList: FC<ConceptAssignmentListProps> = ({assignments, activeAssignment, disableLocationPreview, onSelectAssignment}) => {
  const stackRef = useRef<HTMLDivElement>()

  const refs = useMemo(() => assignments.reduce((acc, val) => ({
    ...acc,
    [val.id]: React.createRef<HTMLDivElement>(),
  }), {} as Record<string, RefObject<HTMLDivElement>>),
  [JSON.stringify(assignments)],
  )

  useEffect(() => {
    if (!activeAssignment || !stackRef.current || !refs[activeAssignment.id]) {
      return
    }

    refs[activeAssignment.id].current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }, [JSON.stringify(activeAssignment)])

  return (
    <Stack ref={stackRef} direction='column' spacing={1}>
      {assignments.length < 1 && <Alert severity='info' variant='outlined'>Es sind aktuell keine Grundstücksvergaben offen.</Alert> }
      {assignments.map( (i) =>
        <ConceptAssignmentDetailCard
          ref={refs[i.id]}
          key={i.id}
          assignment={i}
          active={activeAssignment?.id === i.id}
          locationPreview={!!disableLocationPreview == false}
          footer={
            <>
              <ButtonLink variant="contained" href={`/vergabe/${i.id}`}>Ansehen</ButtonLink>
              {activeAssignment?.id !== i.id && <Button onClick={() => onSelectAssignment && onSelectAssignment(i)}>
                Auf Karte anzeigen
              </Button>}
            </>
          }
        />,
      )}
    </Stack>
  )
}

export default ConceptAssignmentList

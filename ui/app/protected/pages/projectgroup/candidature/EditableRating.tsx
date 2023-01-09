import React, {FunctionComponent} from 'react';
import {AdminCandidatureView, upsertRating} from '@protected/pages/projectgroup/queries/candidature';
import { useBetterMutation } from '@common/hooks/useBetterMutationHook';
import { Rating } from '@mui/material';

interface Props {
    candidatureId: string
    rating: number | null
    onEdit: (data: AdminCandidatureView) => void
}

export const EditableRating: FunctionComponent<Props> = (props) => {
  const rate = useBetterMutation((rating: number | null) => upsertRating(props.candidatureId, {rating}),
      {
        onSuccess: (r) => {
          props.onEdit(r.data)
        },
      },
  )
  return <Rating
    value={props.rating}
    readOnly={rate.isLoading}
    onChange={(event, newValue) => {
      rate.mutate(newValue)
    }}
  />
}

import { VcsMap } from '@vcmap/core'
import React from 'react'

export const MapContext = React.createContext<VcsMap>(new VcsMap({}))

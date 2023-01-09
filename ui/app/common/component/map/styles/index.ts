import {VectorStyleItem} from '@vcmap/core';
import {PublicStates} from '@public/models/ConceptAssignmentDetail';
import {ConceptAssignmentState} from '@protected/pages/projectgroup/queries/concept-assignment';

export const PublicStateStyles: { [key in PublicStates]: VectorStyleItem } = {
  'ACTIVE': new VectorStyleItem({
    stroke: {
      color: 'rgb(120, 255, 0)',
      width: 2,
    },
    fill: {
      color: 'rgb(120, 255, 0, 0.8)',
    },
    label: 'Verfügbar',
    text: {},
  }),
  'REVIEW': new VectorStyleItem({
    stroke: {
      color: 'rgb(242, 175, 75)',
      width: 2,
    },
    fill: {
      color: 'rgba(242, 175, 75, 0.8)',
    },
    label: 'In Prüfung',
    text: {},
  }),
  'FINISHED': new VectorStyleItem({
    stroke: {
      color: 'rgba(205, 10, 10, 0.2)',
      width: 2,
    },
    fill: {
      color: 'rgba(240, 100, 100, 0.3)',
    },
    label: 'Vergeben',
    text: {},
  }),
}

export const vectorLayerBaseStyle = new VectorStyleItem({
  stroke: {
    color: 'rgba(199,195,195, 1)',
    width: 2,
  },
  fill: {
    color: 'rgba(199,195,195,0.8)',
  },
})

export const vectorLayerDisabledStyle = new VectorStyleItem({
  fill: {
    color: 'rgba(0,0,0,0.1)',
  },
  stroke: {
    color: 'rgba(0,0,0,0.2)',
  },
})

export const vectorLayerSelectStyle = new VectorStyleItem({
  stroke: {
    color: 'rgba(185, 10, 0, 1)',
    width: 4,
  },
  fill: {
    color: 'rgb(120, 255, 0, 0.8)',
  },
})

export const StateStylesWithLabel: { [key in ConceptAssignmentState]: VectorStyleItem } = {
  'DRAFT': new VectorStyleItem({
    stroke: {
      color: 'rgba(0,225,255,0.2)',
      width: 2,
    },
    fill: {
      color: 'rgba(0,225,255,0.8)',
    },
    label: 'Entwurf',
    text: {},
  }),
  'WAITING': new VectorStyleItem({
    stroke: {
      color: 'rgba(221,255,0,0.2)',
      width: 2,
    },
    fill: {
      color: 'rgba(221,255,0,0.8)',
    },
    label: 'In Vorbereitung',
    text: {},
  }),
  'ACTIVE': new VectorStyleItem({
    stroke: {
      color: 'rgb(120, 255, 0, 0.2)',
      width: 2,
    },
    fill: {
      color: 'rgb(120, 255, 0, 0.8)',
    },
    label: 'Aktiv',
    text: {},
  }),
  'REVIEW': new VectorStyleItem({
    stroke: {
      color: 'rgb(242, 175, 75, 0.2)',
      width: 2,
    },
    fill: {
      color: 'rgba(242, 175, 75, 0.8)',
    },
    label: 'In Prüfung',
    text: {},
  }),
  'FINISHED': new VectorStyleItem({
    stroke: {
      color: 'rgba(205, 10, 10, 0.2)',
      width: 2,
    },
    fill: {
      color: 'rgba(240, 100, 100, 0.3)',
    },
    label: 'Vergeben',
    text: {},
  }),
  'ABORTED': new VectorStyleItem({
    stroke: {
      color: 'rgba(255,0,195,0.2)',
      width: 2,
    },
    fill: {
      color: 'rgba(255,0,195,0.8)',
    },
    label: 'Abgebrochen',
    text: {},
  }),
}

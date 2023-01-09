export type AnswerType = 'stringAnswer'
  | 'intAnswer'
  | 'rasterQuestionIntAnswer'
  | 'targetActualAnswer'

export type Answer = StringAnswer | IntAnswer | RasterQuestionIntAnswer | TargetActualAnswer

export interface BaseAnswer {
  type: AnswerType
  questionId: string
  value: any
}

export interface StringAnswer extends BaseAnswer {
  type: 'stringAnswer'
  value: string
}

export interface IntAnswer extends BaseAnswer {
  type: 'intAnswer'
  value: number
}

export interface RasterQuestionIntAnswer extends BaseAnswer {
  type: 'rasterQuestionIntAnswer'
  value: { [column: number]: { [row: number]: number | null } }
}

export interface TargetActualAnswer extends BaseAnswer {
  type: 'targetActualAnswer'
  value: {
    target: (number | null)[]
    actual: (number | null)[]
  }
}

import {AttachmentMetadata} from '@protected/pages/projectgroup/queries/concept-assignment';

export interface Range {
  start: number
  endInclusive: number
}

export const QuestionTypes = [
  'intRangeQuestion',
  'percentQuestion',
  'enumQuestion',
  'freeTextQuestion',
  'fileUploadQuestion',
] as const

export type QuestionTypes = typeof QuestionTypes
export type QuestionType = QuestionTypes[number]

export const QuestionTypeTranslations: Record<QuestionType, { name: string, description: string }> = {
  intRangeQuestion: {
    name: 'Schulnoten-Frage',
    description: 'Antworten in einem Bereich von Zahlen in 1er - Schritten',
  },
  percentQuestion: {
    name: 'Prozent-Frage',
    description: 'Anworten in einem Bereich von 0% - 100% in 1% - Schritten',
  },
  enumQuestion: {
    name: 'Enum-Frage',
    description: 'Anworten aus einer vordefinierten Liste',
  },
  freeTextQuestion: {
    name: 'Freitext-Frage',
    description: `Antworten in einem Freitext-Feld.`,
  },
  fileUploadQuestion: {
    name: 'Datei-Upload-Frage',
    description: `Antworten in einem Datei-Upload-Feld.`,
  },
}


export interface BaseQuestion {
  type: QuestionType
  id: string
  text: string
  description: string | null
  required: boolean
}

export interface IntRangeQuestion extends BaseQuestion {
  type: 'intRangeQuestion'
  range: Range
}

export interface PercentQuestion extends BaseQuestion {
  type: 'percentQuestion'
}

export interface EnumQuestion extends BaseQuestion {
  type: 'enumQuestion'
  values: string[]
}

export interface FreeTextQuestion extends BaseQuestion {
  type: 'freeTextQuestion'
}

export interface FileUploadQuestion extends BaseQuestion {
  type: 'fileUploadQuestion'
  attachmentMetadata: AttachmentMetadata | undefined
}

export type Question = IntRangeQuestion
  | PercentQuestion
  | EnumQuestion
  | FreeTextQuestion
  | FileUploadQuestion

export const addQuestion = (
    questions: readonly Question[],
    question: Question,
) => {
  return [...questions, question]
}

export const replaceQuestion = (
    questions: readonly Question[],
    question: Question,
) => {
  return questions.map((q) => {
    if (q.id === question.id) {
      return question
    } else {
      return q
    }
  })
}

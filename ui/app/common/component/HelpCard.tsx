import React, {FunctionComponent} from 'react';
import ReactMarkdown from 'react-markdown';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkToc from 'remark-toc';
import remarkSlug from 'remark-slug';
import {Card} from '@mui/material';

interface HelpCardProps {
  text: string
}

export const HelpCard: FunctionComponent<HelpCardProps> = (props) => {
  const {text} = props;

  return (
    <Card
      sx={{p: 2}}
      variant="outlined">
      <ReactMarkdown
        remarkPlugins={[remarkParse, remarkGfm, [remarkToc, {heading: 'Inhaltsverzeichnis', tight: true}], remarkSlug]}
      >
        {text}
      </ReactMarkdown>
    </Card>
  )
}

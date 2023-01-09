import {Params} from 'react-router-dom';

export interface BreadcrumbLinks {
  root: string
  others: string
}

export interface BreadcrumbLinkGenerator {
  links: (params: Params) => BreadcrumbLinks
}

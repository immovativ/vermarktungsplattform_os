import { Link as MuiLink, Typography } from '@mui/material';
import React, { FC, ReactChild, SetStateAction, useContext, useEffect, useMemo, useState } from 'react'
import { Dispatch } from 'react';
import { Link, matchRoutes, useLocation } from 'react-router-dom'
import { MenuEntry } from '../MainMenu'

export type BreadcrumbConfigItemWithoutLink = {
  name: string | null
  link?: string
}

export type BreadcrumbConfigItemWithLink = {
  name: string | null
  link: string
}

export type BreadcrumbConfigItem = BreadcrumbConfigItemWithLink | BreadcrumbConfigItemWithoutLink
export type BreadcrumbConfigArray = [...BreadcrumbConfigItemWithLink[], BreadcrumbConfigItemWithoutLink] | BreadcrumbConfigItemWithLink[]
export type BreadcrumbConfig = BreadcrumbConfigArray | BreadcrumbConfigItem | BreadcrumbConfigItemWithLink

type BreadcrumbContextConfig = (BreadcrumbConfigItem | null)[]
type ProvideBreadcrumbContextValue = [
  Record<string, BreadcrumbContextConfig>,
  Dispatch<SetStateAction<Record<string, BreadcrumbContextConfig>>>
]

export const BreadcrumbContext = React.createContext<MenuEntry[]>([])
export const ProvideBreadcrumbContext = React.createContext<ProvideBreadcrumbContextValue>([{}, () => {
  null
}])

export const ProvidedBreadcrumbWrapper: FC = (props) => {
  const [state, setState] = useState<Record<string, BreadcrumbContextConfig>>({})
  const memoizedState: ProvideBreadcrumbContextValue = useMemo(
      () => [state, setState],
      [JSON.stringify(state), setState])

  return <ProvideBreadcrumbContext.Provider value={memoizedState}>
    {props.children}
  </ProvideBreadcrumbContext.Provider>
}


export const useProvideBreadcrumb = (key: string, config: BreadcrumbConfig) => {
  const [_, setBreadcrumbValue] = useContext(ProvideBreadcrumbContext)

  useEffect(() => {
    if (Array.isArray(config)) {
      const transformedConfig = config.map((i) => {
        if (i.name === null) {
          return null
        } else {
          return {...i}
        }
      })
      setBreadcrumbValue((prev) => ({
        ...prev,
        [key]: transformedConfig,
      }))
    } else {
      setBreadcrumbValue((prev) => ({
        ...prev,
        [key]: [config],
      }))
    }

    return () => {
      setBreadcrumbValue((prev) => {
        const newMap = {...prev}
        delete newMap[key]
        return newMap
      })
    }
  }, [key, config])
}


export const useBreadcrumb = (): (ReactChild | null)[] => {
  const [providedBreadcrumbs, _] = useContext(ProvideBreadcrumbContext)
  const routes = useContext(BreadcrumbContext)
  const location = useLocation()
  const activeRoutes = matchRoutes(routes, location)

  return activeRoutes?.filter((i) =>
    !i.route.index,
  ).flatMap((i) => {
    const route = (i.route as MenuEntry)
    if (route.breadcrumbKey) {
      const breadcrumbConfig = providedBreadcrumbs[route.breadcrumbKey]

      if (breadcrumbConfig === undefined) {
        return [null]
      }

      return breadcrumbConfig.map((item) => {
        if (!item) return null

        return {
          pathname: item.link ? item.link : i.pathname,
          component: <>{item.name}</> as ReactChild,
        }
      })
    } else {
      return [{
        pathname: i.pathname,
        component: route.text,
      }]
    }
  }).map((i) => {
    if (i === null) {
      return null
    }

    if (i.pathname === location.pathname) {
      return <Typography key={i.pathname}>{i.component}</Typography>
    } else {
      return <MuiLink key={i.pathname} component={Link} to={i.pathname}>
        {i.component}
      </MuiLink>
    }
  }) ?? []
}

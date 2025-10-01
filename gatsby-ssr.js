import React from 'react'
import { StaticRouter } from 'react-router-dom/server'

export const wrapRootElement = ({ element, location }) => {
  return (
    <StaticRouter location={location}>
      {element}
    </StaticRouter>
  )
}
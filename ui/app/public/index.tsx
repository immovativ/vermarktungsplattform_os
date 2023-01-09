import React from 'react'
import ReactDOMClient from 'react-dom/client'
import {App} from './App'

const root = ReactDOMClient.createRoot(
  document.getElementById('app') as Element,
)

root.render(<App />)

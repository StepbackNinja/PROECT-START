import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

const cosmos = new URLSearchParams(window.location.search).get('design') === 'cosmos'
createRoot(document.getElementById('root')!).render(<React.StrictMode><App cosmos={cosmos} /></React.StrictMode>)

import React from 'react'
import ReactDOM from 'react-dom/client'
import AppDemo from './AppDemo.jsx'
import './index.css'

// Remover loading screen
const loading = document.getElementById('loading')
if (loading) {
  loading.style.opacity = '0'
  setTimeout(() => {
    if (loading.parentNode) {
      loading.parentNode.removeChild(loading)
    }
  }, 500)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppDemo />
  </React.StrictMode>,
)
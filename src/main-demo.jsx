import React from 'react'
import ReactDOM from 'react-dom/client'
import SpinWheelDemo from './components/SpinWheelDemo'
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
    <SpinWheelDemo />
  </React.StrictMode>,
)
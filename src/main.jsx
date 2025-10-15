import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Remover loading screen
const loading = document.getElementById('loading')
if (loading) {
  loading.style.opacity = '0'
  loading.style.transition = 'opacity 0.5s ease'
  setTimeout(() => {
    if (loading.parentNode) {
      loading.parentNode.removeChild(loading)
    }
  }, 500)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
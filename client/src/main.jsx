import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import SiteIntro from './components/SiteIntro.jsx'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {window.location.pathname === '/' && <SiteIntro />}
    <div className="site-app">
      <App />
    </div>
  </React.StrictMode>,
)

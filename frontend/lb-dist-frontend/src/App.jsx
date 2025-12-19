
import { useState } from 'react'
import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'; 

import LandingPage from './components/LandingPage'; 

function App() {
  return (
    <BrowserRouter> {/*Router wraps the entire app */}
			<header>
        {/* navigation? */}
			</header>      
      <LandingPage /> 
		</BrowserRouter>
  )
}

export default App
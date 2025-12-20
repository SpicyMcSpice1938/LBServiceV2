
import { useState } from 'react'
import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'; 

import LandingPage from './components/LandingPage'; 

function App() {
  return (
    <BrowserRouter> 
			<header>
        
			</header>      
      <LandingPage /> 
		</BrowserRouter>
  )
}

export default App
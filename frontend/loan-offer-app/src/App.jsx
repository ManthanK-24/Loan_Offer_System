import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import LoanOfferForm from './components/LoanOfferform'
import FindLenders from './components/FindLenders'

function App() {
  const [count, setCount] = useState(0)

  return (
   <FindLenders></FindLenders>
    
  )
}

export default App

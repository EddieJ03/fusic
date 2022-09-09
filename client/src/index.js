import React from 'react'
import ReactDOM from 'react-dom'
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';
import './index.css'
import App from './App'

ReactDOM.render(
  <React.StrictMode>
    <>
      <ToastContainer />
      <App />
    </>
  </React.StrictMode>,
  document.getElementById('root')
)
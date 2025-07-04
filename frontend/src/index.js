import React from 'react'
import ReactDOM from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import App from './App'
import { PathContextProvider } from './context/path'
import { AuthContextProvider } from './context/auth'
import { UserContextProvider } from './context/user'
import { TasksContextProvider } from './context/task'
import { NotificationProvider } from './context/notification'
import { BrowserRouter } from 'react-router-dom'
import { disableReactDevTools } from '@fvilers/disable-react-devtools'

if (process.env.NODE_ENV === 'production') disableReactDevTools()

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <PathContextProvider>
        <AuthContextProvider>
          <TasksContextProvider>
            <UserContextProvider>
              <NotificationProvider>
                <App />
              </NotificationProvider>
            </UserContextProvider>
          </TasksContextProvider>
        </AuthContextProvider>
      </PathContextProvider>
    </BrowserRouter>
  </React.StrictMode>
)
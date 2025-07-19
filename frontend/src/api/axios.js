// import axios from 'axios' 

// export default axios.create({
//     baseURL: process.env.REACT_APP_API_URL, 
//     headers: { 'Content-Type': 'application/json' },
//     withCredentials: true
// }) 

// export const axiosPrivate = axios.create({
//     baseURL: process.env.REACT_APP_API_URL,
//     headers: { 'Content-Type': 'application/json' },
//     withCredentials: true
// }) 

// export const axiosPublic = axios.create({
//     baseURL: process.env.REACT_APP_API_URL,
//     headers: { 'Content-Type': 'application/json' }
// }) 

import axios from 'axios' 

const NGROK_HEADER = { 'ngrok-skip-browser-warning': '1' }

export default axios.create({
    baseURL: process.env.REACT_APP_API_URL, 
    headers: { 
        'Content-Type': 'application/json',
        ...NGROK_HEADER
    },
    withCredentials: true
}) 

export const axiosPrivate = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    headers: { 
        'Content-Type': 'application/json',
        ...NGROK_HEADER
    },
    withCredentials: true
}) 

export const axiosPublic = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    headers: { 
        'Content-Type': 'application/json',
        ...NGROK_HEADER
    }
}) 

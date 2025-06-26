import { createContext, useReducer, useState, useContext } from 'react'

export const UserContext = createContext() 

export const userReducer = (state, action) => {
    switch (action.type) {
        case 'SET_USER':
            return { users: action.payload }
        case 'CREATE_USER':
            return { users: [action.payload, ...state.users] }
        case 'UPDATE_USER':
            return { users: action.payload }
        case 'DELETE_USER':
            return { users: state.users.filter(u => u._id !== action.payload._id) }
        default:
            return state
    }
}

export const UserContextProvider = ({children}) => {
    const [state, dispatch] = useReducer(userReducer, { users: null })
    const [targetUser, setTargetUser] = useState()
    return (<UserContext.Provider value={{ ...state, dispatch, targetUser, setTargetUser}}>{ children }</UserContext.Provider>)
}

export const useUserContext = () => {
    const context = useContext(UserContext)
    if(!context) throw Error('useUserContext must be used inside an AuthContextProvider')
    return context
}
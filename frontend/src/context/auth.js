import { createContext, useReducer, useContext } from "react"

export const AuthContext = createContext()

export const authReducer = (state, action) => {
    switch (action.type) {
        case 'LOGIN':
            return { auth: action.payload }
        case 'LOGOUT':
            return { auth: null }
        default:
            return state
    }
}

export const AuthContextProvider = ({children}) => {
    // Try to restore from localStorage
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('accessToken');
    const initialAuth = storedUser && storedToken
      ? { auth: { ...JSON.parse(storedUser), accessToken: storedToken } }
      : { auth: null };
    const [state, dispatch] = useReducer(authReducer, initialAuth);
    return (<AuthContext.Provider value={{ ...state, dispatch }}>{ children }</AuthContext.Provider>)
}

export const useAuthContext = () => {
    const context = useContext(AuthContext)
    if(!context) throw Error('useAuthContext must be used inside an AuthContextProvider')
    return context
}
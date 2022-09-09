import React, { createContext, useReducer } from 'react';
import AppReducer from './AppReducer';

// Initial state
const initialState = {
  user: null,
  socket: null,
  clickedUser: null,
}

// Create context
export const GlobalContext = createContext(initialState);

// Provider component
export const GlobalProvider = ({ children }) => {
  const [state, dispatch] = useReducer(AppReducer, initialState);

  // Actions
  function setUser(data) {
    dispatch({
        type: 'SET_USER',
        payload: data
    });
  }

  function addMatch(match) {
    dispatch({
      type: 'ADD_MATCH',
      payload: {user_id: match}
    })
  }

  function addSwipedLeft(match) {
    dispatch({
      type: 'ADD_SWIPED_LEFT',
      payload: { user_id: match }
    })
  }

  function addSwipedRight(match) {
    dispatch({
      type: 'ADD_SWIPED_RIGHT',
      payload: { user_id: match }
    })
  }

  function setSocket(socket) {
    dispatch({
      type: 'SET_SOCKET',
      payload: socket
    })
  }

  function setClickedUser(user) {
    dispatch({
      type: 'SET_CLICKED_USER',
      payload: user
    })
  }

  return (<GlobalContext.Provider value={{
    user: state.user,
    socket: state.socket,
    clickedUser: state.clickedUser,
    setUser,
    addMatch,
    setSocket,
    setClickedUser,
    addSwipedLeft,
    addSwipedRight
  }}>
    {children}
  </GlobalContext.Provider>);
}
export default (state, action) => {
    switch(action.type) {
      case 'SET_USER':
        return {
          ...state,
          user: action.payload
        }
      case 'ADD_MATCH':
        return {
          ...state,
          user: {
            ...state.user,
            matches: [...state.user.matches, action.payload]
          }
        } 
      case 'ADD_SWIPED_RIGHT':
        return {
          ...state,
          user: {
            ...state.user,
            swiped_right: [...state.user.swiped_right, action.payload]
          }
        } 
      case 'ADD_SWIPED_LEFT':
        return {
          ...state,
          user: {
            ...state.user,
            swiped_left: [...state.user.swiped_left, action.payload]
          }
        }     
      case 'SET_SOCKET':
        return {
          ...state,
          socket: action.payload
        }
      case 'SET_CLICKED_USER':
        return {
          ...state,
          clickedUser: action.payload
        }
      default:
        return state;
    }
}
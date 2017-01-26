import { browserHistory } from 'react-router';

export const SESSION_REQUEST = 'SESSION_REQUEST';
export const SESSION_SUCCESS = 'SESSION_SUCCESS';
export const SESSION_UNAUTHORISED = 'SESSION_UNAUTHORISED';
export const SESSION_FAILURE = 'SESSION_FAILURE';

const sessionRequest = () => {
  return {
    type: SESSION_REQUEST,
  };
};

const sessionSuccess = (response) => {
  return {
    type: SESSION_SUCCESS,
    response
  };
};

const sessionFailure = () => {
  return {
    type: SESSION_FAILURE
  };
};

const sessionUnauthorised = () => {
  return {
    type: SESSION_UNAUTHORISED
  };
};

export const performSession = ({ storeId }) => async (dispatch, getState) => {
  dispatch(sessionRequest());
  try {
    const refreshToken = getState().refreshToken;
    const response = await fetch('/api/v1/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer: ${refreshToken}`
      }
    });
    if (response.status === 401) {
      dispatch(sessionUnauthorised());
      browserHistory.push(`/`);
      return;
    }
    const json = await response.json();
    if (json.error) {
      throw new Error(json.error.message);
    }
    const session = json.response;
    dispatch(sessionSuccess(session));
  }
  catch (e) {
    dispatch(sessionFailure());
    browserHistory.push(`/error`);
  }
};

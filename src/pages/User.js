import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAxiosPrivate } from '../contexts/AxiosPrivate';
import { useDispatch } from 'react-redux';
import { setTitle } from '../actions/titleActions';

const User = () => {
  const auth = useAuth();
  const axiosPrivate = useAxiosPrivate();
  const dispatch = useDispatch();

  useEffect(() => {
    // ...
  }, [auth, axiosPrivate, dispatch, setTitle]);

  return (
    // ... existing code ...
  );
};

export default User; 
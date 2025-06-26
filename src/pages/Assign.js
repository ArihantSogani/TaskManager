import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAxiosPrivate } from '../contexts/AxiosPrivateContext';

const Assign = () => {
  const { auth } = useAuth();
  const { axiosPrivate } = useAxiosPrivate();
  const { id, setAssignedUser, setTitle } = useAuth();

  useEffect(() => {
    // ...
  }, [auth, axiosPrivate, id, setAssignedUser, setTitle]);

  return (
    // ... existing code ...
  );
};

export default Assign; 
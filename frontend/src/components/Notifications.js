import { useEffect } from 'react';
import { useAuthContext } from '../hooks/useAuthContext';
import { socket } from '../socket';
import { toast } from 'react-toastify';
import { useNotificationContext } from '../context/notification';

// Helper function for browser notifications
function showDesktopNotification(title, message) {
  // --- Start of Desktop Notification Debug ---
  console.log('--- Desktop Notification Debug ---');
  console.log('1. showDesktopNotification called with:', { title, message });
  console.log('2. Current Notification.permission:', Notification.permission);

  if (Notification.permission === 'granted') {
    console.log('3. Permission is granted. Creating new Notification().');
    new Notification(title, {
      body: message,
      icon: '/favicon.ico',
    });
    console.log('4. Notification should be visible now.');
  } else {
    console.log('3. Permission is NOT granted.');
  }
  // --- End of Desktop Notification Debug ---
}

const Notifications = () => {
  const { auth } = useAuthContext();
  const { addNotification } = useNotificationContext();

  useEffect(() => {
    // This component now mounts immediately.
    // We will handle connection and listeners inside the next useEffect.
    
    // Ensure we ask for permission as soon as the app loads.
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }

    // Define socket event handlers
    const onNotification = (data) => {
      console.log('Received "notification" event:', data);
      const message = data?.data?.message || 'You have a new notification.';
      toast.info(message);
      showDesktopNotification('New Notification', message);
      addNotification({
        id: Date.now() + Math.random(),
        message: message,
        time: new Date().toLocaleTimeString(),
        read: false,
      });
    };

    const onTaskUpdate = (data) => {
      // --- Start of Task Update Debug ---
      console.log('--- Task Update Debug ---');
      console.log('1. Received "taskUpdate" event. Raw data:', data);

      if (!data || !data.data || !data.data.message) {
        console.log('2. The data object is missing the expected "data.message" property.');
      }

      const message = data?.data?.message || 'A task was updated (default message).';
      console.log('3. The final message is:', `"${message}"`);
      // --- End of Task Update Debug ---

      toast.info(message);
      showDesktopNotification('Task Update', message);
      addNotification({
        id: Date.now() + Math.random(),
        message: message,
        time: new Date().toLocaleTimeString(),
        read: false,
      });
    };

    const onTaskComment = (data) => {
        console.log('Received "taskComment" event:', data);
        const message = data?.data?.message || 'A new comment was posted.';
        toast.info(message);
        showDesktopNotification('New Comment', message);
        addNotification({
          id: Date.now() + Math.random(),
          message: message,
          time: new Date().toLocaleTimeString(),
          read: false,
        });
      };

    // Add listeners
    socket.on('notification', onNotification);
    socket.on('taskUpdate', onTaskUpdate);
    socket.on('taskComment', onTaskComment);

    return () => {
      // Cleanup: remove listeners when the component unmounts
      socket.off('notification', onNotification);
      socket.off('taskUpdate', onTaskUpdate);
      socket.off('taskComment', onTaskComment);
    };
  }, [addNotification]);


  useEffect(() => {
    // This effect handles the socket connection based on auth state.
    if (auth?._id) {
      // If we have an authenticated user
      if (!socket.connected) {
        // And the socket is not already connected, then connect.
        socket.auth = { userId: auth._id };
        socket.connect();
        console.log(`Socket connecting with user ID: ${auth._id}`);
      }
    } else if (socket.connected) {
      // If we do not have an authenticated user but the socket is connected, disconnect.
      socket.disconnect();
      console.log('User logged out. Socket disconnected.');
    }

    const onConnect = () => {
        console.log('Socket connected successfully! SID:', socket.id);
        // The backend automatically joins the room with the user ID on connection.
    }

    const onDisconnect = () => {
        console.log('Socket disconnected.');
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
    }
  }, [auth]);


  // This component does not render anything itself.
  return null;
};

export default Notifications;
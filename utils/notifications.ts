import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/FirebaseConfig';

export const sendNotification = async (
  userId: string,
  title: string,
  message: string,
  type: 'task' | 'announcement' | 'calendar' | 'system' | 'other' = 'other',
  actionId?: string
) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      title,
      message,
      type,
      actionId,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

export const NotificationTemplates = {
  taskAssigned: (taskName: string, who: string) => ({
    title: 'New Task Assigned',
    message: `You have been assigned to the task '${taskName}' by ${who}`,
  }),
  
  announcementPosted: (title: string, author: string) => ({
    title: `${author} posted announcement`,
    message: `${title}`,
  }),
  
  eventReminder: (eventName: string, time: string) => ({
    title: 'Event Reminder',
    message: `${eventName} starts ${time}`,
  }),
  
  eventCreated: (eventName: string) => ({
    title: 'New Event',
    message: `${eventName} has been added to the calendar`,
  }),
};
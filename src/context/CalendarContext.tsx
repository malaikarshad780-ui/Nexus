import React, { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AvailabilitySlot, MeetingRequest } from '../types';
import { useAuth } from './AuthContext';

const SLOTS_KEY = 'business_nexus_slots';
const REQUESTS_KEY = 'business_nexus_meeting_requests';

interface CalendarContextType {
  slots: AvailabilitySlot[];
  addSlot: (start: string, end: string) => void;
  removeSlot: (slotId: string) => void;
  requestMeeting: (slotId: string) => void;
  acceptRequest: (requestId: string) => void;
  declineRequest: (requestId: string) => void;
  mySlots: AvailabilitySlot[];
  incomingRequests: MeetingRequest[];
  outgoingRequests: MeetingRequest[];
  confirmedMeetings: MeetingRequest[];
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export const CalendarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [requests, setRequests] = useState<MeetingRequest[]>([]);

  useEffect(() => {
    const storedSlots = localStorage.getItem(SLOTS_KEY);
    const storedRequests = localStorage.getItem(REQUESTS_KEY);
    if (storedSlots) setSlots(JSON.parse(storedSlots));
    if (storedRequests) setRequests(JSON.parse(storedRequests));
  }, []);

  const persistSlots = (next: AvailabilitySlot[]) => {
    setSlots(next);
    localStorage.setItem(SLOTS_KEY, JSON.stringify(next));
  };

  const persistRequests = (next: MeetingRequest[]) => {
    setRequests(next);
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(next));
  };

  const addSlot = (start: string, end: string) => {
    if (!user) return;

    if (new Date(end).getTime() <= new Date(start).getTime()) {
      toast.error('End time must be after start time');
      return;
    }

    const newSlot: AvailabilitySlot = {
      id: `slot_${Date.now()}`,
      userId: user.id,
      start,
      end,
      isBooked: false
    };
    persistSlots([...slots, newSlot]);
    toast.success('Availability slot added');
  };

  const removeSlot = (slotId: string) => {
    persistSlots(slots.filter(s => s.id !== slotId));
    persistRequests(requests.filter(r => r.slotId !== slotId));
    toast.success('Slot removed');
  };

  const requestMeeting = (slotId: string) => {
    if (!user) return;
    const slot = slots.find(s => s.id === slotId);
    if (!slot || slot.isBooked) return;

    const alreadyRequested = requests.some(
      r => r.slotId === slotId && r.requesterId === user.id && r.status === 'pending'
    );
    if (alreadyRequested) {
      toast.error('You already requested this slot');
      return;
    }

    const newRequest: MeetingRequest = {
      id: `req_${Date.now()}`,
      slotId,
      requesterId: user.id,
      hostId: slot.userId,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    persistRequests([...requests, newRequest]);
    toast.success('Meeting request sent');
  };

  const acceptRequest = (requestId: string) => {
    const request = requests.find(r => r.id === requestId);
    if (!request) return;
    persistRequests(requests.map(r => (r.id === requestId ? { ...r, status: 'accepted' } : r)));
    persistSlots(slots.map(s => (s.id === request.slotId ? { ...s, isBooked: true } : s)));
    toast.success('Meeting confirmed');
  };

  const declineRequest = (requestId: string) => {
    persistRequests(requests.map(r => (r.id === requestId ? { ...r, status: 'declined' } : r)));
    toast.success('Meeting declined');
  };

  const mySlots = slots.filter(s => s.userId === user?.id);
  const incomingRequests = requests.filter(r => r.hostId === user?.id && r.status === 'pending');
  const outgoingRequests = requests.filter(r => r.requesterId === user?.id && r.status === 'pending');
  const confirmedMeetings = requests.filter(
    r => r.status === 'accepted' && (r.hostId === user?.id || r.requesterId === user?.id)
  );

  const value: CalendarContextType = {
    slots, addSlot, removeSlot, requestMeeting, acceptRequest, declineRequest,
    mySlots, incomingRequests, outgoingRequests, confirmedMeetings
  };

  return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>;
};

export const useCalendar = (): CalendarContextType => {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
};
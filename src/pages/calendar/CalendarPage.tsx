import React, { useState } from 'react';
import { Calendar as CalendarIcon, Plus, Trash2, Check, X } from 'lucide-react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import { useCalendar } from '../../context/CalendarContext';
import { users } from '../../data/users';

const localizer = dateFnsLocalizer({
  format, parse, startOfWeek, getDay,
  locales: { 'en-US': enUS },
});

export const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const {
    mySlots, incomingRequests, outgoingRequests, confirmedMeetings, slots,
    addSlot, removeSlot, requestMeeting, acceptRequest, declineRequest
  } = useCalendar();

  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStart || !newEnd) return;
    addSlot(new Date(newStart).toISOString(), new Date(newEnd).toISOString());
    setNewStart('');
    setNewEnd('');
  };

  const requestedSlotIds = new Set(outgoingRequests.map(r => r.slotId));
  const otherAvailableSlots = slots.filter(
    s => s.userId !== user?.id && !s.isBooked && !requestedSlotIds.has(s.id)
  );
  const getUserName = (id: string) => users.find(u => u.id === id)?.name ?? 'Unknown';

  const calendarEvents = confirmedMeetings.map(meeting => {
    const slot = slots.find(s => s.id === meeting.slotId);
    return {
      id: meeting.id,
      title: meeting.hostId === user?.id
        ? `Meeting with ${getUserName(meeting.requesterId)}`
        : `Meeting with ${getUserName(meeting.hostId)}`,
      start: new Date(slot?.start ?? meeting.createdAt),
      end: new Date(slot?.end ?? meeting.createdAt),
    };
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Meeting Scheduler</h1>
        <p className="text-gray-600">Manage your availability and meeting requests</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <CalendarIcon size={18} className="text-primary-600" />
            Confirmed Meetings
          </h2>
        </CardHeader>
        <CardBody>
          <div style={{ height: 500 }}>
            <BigCalendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
            />
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">My Availability</h2>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleAddSlot} className="flex flex-col gap-3 mb-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Start</label>
                <Input type="datetime-local" value={newStart} onChange={(e) => setNewStart(e.target.value)} fullWidth />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">End</label>
                <Input type="datetime-local" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} fullWidth />
              </div>
              <Button type="submit">
                <Plus size={16} className="mr-1" />
                Add Slot
              </Button>
            </form>

            <div className="space-y-2">
              {mySlots.length === 0 && <p className="text-sm text-gray-500">No availability added yet.</p>}
              {mySlots.map(slot => (
                <div key={slot.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-900">
                      {new Date(slot.start).toLocaleString()} – {new Date(slot.end).toLocaleTimeString()}
                    </p>
                    <Badge variant={slot.isBooked ? 'success' : 'gray'}>
                      {slot.isBooked ? 'Booked' : 'Available'}
                    </Badge>
                  </div>
                  {!slot.isBooked && (
                    <Button variant="outline" size="sm" onClick={() => removeSlot(slot.id)}>
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">Meeting Requests</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              {incomingRequests.length === 0 && <p className="text-sm text-gray-500">No pending requests.</p>}
              {incomingRequests.map(request => {
                const slot = slots.find(s => s.id === request.slotId);
                return (
                  <div key={request.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{getUserName(request.requesterId)}</p>
                      {slot && <p className="text-xs text-gray-500">{new Date(slot.start).toLocaleString()}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => acceptRequest(request.id)}><Check size={14} /></Button>
                      <Button variant="outline" size="sm" onClick={() => declineRequest(request.id)}><X size={14} /></Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Book a Meeting</h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-2">
            {otherAvailableSlots.length === 0 && outgoingRequests.length === 0 && (
              <p className="text-sm text-gray-500">No available slots from others right now.</p>
            )}
            {otherAvailableSlots.map(slot => (
              <div key={slot.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{getUserName(slot.userId)}</p>
                  <p className="text-xs text-gray-500">{new Date(slot.start).toLocaleString()}</p>
                </div>
                <Button size="sm" onClick={() => requestMeeting(slot.id)}>Request</Button>
              </div>
            ))}
            {outgoingRequests.map(request => {
              const slot = slots.find(s => s.id === request.slotId);
              if (!slot) return null;
              return (
                <div key={request.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{getUserName(slot.userId)}</p>
                    <p className="text-xs text-gray-500">{new Date(slot.start).toLocaleString()}</p>
                  </div>
                  <Badge variant="gray">Requested</Badge>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
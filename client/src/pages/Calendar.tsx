import React, { useState, useMemo } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  ButtonGroup,
} from '@mui/material';
import { Calendar as BigCalendar, momentLocalizer, Event as CalendarEvent } from 'react-big-calendar';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import { useEvents } from '../hooks/useEvents';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

interface EventData extends CalendarEvent {
  id: number;
  resource?: any;
}

const Calendar: React.FC = () => {
  const { events, loading, error } = useEvents();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month');

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

 
  const yearOptions = Array.from({ length: 7 }, (_, i) => 2024 + i);


  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleYearChange = (year: number) => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(year);
    setCurrentDate(newDate);
  };

  const handleMonthChange = (month: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(month);
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleNavigate = (date: Date) => {
    setCurrentDate(date);
  };

  const calendarEvents = useMemo(() => {
    return events.map((event: any) => ({
      id: event.EventID || event.id,
      title: event.Title || event.title,
      start: new Date(event.StartDateTime || event.startDate),
      end: new Date(event.EndDateTime || event.endDate),
      resource: event,
    }));
  }, [events]);

  const handleSelectEvent = (event: EventData) => {
    navigate(`/events/${event.id}`);
  };

  const eventStyleGetter = (event: EventData) => {
    const eventData = event.resource;
    let backgroundColor = '#1976d2';

    
    if (eventData?.CategoryColor) {
      backgroundColor = eventData.CategoryColor;
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    };
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 4 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Event Calendar
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          View all volunteer events in calendar format
        </Typography>

        {/* Navigation Controls */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, mt: 3, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Year</InputLabel>
            <Select
              value={currentYear}
              label="Year"
              onChange={(e) => handleYearChange(e.target.value as number)}
            >
              {yearOptions.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Month</InputLabel>
            <Select
              value={currentMonth}
              label="Month"
              onChange={(e) => handleMonthChange(e.target.value as number)}
            >
              {monthNames.map((month, index) => (
                <MenuItem key={index} value={index}>
                  {month}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            size="small"
            onClick={handleToday}
          >
            Today
          </Button>

          <ButtonGroup size="small" variant="outlined">
            <Button onClick={() => setView('month')} variant={view === 'month' ? 'contained' : 'outlined'}>
              Month
            </Button>
            <Button onClick={() => setView('week')} variant={view === 'week' ? 'contained' : 'outlined'}>
              Week
            </Button>
            <Button onClick={() => setView('day')} variant={view === 'day' ? 'contained' : 'outlined'}>
              Day
            </Button>
            <Button onClick={() => setView('agenda')} variant={view === 'agenda' ? 'contained' : 'outlined'}>
              Agenda
            </Button>
          </ButtonGroup>
        </Box>

        <Paper sx={{ p: 3, mt: 3 }}>
          <Box sx={{ height: '600px' }}>
            <BigCalendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
              views={['month', 'week', 'day', 'agenda']}
              view={view as any}
              onView={setView as any}
              date={currentDate}
              onNavigate={handleNavigate}
              popup
              style={{ height: '100%' }}
            />
          </Box>
        </Paper>

        <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="caption" color="text.secondary">
            Tip: Click on an event to view details. Use the toolbar to switch between month, week, day, and agenda views.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default Calendar;

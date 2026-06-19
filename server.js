const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

// ── CENTRAL DATABASE STATE (In-Memory Data Framework)
let appointments = [
  { token: 'T001', name: 'Sunita Reddy', phone: '98001 11234', dept: 'Cardiology', doctor: 'Dr. Kavitha Nair', date: new Date().toISOString().split('T')[0], time: '09:00', status: 'Arrived', question: '', payment: 'upi', bookedAt: new Date().toISOString() }
];

let doctors = [
  { id: 1, name: 'Dr. Kavitha Nair', dept: 'Cardiology', color: '#e05252', available: true, blockedSlots: [] },
  { id: 2, name: 'Dr. Rajan Pillai', dept: 'Orthopaedics', color: '#4a7c6f', available: true, blockedSlots: [] },
  { id: 3, name: 'Dr. Sonal Mehta', dept: 'General Medicine', color: '#c8973a', available: true, blockedSlots: [] },
  { id: 4, name: 'Dr. Arjun Krishnan', dept: 'Paediatrics', color: '#5566cc', available: false, blockedSlots: [] },
  { id: 5, name: 'Dr. Leela Sharma', dept: 'Dental', color: '#8844aa', available: true, blockedSlots: [] },
  { id: 6, name: 'Dr. Vivek Rao', dept: 'Neurology', color: '#cc6644', available: true, blockedSlots: [] }
];
let tokenSeq = 1;

// ── REST API ENDPOINTS
app.get('/api/doctors', (req, res) => res.json(doctors));
app.get('/api/appointments', (req, res) => res.json(appointments));

app.post('/api/appointments', (req, res) => {
  const appt = req.body;
  tokenSeq++;
  appt.token = 'T' + String(tokenSeq).padStart(3, '0');
  appt.bookedAt = new Date().toISOString();
  appointments.push(appt);

  // Broadcast out to all connected terminals instantly
  io.emit('NEW_APPOINTMENT', appt);
  res.status(201).json(appt);
});

app.patch('/api/appointments/:token', (req, res) => {
  const { token } = req.params;
  const updates = req.body;
  let appt = appointments.find(a => a.token === token);
  
  if (appt) {
    Object.assign(appt, updates);
    io.emit('STATUS_UPDATE', { token, ...updates });
    return res.json(appt);
  }
  res.status(404).json({ error: "Appointment not found" });
});

app.put('/api/doctors', (req, res) => {
  doctors = req.body;
  io.emit('DOCTORS_UPDATE', doctors);
  res.json(doctors);
});

// ── WEBSOCKET TUNNEL CONNECTION
io.on('connection', (socket) => {
  console.log('⚡ Terminal Connected to QuickCare Network:', socket.id);
});

const PORT = 3000;
server.listen(PORT, () => console.log(`🚀 QuickCare Engine live on http://localhost:${PORT}`));
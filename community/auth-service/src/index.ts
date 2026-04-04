import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { DbConnection, reducers } from './module_bindings/index.js'; // Generated SDK
import { reducers } from './module_bindings/index.js'; 

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 4000;


const conn = DbConnection.builder()
  .withUri(HOST)
  .withDatabaseName(DB_NAME)
  .withToken(loadToken())  // Load saved token from file
  .onConnect((conn, identity, token) => {
    console.log('Connected! Identity:', identity.toHexString());
    saveToken(token);  // Save token for future connections

    // Subscribe to all tables
    conn.subscriptionBuilder()
      .onApplied((ctx) => {
        // Show current people
        const people = [...ctx.db.person.iter()];
        console.log('Current people:', people.length);
      })
      .subscribeToAllTables();

    // Listen for table changes
    conn.db.person.onInsert((ctx, person) => {
      console.log(`[Added] ${person.name}`);
    });
  })
  .build();
const conn = DbConnection.builder()
  .withUri("ws://127.0.0.1:3000") // or your Spacetime Cloud URI
  .withModuleName("your_module_name")
  .build();

app.post('/send-code', async (req, res) => {
  const { email } = req.body;
  
  // 2. Generate the 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    // 3. Send via Nodemailer
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Your Verification Code',
      text: `Your code is: ${code}`,
    });

    // 4. Call the SpacetimeDB Reducer
    // Replace 'registerCode' with the actual name of your reducer in lib.rs/lib.ts
    reducers.registerCode(email, code);

    res.status(200).json({ message: 'Code sent and registered!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

conn.onReducer('registerCode', (status, identity, reducerArgs) => {
  if (status === 'committed') {
    console.log("Database updated successfully!");
  }
});

// Setup Nodemailer Transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER, 
    pass: process.env.SMTP_PASS, 
  },
});

// In-memory code store { email: { code, role } }
const verificationStore = new Map();

// Connect to SpacetimeDB
// We use a predefined backend "system" identity. For hackathon simplicity, we just boot the connection.
let isDbConnected = false;


app.post('/register', async (req, res) => {
  const { email, password, role } = req.body;
  
  if (!email || !password || (role !== 'user' && role !== 'doctor')) {
    return res.status(400).json({ error: 'Invalid input. Please provide email, password, and valid role (user or doctor)' });
  }

  // Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  verificationStore.set(email, { code, role });

  try {
    await transporter.sendMail({
      from: `"MedSpatial AI" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'MedSpatial AI - Email Verification',
      text: `Your verification code is: ${code}`,
      html: `<h3>Welcome to MedSpatial AI!</h3><p>Your verification code is: <b>${code}</b></p>`,
    });

    res.json({ message: 'Verification code sent to email' });
  } catch (err) {
    console.error('SMTP Error:', err);
    res.status(500).json({ error: 'Failed to send verification email. Check SMTP credentials.' });
  }
});

app.post('/verify', (req, res) => {
  const { email, code } = req.body;
  
  const record = verificationStore.get(email);
  if (!record) {
    return res.status(400).json({ error: 'No verification requested for this email' });
  }
  
  if (record.code !== code) {
    return res.status(400).json({ error: 'Invalid code' });
  }

  if (!isDbConnected) {
    return res.status(500).json({ error: 'Backend is not currently connected to SpacetimeDB' });
  }

  try {
    // Calling the internal SDK reducer to securely insert the user.
    // The email and role are passed. The identity bound will be the one belonging to this Auth backend,
    // which is not correct. Wait! In SpacetimeDB, the user themselves must bind their identity!
    // Since we want the user's frontend to own the identity, the best architecture is:
    // 1. Auth service tells the Frontend "Verified!"
    // 2. The frontend (which has its own identity via pure Spacetime auth) connects to SpacetimeDB.
    // 3. The frontend calls the database itself!
    // BUT we want to secure it. If the frontend calls `register`, anyone can forge a register call without verifying email.
    // Therefore: The Auth service signs a payload?
    
    // Instead, for this minimal backend architecture:
    // Auth Service inserts the user record with the Backend's identity OR a placeholder.
    reducers.register_user_internal(email, record.role);
    
    // Once inserted, the user's frontend will call `link_identity(email)` after login, which will map their new identity.
    // This is safe enough for this hackathon context as long as email uniqueness holds.
    
    verificationStore.delete(email);
    res.json({ message: 'Verification successful. User registered.' });
    
  } catch (error) {
    console.error('SpacetimeDB Error:', error);
    res.status(500).json({ error: 'Database registration failed' });
  }
});

app.listen(PORT, () => {
  console.log(`[Auth Service] Running on http://localhost:${PORT}`);
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("⚠️ SMTP_USER and SMTP_PASS are missing in .env. Emailing will fail.");
  }
});

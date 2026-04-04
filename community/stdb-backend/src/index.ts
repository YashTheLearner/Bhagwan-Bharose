import { schema, table, t, SenderError } from 'spacetimedb/server';

// ========================
// TABLES
// ========================

const user = table(
  { name: 'user', public: true },
  {
    email: t.string().primaryKey(),
    identity: t.identity().unique(),
    role: t.string(), // "user" or "doctor"
    is_verified: t.bool(),
  }
);

const chat_request = table(
  { name: 'chat_request', public: true },
  {
    id: t.u64().primaryKey().autoInc(),
    patient_email: t.string(),
    doctor_email: t.string(),
    status: t.string(), // "pending", "accepted", "rejected"
  }
);

const message = table(
  { name: 'message', public: true },
  {
    id: t.u64().primaryKey().autoInc(),
    request_id: t.u64(),
    sender_email: t.string(),
    content: t.string(),
    timestamp: t.u64(),
  }
);

// ========================
// SCHEMA
// ========================

const spacetimedb = schema({
  user,
  chat_request,
  message,
});

export default spacetimedb;

// ========================
// LIFECYCLE 
// ========================

export const init = spacetimedb.init((_ctx) => {
  console.log('Community Chat SpacetimeDB Module Initialized');
});

// ========================
// REDUCERS
// ========================

// Called by the Node.js Auth Service securely 
export const registerUserInternal = spacetimedb.reducer(
  {
    email: t.string(),
    role: t.string(),
  },
  (ctx, { email, role }) => {
    ctx.db.user.insert({
      email,
      identity: ctx.sender,
      role,
      is_verified: true,
    });
    console.log(`Verified user added: ${email} (${role})`);
  }
);

// Allows the user to link their connection Identity securely if they have their email
export const link_identity = spacetimedb.reducer(
  {
    email: t.string(),
  },
  (ctx, { email }) => {
    const u = ctx.db.user.email.find(email);
    if (!u) {
      throw new SenderError('User not found');
    }
    const currentIdentity = u.identity.toHexString();
    if (currentIdentity !== ctx.sender.toHexString()) {
      ctx.db.user.email.update({ ...u, identity: ctx.sender });
      console.log(`Identity linked for user ${email}`);
    }
  }
);


export const request_chat = spacetimedb.reducer(
  {
    doctor_email: t.string(),
  },
  (ctx, { doctor_email }) => {
    const p = ctx.db.user.identity.find(ctx.sender);
    if (!p || p.role !== 'user') throw new SenderError('Only verified users can request chats');

    const d = ctx.db.user.email.find(doctor_email);
    if (!d || d.role !== 'doctor') throw new SenderError('Doctor not found');

    ctx.db.chat_request.insert({
      id: 0n,
      patient_email: p.email,
      doctor_email: doctor_email,
      status: 'pending',
    });
    console.log(`Chat request: ${p.email} -> ${doctor_email}`);
  }
);

export const update_request = spacetimedb.reducer(
  {
    request_id: t.u64(),
    status: t.string(), // "accepted" or "rejected"
  },
  (ctx, { request_id, status }) => {
    const d = ctx.db.user.identity.find(ctx.sender);
    if (!d || d.role !== 'doctor') throw new SenderError('Unauthorized');

    const req = ctx.db.chat_request.id.find(request_id);
    if (!req) throw new SenderError('Request not found');
    if (req.doctor_email !== d.email) throw new SenderError('Not your request');

    ctx.db.chat_request.id.update({ ...req, status });
    console.log(`Request #${request_id} updated to ${status}`);
  }
);

export const send_message = spacetimedb.reducer(
  {
    request_id: t.u64(),
    content: t.string(),
  },
  (ctx, { request_id, content }) => {
    const u = ctx.db.user.identity.find(ctx.sender);
    if (!u) throw new SenderError('Unauthorized');

    const req = ctx.db.chat_request.id.find(request_id);
    if (!req) throw new SenderError('Chat session not found');
    if (req.status !== 'accepted') throw new SenderError('Chat not accepted yet');

    if (req.patient_email !== u.email && req.doctor_email !== u.email) {
      throw new SenderError('You are not a participant in this chat');
    }

    ctx.db.message.insert({
      id: 0n,
      request_id,
      sender_email: u.email,
      content,
      timestamp: BigInt(Date.now()),
    });
    console.log(`Chat: ${u.email} -> Req ID ${request_id}: ${content.slice(0, 10)}`);
  }
);

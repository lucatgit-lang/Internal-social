import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../lib/db.js";
import { ApiError } from "../lib/errors.js";

const sendSchema = z.object({ content: z.string().trim().min(1) });
const openSchema = z.object({ targetUserId: z.string().uuid() });

export async function chatRoutes(app: FastifyInstance): Promise<void> {
  app.post("/api/v1/chat/direct/open-or-create", { preHandler: [app.authenticate] }, async (request) => {
    const parsed = openSchema.safeParse(request.body);
    if (!parsed.success) throw new ApiError(400, "VALIDATION_ERROR", "Invalid payload", parsed.error.flatten());
    const me = request.user.sub;
    const target = parsed.data.targetUserId;

    const existing = await db.query<{ id: string }>(`
      select c.id::text
      from app.conversations c
      join app.conversation_participants p1 on p1.conversation_id=c.id and p1.user_id=$1::uuid
      join app.conversation_participants p2 on p2.conversation_id=c.id and p2.user_id=$2::uuid
      where c.type='direct'
      limit 1
    `,[me,target]);
    if (existing.rows[0]) return { data: { conversationId: existing.rows[0].id } };

    const conv = await db.query<{ id: string }>("insert into app.conversations (type,created_by) values ('direct',$1::uuid) returning id::text", [me]);
    await db.query(`insert into app.conversation_participants (conversation_id,user_id) values ($1::uuid,$2::uuid),($1::uuid,$3::uuid)`, [conv.rows[0]!.id, me, target]);
    return { data: { conversationId: conv.rows[0]!.id } };
  });

  app.get("/api/v1/chat/conversations", { preHandler: [app.authenticate] }, async (request) => {
    const me = request.user.sub;
    const rows = await db.query<{
      id: string; type: string; name: string | null; description: string | null; updated_at: string;
      last_message: string | null; last_time: string | null; unread: number;
      direct_user_id: string | null; direct_name: string | null; direct_title: string | null; direct_avatar: string | null;
    }>(`
      with my_convs as (
        select c.id, c.type, c.name, c.description, c.updated_at
        from app.conversations c join app.conversation_participants cp on cp.conversation_id=c.id
        where cp.user_id=$1::uuid
      )
      select m.id::text, m.type, m.name, m.description, m.updated_at::text,
             lm.content as last_message, lm.created_at::text as last_time,
             coalesce(ur.unread,0)::int as unread,
             du.id::text as direct_user_id, du.full_name as direct_name, du.title as direct_title, du.avatar_url as direct_avatar
      from my_convs m
      left join lateral (
        select content, created_at
        from app.messages msg where msg.conversation_id=m.id
        order by created_at desc limit 1
      ) lm on true
      left join lateral (
        select count(*) as unread
        from app.messages msg
        left join app.conversation_participants cp on cp.conversation_id=msg.conversation_id and cp.user_id=$1::uuid
        where msg.conversation_id=m.id and msg.sender_id <> $1::uuid and (cp.last_read_at is null or msg.created_at > cp.last_read_at)
      ) ur on true
      left join lateral (
        select u.id, u.full_name, u.title, u.avatar_url
        from app.conversation_participants cp
        join app.users u on u.id=cp.user_id
        where cp.conversation_id=m.id and cp.user_id <> $1::uuid and m.type='direct'
        limit 1
      ) du on true
      order by coalesce(lm.created_at, m.updated_at) desc
    `,[me]);

    return { data: rows.rows.map((r) => ({
      id: r.id,
      type: r.type,
      name: r.type === "direct" ? (r.direct_name ?? "Utente") : (r.name ?? "Conversazione"),
      description: r.description,
      lastMessage: r.last_message ?? "",
      lastTime: r.last_time ?? r.updated_at,
      unread: r.unread,
      participant: r.direct_user_id ? { id: r.direct_user_id, name: r.direct_name, title: r.direct_title, avatar: r.direct_avatar } : null
    })) };
  });

  app.get("/api/v1/chat/conversations/:id/messages", { preHandler: [app.authenticate] }, async (request) => {
    const id = (request.params as any).id as string;
    const me = request.user.sub;
    const allowed = await db.query("select 1 from app.conversation_participants where conversation_id=$1::uuid and user_id=$2::uuid", [id, me]);
    if (!allowed.rowCount) throw new ApiError(404, "NOT_FOUND", "Conversation not found");

    const messages = await db.query<{ id: string; sender_id: string; content: string; created_at: string }>(
      "select id::text,sender_id::text,content,created_at::text from app.messages where conversation_id=$1::uuid order by created_at asc", [id]
    );

    const participants = await db.query<{ id: string; full_name: string; title: string | null; avatar_url: string | null }>(
      "select u.id::text,u.full_name,u.title,u.avatar_url from app.conversation_participants cp join app.users u on u.id=cp.user_id where cp.conversation_id=$1::uuid", [id]
    );

    await db.query("update app.conversation_participants set last_read_at=now() where conversation_id=$1::uuid and user_id=$2::uuid", [id, me]);

    return { data: { messages: messages.rows.map((m) => ({ id: m.id, senderId: m.sender_id, text: m.content, time: m.created_at })), participants: participants.rows } };
  });

  app.post("/api/v1/chat/conversations/:id/messages", { preHandler: [app.authenticate] }, async (request) => {
    const id = (request.params as any).id as string;
    const parsed = sendSchema.safeParse(request.body);
    if (!parsed.success) throw new ApiError(400, "VALIDATION_ERROR", "Invalid payload", parsed.error.flatten());
    const me = request.user.sub;
    const allowed = await db.query("select 1 from app.conversation_participants where conversation_id=$1::uuid and user_id=$2::uuid", [id, me]);
    if (!allowed.rowCount) throw new ApiError(404, "NOT_FOUND", "Conversation not found");

    const ins = await db.query<{ id: string; created_at: string }>("insert into app.messages (conversation_id,sender_id,content) values ($1::uuid,$2::uuid,$3) returning id::text,created_at::text", [id, me, parsed.data.content]);
    await db.query("update app.conversations set updated_at=now() where id=$1::uuid", [id]);
    return { data: { id: ins.rows[0]!.id, time: ins.rows[0]!.created_at } };
  });

  app.get("/api/v1/chat/contacts", { preHandler: [app.authenticate] }, async (request) => {
    const me = request.user.sub;
    const rows = await db.query<{ id: string; full_name: string; title: string | null; email: string; avatar_url: string | null }>(
      "select id::text,full_name,title,email,avatar_url from app.users where id <> $1::uuid order by full_name asc", [me]
    );
    return { data: rows.rows.map((r) => ({ id: r.id, name: r.full_name, role: r.title, email: r.email, avatar: r.avatar_url })) };
  });

  app.get("/api/v1/chat/notifications", { preHandler: [app.authenticate] }, async (request) => {
    const rows = await db.query<{ id: string; title: string; description: string | null; created_at: string; read_at: string | null }>(
      "select id::text,title,description,created_at::text,read_at::text from app.notifications where user_id=$1::uuid order by created_at desc limit 50", [request.user.sub]
    );
    return { data: rows.rows.map((r) => ({ id: r.id, title: r.title, description: r.description, createdAt: r.created_at, read: !!r.read_at })) };
  });

  app.get("/api/v1/chat/email/inbox", { preHandler: [app.authenticate] }, async (request) => {
    const rows = await db.query<{ id: string; subject: string; body: string; created_at: string; read_at: string | null; starred: boolean; from_name: string }>(`
      select e.id::text,e.subject,e.body,e.created_at::text,e.read_at::text,e.starred,u.full_name as from_name
      from app.emails e join app.users u on u.id=e.from_user_id
      where e.to_user_id=$1::uuid and e.folder='inbox'
      order by e.created_at desc`, [request.user.sub]);
    return { data: rows.rows.map((r) => ({ id: r.id, from: r.from_name, subject: r.subject, body: r.body, time: r.created_at, read: !!r.read_at, starred: r.starred })) };
  });

  app.get("/api/v1/chat/video/history", { preHandler: [app.authenticate] }, async (request) => {
    const rows = await db.query<{ id: string; call_type: string; duration_sec: number | null; created_at: string; with_name: string }>(`
      select vc.id::text, vc.call_type, vc.duration_sec, vc.created_at::text, u.full_name as with_name
      from app.video_calls vc join app.users u on u.id=vc.with_user_id
      where vc.by_user_id=$1::uuid
      order by vc.created_at desc`, [request.user.sub]);
    return { data: rows.rows.map((r) => ({ id: r.id, type: r.call_type, durationSec: r.duration_sec, time: r.created_at, with: r.with_name })) };
  });
}

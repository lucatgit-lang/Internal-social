import { db } from "../lib/db.js";
import { hashPassword } from "../lib/password.js";

type SeedUser = { email: string; fullName: string; role: "admin" | "user"; title: string; avatarUrl?: string };

type SeedPost = { by: string; content: string; image?: string; comments?: Array<{ by: string; text: string }> };

type SeedStory = { by: string; image: string; hoursToLive: number };

const users: SeedUser[] = [
  { email: "admin@hideddy.community", fullName: "Deddy Admin", role: "admin", title: "Amministratore", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop" },
  { email: "lucia.f@hideddy.community", fullName: "Lucia F.", role: "user", title: "Responsabile Qualita", avatarUrl: "https://i.pravatar.cc/150?u=lucia" },
  { email: "roberto.b@hideddy.community", fullName: "Roberto B.", role: "user", title: "Agente Centro", avatarUrl: "https://i.pravatar.cc/150?u=roberto" },
  { email: "supporto.it@hideddy.community", fullName: "Supporto IT", role: "user", title: "Tecnico", avatarUrl: "https://i.pravatar.cc/150?u=it" },
  { email: "giulia.rossi@hideddy.community", fullName: "Giulia Rossi", role: "user", title: "Commerciale", avatarUrl: "https://images.unsplash.com/photo-1610387694365-19fafcc86d86?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=160" },
  { email: "marco.g@hideddy.community", fullName: "Marco G.", role: "user", title: "Logistica", avatarUrl: "https://i.pravatar.cc/150?u=marco-g" },
  { email: "antonio.r@hideddy.community", fullName: "Antonio R.", role: "user", title: "Magazzino", avatarUrl: "https://i.pravatar.cc/150?u=antonio-r" },
  { email: "sara.m@hideddy.community", fullName: "Sara Marchetti", role: "user", title: "Qualita", avatarUrl: "https://i.pravatar.cc/150?u=sara-m" },
  { email: "davide.r@hideddy.community", fullName: "Davide Romano", role: "user", title: "IT", avatarUrl: "https://i.pravatar.cc/150?u=davide-r" },
  { email: "marta.l@hideddy.community", fullName: "Marta Lombardi", role: "user", title: "Amministrazione", avatarUrl: "https://i.pravatar.cc/150?u=marta-l" }
];

const stories: SeedStory[] = [
  { by: "admin@hideddy.community", image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1080", hoursToLive: 18 },
  { by: "lucia.f@hideddy.community", image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1080", hoursToLive: 20 },
  { by: "giulia.rossi@hideddy.community", image: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=1080", hoursToLive: 12 },
  { by: "marco.g@hideddy.community", image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1080", hoursToLive: 22 },
  { by: "antonio.r@hideddy.community", image: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=1080", hoursToLive: 16 }
];

const posts: SeedPost[] = [
  {
    by: "giulia.rossi@hideddy.community",
    content: "Team commerciale allineato: oggi priorita su clienti nuovi area nord. ??",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200",
    comments: [
      { by: "admin@hideddy.community", text: "Perfetto, aggiornatemi a fine giornata." },
      { by: "lucia.f@hideddy.community", text: "Ricevuto, tengo monitorata anche qualita." }
    ]
  },
  {
    by: "admin@hideddy.community",
    content: "Benvenuti nella nuova HI Deddy Community: da oggi team, chat e aggiornamenti in un unico flusso.",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200",
    comments: [
      { by: "marco.g@hideddy.community", text: "Interfaccia molto piu veloce del vecchio flusso." }
    ]
  },
  {
    by: "marco.g@hideddy.community",
    content: "Lotto 445 in chiusura, picking list condivisa in chat interna.",
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200",
    comments: [
      { by: "roberto.b@hideddy.community", text: "Ottimo, preparo il giro clienti." }
    ]
  },
  {
    by: "lucia.f@hideddy.community",
    content: "Campionamenti completati. Domani rilascio report qualita in dashboard.",
    comments: [
      { by: "sara.m@hideddy.community", text: "Grande, ti supporto sulla parte documentale." }
    ]
  }
];

async function run() {
  const pass = await hashPassword("ChangeMe123!");
  const ids = new Map<string, string>();

  for (const u of users) {
    const res = await db.query<{ id: string }>(`insert into app.users (email,password_hash,full_name,role,title,avatar_url) values ($1,$2,$3,$4,$5,$6)
      on conflict (email) do update set full_name=excluded.full_name, role=excluded.role, title=excluded.title, avatar_url=excluded.avatar_url, updated_at=now()
      returning id::text`, [u.email, pass, u.fullName, u.role, u.title, u.avatarUrl ?? null]);
    ids.set(u.email, res.rows[0]!.id);
  }

  await db.query("delete from app.post_comments");
  await db.query("delete from app.post_reactions");
  await db.query("delete from app.post_saves");
  await db.query("delete from app.posts");
  await db.query("delete from app.story_views");
  await db.query("delete from app.stories");
  await db.query("delete from app.messages");
  await db.query("delete from app.conversation_participants");
  await db.query("delete from app.conversations");
  await db.query("delete from app.user_follows");
  await db.query("delete from app.notifications");

  const adminId = ids.get("admin@hideddy.community")!;
  const luciaId = ids.get("lucia.f@hideddy.community")!;
  const giuliaId = ids.get("giulia.rossi@hideddy.community")!;

  for (const s of stories) {
    await db.query(
      "insert into app.stories (author_id, image_url, expires_at) values ($1::uuid,$2,now() + ($3 || ' hours')::interval)",
      [ids.get(s.by), s.image, s.hoursToLive]
    );
  }

  for (const p of posts) {
    const inserted = await db.query<{ id: string }>(
      "insert into app.posts (author_id, content, image_url) values ($1::uuid,$2,$3) returning id::text",
      [ids.get(p.by), p.content, p.image ?? null]
    );
    for (const c of p.comments ?? []) {
      await db.query(
        "insert into app.post_comments (post_id, author_id, content) values ($1::uuid,$2::uuid,$3)",
        [inserted.rows[0]!.id, ids.get(c.by), c.text]
      );
    }
  }

  await db.query(`
    insert into app.user_follows (follower_id, following_id)
    values
      ($1::uuid, $2::uuid),
      ($1::uuid, $3::uuid),
      ($2::uuid, $1::uuid)
    on conflict do nothing
  `, [adminId, luciaId, giuliaId]);

  const dm = await db.query<{ id: string }>(
    "insert into app.conversations (type,name,created_by) values ('direct',null,$1::uuid) returning id::text",
    [adminId]
  );
  await db.query(
    "insert into app.conversation_participants (conversation_id,user_id,last_read_at) values ($1::uuid,$2::uuid,now()),($1::uuid,$3::uuid,now())",
    [dm.rows[0]!.id, adminId, luciaId]
  );
  await db.query(
    "insert into app.messages (conversation_id,sender_id,content) values ($1::uuid,$2::uuid,$3),($1::uuid,$4::uuid,$5)",
    [dm.rows[0]!.id, luciaId, "Ciao Deddy, ho appena aggiornato il controllo qualita.", adminId, "Perfetto Lucia, apro il thread con il team."]
  );

  await db.query(
    "insert into app.notifications (user_id,title,description) values ($1::uuid,$2,$3),($1::uuid,$4,$5)",
    [adminId, "Lucia F. ha pubblicato un aggiornamento", "Controllo qualita", "Marco G. ha citato il lotto 445", "Produzione"]
  );

  console.log("Seed complete");
  console.log("Admin login: admin@hideddy.community / ChangeMe123!");
  await db.end();
}

run().catch(async (e) => { console.error(e); await db.end(); process.exit(1); });

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { db } from "./db.js";
import { hashPassword } from "./password.js";

const ADMIN_EMAIL = "admin@hideddy.community";
const ADMIN_PASSWORD = "ChangeMe123!";

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export async function bootstrapDatabase(): Promise<void> {
  await db.query(`
    create extension if not exists pgcrypto;
    create schema if not exists app;
    create table if not exists app.schema_migrations (
      id text primary key,
      checksum text not null,
      executed_at timestamptz not null default now()
    );
  `);

  const baseDir = path.dirname(fileURLToPath(import.meta.url));
  const migrationsDir = path.resolve(baseDir, "../../migrations");
  const files = (await fs.readdir(migrationsDir)).filter((file) => file.endsWith(".sql")).sort();

  for (const file of files) {
    const sql = await fs.readFile(path.join(migrationsDir, file), "utf8");
    const checksum = sha256(sql);
    const existing = await db.query<{ checksum: string }>("select checksum from app.schema_migrations where id = $1", [file]);
    if (existing.rowCount && existing.rows[0]?.checksum === checksum) {
      continue;
    }
    if (existing.rowCount) {
      throw new Error(`Migration checksum mismatch for ${file}`);
    }

    const client = await db.connect();
    try {
      await client.query("begin");
      await client.query(sql);
      await client.query("insert into app.schema_migrations (id, checksum) values ($1, $2)", [file, checksum]);
      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  await ensureDemoData();
}

type DemoUser = {
  email: string;
  fullName: string;
  role: "admin" | "user";
  title: string;
  avatarUrl: string;
};

type DemoStory = {
  by: string;
  image: string;
  hoursToLive: number;
};

type DemoPost = {
  by: string;
  content: string;
  image?: string;
  comments?: Array<{ by: string; text: string }>;
};

const demoUsers: DemoUser[] = [
  {
    email: "admin@hideddy.community",
    fullName: "Deddy Admin",
    role: "admin",
    title: "Amministratore",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop"
  },
  {
    email: "lucia.f@hideddy.community",
    fullName: "Lucia F.",
    role: "user",
    title: "Responsabile Qualita",
    avatarUrl: "https://i.pravatar.cc/150?u=lucia"
  },
  {
    email: "roberto.b@hideddy.community",
    fullName: "Roberto B.",
    role: "user",
    title: "Agente Centro",
    avatarUrl: "https://i.pravatar.cc/150?u=roberto"
  },
  {
    email: "supporto.it@hideddy.community",
    fullName: "Supporto IT",
    role: "user",
    title: "Tecnico",
    avatarUrl: "https://i.pravatar.cc/150?u=it"
  },
  {
    email: "giulia.rossi@hideddy.community",
    fullName: "Giulia Rossi",
    role: "user",
    title: "Commerciale",
    avatarUrl: "https://images.unsplash.com/photo-1610387694365-19fafcc86d86?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=160"
  },
  {
    email: "marco.g@hideddy.community",
    fullName: "Marco G.",
    role: "user",
    title: "Logistica",
    avatarUrl: "https://i.pravatar.cc/150?u=marco-g"
  },
  {
    email: "antonio.r@hideddy.community",
    fullName: "Antonio R.",
    role: "user",
    title: "Magazzino",
    avatarUrl: "https://i.pravatar.cc/150?u=antonio-r"
  },
  {
    email: "sara.m@hideddy.community",
    fullName: "Sara Marchetti",
    role: "user",
    title: "Qualita",
    avatarUrl: "https://i.pravatar.cc/150?u=sara-m"
  },
  {
    email: "davide.r@hideddy.community",
    fullName: "Davide Romano",
    role: "user",
    title: "IT",
    avatarUrl: "https://i.pravatar.cc/150?u=davide-r"
  },
  {
    email: "marta.l@hideddy.community",
    fullName: "Marta Lombardi",
    role: "user",
    title: "Amministrazione",
    avatarUrl: "https://i.pravatar.cc/150?u=marta-l"
  },
  {
    email: "luca.ferrari@hideddy.community",
    fullName: "Luca Ferrari",
    role: "user",
    title: "Produzione",
    avatarUrl: "https://i.pravatar.cc/150?u=luca-ferrari"
  },
  {
    email: "andrea.conti@hideddy.community",
    fullName: "Andrea Conti",
    role: "user",
    title: "Acquisti",
    avatarUrl: "https://i.pravatar.cc/150?u=andrea-conti"
  },
  {
    email: "elena.v@hideddy.community",
    fullName: "Elena V.",
    role: "user",
    title: "Customer Care",
    avatarUrl: "https://i.pravatar.cc/150?u=elena-v"
  },
  {
    email: "paolo.n@hideddy.community",
    fullName: "Paolo Neri",
    role: "user",
    title: "Spedizioni",
    avatarUrl: "https://i.pravatar.cc/150?u=paolo-neri"
  },
  {
    email: "francesca.d@hideddy.community",
    fullName: "Francesca D.",
    role: "user",
    title: "HR",
    avatarUrl: "https://i.pravatar.cc/150?u=francesca-d"
  }
];

const demoStories: DemoStory[] = [
  { by: "admin@hideddy.community", image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1080", hoursToLive: 12 },
  { by: "lucia.f@hideddy.community", image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1080", hoursToLive: 12 },
  { by: "giulia.rossi@hideddy.community", image: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=1080", hoursToLive: 12 },
  { by: "marco.g@hideddy.community", image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1080", hoursToLive: 12 },
  { by: "antonio.r@hideddy.community", image: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=1080", hoursToLive: 12 },
  { by: "davide.r@hideddy.community", image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1080", hoursToLive: 12 },
  { by: "marta.l@hideddy.community", image: "https://images.unsplash.com/photo-1483058712412-4245e9b90334?w=1080", hoursToLive: 12 },
  { by: "luca.ferrari@hideddy.community", image: "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=1080", hoursToLive: 12 },
  { by: "andrea.conti@hideddy.community", image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1080", hoursToLive: 12 },
  { by: "elena.v@hideddy.community", image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1080", hoursToLive: 12 },
  { by: "paolo.n@hideddy.community", image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1080", hoursToLive: 12 },
  { by: "francesca.d@hideddy.community", image: "https://images.unsplash.com/photo-1573497161079-f3fd25cc6b90?w=1080", hoursToLive: 12 }
];

const demoPosts: DemoPost[] = [
  {
    by: "giulia.rossi@hideddy.community",
    content: "Team commerciale allineato: oggi priorita su clienti nuovi area nord.",
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
    comments: [{ by: "marco.g@hideddy.community", text: "Interfaccia molto piu veloce del vecchio flusso." }]
  },
  {
    by: "marco.g@hideddy.community",
    content: "Lotto 445 in chiusura, picking list condivisa in chat interna.",
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200",
    comments: [{ by: "roberto.b@hideddy.community", text: "Ottimo, preparo il giro clienti." }]
  },
  {
    by: "lucia.f@hideddy.community",
    content: "Campionamenti completati. Domani rilascio report qualita in dashboard.",
    comments: [{ by: "sara.m@hideddy.community", text: "Grande, ti supporto sulla parte documentale." }]
  },
  {
    by: "luca.ferrari@hideddy.community",
    content: "Linea confezionamento 3 pronta. Test conclusi senza blocchi.",
    image: "https://images.unsplash.com/photo-1565791380713-1756b9a2a5f0?w=1200",
    comments: [{ by: "admin@hideddy.community", text: "Perfetto, aggiorna anche il canale Produzione." }]
  },
  {
    by: "andrea.conti@hideddy.community",
    content: "Ricevuti nuovi preventivi fornitori, confronto prezzi in corso.",
    comments: [{ by: "marta.l@hideddy.community", text: "Mandami il riepilogo per amministrazione." }]
  },
  {
    by: "paolo.n@hideddy.community",
    content: "Spedizioni area centro allineate: oggi 14 consegne confermate.",
    image: "https://images.unsplash.com/photo-1494412651409-8963ce7935a7?w=1200"
  },
  {
    by: "elena.v@hideddy.community",
    content: "Nuovo template risposta clienti attivo da oggi.",
    comments: [{ by: "roberto.b@hideddy.community", text: "Ottimo, lo uso subito con i nuovi lead." }]
  },
  {
    by: "francesca.d@hideddy.community",
    content: "Workshop interno venerdi ore 15:00 su processi e sicurezza.",
    image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200"
  }
];

async function ensureDemoData(): Promise<void> {
  const passwordHash = await hashPassword(ADMIN_PASSWORD);
  const userIds = new Map<string, string>();

  for (const user of demoUsers) {
    const result = await db.query<{ id: string }>(
      `insert into app.users (email, password_hash, full_name, role, title, avatar_url, bio, is_active)
       values ($1, $2, $3, $4, $5, $6, $7, true)
       on conflict (email) do update
       set full_name = excluded.full_name,
           role = excluded.role,
           title = excluded.title,
           avatar_url = excluded.avatar_url,
           bio = coalesce(app.users.bio, excluded.bio),
           is_active = true,
           updated_at = now()
       returning id::text`,
      [user.email, passwordHash, user.fullName, user.role, user.title, user.avatarUrl, "hi deddy community"]
    );
    userIds.set(user.email, result.rows[0]!.id);
  }

  for (const story of demoStories) {
    const authorId = userIds.get(story.by);
    if (!authorId) continue;
    const exists = await db.query(
      `select 1
       from app.stories
       where author_id = $1::uuid and image_url = $2 and expires_at > now()
       limit 1`,
      [authorId, story.image]
    );
    if (!exists.rowCount) {
      await db.query(
        "insert into app.stories (author_id, image_url, expires_at) values ($1::uuid, $2, now() + ($3 || ' hours')::interval)",
        [authorId, story.image, story.hoursToLive]
      );
    }
  }

  for (const post of demoPosts) {
    const authorId = userIds.get(post.by);
    if (!authorId) continue;
    let postId: string | null = null;

    const existingPost = await db.query<{ id: string }>(
      `select id::text
       from app.posts
       where author_id = $1::uuid and content = $2
       order by created_at asc
       limit 1`,
      [authorId, post.content]
    );

    if (existingPost.rowCount) {
      postId = existingPost.rows[0]!.id;
    } else {
      const inserted = await db.query<{ id: string }>(
        "insert into app.posts (author_id, content, image_url) values ($1::uuid, $2, $3) returning id::text",
        [authorId, post.content, post.image ?? null]
      );
      postId = inserted.rows[0]!.id;
    }

    for (const comment of post.comments ?? []) {
      const commentAuthorId = userIds.get(comment.by);
      if (!commentAuthorId || !postId) continue;
      const existingComment = await db.query(
        `select 1
         from app.post_comments
         where post_id = $1::uuid and author_id = $2::uuid and content = $3
         limit 1`,
        [postId, commentAuthorId, comment.text]
      );
      if (!existingComment.rowCount) {
        await db.query(
          "insert into app.post_comments (post_id, author_id, content) values ($1::uuid, $2::uuid, $3)",
          [postId, commentAuthorId, comment.text]
        );
      }
    }
  }

  const adminId = userIds.get("admin@hideddy.community");
  const luciaId = userIds.get("lucia.f@hideddy.community");
  const giuliaId = userIds.get("giulia.rossi@hideddy.community");
  if (adminId && luciaId && giuliaId) {
    await db.query(
      `insert into app.user_follows (follower_id, following_id)
       values ($1::uuid, $2::uuid), ($1::uuid, $3::uuid), ($2::uuid, $1::uuid)
       on conflict do nothing`,
      [adminId, luciaId, giuliaId]
    );
  }
}

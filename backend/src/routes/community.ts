import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../lib/db.js";
import { ApiError } from "../lib/errors.js";

const mediaUrlSchema = z.string().refine(
  (v) => /^https?:\/\//i.test(v) || /^data:(image|video)\//i.test(v),
  "Invalid media URL"
);
const postSchema = z.object({ content: z.string().trim().min(1), imageUrl: mediaUrlSchema.optional() });
const commentSchema = z.object({ content: z.string().trim().min(1) });
const storySchema = z.object({ imageUrl: mediaUrlSchema, hoursToLive: z.number().int().min(1).max(48).optional() });

export async function communityRoutes(app: FastifyInstance): Promise<void> {
  async function notifyUser(userId: string, title: string, description: string | null) {
    await db.query(
      "insert into app.notifications (user_id,title,description) values ($1::uuid,$2,$3)",
      [userId, title, description]
    );
  }

  app.get("/api/v1/community/feed", { preHandler: [app.authenticate] }, async (request) => {
    const userId = request.user.sub;
    const posts = await db.query<{
      id: string; content: string; image_url: string | null; created_at: string;
      author_id: string; author_name: string; author_title: string | null; author_avatar: string | null;
      likes: number; comments_count: number;
    }>(`
      select p.id::text, p.content, p.image_url, p.created_at::text,
             u.id::text as author_id, u.full_name as author_name, u.title as author_title, u.avatar_url as author_avatar,
             coalesce(l.likes,0)::int as likes, coalesce(c.comments_count,0)::int as comments_count
      from app.posts p
      join app.users u on u.id = p.author_id
      left join (select post_id, count(*) as likes from app.post_reactions group by post_id) l on l.post_id = p.id
      left join (select post_id, count(*) as comments_count from app.post_comments group by post_id) c on c.post_id = p.id
      order by p.created_at desc
      limit 100
    `);

    const comments = await db.query<{ post_id: string; id: string; content: string; created_at: string; author_name: string }>(`
      select pc.post_id::text, pc.id::text, pc.content, pc.created_at::text, u.full_name as author_name
      from app.post_comments pc
      join app.users u on u.id = pc.author_id
      order by pc.created_at asc
    `);

    const myReactions = await db.query<{ post_id: string }>("select post_id::text from app.post_reactions where user_id=$1::uuid", [userId]);
    const mySaves = await db.query<{ post_id: string }>("select post_id::text from app.post_saves where user_id=$1::uuid", [userId]);

    const stories = await db.query<{ id: string; user_id: string; full_name: string; avatar_url: string | null; image_url: string; created_at: string; viewed: boolean }>(`
      select s.id::text, u.id::text as user_id, u.full_name, u.avatar_url, s.image_url, s.created_at::text,
             exists(select 1 from app.story_views sv where sv.story_id=s.id and sv.viewer_id=$1::uuid) as viewed
      from app.stories s
      join app.users u on u.id=s.author_id
      where s.expires_at > now()
      order by s.created_at desc
      limit 200
    `,[userId]);

    const suggestions = await db.query<{ id: string; full_name: string; title: string | null; avatar_url: string | null; is_following: boolean }>(`
      select u.id::text, u.full_name, u.title, u.avatar_url,
             exists(select 1 from app.user_follows f where f.follower_id=$1::uuid and f.following_id=u.id) as is_following
      from app.users u
      where u.id <> $1::uuid
      order by u.full_name asc
      limit 20
    `,[userId]);

    const commentsByPost = new Map<string, Array<any>>();
    for (const c of comments.rows) {
      if (!commentsByPost.has(c.post_id)) commentsByPost.set(c.post_id, []);
      commentsByPost.get(c.post_id)!.push({ id: c.id, user: c.author_name, text: c.content, createdAt: c.created_at });
    }
    const reactionSet = new Set(myReactions.rows.map((r) => r.post_id));
    const saveSet = new Set(mySaves.rows.map((r) => r.post_id));

    return {
      data: {
        posts: posts.rows.map((p) => ({
          id: p.id,
          author: { id: p.author_id, name: p.author_name, role: p.author_title, avatar: p.author_avatar },
          time: p.created_at,
          content: p.content,
          image: p.image_url,
          likes: p.likes,
          comments: commentsByPost.get(p.id) ?? [],
          isLiked: reactionSet.has(p.id),
          isSaved: saveSet.has(p.id)
        })),
        stories: stories.rows.map((s) => ({ id: s.id, userId: s.user_id, user: s.full_name, avatar: s.avatar_url, image: s.image_url, viewed: s.viewed, time: s.created_at })),
        suggestions: suggestions.rows.map((s) => ({ id: s.id, name: s.full_name, role: s.title, avatar: s.avatar_url, isFollowing: s.is_following }))
      }
    };
  });

  app.post("/api/v1/community/posts", { preHandler: [app.authenticate] }, async (request) => {
    const parsed = postSchema.safeParse(request.body);
    if (!parsed.success) throw new ApiError(400, "VALIDATION_ERROR", "Invalid payload", parsed.error.flatten());
    const res = await db.query<{ id: string }>("insert into app.posts (author_id, content, image_url) values ($1::uuid,$2,$3) returning id::text", [request.user.sub, parsed.data.content, parsed.data.imageUrl ?? null]);
    return { data: { id: res.rows[0]!.id } };
  });

  app.post("/api/v1/community/stories", { preHandler: [app.authenticate] }, async (request) => {
    const parsed = storySchema.safeParse(request.body);
    if (!parsed.success) throw new ApiError(400, "VALIDATION_ERROR", "Invalid payload", parsed.error.flatten());
    const ttl = parsed.data.hoursToLive ?? 12;
    const res = await db.query<{ id: string }>(
      "insert into app.stories (author_id, image_url, expires_at) values ($1::uuid,$2,now() + ($3 || ' hours')::interval) returning id::text",
      [request.user.sub, parsed.data.imageUrl, ttl]
    );
    return { data: { id: res.rows[0]!.id } };
  });

  app.post("/api/v1/community/posts/:id/comments", { preHandler: [app.authenticate] }, async (request) => {
    const id = (request.params as any).id;
    const parsed = commentSchema.safeParse(request.body);
    if (!parsed.success) throw new ApiError(400, "VALIDATION_ERROR", "Invalid payload", parsed.error.flatten());
    const author = await db.query<{ author_id: string; author_name: string }>(
      `select p.author_id::text, u.full_name as author_name
       from app.posts p
       join app.users u on u.id=p.author_id
       where p.id=$1::uuid`,
      [id]
    );
    await db.query("insert into app.post_comments (post_id, author_id, content) values ($1::uuid,$2::uuid,$3)", [id, request.user.sub, parsed.data.content]);
    if (author.rows[0] && author.rows[0].author_id !== request.user.sub) {
      const me = await db.query<{ full_name: string }>("select full_name from app.users where id=$1::uuid", [request.user.sub]);
      await notifyUser(author.rows[0].author_id, `${me.rows[0]?.full_name ?? "Utente"} ha commentato il tuo post`, parsed.data.content.slice(0, 80));
    }
    return { success: true };
  });

  app.post("/api/v1/community/posts/:id/like", { preHandler: [app.authenticate] }, async (request) => {
    const id = (request.params as any).id;
    const exists = await db.query("select 1 from app.post_reactions where post_id=$1::uuid and user_id=$2::uuid", [id, request.user.sub]);
    if (exists.rowCount) await db.query("delete from app.post_reactions where post_id=$1::uuid and user_id=$2::uuid", [id, request.user.sub]);
    else {
      await db.query("insert into app.post_reactions (post_id, user_id, reaction) values ($1::uuid,$2::uuid,'like')", [id, request.user.sub]);
      const owner = await db.query<{ author_id: string }>("select author_id::text from app.posts where id=$1::uuid", [id]);
      if (owner.rows[0] && owner.rows[0].author_id !== request.user.sub) {
        const me = await db.query<{ full_name: string }>("select full_name from app.users where id=$1::uuid", [request.user.sub]);
        await notifyUser(owner.rows[0].author_id, `${me.rows[0]?.full_name ?? "Utente"} ha messo like al tuo post`, null);
      }
    }
    return { success: true };
  });

  app.post("/api/v1/community/posts/:id/save", { preHandler: [app.authenticate] }, async (request) => {
    const id = (request.params as any).id;
    const exists = await db.query("select 1 from app.post_saves where post_id=$1::uuid and user_id=$2::uuid", [id, request.user.sub]);
    if (exists.rowCount) await db.query("delete from app.post_saves where post_id=$1::uuid and user_id=$2::uuid", [id, request.user.sub]);
    else await db.query("insert into app.post_saves (post_id, user_id) values ($1::uuid,$2::uuid)", [id, request.user.sub]);
    return { success: true };
  });

  app.post("/api/v1/community/users/:id/follow", { preHandler: [app.authenticate] }, async (request) => {
    const targetId = (request.params as any).id as string;
    const me = request.user.sub;
    if (targetId === me) throw new ApiError(400, "VALIDATION_ERROR", "Cannot follow yourself");
    const exists = await db.query("select 1 from app.user_follows where follower_id=$1::uuid and following_id=$2::uuid", [me, targetId]);
    if (exists.rowCount) await db.query("delete from app.user_follows where follower_id=$1::uuid and following_id=$2::uuid", [me, targetId]);
    else {
      await db.query("insert into app.user_follows (follower_id, following_id) values ($1::uuid,$2::uuid)", [me, targetId]);
      const actor = await db.query<{ full_name: string }>("select full_name from app.users where id=$1::uuid", [me]);
      await notifyUser(targetId, `${actor.rows[0]?.full_name ?? "Utente"} ha iniziato a seguirti`, null);
    }
    return { success: true };
  });

  app.get("/api/v1/community/profile/me", { preHandler: [app.authenticate] }, async (request) => {
    const me = request.user.sub;
    const user = await db.query<{
      id: string; full_name: string; title: string | null; bio: string | null; avatar_url: string | null;
      posts_count: number; followers_count: number; following_count: number;
    }>(`
      select u.id::text, u.full_name, u.title, u.bio, u.avatar_url,
        (select count(*)::int from app.posts p where p.author_id=u.id) as posts_count,
        (select count(*)::int from app.user_follows f where f.following_id=u.id) as followers_count,
        (select count(*)::int from app.user_follows f where f.follower_id=u.id) as following_count
      from app.users u
      where u.id=$1::uuid
      limit 1
    `, [me]);
    if (!user.rows[0]) throw new ApiError(404, "NOT_FOUND", "User not found");

    const posts = await db.query<{ id: string; image_url: string | null; content: string; created_at: string }>(
      "select id::text,image_url,content,created_at::text from app.posts where author_id=$1::uuid order by created_at desc limit 120",
      [me]
    );

    return {
      data: {
        id: user.rows[0].id,
        name: user.rows[0].full_name,
        username: user.rows[0].full_name.toLowerCase().replace(/\s+/g, "_"),
        title: user.rows[0].title,
        bio: user.rows[0].bio,
        avatar: user.rows[0].avatar_url,
        stats: {
          posts: user.rows[0].posts_count,
          followers: user.rows[0].followers_count,
          following: user.rows[0].following_count
        },
        posts: posts.rows.map((p) => ({ id: p.id, image: p.image_url, content: p.content, createdAt: p.created_at }))
      }
    };
  });
}

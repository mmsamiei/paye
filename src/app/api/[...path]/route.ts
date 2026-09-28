import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import sharp from 'sharp';
import { db, rows, transaction } from '@/lib/db';
import { event, getViewer, isAdmin, type Viewer } from '@/lib/auth';
import { avatarSql, getPost, parseId, postSelect, readable, type Post } from '@/lib/posts';
import { createSpace, listSpaces, spaceColumns, updateSpace } from '@/lib/spaces';

export const runtime = 'nodejs';
type Context = { params: Promise<{ path: string[] }> };
const json = (data: unknown, status = 200) => NextResponse.json(data, { status });
const body = async (request: NextRequest) => { try { return await request.json(); } catch { throw new Error('Invalid JSON'); } };
const postInput = z.object({ body: z.string().trim().min(1).max(4000), visibility: z.enum(['public','private']), space_id: z.string().regex(/^[1-9]\d*$/).nullable().optional() });
const commentInput = z.object({ body: z.string().trim().min(1).max(2000) });
const id = (path: string[], index: number) => parseId(path[index]);
const adminOnly = (viewer: Viewer) => { if (!isAdmin(viewer)) throw new Error('Forbidden'); };
async function rateLimit(viewer: Viewer, name: string, max: number, minutes: number) {
  const [count] = await rows<{ count: string }>(db, `SELECT count(*)::text AS count FROM analytics_events WHERE user_id=$1 AND name=$2 AND created_at>now()-($3::int * interval '1 minute')`, [viewer.id,name,minutes]);
  if (Number(count.count) >= max) throw new Error('Rate limit exceeded');
}
async function existsSpace(spaceId: string | null | undefined) {
  if (!spaceId) return;
  const [space] = await rows(db, 'SELECT id FROM spaces WHERE id=$1', [spaceId]);
  if (!space) throw new Error('Space not found');
}
async function notification(userId: string, actorId: string, kind: string, postId?: string, commentId?: string) {
  if (userId !== actorId) await db.query('INSERT INTO notifications (user_id,actor_id,kind,post_id,comment_id) VALUES ($1,$2,$3,$4,$5)', [userId,actorId,kind,postId || null,commentId || null]);
}
function cursor(url: URL) {
  const raw = url.searchParams.get('cursor');
  if (!raw) return null;
  const [date, key] = raw.split('|');
  if (!date || !Number.isFinite(Date.parse(date)) || !/^[1-9]\d*$/.test(key || '')) throw new Error('Invalid cursor');
  return { date, key };
}
async function feed(request: NextRequest, viewer: Viewer, where: string, args: unknown[]) {
  const page = cursor(request.nextUrl);
  const limit = 20;
  const values = [viewer.id, ...args];
  let sql = `${postSelect} WHERE p.deleted_at IS NULL AND u.disabled_at IS NULL AND ${readable} AND (${where})`;
  if (page) { values.push(page.date,page.key); sql += ` AND (p.created_at,p.id)<($${values.length-1}::timestamptz,$${values.length}::bigint)`; }
  values.push(limit + 1);
  sql += ` ORDER BY p.created_at DESC,p.id DESC LIMIT $${values.length}`;
  const found = await rows<Post>(db, sql, values);
  const items = found.slice(0,limit);
  const last = items.at(-1);
  await event(db, viewer, 'feed_view', { scope: where === 'true' ? 'home' : 'filtered' });
  return json({ items, next_cursor: found.length > limit && last ? `${new Date(last.created_at).toISOString()}|${last.id}` : null });
}
async function handle(request: NextRequest, method: string, path: string[]) {
  const viewer = await getViewer(request);
  const [root, key, sub] = path;
  if (root === 'me') {
    if (method === 'GET' && !key) { const [avatar]=await rows<{avatar_url:string|null;has_custom_avatar:boolean}>(db,`SELECT ${avatarSql} AS avatar_url,ua.user_id IS NOT NULL AS has_custom_avatar FROM users u LEFT JOIN user_avatar_uploads ua ON ua.user_id=u.id WHERE u.id=$1`,[viewer.id]); await event(db,viewer,'session'); return json({ viewer:{...viewer,avatar_display_url:avatar.avatar_url,has_custom_avatar:avatar.has_custom_avatar}, admin: isAdmin(viewer) }); }
    if (method === 'PATCH' && !key) { const input=z.object({show_avatar:z.boolean()}).parse(await body(request)); await db.query('UPDATE users SET show_avatar=$2,updated_at=now() WHERE id=$1',[viewer.id,input.show_avatar]); return json({show_avatar:input.show_avatar}); }
    if (method === 'DELETE' && !key) { await transaction(async tx => { await tx.query('DELETE FROM users WHERE id=$1', [viewer.id]); }); return json({ ok:true }); }
    if (key === 'avatar' && !sub && method === 'POST') {
      const form=await request.formData();
      const file=form.get('image');
      if (!(file instanceof File) || !['image/jpeg','image/png','image/webp'].includes(file.type) || file.size===0 || file.size>4*1024*1024) return json({error:'عکس باید JPG، PNG یا WebP و حداکثر ۴ مگابایت باشد.'},400);
      let image:Buffer;
      try { const source=sharp(Buffer.from(await file.arrayBuffer()),{limitInputPixels:16_000_000,animated:false}); const metadata=await source.metadata(); if(!['jpeg','png','webp'].includes(metadata.format||''))throw new Error('Unsupported image'); image=await source.rotate().resize(256,256,{fit:'cover',position:'attention'}).webp({quality:82}).toBuffer(); }
      catch { return json({error:'فایل تصویر معتبر نیست.'},400); }
      if(image.length>524288)return json({error:'اندازهٔ تصویر پردازش‌شده بیش از حد است.'},400);
      await transaction(async tx=>{await tx.query('INSERT INTO user_avatar_uploads (user_id,image) VALUES ($1,$2) ON CONFLICT (user_id) DO UPDATE SET image=EXCLUDED.image,updated_at=now()',[viewer.id,image]);await tx.query('UPDATE users SET show_avatar=true,updated_at=now() WHERE id=$1',[viewer.id]);});
      return json({ok:true});
    }
    if (key === 'avatar' && !sub && method === 'DELETE') { await db.query('DELETE FROM user_avatar_uploads WHERE user_id=$1',[viewer.id]); return json({ok:true}); }
    if (method === 'GET' && key === 'notifications') return json({ items: await rows(db, `SELECT n.id,n.kind,n.post_id,n.comment_id,n.read_at,n.created_at,CASE WHEN u.disabled_at IS NULL THEN u.id ELSE NULL END AS actor_id,CASE WHEN u.disabled_at IS NULL THEN u.display_name ELSE NULL END AS actor_name,CASE WHEN u.disabled_at IS NULL THEN ${avatarSql} ELSE NULL END AS actor_avatar_url FROM notifications n LEFT JOIN users u ON u.id=n.actor_id LEFT JOIN user_avatar_uploads ua ON ua.user_id=u.id WHERE n.user_id=$1 ORDER BY n.created_at DESC LIMIT 100`, [viewer.id]) });
    if (method === 'POST' && key === 'notifications' && sub) { await db.query('UPDATE notifications SET read_at=now() WHERE id=$1 AND user_id=$2', [id(path,2),viewer.id]); return json({ ok:true }); }
  }
  if (root === 'feed' && method === 'GET') return feed(request,viewer,'true',[]);
  if (root === 'posts') {
    if (method === 'POST' && !key) {
      await rateLimit(viewer,'post_created',5,60);
      const input = postInput.parse(await body(request)); await existsSpace(input.space_id);
      const [created] = await rows<{ id: string }>(db, 'INSERT INTO posts (author_id,body,visibility,space_id) VALUES ($1,$2,$3,$4) RETURNING id', [viewer.id,input.body,input.visibility,input.space_id || null]);
      await event(db,viewer,'post_created',{ post_id:created.id }); return json({ id:created.id },201);
    }
    const postId = id(path,1);
    if (method === 'GET' && !sub) { const post = await getPost(postId,viewer); return post ? json({ post }) : json({ error:'Not found' },404); }
    if (method === 'PATCH' && !sub) {
      const input = postInput.partial().parse(await body(request)); await existsSpace(input.space_id);
      const [updated] = await rows(db, `UPDATE posts SET body=COALESCE($3,body),visibility=COALESCE($4,visibility),space_id=CASE WHEN $5 THEN $6 ELSE space_id END,updated_at=now() WHERE id=$1 AND author_id=$2 AND deleted_at IS NULL RETURNING id`, [postId,viewer.id,input.body ?? null,input.visibility ?? null,Object.hasOwn(input,'space_id'),input.space_id ?? null]);
      return updated ? json({ ok:true }) : json({ error:'Not found' },404);
    }
    if (method === 'DELETE' && !sub) {
      const [deleted] = await rows(db, 'UPDATE posts SET deleted_at=now() WHERE id=$1 AND author_id=$2 AND deleted_at IS NULL RETURNING id', [postId,viewer.id]);
      return deleted ? json({ ok:true }) : json({ error:'Not found' },404);
    }
    if (sub === 'comments') {
      const post = await getPost(postId,viewer); if (!post) return json({ error:'Not found' },404);
      if (method === 'GET') return json({ items: await rows(db, `SELECT c.id,c.post_id,c.author_id,c.body,c.created_at,u.display_name,${avatarSql} AS avatar_url FROM comments c JOIN users u ON u.id=c.author_id LEFT JOIN user_avatar_uploads ua ON ua.user_id=u.id WHERE c.post_id=$1 AND c.deleted_at IS NULL AND u.disabled_at IS NULL ORDER BY c.created_at,c.id LIMIT 100`, [postId]) });
      if (method === 'POST') { await rateLimit(viewer,'comment_created',20,60); const input=commentInput.parse(await body(request)); const [created]=await rows<{id:string}>(db,`INSERT INTO comments (post_id,author_id,body) SELECT p.id,$2,$3 FROM posts p JOIN users u ON u.id=p.author_id WHERE p.id=$1 AND p.deleted_at IS NULL AND u.disabled_at IS NULL AND (p.visibility='public' OR p.author_id=$2 OR EXISTS (SELECT 1 FROM follows f WHERE f.follower_id=$2 AND f.followee_id=p.author_id AND f.status='accepted')) RETURNING id`,[postId,viewer.id,input.body]); if(!created)return json({error:'Not found'},404); await notification(post.author_id,viewer.id,'comment',postId,created.id); await event(db,viewer,'comment_created',{post_id:postId}); return json({id:created.id},201); }
    }
  }
  if (root === 'comments' && method === 'DELETE') { const [deleted]=await rows(db,'UPDATE comments SET deleted_at=now() WHERE id=$1 AND author_id=$2 AND deleted_at IS NULL RETURNING id',[id(path,1),viewer.id]); return deleted ? json({ok:true}) : json({error:'Not found'},404); }
  if (root === 'users') {
    const userId=id(path,1);
    if (method === 'GET' && !sub) {
      const [user]=await rows(db,`SELECT u.id,u.display_name,u.username,${avatarSql} AS avatar_url,u.show_avatar,ua.user_id IS NOT NULL AS has_custom_avatar,u.created_at FROM users u LEFT JOIN user_avatar_uploads ua ON ua.user_id=u.id WHERE u.id=$1 AND u.disabled_at IS NULL`,[userId]);
      if (!user) return json({error:'Not found'},404);
      const [relation]=await rows<{status:string}>(db,'SELECT status FROM follows WHERE follower_id=$1 AND followee_id=$2',[viewer.id,userId]);
      const [counts]=await rows(db,`SELECT (SELECT count(*) FROM follows WHERE followee_id=$1 AND status='accepted')::text AS followers,(SELECT count(*) FROM follows WHERE follower_id=$1 AND status='accepted')::text AS following`,[userId]);
      return json({user,follow_status:relation?.status || null,counts});
    }
    if (method === 'GET' && sub === 'posts') return feed(request,viewer,'p.author_id=$2',[userId]);
    if (method === 'GET' && (sub === 'followers' || sub === 'following')) return json({items:await rows(db,`SELECT u.id,u.display_name,u.username FROM follows f JOIN users u ON u.id=${sub==='followers'?'f.follower_id':'f.followee_id'} WHERE f.${sub==='followers'?'followee_id':'follower_id'}=$1 AND f.status='accepted' AND u.disabled_at IS NULL ORDER BY f.updated_at DESC LIMIT 100`,[userId])});
    if (sub === 'follow') {
      if (userId===viewer.id) throw new Error('Cannot follow yourself');
      if (method === 'POST') { await rateLimit(viewer,'follow_requested',20,1440); const [target]=await rows(db,'SELECT id FROM users WHERE id=$1 AND disabled_at IS NULL',[userId]); if(!target)return json({error:'Not found'},404);
        const [created]=await rows<{id:string}>(db,`INSERT INTO follows (follower_id,followee_id,status) VALUES ($1,$2,'pending') ON CONFLICT (follower_id,followee_id) DO NOTHING RETURNING id`,[viewer.id,userId]);
        if (!created) throw new Error('Request already exists'); await notification(userId,viewer.id,'follow_request'); await event(db,viewer,'follow_requested',{user_id:userId}); return json({id:created.id},201); }
      if (method === 'DELETE') { await db.query('DELETE FROM follows WHERE follower_id=$1 AND followee_id=$2',[viewer.id,userId]); return json({ok:true}); }
    }
  }
  if (root === 'follow-requests' && method === 'POST' && (sub==='accept'||sub==='reject')) {
    const requestId=id(path,1); const status=sub==='accept'?'accepted':'rejected';
    const [updated]=await rows<{follower_id:string}>(db,`UPDATE follows SET status=$3,updated_at=now() WHERE id=$1 AND followee_id=$2 AND status='pending' RETURNING follower_id`,[requestId,viewer.id,status]);
    if(!updated)return json({error:'Not found'},404);
    if(status==='accepted'){await notification(updated.follower_id,viewer.id,'follow_accepted');await event(db,viewer,'follow_accepted');}
    return json({ok:true});
  }
  if (root==='follow-requests' && method==='GET') return json({items:await rows(db,`SELECT f.id,f.follower_id,u.display_name,u.username,${avatarSql} AS avatar_url,f.created_at FROM follows f JOIN users u ON u.id=f.follower_id LEFT JOIN user_avatar_uploads ua ON ua.user_id=u.id WHERE f.followee_id=$1 AND f.status='pending' AND u.disabled_at IS NULL ORDER BY f.created_at DESC`,[viewer.id])});
  if (root==='spaces') {
    if(method==='GET'&&!key)return json({items:await listSpaces()});
    const spaceId=id(path,1);
    if(method==='GET'&&!sub){const [space]=await rows(db,`SELECT ${spaceColumns} FROM spaces WHERE id=$1`,[spaceId]);return space?json({space}):json({error:'Not found'},404);}
    if(method==='GET'&&sub==='posts')return feed(request,viewer,`p.space_id IN (WITH RECURSIVE descendants AS (SELECT id FROM spaces WHERE id=$2 UNION ALL SELECT s.id FROM spaces s JOIN descendants d ON s.parent_id=d.id) SELECT id FROM descendants)`,[spaceId]);
  }
  if (root==='reports'&&method==='POST') { const input=z.object({target_type:z.enum(['user','post','comment']),target_id:z.string().regex(/^[1-9]\d*$/),reason:z.string().trim().min(3).max(500)}).parse(await body(request));
    if(input.target_type==='post'&&!await getPost(input.target_id,viewer))return json({error:'Not found'},404);
    if(input.target_type==='comment'){const [target]=await rows<{post_id:string}>(db,'SELECT post_id FROM comments WHERE id=$1 AND deleted_at IS NULL',[input.target_id]);if(!target||!await getPost(target.post_id,viewer))return json({error:'Not found'},404);}
    if(input.target_type==='user'){const [target]=await rows(db,'SELECT id FROM users WHERE id=$1 AND disabled_at IS NULL',[input.target_id]);if(!target)return json({error:'Not found'},404);}
    await db.query('INSERT INTO reports (reporter_id,target_type,target_id,reason) VALUES ($1,$2,$3,$4)',[viewer.id,input.target_type,input.target_id,input.reason]);return json({ok:true},201); }
  if (root==='admin') {
    adminOnly(viewer);
    const segment=z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(2).max(80);
    const aliases=z.array(z.string().trim().min(2).max(80)).max(20);
    if(key==='spaces'&&method==='POST'){const input=z.object({name:z.string().trim().min(1).max(120),slug_segment:segment,parent_id:z.string().regex(/^[1-9]\d*$/).nullable().optional(),aliases:aliases.optional(),is_default:z.boolean().optional()}).parse(await body(request));return json({space:await createSpace(input)},201);}
    if(key==='spaces'&&method==='PATCH'){const spaceId=id(path,2);const input=z.object({name:z.string().trim().min(1).max(120).optional(),slug_segment:segment.optional(),parent_id:z.string().regex(/^[1-9]\d*$/).nullable().optional(),aliases:aliases.optional(),is_default:z.boolean().optional()}).parse(await body(request));const space=await updateSpace(spaceId,input);return space?json({space}):json({error:'Not found'},404);}
    if(key==='reports'&&method==='GET')return json({items:await rows(db,"SELECT * FROM reports WHERE status='open' ORDER BY created_at DESC LIMIT 100")});
    if(key==='reports'&&method==='PATCH'){await db.query("UPDATE reports SET status='resolved' WHERE id=$1",[id(path,2)]);return json({ok:true});}
    if(key==='posts'&&method==='DELETE'){await db.query('UPDATE posts SET deleted_at=now() WHERE id=$1',[id(path,2)]);return json({ok:true});}
    if(key==='comments'&&method==='DELETE'){await db.query('UPDATE comments SET deleted_at=now() WHERE id=$1',[id(path,2)]);return json({ok:true});}
    if(key==='users'&&method==='POST'&&path[3]==='disable'){await db.query('UPDATE users SET disabled_at=now() WHERE id=$1',[id(path,2)]);return json({ok:true});}
  }
  return json({error:'Not found'},404);
}
async function route(request: NextRequest, context: Context, method: string) {
  try { return await handle(request,method,(await context.params).path); }
  catch(error) { const message=error instanceof Error?error.message:'Unexpected error'; const code=typeof error==='object'&&error&&'code' in error?error.code:null; const status=error instanceof z.ZodError?400:/Telegram session|Telegram user|Account disabled/.test(message)?401:/Rate limit/.test(message)?429:/Forbidden/.test(message)?403:/not found/i.test(message)?404:code==='23505'||/Request already exists/.test(message)?409:/Invalid|Cannot/.test(message)?400:500; if(status===500)console.error(error); return json({error:status===500?'Server error':status===409?'این شناسه در همین فضا قبلاً استفاده شده است.':status===400&&error instanceof z.ZodError?'Invalid input':message},status); }
}
export const GET=(request:NextRequest,context:Context)=>route(request,context,'GET');
export const POST=(request:NextRequest,context:Context)=>route(request,context,'POST');
export const PATCH=(request:NextRequest,context:Context)=>route(request,context,'PATCH');
export const DELETE=(request:NextRequest,context:Context)=>route(request,context,'DELETE');

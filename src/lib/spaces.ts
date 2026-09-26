import { db, rows, transaction, type Sql } from './db.ts';

export type Space = {
  id: string;
  parent_id: string | null;
  name: string;
  slug_segment: string;
  slug: string;
  aliases: string[];
  is_default: boolean;
};

export const spaceColumns = 'id,parent_id,name,slug_segment,slug,aliases,is_default';

async function parentPath(sql: Sql, parentId: string | null): Promise<string> {
  if (!parentId) return '';
  const [parent] = await rows<{ slug: string }>(sql, 'SELECT slug FROM spaces WHERE id=$1', [parentId]);
  if (!parent) throw new Error('Invalid parent space');
  return parent.slug;
}

export async function createSpace(input: {
  name: string;
  slug_segment: string;
  parent_id?: string | null;
  aliases?: string[];
  is_default?: boolean;
}): Promise<Space> {
  return transaction(async sql => {
    const parent = await parentPath(sql, input.parent_id || null);
    const slug = parent ? `${parent}/${input.slug_segment}` : input.slug_segment;
    const [space] = await rows<Space>(sql,
      `INSERT INTO spaces (name,slug_segment,slug,parent_id,aliases,is_default)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING ${spaceColumns}`,
      [input.name,input.slug_segment,slug,input.parent_id || null,input.aliases || [],input.is_default || false]);
    return space;
  });
}

export async function updateSpace(spaceId: string, input: {
  name?: string;
  slug_segment?: string;
  parent_id?: string | null;
  aliases?: string[];
  is_default?: boolean;
}): Promise<Space | null> {
  return transaction(async sql => {
    const [current] = await rows<Space>(sql, `SELECT ${spaceColumns} FROM spaces WHERE id=$1 FOR UPDATE`, [spaceId]);
    if (!current) return null;
    const parentId = input.parent_id === undefined ? current.parent_id : input.parent_id;
    if (parentId) {
      const [cycle] = await rows(sql, `WITH RECURSIVE descendants AS (
        SELECT id FROM spaces WHERE id=$1
        UNION ALL SELECT child.id FROM spaces child JOIN descendants d ON child.parent_id=d.id
      ) SELECT id FROM descendants WHERE id=$2`, [spaceId,parentId]);
      if (cycle) throw new Error('Invalid parent space');
    }
    const parent = await parentPath(sql, parentId);
    const segment = input.slug_segment ?? current.slug_segment;
    const newSlug = parent ? `${parent}/${segment}` : segment;
    if (input.is_default) await sql.query('UPDATE spaces SET is_default=false WHERE is_default=true');
    await sql.query(`UPDATE spaces SET name=$2,slug_segment=$3,parent_id=$4,aliases=$5,is_default=$6
      WHERE id=$1`, [spaceId,input.name ?? current.name,segment,parentId,input.aliases ?? current.aliases,input.is_default ?? current.is_default]);
    await sql.query(`WITH RECURSIVE branch AS (
      SELECT id,$2::text AS path FROM spaces WHERE id=$1
      UNION ALL SELECT child.id, branch.path || '/' || child.slug_segment
      FROM spaces child JOIN branch ON child.parent_id=branch.id
    ) UPDATE spaces SET slug=branch.path FROM branch WHERE spaces.id=branch.id`, [spaceId,newSlug]);
    const [space] = await rows<Space>(sql, `SELECT ${spaceColumns} FROM spaces WHERE id=$1`, [spaceId]);
    return space;
  });
}

export async function listSpaces(): Promise<Space[]> {
  return rows<Space>(db, `SELECT ${spaceColumns} FROM spaces ORDER BY slug`);
}

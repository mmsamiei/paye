import { NextResponse } from 'next/server';
import { db, rows } from '@/lib/db';

export const runtime='nodejs';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  if(!/^[1-9]\d*$/.test(id))return new NextResponse(null,{status:404});
  const [avatar]=await rows<{image:Buffer}>(db,'SELECT ua.image FROM user_avatar_uploads ua JOIN users u ON u.id=ua.user_id WHERE u.id=$1 AND u.show_avatar AND u.disabled_at IS NULL',[id]);
  if(!avatar)return new NextResponse(null,{status:404});
  return new NextResponse(new Uint8Array(avatar.image),{headers:{'Content-Type':'image/webp','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}

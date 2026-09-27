'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SpacePicker, { type SpaceOption } from './SpacePicker';
import { useApi } from '@/lib/client-api';
import Avatar from './Avatar';

export default function ComposePost(){
  const api=useApi();
  const router=useRouter();
  const [author,setAuthor]=useState('');
  const [authorAvatar,setAuthorAvatar]=useState<string|null>(null);
  const [spaces,setSpaces]=useState<SpaceOption[]>([]);
  const [spaceId,setSpaceId]=useState('');
  const [body,setBody]=useState('');
  const [visibility,setVisibility]=useState<'public'|'private'>('public');
  const [ready,setReady]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');

  useEffect(()=>{
    window.Telegram?.WebApp?.ready();window.Telegram?.WebApp?.expand();
    Promise.all([api<{viewer:{display_name:string;avatar_url:string|null;show_avatar:boolean}}>('me'),api<{items:SpaceOption[]}>('spaces')])
      .then(([me,data])=>{setAuthor(me.viewer.display_name);setAuthorAvatar(me.viewer.show_avatar?me.viewer.avatar_url:null);setSpaces(data.items);const requestedSpace=new URLSearchParams(window.location.search).get('space');setSpaceId(data.items.find(space=>space.id===requestedSpace)?.id||'');setReady(true);})
      .catch(err=>{setError(err instanceof Error?err.message:'خطا در بارگذاری');setReady(true);});
  },[api]);

  const publish=async()=>{
    setError('');setBusy(true);
    try{
      const result=await api<{id:string}>('posts',{method:'POST',body:JSON.stringify({body,visibility,space_id:spaceId||null})});
      router.replace(`/posts/${result.id}`);
    }catch(err){setError(err instanceof Error?err.message:'انتشار انجام نشد');setBusy(false);}
  };

  return <div className="shell compose-shell">
    <div className="compose-header"><a href="/" aria-label="بستن صفحهٔ نوشتن">لغو</a><strong>پست جدید</strong><button className="primary" disabled={!ready||busy||!body.trim()} onClick={publish}>انتشار</button></div>
    {error&&<div className="error" role="alert">{error}</div>}
    {ready&&<main className="compose-main"><div className="compose-author"><Avatar name={author} url={authorAvatar}/><strong>{author}</strong></div>
      <textarea className="compose-text" autoFocus placeholder="چه چیزی توی ذهنته؟" value={body} onChange={event=>setBody(event.target.value)} maxLength={4000} aria-label="متن پست"/>
      <div className="compose-count">{body.length.toLocaleString('fa-IR')} / ۴٬۰۰۰</div>
      <div className="compose-settings"><label>نمایش<select value={visibility} onChange={event=>setVisibility(event.target.value as 'public'|'private')}><option value="public">عمومی</option><option value="private">فقط دنبال‌کنندگان پذیرفته‌شده</option></select></label><label>فضا<SpacePicker spaces={spaces} value={spaceId} onChange={setSpaceId} emptyLabel="بدون فضا" placeholder="جست‌وجوی فضا برای پست"/></label></div>
    </main>}
  </div>;
}

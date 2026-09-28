'use client';
import { useEffect, useState } from 'react';

export default function Avatar({name,url,small=false}:{name:string;url?:string|null;small?:boolean}){
  const [failed,setFailed]=useState(false);
  useEffect(()=>setFailed(false),[url]);
  const safeUrl=url?.startsWith('https://') || /^\/api\/avatars\/[1-9]\d*(\?v=\d+)?$/.test(url||'') ? url : null;
  return <span className={`avatar${small?' avatar-small':''}`} aria-hidden="true">
    {safeUrl&&!failed?<img src={safeUrl} alt="" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>:<span>{name.trim()[0]||'پ'}</span>}
  </span>;
}

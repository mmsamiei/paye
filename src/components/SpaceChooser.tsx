'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { spaceLabel, type SpaceOption } from './SpacePicker';

const recentKey='paye-recent-spaces';
const normalize=(text:string)=>text.toLocaleLowerCase('fa').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[۰-۹]/g,char=>String(char.charCodeAt(0)-1776)).replace(/[٠-٩]/g,char=>String(char.charCodeAt(0)-1632)).trim();

export default function SpaceChooser({spaces,value,onChange,mode}:{spaces:SpaceOption[];value:string;onChange:(id:string)=>void;mode:'feed'|'compose'}){
  const [open,setOpen]=useState(false);
  const [query,setQuery]=useState('');
  const [parentId,setParentId]=useState<string|null>(null);
  const [recent,setRecent]=useState<string[]>([]);
  const closeButton=useRef<HTMLButtonElement>(null);
  const dialog=useRef<HTMLElement>(null);
  const searchInput=useRef<HTMLInputElement>(null);
  const trigger=useRef<HTMLButtonElement>(null);
  const byId=useMemo(()=>new Map(spaces.map(space=>[space.id,space])),[spaces]);
  const selected=byId.get(value);
  const emptyLabel=mode==='feed'?'همهٔ پست‌ها':'بدون Space';
  const label=selected?spaceLabel(selected,spaces):emptyLabel;
  const currentParent=parentId?byId.get(parentId):null;
  const children=spaces.filter(space=>space.parent_id===parentId);
  const recentSpaces=recent.map(id=>byId.get(id)).filter((space):space is SpaceOption=>Boolean(space));
  const terms=normalize(query).split(/\s+/).filter(Boolean);
  const matches=terms.length?spaces.filter(space=>{
    const haystack=normalize(`${spaceLabel(space,spaces)} ${space.slug} ${space.aliases.join(' ')}`);
    return terms.every(term=>haystack.includes(term));
  }).slice(0,30):[];

  useEffect(()=>{
    if(!open)return;
    const before=document.body.style.overflow;
    document.body.style.overflow='hidden';
    closeButton.current?.focus();
    const onKeyDown=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){event.preventDefault();setOpen(false);return;}
      if(event.key!=='Tab')return;
      const focusable=[...(dialog.current?.querySelectorAll<HTMLButtonElement|HTMLInputElement>('button:not(:disabled),input:not(:disabled)')||[])];
      const first=focusable[0],last=focusable.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
    };
    document.addEventListener('keydown',onKeyDown);
    return()=>{document.body.style.overflow=before;document.removeEventListener('keydown',onKeyDown);trigger.current?.focus();};
  },[open]);

  const show=()=>{
    try{const saved=JSON.parse(localStorage.getItem(recentKey)||'[]');setRecent(Array.isArray(saved)?saved.filter((id):id is string=>typeof id==='string').slice(0,5):[]);}catch{setRecent([]);}
    setQuery('');setParentId(null);setOpen(true);
  };
  const choose=(id:string)=>{
    if(id){const next=[id,...recent.filter(item=>item!==id)].slice(0,5);setRecent(next);try{localStorage.setItem(recentKey,JSON.stringify(next));}catch{}}
    if(id!==value)onChange(id);
    setOpen(false);
  };
  const row=(space:SpaceOption,browsing=false)=>{
    const hasChildren=spaces.some(item=>item.parent_id===space.id);
    return <div className="space-choice-row" key={space.id}>
      <button type="button" className="space-choice" onClick={()=>choose(space.id)} aria-current={value===space.id?'true':undefined}>
        <strong>{space.name}</strong><small>{spaceLabel(space,spaces)}</small>
      </button>
      {browsing&&hasChildren&&<button type="button" className="space-drill" onClick={()=>setParentId(space.id)} aria-label={`نمایش زیر‌فضاهای ${space.name}`}>←</button>}
    </div>;
  };
  return <>
    <button ref={trigger} type="button" className={`space-select-trigger ${mode}`} onClick={show} aria-haspopup="dialog">
      <span className="space-select-title">{mode==='feed'?'فضای فید':'افزودن به Space · اختیاری'}</span>
      <span className="space-select-value">{label}</span><span className="space-select-arrow" aria-hidden="true">⌄</span>
    </button>
    {open&&<div className="space-dialog-backdrop" onClick={event=>{if(event.target===event.currentTarget)setOpen(false);}}>
      <section ref={dialog} className="space-dialog" role="dialog" aria-modal="true" aria-labelledby="space-dialog-title" dir="rtl">
        <div className="space-dialog-head"><h2 id="space-dialog-title">{mode==='feed'?'انتخاب فید':'انتخاب Space برای پست'}</h2><button ref={closeButton} type="button" onClick={()=>setOpen(false)} aria-label="بستن انتخاب فضا">×</button></div>
        <div className="space-search"><input ref={searchInput} type="text" inputMode="search" enterKeyHint="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="نام فضا، دانشگاه یا دانشکده را بنویس..." aria-label="جست‌وجوی فضا"/>{query&&<button type="button" onClick={()=>{setQuery('');searchInput.current?.focus();}} aria-label="پاک‌کردن جست‌وجو">×</button>}</div>
        <div className="space-dialog-body">
          {terms.length?<><p className="space-section-title">نتایج جست‌وجو</p>{matches.map(space=>row(space))}{!matches.length&&<p className="space-no-results">فضایی پیدا نشد. نام کوتاه‌تر یا نام والد را امتحان کن.</p>}{matches.length===30&&<p className="space-no-results">برای نتیجهٔ دقیق‌تر، واژهٔ دیگری هم بنویس.</p>}</>:
          <>
            {!parentId&&<><p className="space-section-title">انتخاب سریع</p><button type="button" className="space-empty-choice" onClick={()=>choose('')} aria-current={!value?'true':undefined}>{emptyLabel}</button>{selected&&!recent.includes(selected.id)&&row(selected)}{recentSpaces.length>0&&<><p className="space-section-title">فضاهای اخیر</p>{recentSpaces.map(space=>row(space))}</>}</>}
            <div className="space-browse-head">{currentParent?<><button type="button" onClick={()=>setParentId(currentParent.parent_id)}>→ بازگشت</button><span>{spaceLabel(currentParent,spaces)}</span></>:<p className="space-section-title">مرور فضاها</p>}</div>
            {children.map(space=>row(space,true))}
            {!children.length&&<p className="space-no-results">زیر‌فضای دیگری وجود ندارد.</p>}
          </>}
        </div>
      </section>
    </div>}
  </>;
}

'use client';
import { useMemo, useState } from 'react';

export type SpaceOption = { id:string; parent_id:string|null; name:string; slug:string; slug_segment:string; aliases:string[]; is_default:boolean };

export function spaceLabel(space:SpaceOption, spaces:SpaceOption[]):string {
  const names=[space.name];
  const seen=new Set([space.id]);
  let parentId=space.parent_id;
  while(parentId){
    const parent=spaces.find(candidate=>candidate.id===parentId);
    if(!parent||seen.has(parent.id))break;
    seen.add(parent.id);names.unshift(parent.name);parentId=parent.parent_id;
  }
  return names.join(' / ');
}

const normalize=(text:string)=>text.toLocaleLowerCase('fa').replace(/[يى]/g,'ی').replace(/ك/g,'ک').trim();
const recentKey='paye-recent-spaces';

export default function SpacePicker({spaces,value,onChange,emptyLabel,placeholder}:{
  spaces:SpaceOption[];value:string;onChange:(id:string)=>void;emptyLabel:string;placeholder:string;
}){
  const [open,setOpen]=useState(false);
  const [query,setQuery]=useState('');
  const [active,setActive]=useState(0);
  const [recent,setRecent]=useState<string[]>([]);
  const options=useMemo(()=>spaces.map(space=>({space,label:spaceLabel(space,spaces)})),[spaces]);
  const selected=options.find(option=>option.space.id===value);
  const matches=options.filter(option=>{
    const haystack=normalize(`${option.label} ${option.space.slug} ${option.space.aliases.join(' ')}`);
    return normalize(query).split(/\s+/).every(word=>haystack.includes(word));
  }).sort((a,b)=>query.trim()?0:(recent.includes(a.space.id)?recent.indexOf(a.space.id):999)-(recent.includes(b.space.id)?recent.indexOf(b.space.id):999)).slice(0,8);
  const choices=[...(query.trim()?[]:[{id:'',label:emptyLabel,slug:''}]),...matches.map(option=>({id:option.space.id,label:option.label,slug:option.space.slug}))];
  const choose=(id:string)=>{
    if(id){const updated=[id,...recent.filter(item=>item!==id)].slice(0,5);setRecent(updated);try{localStorage.setItem(recentKey,JSON.stringify(updated));}catch{}}
    onChange(id);setQuery('');setOpen(false);setActive(0);
  };
  return <div className="space-picker">
    <input role="combobox" aria-label={placeholder} aria-autocomplete="list" aria-expanded={open}
      placeholder={placeholder} value={open?query:(selected?.label||emptyLabel)}
      onFocus={()=>{try{const saved=JSON.parse(localStorage.getItem(recentKey)||'[]');if(Array.isArray(saved))setRecent(saved.filter(item=>typeof item==='string').slice(0,5));}catch{}setQuery('');setOpen(true);setActive(0);}}
      onChange={event=>{setQuery(event.target.value);setOpen(true);setActive(0);}}
      onBlur={()=>setTimeout(()=>setOpen(false),150)}
      onKeyDown={event=>{
        if(event.key==='ArrowDown'){event.preventDefault();setActive(index=>Math.min(index+1,Math.max(choices.length-1,0)));}
        if(event.key==='ArrowUp'){event.preventDefault();setActive(index=>Math.max(index-1,0));}
        if(event.key==='Enter'&&open&&choices[active]){event.preventDefault();choose(choices[active].id);}
        if(event.key==='Escape')setOpen(false);
      }}/>
    {open&&<div className="space-options" role="listbox">
      {choices.map((choice,index)=><button key={choice.id||'empty'} type="button" role="option" aria-selected={choice.id===value} className={index===active?'highlighted':''}
        onMouseDown={event=>event.preventDefault()} onClick={()=>choose(choice.id)}>
        <span>{choice.label}</span>{choice.slug&&<small>{choice.slug}</small>}
      </button>)}
      {!matches.length&&query&&<p>فضایی با این نام پیدا نشد.</p>}
    </div>}
  </div>;
}

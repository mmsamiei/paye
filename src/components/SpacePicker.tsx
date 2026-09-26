'use client';
import { useMemo, useState } from 'react';

export type SpaceOption = { id:string; parent_id:string|null; name:string; slug:string; slug_segment:string; is_default:boolean };

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

export default function SpacePicker({spaces,value,onChange,emptyLabel,placeholder}:{
  spaces:SpaceOption[];value:string;onChange:(id:string)=>void;emptyLabel:string;placeholder:string;
}){
  const [open,setOpen]=useState(false);
  const [query,setQuery]=useState('');
  const [active,setActive]=useState(0);
  const options=useMemo(()=>spaces.map(space=>({space,label:spaceLabel(space,spaces)})),[spaces]);
  const selected=options.find(option=>option.space.id===value);
  const matches=options.filter(option=>{
    const haystack=normalize(`${option.label} ${option.space.slug}`);
    return normalize(query).split(/\s+/).every(word=>haystack.includes(word));
  }).slice(0,8);
  const choices=[...(query.trim()?[]:[{id:'',label:emptyLabel,slug:''}]),...matches.map(option=>({id:option.space.id,label:option.label,slug:option.space.slug}))];
  const choose=(id:string)=>{onChange(id);setQuery('');setOpen(false);setActive(0);};
  return <div className="space-picker">
    <input role="combobox" aria-label={placeholder} aria-autocomplete="list" aria-expanded={open}
      placeholder={placeholder} value={open?query:(selected?.label||emptyLabel)}
      onFocus={()=>{setQuery('');setOpen(true);setActive(0);}}
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

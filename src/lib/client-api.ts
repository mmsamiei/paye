'use client';
import { useCallback } from 'react';

declare global {
  interface Window {
    Telegram?: { WebApp?: {
      initData:string;
      ready:()=>void;
      expand:()=>void;
      openTelegramLink?:(url:string)=>void;
    } };
  }
}

export function useApi(){
  return useCallback(async <T,>(path:string,options:RequestInit={}):Promise<T>=>{
    const token=window.Telegram?.WebApp?.initData;
    if(!token)throw new Error('پایه را از داخل تلگرام باز کنید.');
    const headers=new Headers(options.headers);
    if(!(options.body instanceof FormData))headers.set('Content-Type','application/json');
    headers.set('Authorization',`tma ${token}`);
    const response=await fetch(`/api/${path}`,{...options,headers});
    const result=await response.json();
    if(!response.ok)throw new Error(result.error||'درخواست انجام نشد');
    return result as T;
  },[]);
}

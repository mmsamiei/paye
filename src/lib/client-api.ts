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
    const response=await fetch(`/api/${path}`,{...options,headers:{'Content-Type':'application/json',Authorization:`tma ${token}`,...options.headers}});
    const result=await response.json();
    if(!response.ok)throw new Error(result.error||'درخواست انجام نشد');
    return result as T;
  },[]);
}

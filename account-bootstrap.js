'use strict';
window.EKV_ACCOUNT_SESSION_KEY='ekvivalent-auth-v1';
window.EKV_ACCOUNT_CACHE_PREFIX='ekvivalent-user-v1:';
window.EKV_ACCOUNT_BOOT=null;
try{const s=JSON.parse(localStorage.getItem(window.EKV_ACCOUNT_SESSION_KEY)||'null');if(s&&typeof s.access_token==='string'&&typeof s.refresh_token==='string'&&/^[a-f0-9-]{36}$/i.test(s.user?.id||''))window.EKV_ACCOUNT_BOOT=s;}catch(e){}

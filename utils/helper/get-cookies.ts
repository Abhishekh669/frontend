'use server'

import { cookies } from "next/headers";


export const get_cookies = async(name : string) =>{
    const cookie_store = await cookies();
    const token =  cookie_store.get(name)?.value;
    return token ? token : null;
}



export const delete_cookie = async(name : string) =>{
    const cookie_store = await cookies();
    cookie_store.delete(name);
    return true;
}


const initialState=Object.freeze({catalog:null,currentSong:null,activeView:"overview",search:"",categoryId:"",ready:false,error:null});
export function createState(){
  let value={...initialState};const listeners=new Set();
  return{get:()=>value,set(patch){value={...value,...patch};listeners.forEach(listener=>listener(value));},subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener);}};
}

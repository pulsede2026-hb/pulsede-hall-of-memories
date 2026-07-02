function assert(condition,message){if(!condition)throw new Error(`Katalogfehler: ${message}`);}
function validateCatalog(catalog){
  assert(catalog&&typeof catalog==="object","Kein gültiges Objekt");assert(catalog.schemaVersion===1,"Unbekannte schemaVersion");
  assert(Array.isArray(catalog.songs)&&catalog.songs.length>0,"Songs fehlen");assert(Array.isArray(catalog.categories)&&catalog.categories.length>0,"Kategorien fehlen");
  const songIds=new Set(),indexes=new Set();
  catalog.songs.forEach(song=>{assert(song.id&&!songIds.has(song.id),`Doppelte Song-ID ${song.id||"(leer)"}`);assert(Number.isInteger(song.playlistIndex),`Ungültiger Index bei ${song.id}`);assert(!indexes.has(song.playlistIndex),`Doppelter Index ${song.playlistIndex}`);assert(song.files?.audio&&song.files?.cover&&song.files?.lyrics,`Dateien fehlen bei ${song.id}`);songIds.add(song.id);indexes.add(song.playlistIndex);});
  assert(Math.min(...indexes)===0&&Math.max(...indexes)===catalog.songs.length-1,"Playlist-Indizes sind nicht fortlaufend");
  catalog.categories.forEach(category=>{assert(category.id&&Array.isArray(category.songIds),"Ungültige Kategorie");category.songIds.forEach(id=>assert(songIds.has(id),`${category.id} verweist auf unbekannten Song ${id}`));});
  return catalog;
}
export async function loadCatalog(path){const response=await fetch(path,{cache:"no-store"});if(!response.ok)throw new Error(`Katalog konnte nicht geladen werden (${response.status})`);return validateCatalog(await response.json());}
export function assetUrl(catalog,filename){return new URL(filename,new URL(catalog.basePath||"../",window.location.href)).href;}
export function categoriesForSong(catalog,songId){return catalog.categories.filter(category=>category.songIds.includes(songId));}

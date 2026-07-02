import{assetUrl,categoriesForSong}from"./catalog-service.js";
export function createUi({state,bridge}){
  const el={panels:[...document.querySelectorAll("[data-view-panel]")],nav:[...document.querySelectorAll("[data-view]")],status:document.querySelector("#system-status"),statusDot:document.querySelector("#system-dot"),error:document.querySelector("#app-error"),currentSong:document.querySelector("#current-song"),search:document.querySelector("#catalog-search"),filter:document.querySelector("#category-filter"),categoryGrid:document.querySelector("#category-grid"),songList:document.querySelector("#song-list"),resultCount:document.querySelector("#result-count"),songsMetric:document.querySelector("#metric-songs"),categoriesMetric:document.querySelector("#metric-categories"),featuredMetric:document.querySelector("#metric-featured")};
  function setView(view){state.set({activeView:view});el.panels.forEach(panel=>{panel.hidden=panel.dataset.viewPanel!==view;});el.nav.forEach(button=>{const active=button.dataset.view===view;button.classList.toggle("is-active",active);button.setAttribute("aria-pressed",String(active));});}
  function renderCategories(catalog){
    el.filter.replaceChildren(new Option("Alle Erlebnisordner",""));el.categoryGrid.replaceChildren();
    catalog.categories.forEach(category=>{
      el.filter.add(new Option(`${category.icon} ${category.number} ${category.title}`,category.id));
      const button=document.createElement("button");button.type="button";button.className="category-card";button.dataset.categoryId=category.id;button.setAttribute("aria-label",`${category.title}, ${category.songIds.length} Songs`);
      const image=document.createElement("img");image.src=assetUrl(catalog,category.cover);image.alt="";
      const label=document.createElement("span");label.textContent=`${category.icon} ${category.title} · ${category.songIds.length}`;
      button.append(image,label);button.addEventListener("click",()=>{const next=state.get().categoryId===category.id?"":category.id;el.filter.value=next;state.set({categoryId:next});renderSongList();});el.categoryGrid.append(button);
    });
  }
  function renderSongList(){
    const{catalog,search,categoryId}=state.get();if(!catalog)return;
    const term=search.trim().toLocaleLowerCase("de"),category=catalog.categories.find(item=>item.id===categoryId);
    const songs=catalog.songs.filter(song=>(!term||`${song.number} ${song.title}`.toLocaleLowerCase("de").includes(term))&&(!category||category.songIds.includes(song.id)));
    el.categoryGrid.querySelectorAll(".category-card").forEach(button=>button.classList.toggle("is-active",button.dataset.categoryId===categoryId));
    el.resultCount.textContent=`${songs.length} von ${catalog.songs.length} Songs`;el.songList.replaceChildren();
    if(!songs.length){const empty=document.createElement("p");empty.className="empty-state";empty.textContent="Keine passenden Songs gefunden.";el.songList.append(empty);return;}
    songs.forEach(song=>{
      const button=document.createElement("button");button.type="button";button.className="song-item";button.title="Im vorhandenen Hall-Player auswählen";
      const title=document.createElement("span");title.className="song-title";const number=document.createElement("span");number.className="song-number";number.textContent=song.number;title.append(number,` ${song.title}`);
      const meta=document.createElement("span");meta.className=song.featured?"featured":"";meta.textContent=song.featured?"★":`${categoriesForSong(catalog,song.id).length}×`;
      button.append(title,meta);button.addEventListener("click",()=>{bridge.selectSong(song.playlistIndex);setView("hall");});el.songList.append(button);
    });
  }
  function initialize(catalog){el.songsMetric.textContent=catalog.songs.length;el.categoriesMetric.textContent=catalog.categories.length;el.featuredMetric.textContent=catalog.songs.filter(song=>song.featured).length;renderCategories(catalog);renderSongList();el.status.textContent="Katalog und Hall bereit";el.statusDot.classList.add("is-ready");}
  el.nav.forEach(button=>button.addEventListener("click",()=>setView(button.dataset.view)));document.querySelector("#open-hall").addEventListener("click",()=>setView("hall"));document.querySelector("#back-overview").addEventListener("click",()=>setView("overview"));
  el.search.addEventListener("input",()=>{state.set({search:el.search.value});renderSongList();});el.filter.addEventListener("change",()=>{state.set({categoryId:el.filter.value});renderSongList();});
  state.subscribe(next=>{el.currentSong.textContent=next.currentSong?.title||"Noch kein Song ausgewählt";if(next.error){el.error.textContent=next.error;el.error.hidden=false;el.status.textContent="Fehler beim Start";el.statusDot.classList.add("is-error");}});
  return{initialize,setView};
}

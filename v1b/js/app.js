import{CONFIG}from"./config.js";import{loadCatalog}from"./catalog-service.js";import{HallBridge}from"./hm-bridge.js";import{createState}from"./state.js";import{createUi}from"./ui.js";
const state=createState();
const bridge=new HallBridge({playerFrame:document.querySelector("#hm-player-frame"),textFrame:document.querySelector("#hm-text-frame"),explorerFrame:document.querySelector("#hm-explorer-frame"),state,config:CONFIG});
const ui=createUi({state,bridge});bridge.start();
try{const catalog=await loadCatalog(CONFIG.catalogPath);state.set({catalog,ready:true});ui.initialize(catalog);}catch(error){console.error(error);state.set({error:`${error.message}. V1B lokal bitte über einen Webserver öffnen.`});}
window.addEventListener("beforeunload",()=>bridge.stop(),{once:true});

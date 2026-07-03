import { CONFIG } from "./config.js";
import { analyzeHmSuggestions } from "./core/hm-suggestion-service.js";
import { resolveTitleProposal, titleSourceLabel } from "./core/title-service.js";

const el = Object.fromEntries([...document.querySelectorAll("[id]")].map(node => [node.id, node]));
let files = { mp3:null, jpg:null, txt:null };
let hmRules = { categories:[] };
let suggestions = [];
let hmConfirmed = false;
let baseline = null;
let busy = false;
let currentRun = null;
let workflow = null;

for (const category of CONFIG.hmCategories) {
  const label = document.createElement("label"); label.className = "hm-option"; label.dataset.hmId = category.id;
  const checkbox = document.createElement("input"); checkbox.type = "checkbox"; checkbox.name = "hm"; checkbox.value = category.id;
  const text = document.createElement("span"); text.textContent = `${category.icon} ${category.id} ${category.name}`;
  const evidence = document.createElement("small"); evidence.className = "hm-evidence"; evidence.hidden = true;
  const reason = document.createElement("small"); reason.className = "hm-reason"; reason.hidden = true;
  const status = document.createElement("small"); status.className = "hm-item-status"; status.hidden = true;
  label.append(checkbox, text, evidence, reason, status); el["hm-options"].append(label);
}

function selectedHm() { return [...document.querySelectorAll('input[name="hm"]:checked')].map(node => node.value).sort(); }
function setStatus(kind, text, intro) { el["status-badge"].className = `status-badge ${kind}`; el["status-badge"].textContent = text; if (intro) el["result-intro"].textContent = intro; }
function setErrors(messages) { el["errors-block"].hidden = !messages.length; el["errors-list"].replaceChildren(...messages.map(message => { const li=document.createElement("li"); li.textContent=message; return li; })); }
const workflowLabels = {
  recognized:["status-recognized","Erkannt"], prepared:["status-prepared","Vorbereitet"], localTested:["status-local","Lokal getestet"], hmConfirmed:["status-hm","HM bestätigt"], reserved:["status-reserved","Reserviert"], stemApproved:["status-stem-approved","Stammübernahme freigegeben"], stemIntegrated:["status-stem-integrated","Stamm übernommen"], githubApproved:["status-github-approved","GitHub freigegeben"], githubUpdated:["status-github-updated","GitHub aktualisiert"]
};
const guideLabels = { recognized:"Songpaket erkennen", hmConfirmed:"HM-Vorschläge prüfen und bestätigen", prepared:"Testpaket erzeugen", localTested:"Lokalen HOME-Test bestätigen", reserved:"Songnummer reservieren", stemApproved:"Stammübernahme freigeben", stemIntegrated:"Stamm vollständig übernehmen", githubApproved:"GitHub-Übernahme freigeben", githubUpdated:"GitHub aktualisieren" };
function renderGuide() {
  const fileReady=Boolean(files.mp3&&files.jpg&&files.txt&&el["song-title"].value.trim());
  const state={recognized:Boolean(workflow?.recognized||fileReady),hmConfirmed:Boolean(workflow?.hmConfirmed||hmConfirmed),prepared:Boolean(workflow?.prepared),localTested:Boolean(workflow?.localTested),reserved:Boolean(workflow?.reserved),stemApproved:Boolean(workflow?.stemApproved),stemIntegrated:Boolean(workflow?.stemIntegrated),githubApproved:Boolean(workflow?.githubApproved),githubUpdated:Boolean(workflow?.githubUpdated)};
  document.querySelectorAll("[data-guide]").forEach(item=>{const done=state[item.dataset.guide];item.classList.toggle("done",done);item.classList.toggle("active",!done&&Object.keys(guideLabels).find(key=>!state[key])===item.dataset.guide);});
  const keys=Object.keys(guideLabels); const currentIndex=keys.findIndex(key=>!state[key]);
  if(currentIndex<0){el["guide-current"].innerHTML="<strong>Abgeschlossen:</strong> Alle Schritte wurden vollständig durchgeführt.";el["guide-next"].innerHTML="<strong>Nächster Schritt:</strong> Neuer Song kann vorbereitet werden.";return;}
  el["guide-current"].innerHTML=`<strong>Aktuell:</strong> ${guideLabels[keys[currentIndex]]}`;
  el["guide-next"].innerHTML=`<strong>Danach:</strong> ${currentIndex+1<keys.length?guideLabels[keys[currentIndex+1]]:"Arbeitsabschnitt vollständig abschließen"}`;
}
function renderWorkflow() {
  const state = workflow || {};
  for (const [field,[id,label]] of Object.entries(workflowLabels)) { const done=Boolean(state[field]); el[id].textContent=`${label} ${done?"✅":"⬜"}`; el[id].classList.toggle("done",done); }
  el["approval-song"].textContent=currentRun?`${currentRun.number} ${currentRun.title}${currentRun.featured?" *":""}`:"–";
  el["approval-hm"].textContent=currentRun?currentRun.hm.map(id=>`HM ${id}`).join(" · "):"–";
  el["confirm-local-test"].disabled=!currentRun||Boolean(state.localTested);
  el["reserve-number"].disabled=!currentRun||!state.localTested||Boolean(state.reserved);
  el["approve-stem"].disabled=!state.reserved||Boolean(state.stemApproved);
  el["approve-github"].disabled=!state.stemIntegrated||Boolean(state.githubApproved);
  renderGuide();
}
async function workflowRequest(url,payload){const response=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});const result=await response.json();if(!response.ok)throw new Error(result.error||"Freigabeschritt fehlgeschlagen.");return result;}
function showRestoredRun(pending) {
  el["success-block"].hidden=false;
  el["success-summary"].textContent=`Song ${pending.number} ${pending.title} wurde als reservierter Lauf wieder aufgenommen.`;
  el["output-path"].textContent=`Song_Upgrade_V1C/runs/${pending.runName}`;
  el["test-link"].href=`./runs/${pending.runName}/testkopie/PulseDE_Home_A1_TESTRAHMEN_V4.html`;
  el["v1b-link"].href=`./runs/${pending.runName}/testkopie/v1b/index.html`;
  if(pending.stemApproved&&!pending.stemIntegrated)el["approval-message"].textContent="Stammübernahme ist bereits freigegeben. Nächster Schritt: vollständige Stammübernahme durch Codex.";
  else if(pending.reserved&&!pending.stemApproved)el["approval-message"].textContent="Nummer ist reserviert. Nächster Schritt: Stammübernahme freigeben.";
  else if(pending.stemIntegrated&&!pending.githubApproved)el["approval-message"].textContent="Stamm ist übernommen. Nächster Schritt: GitHub-Übernahme freigeben.";
  else if(pending.githubApproved&&!pending.githubUpdated)el["approval-message"].textContent="GitHub ist freigegeben. Nächster Schritt: geprüften Stand übertragen.";
  else el["approval-message"].textContent="Der reservierte Arbeitsstand wurde vollständig wiederhergestellt.";
  setStatus("neutral","Offener Run",`Song ${pending.number} ${pending.title}: Der nächste Arbeitsschritt ist sichtbar.`);
}
function exactFiles(chosen) {
  const result = { mp3:[], jpg:[], txt:[], other:[] };
  for (const file of chosen) { const ext=(file.name.match(/\.[^.]+$/)?.[0]||"").toLowerCase(); if(ext===".mp3")result.mp3.push(file); else if([".jpg",".jpeg"].includes(ext))result.jpg.push(file); else if(ext===".txt")result.txt.push(file); else result.other.push(file); }
  return result;
}
function traffic(ok, text) { const li=document.createElement("li"); li.className=ok?"ok":"bad"; li.textContent=(ok?"🟢 ":"🔴 ")+text; return li; }
function renderMandatory(groups = {mp3:[],jpg:[],txt:[]}) {
  const titleOk = Boolean(el["song-title"].value.trim());
  const hmOk = selectedHm().length > 0 && hmConfirmed;
  const starOk = ["yes","no"].includes(el.featured.value);
  const serverOk = Boolean(baseline);
  const items = [traffic(groups.mp3.length===1,"genau eine MP3 erkannt"),traffic(groups.jpg.length===1,"genau ein JPG/JPEG erkannt"),traffic(groups.txt.length===1,"genau eine TXT erkannt"),traffic(titleOk,"Songtitel erkannt"),traffic(hmOk,"HM-Vorschläge bestätigt"),traffic(starOk,"Sternstatus bestätigt"),traffic(serverOk,"Generator und Baseline bereit")];
  el["mandatory-list"].replaceChildren(...items);
  const ready = !busy && items.every(item=>item.classList.contains("ok")); el["generate-button"].disabled=!ready;
  if (ready) setStatus("complete","🟢 Bereit","Alle Pflichtangaben sind vollständig. Der sichere Generatorlauf kann beginnen.");
  renderGuide();
}
function invalidateHm(message="Vorschläge automatisch markiert – bitte bestätigen.") { hmConfirmed=false; el["hm-confirmation"].className="confirmation-state"; el["hm-confirmation"].textContent=message; }
function renderSuggestions(result) {
  suggestions=result.suggestions||[]; const ids=new Set(suggestions.map(item=>item.id));
  document.querySelectorAll(".hm-option").forEach(label=>{ const input=label.querySelector("input"), evidence=label.querySelector(".hm-evidence"), reason=label.querySelector(".hm-reason"), status=label.querySelector(".hm-item-status"), suggestion=suggestions.find(item=>item.id===input.value); input.checked=ids.has(input.value); label.classList.toggle("suggested",Boolean(suggestion)); evidence.hidden=!suggestion; reason.hidden=!suggestion; status.hidden=!suggestion; evidence.textContent=suggestion?`Treffer: ${suggestion.matchedTerms.join(", ")}`:""; reason.textContent=suggestion?`Begründung: ${suggestion.reason}`:""; status.textContent=suggestion?"Status: noch nicht durch Harald bestätigt":""; status.className="hm-item-status"; });
  el["hm-suggestion-summary"].textContent = !result.textAvailable ? "Kein Songtext verfügbar." : suggestions.length ? `Automatisch vorgeschlagen: ${suggestions.map(x=>`${x.id} ${x.name}`).join(" · ")}.` : "Keine eindeutigen Begriffe erkannt. Bitte HM-Bereiche auswählen.";
  invalidateHm();
}
async function analyzeFolder(chosen) {
  setErrors([]); el["success-block"].hidden=true; currentRun=null; workflow=null; const groups=exactFiles(chosen);
  files={mp3:groups.mp3[0]||null,jpg:groups.jpg[0]||null,txt:groups.txt[0]||null};
  const errors=[]; for(const kind of ["mp3","jpg","txt"]) if(groups[kind].length!==1) errors.push(`Erwartet wird genau eine ${kind.toUpperCase()}-Datei; gefunden: ${groups[kind].length}.`); if(groups.other.length) errors.push(`Nicht unterstützte Dateien im Ordner: ${groups.other.map(x=>x.name).join(", ")}`);
  const txtText=files.txt?await files.txt.text():""; const proposal=resolveTitleProposal({txtText,txtName:files.txt?.name||"",jpgName:files.jpg?.name||"",mp3Name:files.mp3?.name||""});
  el["song-title"].value=proposal.title; el["title-source"].textContent=`Titelquelle: ${titleSourceLabel(proposal.source)}`;
  renderSuggestions(analyzeHmSuggestions(txtText,hmRules));
  el["detected-block"].hidden=false; el["detected-mp3"].textContent=files.mp3?.name||"–"; el["detected-jpg"].textContent=files.jpg?.name||"–"; el["detected-txt"].textContent=files.txt?.name||"–"; el["detected-hm"].textContent=selectedHm().join(", ")||"–";
  const first=chosen[0]; el["folder-name"].textContent=first?.webkitRelativePath?.split("/")[0]||"Ausgewählter Songordner";
  setErrors(errors); setStatus(errors.length?"incomplete":"neutral",errors.length?"🔴 Ordner prüfen":"HM bestätigen",errors.length?"Der Ordner erfüllt die Dateiregel noch nicht.":"Dateien und Titel wurden erkannt. Prüfe nur noch HM und Sternstatus."); renderMandatory(groups);
}
async function toBase64(file) { const bytes=new Uint8Array(await file.arrayBuffer()); let binary=""; const size=0x8000; for(let i=0;i<bytes.length;i+=size) binary+=String.fromCharCode(...bytes.subarray(i,i+size)); return btoa(binary); }
async function generate() {
  busy=true; renderMandatory(exactFiles(Object.values(files).filter(Boolean))); setErrors([]); el["success-block"].hidden=true; setStatus("neutral","Erzeugung läuft","Die Generatorlogik prüft Baseline, Nummern und Kollisionen.");
  try {
    const payload={title:el["song-title"].value.trim(),hm:selectedHm(),featured:el.featured.value==="yes",files:{}};
    for(const kind of ["mp3","jpg","txt"]) payload.files[kind]={name:files[kind].name,data:await toBase64(files[kind])};
    const response=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}); const result=await response.json(); if(!response.ok) throw new Error(result.error||"Generatorlauf fehlgeschlagen.");
    el["success-block"].hidden=false; el["success-summary"].textContent=`Song ${result.number} ${result.title} wurde als isolierter Lauf vorbereitet.`; el["output-path"].textContent=result.output;
    el["test-link"].href=`./runs/${result.runName}/testkopie/PulseDE_Home_A1_TESTRAHMEN_V4.html`; el["v1b-link"].href=`./runs/${result.runName}/testkopie/v1b/index.html`;
    currentRun={runName:result.runName,number:result.number,title:result.title,hm:[...payload.hm],featured:payload.featured}; workflow={recognized:true,prepared:true,hmConfirmed:true,localTested:false,reserved:false,stemApproved:false,stemIntegrated:false,githubApproved:false,githubUpdated:false}; renderWorkflow();
    setStatus("complete","✅ Vorbereitet","Testkopie und Übergabepakete wurden erzeugt. Jetzt lokal prüfen und anschließend getrennt freigeben."); await loadBaseline();
  } catch(error) { setErrors([error.message]); setStatus("incomplete","🔴 Gestoppt","Es wurde nichts veröffentlicht. Prüfe die Meldung."); }
  finally { busy=false; renderMandatory(exactFiles(Object.values(files).filter(Boolean))); }
}
async function loadBaseline(){ try{const response=await fetch("/api/status",{cache:"no-store"});if(!response.ok)throw new Error();baseline=await response.json();el["number-chip"].textContent=`Nächste sichere Nummer ${baseline.nextNumber}`;if(!currentRun&&!files.mp3&&!files.jpg&&!files.txt){const pending=[...(baseline.reservations||[])].reverse().find(item=>!item.githubUpdated);if(pending){currentRun={runName:pending.runName,number:pending.number,title:pending.title,hm:[...(pending.hms||[])],featured:Boolean(pending.featured)};workflow={...pending};showRestoredRun(pending);}}}catch{baseline=null;el["number-chip"].textContent="Generator nicht erreichbar";}renderWorkflow();renderMandatory(exactFiles(Object.values(files).filter(Boolean)));}
function reset(){files={mp3:null,jpg:null,txt:null};hmConfirmed=false;currentRun=null;workflow=null;el["folder-input"].value="";el["song-title"].value="";el.featured.value="";el["folder-name"].textContent="Noch kein Ordner gewählt.";el["detected-block"].hidden=true;el["success-block"].hidden=true;setErrors([]);renderSuggestions({textAvailable:false,suggestions:[]});renderWorkflow();setStatus("neutral","Wartet auf Ordner","Wähle links einen Songordner. Die Leitzentrale übernimmt danach die Vorbereitung.");renderMandatory();}

el["folder-input"].addEventListener("change",()=>analyzeFolder([...el["folder-input"].files]));
el["song-title"].addEventListener("input",()=>renderMandatory(exactFiles(Object.values(files).filter(Boolean))));
el["hm-options"].addEventListener("change",()=>{invalidateHm("HM-Auswahl geändert – bitte erneut bestätigen.");el["detected-hm"].textContent=selectedHm().join(", ")||"–";renderMandatory(exactFiles(Object.values(files).filter(Boolean)));});
el["confirm-hm"].addEventListener("click",()=>{const hm=selectedHm();if(!hm.length){invalidateHm("Bestätigung nicht möglich: kein HM-Bereich ausgewählt.");}else{hmConfirmed=true;el["hm-confirmation"].className="confirmation-state confirmed";el["hm-confirmation"].textContent=`Bestätigt: HM ${hm.join("")}`;document.querySelectorAll(".hm-option").forEach(label=>{const status=label.querySelector(".hm-item-status");if(!status.hidden){const confirmed=hm.includes(label.dataset.hmId);status.textContent=confirmed?"Status: durch Harald bestätigt":"Status: nicht ausgewählt";status.className=confirmed?"hm-item-status confirmed":"hm-item-status";}});}renderMandatory(exactFiles(Object.values(files).filter(Boolean)));});
el.featured.addEventListener("change",()=>renderMandatory(exactFiles(Object.values(files).filter(Boolean)))); el["generate-button"].addEventListener("click",generate); el["reset-button"].addEventListener("click",reset);
el["confirm-local-test"].addEventListener("click",()=>{if(!workflow)return;workflow.localTested=true;el["approval-message"].textContent="Lokaltest bestätigt. Die Nummer kann jetzt dauerhaft reserviert werden.";renderWorkflow();});
el["reserve-number"].addEventListener("click",async()=>{try{const result=await workflowRequest("/api/reserve",{runName:currentRun.runName,localTested:workflow.localTested});workflow=result.reservation;el["approval-message"].textContent=`Nummer ${workflow.number} ist reserviert. Nächste sichere Nummer: ${result.nextNumber}.`;renderWorkflow();await loadBaseline();}catch(error){setErrors([error.message]);}});
el["approve-stem"].addEventListener("click",async()=>{try{const result=await workflowRequest("/api/workflow",{number:currentRun.number,action:"approve-stem"});workflow=result.reservation;el["approval-message"].textContent="Stammübernahme freigegeben. Die tatsächliche gemeinsame Übernahme bleibt ein eigener Schritt.";renderWorkflow();}catch(error){setErrors([error.message]);}});
el["approve-github"].addEventListener("click",async()=>{try{const result=await workflowRequest("/api/workflow",{number:currentRun.number,action:"approve-github"});workflow=result.reservation;el["approval-message"].textContent="GitHub-Übernahme freigegeben. Ein Push erfolgt weiterhin nur als eigener, protokollierter Schritt.";renderWorkflow();}catch(error){setErrors([error.message]);}});

try { const response=await fetch(CONFIG.hmRulesPath,{cache:"no-store"}); if(!response.ok)throw new Error(); hmRules=await response.json(); } catch { setErrors(["HM-Regeln konnten nicht geladen werden."]); }
reset(); await loadBaseline();

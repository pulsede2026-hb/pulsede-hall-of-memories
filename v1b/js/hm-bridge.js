export class HallBridge{
  constructor({playerFrame,textFrame,explorerFrame,state,config}){this.frames={playerFrame,textFrame,explorerFrame};this.state=state;this.config=config;this.allowedOrigin=window.location.origin;this.onMessage=this.onMessage.bind(this);}
  start(){window.addEventListener("message",this.onMessage);}stop(){window.removeEventListener("message",this.onMessage);}
  isExpectedOrigin(event){return event.origin===this.allowedOrigin||(this.allowedOrigin==="null"&&event.origin==="null");}
  post(frame,message){frame?.contentWindow?.postMessage(message,this.allowedOrigin==="null"?"*":this.allowedOrigin);}
  selectSong(songIndex){this.post(this.frames.playerFrame,{type:"HM_SELECT_SONG",songIndex});}
  onMessage(event){
    if(!this.isExpectedOrigin(event)||!event.data||typeof event.data.type!=="string")return;
    const{playerFrame,textFrame,explorerFrame}=this.frames,source=event.source,message=event.data;
    if(message.type===this.config.currentSongMessage&&source===playerFrame.contentWindow){this.state.set({currentSong:message.songFile?message:null});this.post(textFrame,message);return;}
    if(this.config.messagesToPlayer.includes(message.type)){const fromExplorer=source===explorerFrame.contentWindow;const fromText=source===textFrame.contentWindow&&message.type==="HM_REQUEST_CURRENT";if(fromExplorer||fromText)this.post(playerFrame,message);}
  }
}

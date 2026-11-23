import {historicalMachineBeat} from './livingPaperBeats';

/** Optional paper strike, only unlocked by operating the historical mechanism.
 * The event and its silence remain readable with the speaker turned off.
 */
export function makeF09MechanicalSound(){
  let audio:AudioContext|null=null,stage:GainNode|null=null,age=0,period=-1,armed=false;
  function stop(){
    armed=false;age=0;period=-1;
    if(audio&&stage)stage.gain.setValueAtTime(0,audio.currentTime);
  }
  function arm(){
    if(armed||typeof AudioContext==='undefined')return;
    try{
      if(!audio){
        audio=new AudioContext();stage=audio.createGain();
        stage.gain.value=0;stage.connect(audio.destination);
      }
      if(audio.state==='suspended')void audio.resume().catch(()=>stop());
      armed=true;stage?.gain.setValueAtTime(1,audio.currentTime);
    }catch{stop();}
  }
  function update(dt:number,finale:number,locked:boolean,reduced:boolean){
    if(!armed||!audio||!stage)return;
    if(!historicalMachineBeat(age,finale,locked,reduced).moving||document.hidden){stop();return;}
    age+=Math.max(0,dt);
    const cycle=Math.floor(age/1.05);
    if(period===cycle||audio.state!=='running')return;
    period=cycle;
    const t=audio.currentTime, strike=audio.createOscillator(), body=audio.createGain();
    strike.type='triangle';strike.frequency.setValueAtTime(133,t);strike.frequency.exponentialRampToValueAtTime(71,t+.043);
    body.gain.setValueAtTime(.024,t);body.gain.exponentialRampToValueAtTime(.0001,t+.061);
    strike.connect(body);body.connect(stage);
    strike.start(t);strike.stop(t+.064);
    strike.onended=()=>{strike.disconnect();body.disconnect();};
  }
  return {arm,stop,update,dispose(){stop();if(audio)void audio.close().catch(()=>{});}};
}

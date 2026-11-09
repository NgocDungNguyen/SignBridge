/* SignBridge hand tracking: MediaPipe HandLandmarker running fully in the browser (no video leaves the device).
   Files are self-hosted in /vendor/mediapipe so the demo does not depend on a CDN. */
import {FilesetResolver,HandLandmarker} from '../vendor/mediapipe/vision_bundle.mjs';
const BASE=new URL('../vendor/mediapipe/',import.meta.url).href;
let model=null,loading=null,mode='GPU';
async function make(delegate){
  const fs=await FilesetResolver.forVisionTasks(BASE+'wasm');
  return HandLandmarker.createFromOptions(fs,{baseOptions:{modelAssetPath:BASE+'hand_landmarker.task',delegate},runningMode:'VIDEO',numHands:2,minHandDetectionConfidence:.5,minHandPresenceConfidence:.5,minTrackingConfidence:.5});
}
export function loadModel(forceCpu){
  if(model)return Promise.resolve(model);
  if(!loading)loading=(async()=>{
    if(!forceCpu){try{model=await make('GPU');mode='GPU';return model;}catch(e){console.warn('[hands] GPU delegate unavailable, using CPU',e);}}
    model=await make('CPU');mode='CPU';return model;})();
  return loading;
}
export async function detect(video,ts){
  if(!model)return null;
  try{return model.detectForVideo(video,ts);}
  catch(e){ if(mode==='GPU'){console.warn('[hands] GPU inference failed, switching to CPU',e);try{model.close();}catch(_){}model=null;loading=null;await loadModel(true);return model.detectForVideo(video,ts);} throw e; }
}
export const getMode=()=>mode;
export const CONNECTIONS=[[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];

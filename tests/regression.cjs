const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const project=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(project,'dist/index.html'),'utf8'),scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const {createCanvas}=require('@napi-rs/canvas');
const els=new Map();const get=id=>{if(!els.has(id)){const classes=new Set();els.set(id,{id,style:{},dataset:{},value:id==='weather'?'clear':id==='cameraMode'?'pocket':id==='quality'?'medium':'',checked:id==='guide',textContent:'',innerHTML:'',children:[],classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x),toggle(x,on){if(on===undefined)on=!classes.has(x);on?classes.add(x):classes.delete(x);return on;}},setAttribute(){},focus(){},addEventListener(){},appendChild(x){this.children.push(x);},setPointerCapture(){},getBoundingClientRect(){return {left:0,top:0,width:1440,height:900};},showModal(){this.open=true},close(){this.open=false}});}return els.get(id);};
const ctx={console:{log:console.log,warn(){}},performance,Math,Float32Array,Uint16Array,Uint32Array,Uint8Array,Uint8ClampedArray,Int32Array,ArrayBuffer,DataView,Set,Map,innerWidth:1440,innerHeight:900,devicePixelRatio:1,requestAnimationFrame(){},document:{getElementById:get,createElement(tag){if(tag==='canvas')return createCanvas(1,1);return get('generated'+els.size)},querySelector(){return [...els.values()].find(x=>x.open)||null},querySelectorAll(sel){return sel==='.play'?get('plays').children:[]},addEventListener(){}},TextDecoder,TextEncoder,atob,fetch,URL,Blob,Request,Response,Headers,setTimeout,clearTimeout,window:{addEventListener(){}}};ctx.self=ctx;vm.createContext(ctx);vm.runInContext(scripts[0],ctx);
ctx.THREE.WebGLRenderer=class{constructor(){this.shadowMap={};this.capabilities={getMaxAnisotropy:()=>8}}setPixelRatio(){}setSize(){}setRenderTarget(){}render(){}};
get('athleteAsset').textContent=html.match(/id="athleteAsset">([^<]+)</)[1];vm.runInContext(scripts[1],ctx);
vm.runInContext(scripts[2],ctx);const run=s=>vm.runInContext(s,ctx);const state=()=>JSON.parse(run('JSON.stringify(window.pocketLab.state)'));


async function verify(){await ctx.window.pocketLab.ready;assert.equal(state().athlete.status,'ready');assert.equal(run('[qbActor,...allPlayers].filter(p=>p.skinned).length'),22);
const advance=seconds=>run(`for(let i=0;i<${Math.round(seconds*120)};i++)tick(1/120)`);
const fresh=()=>run("tryMode=null;phase='pre';scrimmageZ=0;snapX=0;down=2;firstDownZ=-9*YARD;gameTime=76;driveEnded=false;nextSpot=null;reset()");
const isolate=()=>run("defenders.forEach((d,i)=>d.root.position.set(-22,0,40+i*.2));offense.filter(p=>p!==ballCarrier).forEach((p,i)=>p.root.position.set(20,0,35+i*.4))");
function catchAt(x,z){run(`phase='flight';flightTime=1;attempts++;allPlayers.forEach(p=>p.root.position.set(22,0,35));receivers[0].root.position.set(${x},0,${z});launch.set(snapX,1.8,scrimmageZ+5);ball.position.set(${x},1.45,${z});checkCatch(new THREE.Vector3(${x},1.45,${z}+.3),new THREE.Vector3(${x},1.45,${z}-.3));`);}
fresh();advance(2);assert.equal(state().gameTime,76);run('snap()');advance(.5);assert(Math.abs(state().gameTime-75.5)<.00001);
run("phase='flight';ball.position.set(0,20,-10);velocity.set(0,0,-3);flightTime=0");advance(.5);assert(Math.abs(state().gameTime-75)<.00001);assert.equal(state().phase,'flight');
let beforeHits=state().hits;catchAt(0,-3);assert.equal(state().phase,'carry');assert.equal(state().hits,beforeHits+1);assert.equal(state().result,'');isolate();let clock=state().gameTime,z=state().carrier.position[2];advance(1);assert.equal(state().phase,'carry');assert(state().carrier.position[2]<z-5);assert(Math.abs(state().gameTime-(clock-1))<.00001);console.log('Catch stays live; carrier advanced',z-state().carrier.position[2],'m; clock continued.');
run("keys.add('KeyD');keys.add('ShiftLeft')");let x=state().carrier.position[0];advance(.3);assert(state().carrier.position[0]>x+.7);assert(state().stamina<96);run('keys.clear();render(.016)');assert.equal(get('controlledName').textContent,'2 · WR LEFT');
// Defender contact ends the run and stores the new line of scrimmage.
run("defenders[0].root.position.copy(ballCarrier.root.position);updatePursuit(1/120)");assert.equal(state().phase,'tackle');advance(.7);assert.equal(state().phase,'dead');assert.equal(state().result,'TACKLED');let dead=state(),endZ=dead.carrier.position[2],deadTime=dead.gameTime;assert(Math.abs(dead.nextSpot.z-endZ)<.001);advance(2);assert.equal(state().gameTime,deadTime);run('reset()');assert(Math.abs(state().scrimmageZ-endZ)<.001);assert.equal(state().gameTime,deadTime);assert(Math.abs(state().position[2]-(endZ+5))<.001);assert(Math.abs(run('scrimmageLine.position.z')-endZ)<.001);assert(run('allPlayers.every(p=>p.root.position.distanceTo(p.home)<.001)'));assert.equal(state().down,1);console.log('Tackle spot persists into next formation; first down awarded; dead-ball clock frozen.');
// Snap timing continues from the preserved clock and incomplete passes retain the spot.
run('snap()');advance(.1);assert(state().gameTime<deadTime);let los=state().scrimmageZ;run("phase='flight';flightTime=.8;land()");assert.equal(state().result,'INCOMPLETE');assert.equal(state().nextSpot.z,los);clock=state().gameTime;run('reset()');assert.equal(state().scrimmageZ,los);assert.equal(state().gameTime,clock);assert.equal(state().down,2);
// A short gain increases down and reduces remaining distance without moving the first-down marker.
fresh();catchAt(0,-2);isolate();run("finishRep('TACKLED',ballCarrier)");run('reset()');assert.equal(state().down,3);assert.equal(state().scrimmageZ,-2);assert(Math.abs(state().firstDownZ+9*.9144)<.001);assert.equal(get('downText').innerHTML,'3rd<br>&amp;<br>7');
// Sidelines end the run at the exit spot and translate the next formation to the near hash.
fresh();catchAt(23.8,-5);isolate();run("keys.add('KeyD')");advance(.3);assert.equal(state().result,'OUT OF BOUNDS');endZ=state().nextSpot.z;run('reset()');assert.equal(state().snapX,2.82);assert.equal(state().scrimmageZ,endZ);assert(run('receivers[0].route[0].x>-19'));
// A touchdown only ends play on crossing the goal line, without double-counting a completion.
fresh();catchAt(0,-44);isolate();beforeHits=state().hits;advance(.5);assert.equal(state().result,'TOUCHDOWN');assert.equal(state().hits,beforeHits);assert.equal(state().driveEnded,true);clock=state().gameTime;assert.equal(state().phase,'celebration');advance(3);assert.equal(state().phase,'conversion');assert.equal(state().gameTime,clock);run("chooseConversion('two')");assert.equal(state().tryMode,'two');assert.equal(state().phase,'pre');assert.equal(state().down,1);
// Clock may expire during a live run; finish that play, then explicitly start a new session.
fresh();catchAt(0,-3);isolate();run('gameTime=.1');advance(.2);assert.equal(state().gameTime,0);assert.equal(state().phase,'carry');run("finishRep('TACKLED',ballCarrier)");assert.equal(get('snapText').textContent,'NEW SESSION');run('snap()');assert.equal(state().gameTime,76);assert.equal(state().phase,'pre');
// Red-zone routes, pass legality and first-down marker use the translated line.
fresh();run("scrimmageZ=-30;snapX=-2;down=1;firstDownZ=-39.144;reset();snap();qb.position.z=-29;startCharge()");assert.equal(run('charging'),true);run("charging=false;qb.position.z=-30.1;startCharge()");assert.equal(run('charging'),false);assert(run('receivers.every(r=>r.route.every(v=>v.z>=-L/2+.7&&v.z<=L/2-.7))'));
// Real throw integration reaches carry before a tackle, not a dead completion.
fresh();run("concept=1;reset();snap();for(let i=0;i<120;i++)tick(1/120);selectReceiver(4);startCharge();charge=.4;release();for(let i=0;i<900&&phase!=='carry'&&phase!=='dead';i++)tick(1/120)");assert.equal(state().phase,'carry');run('render(.016)');
console.log('PASS: live catch, auto-run, steering/sprint, pursuit/tackles, exact spot persistence, downs, first downs, LOS/route translation, incomplete spot, sideline, TD, completion counts, clock phases and expiry.');
// New controls target a receiver immediately, and throw from the animated right hand.
fresh();run('snap();render(.016);directReceiver(4)');assert.equal(state().phase,'windup');assert.equal(run('pending.receiver'),4);assert.equal(run('charging'),false);run('render(.10)');assert(run('origin().distanceTo(playerHand(qbActor))<.061'));advance(.25);assert.equal(state().phase,'flight');
// Isolate coverage to verify the receiver-guided path for all concepts and every eligible receiver.
for(let conceptId=0;conceptId<3;conceptId++)for(let receiverId=0;receiverId<5;receiverId++){
 fresh();run(`concept=${conceptId};reset();snap();defenders.forEach(d=>{d.speed=0;d.shedAt=999;d.root.position.set(-24,0,50);d.home.copy(d.root.position);d.assignment='none';});`);advance(.8);run(`directReceiver(${receiverId})`);let maxStep=0;for(let n=0;n<450&&['live','windup','flight'].includes(state().phase);n++){const old=state().ball;advance(1/120);if(state().phase==='flight'){const next=state().ball;if(n>31)maxStep=Math.max(maxStep,Math.hypot(...next.map((x,i)=>x-old[i])));}}assert.equal(state().phase,'carry',`concept ${conceptId}, receiver ${receiverId}`);assert.equal(state().carrier.role,run(`receivers[${receiverId}].role`));assert(maxStep<1,`continuous pass step ${maxStep}`);
}
console.log('All 15 concept/receiver combinations caught in motion with continuous targeted flight.');
// A nearby defender can secure or swat a pass; open receivers are not given guaranteed priority.
fresh();run("phase='flight';flightTime=1;allPlayers.forEach(p=>p.root.position.set(23,0,40));defenders[0].root.position.set(0,0,-10);ball.position.set(0,1.45,-10);checkCatch(new THREE.Vector3(0,1.45,-9.8),new THREE.Vector3(0,1.45,-10.2))");assert.equal(state().result,'INTERCEPTION');
fresh();run("phase='flight';flightTime=1;allPlayers.forEach(p=>p.root.position.set(23,0,40));defenders[0].root.position.set(.72,0,-10);ball.position.set(0,1.45,-10);checkCatch(new THREE.Vector3(0,1.45,-9.8),new THREE.Vector3(0,1.45,-10.2))");assert.equal(state().result,'PASS DEFLECTED');
// QB scrambling still gains a new spot; illegal forward passes remain blocked.
fresh();run("snap();qb.position.set(0,0,-4);directReceiver(1)");assert.equal(state().phase,'live');assert.equal(run('pending'),null);run("ballCarrier={root:qb};finishRep('TACKLED',null);reset()");assert.equal(state().scrimmageZ,-4);
function touchdown(){fresh();run("snap();qb.position.set(0,0,-45.72);ballCarrier={root:qb};finishRep('TOUCHDOWN',null)");}
let score=state().chiScore;touchdown();assert.equal(state().chiScore,score+6);assert.equal(state().phase,'celebration');const tdClock=state().gameTime;run("finishRep('TOUCHDOWN',null);reset();snap()");assert.equal(state().chiScore,score+6);assert.equal(state().phase,'celebration');advance(3);assert.equal(state().phase,'conversion');assert.equal(state().gameTime,tdClock);assert.equal(get('conversionChoice').hidden,false);
// Accurate timed extra point crosses inside the posts above the crossbar for exactly +1.
run("chooseConversion('kick');kickValue=.5;attemptKick()");advance(2);assert.equal(state().phase,'dead');assert.equal(state().chiScore,score+7);assert.equal(state().tryMode,null);assert.equal(state().gameTime,tdClock);run('snap()');assert.equal(state().phase,'pre');assert.equal(state().down,1);
score=state().chiScore;touchdown();advance(3);run("chooseConversion('kick');kickValue=0;attemptKick()");advance(2);assert.equal(state().chiScore,score+6);assert.equal(state().result,'CONVERSION NO GOOD');
// Two-point tries use the same live mechanics and do not advance the period clock.
score=state().chiScore;touchdown();advance(3);run("gameTime=0;chooseConversion('two');snap()");assert.equal(state().phase,'live');assert(Math.abs(state().scrimmageZ-(-45.72+2*.9144))<1e-8);advance(.1);assert.equal(state().gameTime,0);run("qb.position.z=-45.72;ballCarrier={root:qb};finishRep('TOUCHDOWN',null)");assert.equal(state().chiScore,score+8);assert.equal(state().phase,'dead');assert.equal(state().result,'TWO POINTS GOOD');
score=state().chiScore;touchdown();advance(3);run("chooseConversion('two');snap();phase='flight';land()");assert.equal(state().chiScore,score+6);assert.equal(state().result,'CONVERSION NO GOOD');
// Procedural rig hierarchy and dimensions; elbows flex toward the front, with independent knees.
fresh();run('render(.2)');assert(run("allPlayers.length===21&&qbRig.limbs.every(l=>l.fore.parent===l.arm&&l.hand.parent===l.fore&&l.shin.parent===l.leg&&l.foot.parent===l.shin)"));assert(run('qbRig.limbs.every(l=>l.fore.rotation.x>0&&l.fore.rotation.x<=2.3)'));assert.equal(run("uniformMaterial('offense','helmet').isMeshPhysicalMaterial"),true);assert.equal(run('ground.material.normalMap!==null&&ground.material.roughnessMap!==null'),true);assert.equal(run('contactShadows.length'),22);assert.equal(run('ball.children[0].castShadow'),true);
// Replay renders recorded pose state, then restores simulation roots exactly.
fresh();run('snap();keys.add("KeyW")');advance(1);run("ballCarrier={root:qb};finishRep('TACKLED',null)");assert(state().replayFrames>10);const beforeReplay=JSON.stringify(state().position);run('toggleReplay();render(.016)');assert.equal(run('replayActive'),true);assert.equal(JSON.stringify(state().position),beforeReplay);run('toggleReplay()');
console.log('PASS: direct controls, hand release, interceptions/swats, QB running, +6/+1/+2/no-good scoring, conversion clock, rig joints/materials, turf/contact shadows, replay state isolation.');


// Visible rigs are independent, share geometry, and cannot translate gameplay roots.
fresh();run('render(.016)');
assert(run("qbActor.skinned.bones.RightHand!==receivers[0].skinned.bones.RightHand"));
assert(run("qbActor.skinned.lods[0].children[0].geometry===receivers[0].skinned.lods[0].children[0].geometry"));
assert(run("[qbActor,...allPlayers].every(p=>p.skinned.lods.filter(o=>o.visible).length===1)"));
assert(run("[qbActor,...allPlayers].every(p=>p.skinned.lods.every(l=>l.children.every(o=>o.geometry.attributes.uv&&o.isSkinnedMesh)))"));
assert(run("Object.keys(qbActor.skinned.actions).length===12"));
const stationary=JSON.stringify(state().position), otherHand=run('receivers[0].skinned.bones.RightHand.quaternion.toArray().join()');
run("qbActor.velocity.set(0,0,-6);qbActor.animState='RUN';for(let i=0;i<20;i++)animateSkinned(qbActor,.016)");
assert.equal(JSON.stringify(state().position),stationary);assert.equal(run('receivers[0].skinned.bones.RightHand.quaternion.toArray().join()'),otherHand);
run("qbActor.velocity.set(0,0,0);qbActor.animState='READY';animateSkinned(qbActor,.2)");
// The replay changes visible bones only for the draw, then restores the live skeleton exactly.
fresh();run('snap();keys.add("KeyW")');for(let i=0;i<30;i++){advance(1/30);run('render(1/30)');}
run("ballCarrier=qbActor;finishRep('TACKLED',qbActor);toggleReplay()");
const liveBones=run('JSON.stringify(captureBones(qbActor))');run('drawReplay(.016)');assert.equal(run('JSON.stringify(captureBones(qbActor))'),liveBones);run('toggleReplay()');
for(const quality of ['low','medium','high']){get('quality').value=quality;run('applyGraphics();render(.016)');assert(run('[qbActor,...allPlayers].every(p=>p.skinned.lods.filter(o=>o.visible).length===1)'));}
console.log('PASS: independent skeletons, shared geometry, all LODs/UVs, no animation root motion, visible-bone replay restoration, all quality presets.');
// The visible hand controls the held ball across turning, stance and throwing.
fresh();run('render(.1)');assert(run('ball.position.distanceTo(playerHand(qbActor))<1e-7'));
run('snap();keys.add("KeyD")');advance(.2);run('render(.033)');assert(run('ball.position.distanceTo(playerHand(qbActor))<1e-7'));
// Directional gait switches preserve phase and expired actions release their bindings.
run("qbActor.velocity.set(4,0,0);qbActor.animState='STRAFE_RIGHT';animateSkinned(qbActor,.2)");
assert.equal(run('qbActor.skinned.current'),'STRAFE_RIGHT');
assert(run("qbActor.skinned.actions.STRAFE_RIGHT.getClip().tracks.some(t=>t.name==='RightThigh.quaternion'&&Array.from(t.values).some((v,i)=>Math.abs(v-qbActor.skinned.actions.RUN.getClip().tracks.find(x=>x.name===t.name).values[i])>.01))"));
run("qbActor.animState='RUN';animateSkinned(qbActor,.01)");const gait=run('qbActor.skinned.actions.RUN.time');
run("qbActor.animState='SPRINT';animateSkinned(qbActor,0)");assert(Math.abs(run('qbActor.skinned.actions.SPRINT.time')-gait)<1e-7);
run("for(let n=0;n<25;n++){qbActor.animState=n%2?'RUN':'STRAFE_LEFT';for(let j=0;j<20;j++)animateSkinned(qbActor,.016)}");
assert(run('Object.values(qbActor.skinned.actions).filter(a=>a.isScheduled()).length<=2'));
// A receiver reaches with the upper body while its locomotion clip continues.
run("phase='flight';const receiver=receivers[0];receiver.velocity.set(0,0,-6);receiver.animState='CATCH';ball.position.copy(receiver.root.position).add(new THREE.Vector3(0,1.5,-.65));animateSkinned(receiver,.1)");
assert.equal(run('receivers[0].skinned.current'),'RUN');assert(run('receivers[0].skinned.reachWeight>0'));
const legBefore=run('receivers[0].skinned.bones.LeftThigh.quaternion.toArray().join()');run('animateSkinned(receivers[0],.05)');assert.notEqual(run('receivers[0].skinned.bones.LeftThigh.quaternion.toArray().join()'),legBefore);
// Bounded reach converges toward a nearby target without translating the actor.
run("globalThis.reachTestTarget=playerHand(receivers[0]).add(new THREE.Vector3(.08,.04,-.04));globalThis.reachBefore=playerHand(receivers[0]).distanceTo(reachTestTarget);globalThis.rootBefore=receivers[0].root.position.clone();reachHand(receivers[0].skinned,'Right',reachTestTarget,1)");
assert(run('playerHand(receivers[0]).distanceTo(reachTestTarget)<reachBefore'));assert(run('receivers[0].root.position.distanceTo(rootBefore)===0'));
fresh();assert(run('[qbActor,...allPlayers].every(p=>p.skinned.catchHold===0&&p.skinned.reachWeight===0&&p.skinned.current===null)'));
console.log('PASS: visible-hand ball attachment, directional shuffle, gait continuity, retired fades, running catch layer, bounded arm targeting and reset cleanup.');
// Intake supports real named Actions and preserves texture assets across recoloring.
run("globalThis.namedClips=athleteClipNames.map(n=>qbActor.skinned.actions[n].getClip().clone());namedClips.find(c=>c.name==='RUN').duration=2;globalThis.loadedClips=playerClips(namedClips,'named-actions')");
assert.equal(run("loadedClips.find(c=>c.name==='RUN').duration"),2);
assert.throws(()=>run("playerClips(namedClips.filter(c=>c.name!=='CATCH'),'named-actions')"),/Missing athlete clip/);
assert.throws(()=>run("playerClips([...namedClips,namedClips[0]],'named-actions')"),/Duplicate athlete clip/);
assert.throws(()=>run("playerClips(namedClips,'unknown')"),/Unknown athlete clip/);
run("globalThis.intakeSource=new THREE.MeshStandardMaterial({map:new THREE.Texture(),normalMap:new THREE.Texture(),roughnessMap:new THREE.Texture(),roughness:.7});intakeSource.name='Jersey';globalThis.intakeMaterial=importedUniform('offense',intakeSource,'jersey')");
assert(run("intakeMaterial.map===intakeSource.map&&intakeMaterial.normalMap===intakeSource.normalMap&&intakeMaterial.roughnessMap===intakeSource.roughnessMap&&intakeMaterial.bumpMap===null"));
assert(run("importedUniform('offense',intakeSource,'jersey')===intakeMaterial"));
assert(run("importedUniform('defense',intakeSource,'jersey')!==intakeMaterial"));
assert.throws(()=>run("importedUniform('offense',intakeSource,null)"),/Unmapped player material/);
// A two-second authored throw still reaches release in the existing .24-second windup.
fresh();run("globalThis.throwDuration=qbActor.skinned.actions.QB_THROW.getClip().duration;qbActor.skinned.actions.QB_THROW.getClip().duration=2;qbActor.animState='QB_THROW';animateSkinned(qbActor,.1)");assert(Math.abs(run('qbActor.skinned.actions.QB_THROW.getEffectiveTimeScale()')-2/.24)<1e-7);
run('qbActor.skinned.actions.QB_THROW.getClip().duration=throwDuration');fresh();
console.log('PASS: named-action intake, missing/duplicate rejection, imported texture preservation, team material caching and throw timing contract.');
console.log("GLB pipeline: 22 independent skeletons, 12 animation actions, gameplay regression suite passed.");}
verify().catch(e=>{console.error(e);process.exitCode=1;});

const E = require('../shared/engine.js');
function sim(n, verbose){
  const s = E.newGame(Array.from({length:n},(_,i)=>({name:'Bot'+i,bot:true})));
  let steps=0; const stats={outs:Array(8).fill(0), knocks:0, steps:[]};
  let roundSteps=0;
  while(s.phase!=='gameEnd'){
    if(++steps>200000) throw new Error('hang round '+s.round+' phase '+s.phase);
    roundSteps++;
    if(s.phase==='roundEnd'){ stats.steps.push(roundSteps); roundSteps=0; if(s.lastRound.winner!=null) stats.outs[s.round]++; E.act(s,0,{type:'nextRound'}); continue; }
    let acted=false;
    if(s.phase==='knock'){
      for(let i=0;i<n;i++){ const a=E.botAction(s,i); if(a){ if(a.type==='knock')stats.knocks++; const e=E.act(s,i,a); if(e) throw new Error('knock err '+e); acted=true; break; } }
      if(!acted){ E.act(s,null,{type:'knockTimeout'}); }
      continue;
    }
    const a=E.botAction(s,s.current);
    const e=E.act(s,s.current,a);
    if(e) throw new Error('err '+e+' '+JSON.stringify(a)+' phase '+s.phase+' r'+s.round);
    // invariants
    const total = s.stock.length+s.discard.length+s.players.reduce((t,p)=>t+p.hand.length,0)+s.melds.reduce((t,m)=>t+m.cards.length,0);
    if(total!==110) throw new Error('card count '+total);
    for(const m of s.melds) if(!E.validMeld(m.cards,m.t)) throw new Error('invalid meld');
  }
  if(s.lastRound.winner!=null) stats.outs[7]++;
  stats.steps.push(roundSteps);
  return {s,stats};
}
const N=+process.argv[2]||200; const agg=Array(8).fill(0); let kn=0; const t0=Date.now(); let stepsAll=Array(8).fill(0);
for(let g=0;g<N;g++){ const n=2+(g%5); const {s,stats}=sim(n); stats.outs.forEach((v,i)=>agg[i]+=v); kn+=stats.knocks; stats.steps.forEach((v,i)=>stepsAll[i]+=v); }
console.log('games',N,'ms',Date.now()-t0);
console.log('rounds won by going out (%):', agg.map(v=>Math.round(100*v/N)));
console.log('avg actions per round:', stepsAll.map(v=>Math.round(v/N)));
console.log('knocks per game', (kn/N).toFixed(1));

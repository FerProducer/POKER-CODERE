// server.js — App unificada (API + Front)
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

// ===== Helpers =====
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const uid = p => `${p}-${Math.random().toString(36).slice(2,6)}-${Math.random().toString(36).slice(2,6)}`;
function whenNext(dow, h=20, m=0){
  const now=new Date(); const d=new Date(); const add=(dow-d.getDay()+7)%7;
  d.setDate(d.getDate()+add); d.setHours(h,m,0,0); if(d<=now) d.setDate(d.getDate()+7);
  return d.toISOString();
}

// ===== Datos base =====
const demoTournaments = [
  { id:"MON-FO-20:00", title:"Lunes Deep Freezeout 20:00", venue:"Codere Casino",
    type:["freezeout"], date_start:whenNext(1,20,0), status:"scheduled",
    late_reg_end_level:6, capacity:99,
    buyin:{amount:900, fee:90, currency:"MXN"}, stack:{initial:20000},
    reentry:{enabled:true, maxPerPlayer:1}, rebuy:{enabled:false}, addon:{enabled:false}, alternates:true,
    blind_structure:[{level:1,sb:100,bb:200,ante:200,min:15},{level:2,sb:200,bb:300,ante:300,min:15},{level:3,sb:200,bb:400,ante:400,min:15},{level:4,sb:300,bb:600,ante:600,min:15},{level:5,sb:400,bb:800,ante:800,min:15},{level:6,sb:600,bb:1200,ante:1200,min:15}],
    payout_schema:{mode:"percent", table:[40,25,15,10,6,4]}, restrictions:{maxEntriesPerPlayer:2, minAge:18}
  },
  { id:"TUE-TR-19:00", title:"Martes Turbo Rebuy + Add-on 19:00", venue:"Codere Casino",
    type:["rebuy-addon","turbo"], date_start:whenNext(2,19,0), status:"scheduled",
    late_reg_end_level:8, capacity:126,
    buyin:{amount:400, fee:40, currency:"MXN"}, stack:{initial:12000, rebuy:12000, addon:30000},
    reentry:{enabled:true, maxPerPlayer:2},
    rebuy:{enabled:true, levels:[1,2,3,4,5,6,7,8], maxPerPlayer:Infinity, rake:false, stack:12000, cost:400},
    addon:{enabled:true, atLevel:8, cost:800, stack:30000, eligible:"all"}, alternates:true,
    blind_structure:[{level:1,sb:200,bb:400,ante:400,min:10},{level:2,sb:300,bb:600,ante:600,min:10},{level:3,sb:400,bb:800,ante:800,min:10},{level:4,sb:600,bb:1200,ante:1200,min:10},{level:5,sb:800,bb:1600,ante:1600,min:10},{level:6,sb:1200,bb:2400,ante:2400,min:10},{level:7,sb:1500,bb:3000,ante:3000,min:10},{level:8,sb:2000,bb:4000,ante:4000,min:10}],
    payout_schema:{mode:"percent", table:[35,22,14,10,7,5,3,2,1,1]}, restrictions:{maxEntriesPerPlayer:3, minAge:18}
  },
  { id:"WED-BCB-20:00", title:"Miércoles Black Chip Bounty 20:00", venue:"Codere Casino",
    type:["freezeout","bounty"], date_start:whenNext(3,20,0), status:"scheduled",
    late_reg_end_level:8, capacity:108,
    buyin:{amount:700, fee:70, bounty:300, currency:"MXN"}, stack:{initial:20000},
    reentry:{enabled:true, maxPerPlayer:2}, addon:{enabled:true, atLevel:8, cost:800, stack:20000, eligible:"survivors"},
    rebuy:{enabled:false}, alternates:true,
    blind_structure:[{level:1,sb:100,bb:200,ante:200,min:15},{level:2,sb:200,bb:300,ante:300,min:15},{level:3,sb:200,bb:400,ante:400,min:15},{level:4,sb:300,bb:600,ante:600,min:15},{level:5,sb:400,bb:800,ante:800,min:15},{level:6,sb:600,bb:1200,ante:1200,min:15},{level:7,sb:800,bb:1600,ante:1600,min:15},{level:8,sb:1000,bb:2000,ante:2000,min:15}],
    payout_schema:{mode:"percent", table:[38,24,15,10,6,4,2,1]}, restrictions:{maxEntriesPerPlayer:3, minAge:18}
  },
  { id:"THU-SAT-19:30", title:"Jueves Satélite al Sunday Major 19:30", venue:"Codere Casino",
    type:["satellite","turbo"], date_start:whenNext(4,19,30), status:"scheduled",
    late_reg_end_level:8, capacity:200,
    buyin:{amount:180, fee:18, currency:"MXN"}, stack:{initial:10000, addon:15000},
    reentry:{enabled:true, maxPerPlayer:Infinity}, rebuy:{enabled:false},
    addon:{enabled:true, atLevel:8, cost:300, stack:15000, eligible:"all"}, alternates:true,
    blind_structure:[{level:1,sb:200,bb:400,ante:400,min:12},{level:2,sb:300,bb:600,ante:600,min:12},{level:3,sb:400,bb:800,ante:800,min:12},{level:4,sb:600,bb:1200,ante:1200,min:12},{level:5,sb:800,bb:1600,ante:1600,min:12},{level:6,sb:1200,bb:2400,ante:2400,min:12},{level:7,sb:1500,bb:3000,ante:3000,min:12},{level:8,sb:2000,bb:4000,ante:4000,min:12}],
    payout_schema:{mode:"percent", table:[100]}, restrictions:{maxEntriesPerPlayer:Infinity, minAge:18}
  },
  { id:"FRI-PKO-20:00", title:"Viernes PKO Prime 20:00", venue:"Codere Casino",
    type:["pko"], date_start:whenNext(5,20,0), status:"scheduled",
    late_reg_end_level:8, capacity:150,
    buyin:{amount:600, fee:60, bounty:300, currency:"MXN"}, stack:{initial:20000, addon:20000},
    reentry:{enabled:true, maxPerPlayer:2}, rebuy:{enabled:false},
    addon:{enabled:true, atLevel:8, cost:500, stack:20000, eligible:"all"}, alternates:true,
    blind_structure:[{level:1,sb:200,bb:400,ante:400,min:12},{level:2,sb:300,bb:600,ante:600,min:12},{level:3,sb:400,bb:800,ante:800,min:12},{level:4,sb:600,bb:1200,ante:1200,min:12},{level:5,sb:800,bb:1600,ante:1600,min:12},{level:6,sb:1200,bb:2400,ante:2400,min:12},{level:7,sb:1500,bb:3000,ante:3000,min:12},{level:8,sb:2000,bb:4000,ante:4000,min:12}],
    payout_schema:{mode:"percent", table:[35,22,14,10,7,5,3,2,1,1]}, restrictions:{maxEntriesPerPlayer:3, minAge:18}
  },
  { id:"SAT-MF1-19:30", title:"Sábado Multi-Flight Day 1 (bolsear a Domingo)", venue:"Codere Casino",
    type:["multi-day","re-entry"], date_start:whenNext(6,19,30), status:"scheduled",
    late_reg_end_level:10, capacity:180,
    buyin:{amount:900, fee:90, currency:"MXN"}, stack:{initial:30000},
    reentry:{enabled:true, maxPerPlayer:Infinity}, rebuy:{enabled:false}, addon:{enabled:false}, alternates:true,
    blind_structure:[{level:1,sb:100,bb:200,ante:200,min:20},{level:2,sb:200,bb:300,ante:300,min:20},{level:3,sb:200,bb:400,ante:400,min:20},{level:4,sb:300,bb:600,ante:600,min:20},{level:5,sb:400,bb:800,ante:800,min:20},{level:6,sb:600,bb:1200,ante:1200,min:20},{level:7,sb:800,bb:1600,ante:1600,min:20},{level:8,sb:1000,bb:2000,ante:2000,min:20},{level:9,sb:1500,bb:3000,ante:3000,min:20},{level:10,sb:2000,bb:4000,ante:4000,min:20}],
    payout_schema:{mode:"percent", table:[40,25,15,10,6,4]}, restrictions:{maxEntriesPerPlayer:Infinity, minAge:18}, multi_day:true
  },
  { id:"SUN-MAJOR-17:00", title:"Sunday Major 17:00", venue:"Codere Casino",
    type:["freezeout"], date_start:whenNext(0,17,0), status:"scheduled",
    late_reg_end_level:8, capacity:180,
    buyin:{amount:1800, fee:180, currency:"MXN"}, stack:{initial:40000, addon:25000},
    reentry:{enabled:true, maxPerPlayer:1}, rebuy:{enabled:false},
    addon:{enabled:true, atLevel:8, cost:1000, stack:25000, eligible:"survivors"}, alternates:true,
    blind_structure:[{level:1,sb:200,bb:400,ante:400,min:20},{level:2,sb:300,bb:600,ante:600,min:20},{level:3,sb:400,bb:800,ante:800,min:20},{level:4,sb:600,bb:1200,ante:1200,min:20},{level:5,sb:800,bb:1600,ante:1600,min:20},{level:6,sb:1200,bb:2400,ante:2400,min:20},{level:7,sb:1500,bb:3000,ante:3000,min:20},{level:8,sb:2000,bb:4000,ante:4000,min:20}],
    payout_schema:{mode:"percent", table:[38,24,15,10,6,4,2,1]}, restrictions:{maxEntriesPerPlayer:2, minAge:18}
  }
];

const tournaments   = new Map(demoTournaments.map(t=>[t.id,t]));
const registrations = new Map(); // regId -> reg
const seats = new Map();         // tid -> {grid, taken:Set, perTable}
const alternates = new Map();    // tid -> [playerId]

function ensureSeats(t){
  if(seats.has(t.id)) return seats.get(t.id);
  const perTable=9, tables=Math.ceil(t.capacity/perTable);
  const grid=[], taken=new Set();
  for(let table=1; table<=tables; table++){
    const row=[]; for(let s=1; s<=perTable; s++){ row.push({id:`${table}-${s}`, table, seat:s, regId:null}); }
    grid.push(row);
  }
  const S={grid,taken,perTable}; seats.set(t.id,S); return S;
}
function firstFreeSeat(tid){
  const S=seats.get(tid); if(!S) return null;
  for(const row of S.grid){ for(const seat of row){ if(!seat.regId && !S.taken.has(seat.id)) return seat; } }
  return null;
}

// ===== API =====
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // sirve la SPA

app.get("/api/tournaments", (req,res)=> res.json(demoTournaments));

app.get("/api/seatmap/:tid", (req,res)=>{
  const t=tournaments.get(req.params.tid); if(!t) return res.status(404).json({error:'tournament_not_found'});
  const S=ensureSeats(t); res.json({ perTable:S.perTable, grid:S.grid });
});

// Reserva online: crea REG y asigna asiento si hay lugar
app.post("/api/reserve", (req,res)=>{
  const { tournamentId, qty=1, player } = req.body||{};
  if(!player || !player.id || !player.name) return res.status(400).json({error:'bad_player'});
  const t = tournaments.get(tournamentId); if(!t) return res.status(404).json({error:'tournament_not_found'});
  const S = ensureSeats(t); if(!alternates.has(t.id)) alternates.set(t.id, []);

  const regs=[];
  for(let i=0;i<qty;i++){
    const regId=uid('REG');
    const seat = firstFreeSeat(t.id);
    let r;
    if(seat){
      seat.regId=regId; S.taken.add(seat.id);
      r={ id:regId, player_id:player.id, player_name:player.name, tournament_id:t.id, type:'entry', status:'reserved', seat_id:seat.id, created_at:new Date().toISOString() };
    }else{
      alternates.get(t.id).push(player.id);
      r={ id:regId, player_id:player.id, player_name:player.name, tournament_id:t.id, type:'entry', status:'waitlist', seat_id:null, created_at:new Date().toISOString() };
    }
    registrations.set(regId,r); regs.push(r);
  }
  res.json({ ok:true, regs });
});

// Check-in (confirma y garantiza asiento)
app.post("/api/checkin", (req,res)=>{
  const { regId } = req.body||{};
  const r = registrations.get(regId);
  if(!r) return res.status(404).json({error:'reg_not_found'});
  const t = tournaments.get(r.tournament_id); const S = ensureSeats(t);
  if(!r.seat_id){
    const seat = firstFreeSeat(t.id);
    if(!seat) return res.status(409).json({error:'no_seats'});
    seat.regId=r.id; S.taken.add(seat.id); r.seat_id=seat.id;
  }
  r.status='checked-in';
  res.json({ ok:true, reg:r });
});

// (fallback SPA route)
app.get("*", (_,res)=> res.sendFile(path.join(__dirname,"public","index.html")));

const port = process.env.PORT || 8080;
app.listen(port, ()=> console.log(`App lista en http://localhost:${port}`));

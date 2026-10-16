(() => {
  "use strict";
  const API="https://lszlaglwlixejzytrurg.supabase.co/functions/v1/betinsight-admin-tip-result";
  const SESSION_KEY="betinsight_admin_session_v1";
  const categories={
    tips:{title:"Nicht verdiente Tippanteile",hint:"Einzelbuchungen aus verbrauchten Kauf-Units; kein zusätzlicher Verkaufserlös."},
    affiliate:{title:"Affiliate-Firmenpool",hint:"Nicht an Uplines zugeordnete Affiliate-Anteile aus älteren Zahlungsbuchungen."},
    v5:{title:"V5-Sonderreserve",hint:"In V5-Kaufabrechnungen als Sonderreserve geführte Beträge."},
    assignments:{title:"Live-Premiumreserve",hint:"Nur LIVE-Zuteilungen; Test- und ungültige Buchungen ausgeschlossen."},
    pool_units:{title:"Referral-Firmenpool (Units)",hint:"Buchungen in Units, nicht in Euro. Nicht zu den Euro-Beträgen addieren."}
  };
  let cached=null,filter="all",showAll=false;
  function readSession(){
    try{
      const s=JSON.parse(sessionStorage.getItem(SESSION_KEY)||"null");
      return s&&(String(s.master||"").toUpperCase()==="JA"||String(s.role||"").toUpperCase()==="MASTER")?s:null;
    }catch{return null}
  }
  function node(tag,cls,text){
    const e=document.createElement(tag);
    if(cls)e.className=cls;
    if(text!==undefined)e.textContent=String(text);
    return e;
  }
  const eu=(v,unit,max=2)=>Number(v||0).toLocaleString("de-DE",{minimumFractionDigits:unit==="EUR"?2:0,maximumFractionDigits:max})+(unit==="EUR"?" €":" Units");
  const date=t=>{
    if(!t)return "–";
    const d=new Date(t);
    return Number.isFinite(d.getTime())?d.toLocaleDateString("de-DE"):String(t).slice(0,15);
  };
  async function hash(token){
    const dig=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(String(token)));
    return [...new Uint8Array(dig)].map(v=>v.toString(16).padStart(2,"0")).join("");
  }
  function create(){
    if(!readSession()||document.getElementById("biReserveLedger"))return;
    const header=[...document.querySelectorAll("#tab-master h3")].find(h=>h.textContent?.trim()==="Systemübersicht");
    const card=header?.closest("article");
    if(!card)return;
    const root=node("div");
    root.id="biReserveLedger";
    root.style.cssText="margin-top:18px;padding-top:14px;border-top:1px solid rgba(125,204,232,.19)";
    const bar=node("div");
    bar.style.cssText="display:flex;align-items:center;flex-wrap:wrap;gap:12px";
    const btn=node("button","button button-neutral","Buchungen anzeigen");
    btn.type="button";btn.id="biReserveLoad";
    const info=node("span","muted","Manuelle Übersicht aus den vorhandenen Buchungsquellen. Keine neue Buchung und kein automatischer Abruf.");
    info.style.fontSize="12px";
    bar.append(btn,info);
    const contents=node("div");contents.id="biReserveContents";contents.hidden=true;contents.style.marginTop="14px";
    root.append(bar,contents);
    card.appendChild(root);
    btn.addEventListener("click",()=>{
      if(cached){contents.hidden=!contents.hidden;btn.textContent=contents.hidden?"Buchungen anzeigen":"Buchungen ausblenden";return}
      load();
    });
  }
  function paint(result){
    const holder=document.getElementById("biReserveContents");
    if(!holder)return;
    holder.replaceChildren();
    const title=node("h4","","Buchungsnachweise zur Firmenreserve");
    const note=node("p","muted",
      "Die folgenden Teilbeträge sind getrennt ausgewiesen. Sie sind keine geprüfte Gesamtsumme und können sich buchhalterisch überschneiden. " +
      "Ein endgültiger Bestand erfordert die Abstimmung von Umbuchungen, Abflüssen und der Unternehmensreserve je Zahlungsweg.");
    note.style.cssText="font-size:12px;line-height:1.5;margin:8px 0 14px";
    holder.append(title,note);
    const grid=node("div");
    grid.style.cssText="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px";
    Object.entries(categories).forEach(([key,item])=>{
      const t=result.totals?.[key];
      const box=node("div");
      box.style.cssText="background:rgba(0,19,31,.43);border:1px solid rgba(125,204,232,.18);border-radius:12px;padding:12px";
      const name=node("div","",item.title);name.style.cssText="font-weight:650;font-size:12px";
      const value=node("div","",t?eu(t.amount,t.currency,t.currency==="EUR"?2:4):result.errors?.[key]?"Quelle nicht verfügbar":"Keine positive Buchung");
      value.style.cssText="font-size:19px;font-weight:750;margin:6px 0";
      const small=node("div","muted",(t?t.count+" Buchungsnachweis(e). ":"")+item.hint);
      small.style.cssText="font-size:11px;line-height:1.45";
      box.append(name,value,small);grid.appendChild(box);
    });
    holder.appendChild(grid);
    const controls=node("div");
    controls.style.cssText="margin:16px 0 10px;display:flex;align-items:center;gap:12px;flex-wrap:wrap";
    const label=node("label","","Buchungen aus: ");
    label.style.fontSize="12px";
    const select=node("select");
    select.style.cssText="background:#052739;color:#fff;padding:8px;border:1px solid #2f7289;border-radius:7px";
    [["all","Alle Quellen"],...Object.entries(categories).map(([k,v])=>[k,v.title])].forEach(([k,v])=>{
      const opt=node("option","",v);opt.value=k;select.appendChild(opt);
    });
    select.value=filter;
    const again=node("button","button button-neutral","Erneut laden");
    again.type="button";again.onclick=()=>{cached=null;load()};
    controls.append(label,select,again);holder.appendChild(controls);
    const count=node("div","muted");count.style.cssText="font-size:12px;margin-bottom:8px";
    holder.appendChild(count);
    const scroller=node("div");
    scroller.style.cssText="overflow-x:auto;max-height:420px;overflow-y:auto;border:1px solid rgba(125,204,232,.18);border-radius:8px";
    holder.appendChild(scroller);
    const more=node("button","button button-neutral","Alle Buchungen anzeigen");
    more.type="button";more.style.marginTop="10px";
    holder.appendChild(more);
    const render=()=>{
      const data=(result.rows||[]).filter(x=>filter==="all"||x.category===filter);
      const visible=showAll?data:data.slice(0,18);
      count.textContent=data.length+" Buchungen in dieser Ansicht; "+visible.length+" angezeigt.";
      const table=node("table");table.style.cssText="width:100%;min-width:670px;border-collapse:collapse;font-size:12px";
      const thead=node("thead");const tr=node("tr");
      ["Datum","Art","Buchungsreferenz","Betrag","Buchungsstatus"].forEach(t=>{
        const th=node("th","",t);th.style.cssText="text-align:left;padding:11px 9px;background:#113d52;position:sticky;top:0";tr.appendChild(th);
      });
      thead.appendChild(tr);table.appendChild(thead);
      const tbody=node("tbody");
      visible.forEach((entry,i)=>{
        const line=node("tr");
        line.style.background=i%2===1?"rgba(21,69,87,.35)":"rgba(4,27,43,.5)";
        const vals=[date(entry.date),categories[entry.category]?.title||entry.category,entry.reference,eu(entry.amount,entry.unit,entry.unit==="EUR"?4:6),entry.status];
        vals.forEach((val,j)=>{
          const td=node("td","",val);td.style.cssText="padding:9px;border-top:1px solid rgba(140,203,220,.13);vertical-align:top;overflow-wrap:anywhere";
          if(j===3)td.style.whiteSpace="nowrap";
          line.appendChild(td);
        });tbody.appendChild(line);
      });
      table.appendChild(tbody);scroller.replaceChildren(table);
      more.hidden=showAll||data.length<=18;
    };
    select.onchange=()=>{filter=select.value;showAll=false;render()};
    more.onclick=()=>{showAll=true;render()};
    render();
    const issues=Object.entries(result.errors||{});
    if(issues.length){
      const warn=node("p","muted","Hinweis zu Datenquellen: "+issues.map(([k,v])=>k+" ("+v+")").join(" · ")+". Fehlerhafte Angaben wurden nicht als 0 € gerechnet.");
      warn.style.cssText="margin-top:12px;font-size:12px";holder.appendChild(warn);
    }
    const crypto=(result.crypto||[]);
    if(crypto.length){
      const cbtn=node("button","button button-neutral","Zusätzliche Krypto-Reservewege anzeigen");
      cbtn.type="button";cbtn.style.marginTop="12px";
      const container=node("div");container.hidden=true;container.style.marginTop="10px";
      cbtn.onclick=()=>{container.hidden=!container.hidden;cbtn.textContent=container.hidden?"Zusätzliche Krypto-Reservewege anzeigen":"Krypto-Reservewege ausblenden"};
      crypto.forEach(rec=>{
        const item=node("p","",rec.route+": "+rec.components.join(" · ")+(rec.error?" – Formelfehler im Sheet!":""));
        item.style.cssText="font-size:12px;margin:4px 0";
        container.appendChild(item);
      });
      holder.append(cbtn,container);
    }
  }
  async function load(){
    const s=readSession(),btn=document.getElementById("biReserveLoad");
    const holder=document.getElementById("biReserveContents");
    if(!s?.token||!btn||!holder)return;
    btn.disabled=true;btn.textContent="Buchungen werden geladen …";
    holder.hidden=false;holder.replaceChildren(node("p","muted","Reservebuchungen werden einmalig aus den Quellen geladen …"));
    try{
      const r=await fetch(API,{method:"POST",cache:"no-store",credentials:"omit",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({action:"reserve_details",session_hash:await hash(s.token)})});
      const json=await r.json();
      if(!r.ok||json.ok!==true)throw new Error(json.error||"RESERVE_READ_FAILED");
      cached=json;showAll=false;paint(json);btn.textContent="Buchungen ausblenden";
    }catch(error){
      holder.replaceChildren(node("p","muted","Buchungen nicht abrufbar: "+String(error?.message||error)+". Es wurden keine Buchungen verändert."));
      btn.textContent="Erneut versuchen";
    }finally{btn.disabled=false}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",create,{once:true});
  else create();
})();
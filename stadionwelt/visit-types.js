/* BetInsight Stadium World — visit type UI.
   Keeps the existing match_description storage field usable for events and tours.
   Unspecified historic visits are never silently relabeled as football matches. */
(function(){
"use strict";
const kinds=["unspecified","match","event","tour","other"];
const L={
 de:{kind:"Art des Stadionbesuchs",details:"Was hast du dort erlebt? (optional)",types:["Nicht angegeben","Fußballspiel","Event / Veranstaltung","Stadionführung / Besichtigung","Sonstiger Besuch"],examples:["Optional: Spiel, Konzert oder Anlass","z. B. Borussia Dortmund – Bayern München","z. B. Konzert, Festival oder andere Veranstaltung","z. B. Stadionführung oder Museumsbesuch","z. B. Training oder private Veranstaltung"]},
 en:{kind:"Type of stadium visit",details:"What did you experience there? (optional)",types:["Not specified","Football match","Event / performance","Stadium tour / sightseeing","Other visit"],examples:["Optional: match, concert or occasion","e.g. Arsenal vs Chelsea","e.g. concert, festival or other event","e.g. stadium tour or museum visit","e.g. training or private event"]},
 es:{kind:"Tipo de visita al estadio",details:"¿Qué viviste allí? (opcional)",types:["Sin especificar","Partido de fútbol","Evento / espectáculo","Visita guiada al estadio","Otra visita"],examples:["Opcional: partido, concierto o evento","p. ej. Real Madrid – Barcelona","p. ej. concierto, festival u otro evento","p. ej. visita guiada o museo","p. ej. entrenamiento u otro motivo"]},
 pt:{kind:"Tipo de visita ao estádio",details:"O que você viveu lá? (opcional)",types:["Não informado","Jogo de futebol","Evento / apresentação","Visita guiada ao estádio","Outra visita"],examples:["Opcional: jogo, show ou evento","ex.: Flamengo x Palmeiras","ex.: show, festival ou outro evento","ex.: visita guiada ou museu","ex.: treino ou outro motivo"]},
 it:{kind:"Tipo di visita allo stadio",details:"Cosa hai vissuto lì? (facoltativo)",types:["Non specificato","Partita di calcio","Evento / spettacolo","Visita guidata allo stadio","Altra visita"],examples:["Facoltativo: partita, concerto o evento","es. Milan – Inter","es. concerto, festival o altro evento","es. tour dello stadio o museo","es. allenamento o altro motivo"]},
 fr:{kind:"Type de visite du stade",details:"Qu'avez-vous vécu sur place ? (facultatif)",types:["Non précisé","Match de football","Événement / spectacle","Visite guidée du stade","Autre visite"],examples:["Facultatif : match, concert ou événement","ex. Paris SG – Marseille","ex. concert, festival ou événement","ex. visite du stade ou musée","ex. entraînement ou autre occasion"]},
 nl:{kind:"Soort stadionbezoek",details:"Wat heb je er meegemaakt? (optioneel)",types:["Niet opgegeven","Voetbalwedstrijd","Evenement / optreden","Stadionrondleiding","Ander bezoek"],examples:["Optioneel: wedstrijd, concert of evenement","bijv. Ajax – PSV","bijv. concert, festival of evenement","bijv. rondleiding of museumbezoek","bijv. training of andere aanleiding"]},
 zh:{kind:"球場到訪類型",details:"您在那裡參加了什麼活動？（選填）",types:["未指定","足球比賽","活動／表演","球場導覽／參觀","其他到訪"],examples:["選填：比賽、演唱會或其他活動","例如：足球比賽","例如：演唱會、節慶或活動","例如：球場導覽、博物館","例如：訓練或其他活動"]}
};
function copy(lang){return L[lang]||L.en}
function escape(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function normalize(value){return kinds.includes(value)?value:"unspecified"}
function label(lang,value){const n=normalize(value);return copy(lang).types[kinds.indexOf(n)]}
function field(lang,value,identifier){
 const t=copy(lang),selected=normalize(value),id="visit-kind-"+String(identifier).replace(/[^a-zA-Z0-9_-]/g,"");
 return '<div class="field"><label for="'+escape(id)+'">'+escape(t.kind)+'</label>'+
  '<select id="'+escape(id)+'" name="visit_type" data-visit-kind>'+
  kinds.map((value,index)=>'<option value="'+value+'"'+(selected===value?' selected':'')+'>'+escape(t.types[index])+'</option>').join("")+
  '</select></div>';
}
function detailField(lang,value,existingValue=""){
 const t=copy(lang),kind=normalize(value);
 return '<div class="field"><label data-visit-detail-label>'+escape(t.details)+'</label>'+
  '<input name="match_description" maxlength="200" value="'+escape(existingValue)+'" data-visit-detail placeholder="'+escape(t.examples[kinds.indexOf(kind)])+'"></div>';
}
function wire(root,lang){
 if(!root)return;
 const t=copy(lang);
 root.querySelectorAll("select[data-visit-kind]").forEach(select=>{
  const form=select.closest("form");if(!form)return;
  const label=form.querySelector("[data-visit-detail-label]"),input=form.querySelector("[data-visit-detail]");
  if(label)label.textContent=t.details;
  function update(){if(input)input.placeholder=t.examples[kinds.indexOf(normalize(select.value))]}
  select.addEventListener("change",update);update();
 });
}
window.BetInsightVisitTypes={field,detailField,normalize,label,wire,kinds};
})();
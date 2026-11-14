/* TIME CLASH · historically sourced EURO squads · 2026-11-14. No synthetic roster completion. */
(function(){
 "use strict";
 const club=window.TC_CLUB_CATALOG=window.TC_CLUB_CATALOG||{};
 const nation=window.TC_ADDITIONAL_NATIONS=window.TC_ADDITIONAL_NATIONS||{};
 const russianClubs=[
  "Spartak Moskau 1996|🇷🇺|80",
  "ZSKA Moskau 2005|🇷🇺|81",
  "Zenit St. Petersburg 2007|🇷🇺|81",
  "Rubin Kasan 2008|🇷🇺|79",
  "Lokomotive Moskau 2004|🇷🇺|79"
 ];
 club["Russland · Meister (Auswahl)"]=russianClubs;
 // A distinct competition-group label avoids suggesting these are World Cup winners.
 nation["Europa · Russland"]=[
  "Russland 2008 · EM-Halbfinale|🇷🇺|80",
  "Russland 2018 · WM-Viertelfinale|🇷🇺|79"
 ];
 const db=window.TC_ROSTER_DB=window.TC_ROSTER_DB||{};
 const coaches=window.TC_COACH_DB=window.TC_COACH_DB||{};
 const meta=window.TC_TEAM_REFERENCE=window.TC_TEAM_REFERENCE||{};
 const data=[
  [
    "Deutschland 1980",
    "Jupp Derwall",
    "*Harald Schumacher;Walter Junghans;Eike Immel",
    "*Manfred Kaltz;*Karlheinz Förster;*Bernard Dietz;*Hans-Peter Briegel;Bernhard Cullmann;Bernd Förster;Herbert Zimmermann",
    "*Uli Stielike;*Bernd Schuster;*Hansi Müller;Caspar Memering;Rainer Bonhof;Felix Magath;Karl Del'Haye;Lothar Matthäus;Miroslav Votava",
    "*Karl-Heinz Rummenigge;*Horst Hrubesch;*Klaus Allofs"
  ],
  [
    "Niederlande 1988",
    "Rinus Michels",
    "*Hans van Breukelen;Joop Hiele",
    "*Adri van Tiggelen;*Ronald Koeman;*Berry van Aerle;*Frank Rijkaard;Sjaak Troost;Wim Koevermans;Wilbert Suvrijn",
    "*Gerald Vanenburg;*Arnold Mühren;*Jan Wouters;*Erwin Koeman;Aron Winter;John van 't Schip;Hendrie Krüzen",
    "*Ruud Gullit;*Marco van Basten;John Bosman;Wim Kieft"
  ],
  [
    "Spanien 1964",
    "José Villalonga",
    "*José Ángel Iribar;José Vicente;Salvador Sadurní",
    "*Isacio Calleja;*Ferran Olivella;*Feliciano Rivilla;Luis María Echeberría;Gallego;Severino Reija",
    "*Josep Maria Fusté;*Chus Pereda;*Ignacio Zoco;*Luis Suárez;José Cuéllar González;Luis del Sol;Paquito;Félix Ruiz;Adelardo Rodríguez",
    "*Amancio Amaro;*Carlos Lapetra;*Marcelino Martínez;Enrique Collar"
  ],
  [
    "Italien 1968",
    "Ferruccio Valcareggi",
    "*Dino Zoff;Enrico Albertosi;Lido Vieri",
    "*Tarcisio Burgnich;*Giacinto Facchetti;*Aristide Guarneri;*Roberto Rosato;*Sandro Salvadore;Angelo Anquilletti;Giancarlo Bercellino;Ernesto Castano",
    "*Giancarlo De Sisti;Giacomo Bulgarelli;Giorgio Ferrini;Antonio Juliano;Giovanni Lodetti;Gianni Rivera",
    "*Pietro Anastasi;*Angelo Domenghini;*Sandro Mazzola;*Luigi Riva;Pierino Prati"
  ],
  [
    "Tschechoslowakei 1976",
    "Václav Ježek",
    "*Ivo Viktor;Alexander Vencel",
    "*Karol Dobiaš;*Jozef Čapkovič;*Anton Ondruš;*Ján Pivarník;*Koloman Gögh;Ladislav Jurkemik;Jozef Barmoš;Pavol Biroš",
    "*Antonín Panenka;*Jozef Móder;*Ján Švehlík;Jaroslav Pollák;Dušan Herda;František Veselý;František Štambachr;Přemysl Bičovský",
    "*Marián Masný;*Zdeněk Nehoda;Dušan Galis;Ladislav Petráš"
  ],
  [
    "Frankreich 1984",
    "Michel Hidalgo",
    "*Joël Bats;Philippe Bergeroo;Albert Rust",
    "*Jean-François Domergue;*Maxime Bossis;*Patrick Battiston;*Yvon Le Roux;Manuel Amoros;Thierry Tusseau",
    "*Luis Fernández;*Michel Platini;*Bruno Bellone;*Alain Giresse;*Jean Tigana;Jean-Marc Ferreri;Daniel Bravo;Bernard Genghini;Didier Six",
    "*Bernard Lacombe;Dominique Rocheteau"
  ],
  [
    "Dänemark 1992",
    "Richard Møller Nielsen",
    "*Peter Schmeichel;Mogens Krogh",
    "*John Sivebæk;*Kent Nielsen;*Lars Olsen;*Kim Christofte;*Torben Piechnik;Claus Christiansen",
    "*John Jensen;*Henrik Larsen;*Kim Vilfort;Henrik Andersen;Johnny Mølby;Peter Nielsen;Morten Bruun",
    "*Flemming Povlsen;*Brian Laudrup;Lars Elstrup;Torben Frank;Bent Christensen Arensøe"
  ],
  [
    "Deutschland 1996",
    "Berti Vogts",
    "*Andreas Köpke;Oliver Kahn;Oliver Reck",
    "*Thomas Helmer;*Matthias Sammer;*Markus Babbel;*Christian Ziege;Stefan Reuter;Jürgen Kohler;René Schneider",
    "*Mehmet Scholl;*Thomas Hässler;*Thomas Strunz;*Dieter Eilts;Marco Bode;Steffen Freund;Andreas Möller;Mario Basler;Jens Todt",
    "*Stefan Kuntz;*Jürgen Klinsmann;Fredi Bobic;Oliver Bierhoff"
  ],
  [
    "Frankreich 2000",
    "Roger Lemerre",
    "*Fabien Barthez;Bernard Lama;Ulrich Ramé",
    "*Bixente Lizarazu;*Laurent Blanc;*Marcel Desailly;*Lilian Thuram;Vincent Candela;Frank Lebœuf",
    "*Patrick Vieira;*Youri Djorkaeff;*Didier Deschamps;*Zinédine Zidane;Robert Pirès;Johan Micoud;Emmanuel Petit;Christian Karembeu",
    "*Thierry Henry;*Christophe Dugarry;Nicolas Anelka;Sylvain Wiltord;David Trezeguet"
  ],
  [
    "Spanien 2008",
    "Luis Aragonés",
    "*Iker Casillas;Andrés Palop;Pepe Reina",
    "*Carlos Marchena;*Carles Puyol;*Joan Capdevila;*Sergio Ramos;Raúl Albiol;Fernando Navarro;Álvaro Arbeloa;Juanito",
    "*Andrés Iniesta;*Xavi Hernández;*Cesc Fàbregas;*Marcos Senna;*David Silva;Santi Cazorla;Xabi Alonso;Rubén de la Red",
    "*Fernando Torres;David Villa;Sergio García;Daniel Güiza"
  ],
  [
    "Spanien 2012",
    "Vicente del Bosque",
    "*Iker Casillas;Víctor Valdés;Pepe Reina",
    "*Gerard Piqué;*Sergio Ramos;*Álvaro Arbeloa;*Jordi Alba;Raúl Albiol;Juanfran",
    "*Andrés Iniesta;*Xavi Hernández;*Cesc Fàbregas;*Xabi Alonso;*Sergio Busquets;*David Silva;Javi Martínez;Juan Mata;Santi Cazorla;Jesús Navas",
    "Pedro Rodríguez;Fernando Torres;Álvaro Negredo;Fernando Llorente"
  ],
  [
    "Portugal 2016",
    "Fernando Santos",
    "*Rui Patrício;Anthony Lopes;Eduardo",
    "*Pepe;*José Fonte;*Raphaël Guerreiro;*Cédric;Bruno Alves;Ricardo Carvalho;Eliseu",
    "*João Mário;*William Carvalho;*Renato Sanches;*Adrien Silva;João Moutinho;Vieirinha;Danilo;André Gomes;Rafa Silva",
    "*Cristiano Ronaldo;*Nani;Éder;Ricardo Quaresma"
  ],
  [
    "Spanien 2024",
    "Luis de la Fuente",
    "*Unai Simón;David Raya;Álex Remiro",
    "*Dani Carvajal;*Robin Le Normand;*Aymeric Laporte;*Marc Cucurella;Nacho;Daniel Vivian;Alejandro Grimaldo;Jesús Navas",
    "*Rodri;*Fabián Ruiz;Mikel Merino;Álex Baena;Martín Zubimendi;Pedri;Fermín López",
    "*Lamine Yamal;*Dani Olmo;*Nico Williams;*Álvaro Morata;Joselu;Ferran Torres;Mikel Oyarzabal;Ayoze Pérez"
  ]
];
 const source="https://www.uefa.com/uefaeuro/history/news/025f-0ff0bba775e3-451a9527dcbf-1000--euro-winners-every-player-from-every-victorious-squad/",finalSource="https://www.uefa.com/uefaeuro/history/news/0259-0e5e039dd8b6-ac24fc62a240-1000--all-the-euro-finals-scores-scorers-lineups-and-venues/";
 const roles=["TW","ABW","MIT","ST"];
 const id=name=>name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/œ/g,"oe").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
 for(const [name,coach,...groups] of data){
  const key=name+" · Europameister";
  const players=groups.flatMap((group,i)=>group.split(";").map(raw=>{
   const starter=raw.startsWith("*"),name=raw.replace(/^\*/,"");
   return {id:id(name),name,pos:roles[i],starter,impact:4*(starter?1:0)+3*(starter?0:1),provenance:"UEFA_EURO_SQUAD"};
  })).map((p,i)=>({...p,squadIndex:i}));
  if(players.filter(p=>p.starter).length!==11||new Set(players.map(p=>p.id)).size!==players.length||!players.some(p=>p.starter&&p.pos==="TW"))throw new Error("Invalid EURO squad: "+key);
  if(!Array.isArray(db[key])||db[key].filter(p=>!p.reconstructed).length<players.length)db[key]=players;
  coaches[key]=coach;
  meta[key]={...(meta[key]||{}),source,referenceLineup:finalSource,strengthPolicy:"SIMULATION_ESTIMATE"};
 }
 // Never fabricate historical names or silently fill missing squad places.
 window.TC_COMPLETE_ROSTERS=function(){return 0;};
 window.TC_RECONSTRUCTION_STATUS={reconstructionPolicy:"DISABLED",generatedOn:"2026-11-14"};
})();
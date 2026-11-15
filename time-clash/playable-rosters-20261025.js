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
 // 2026-11-15: verified Russian tournament squad and same-season club aliases.
 const tournamentRosters=[
  {
    "key": "Russland 2008 · EM-Halbfinale",
    "coach": "Guus Hiddink",
    "source": "https://www.uefa.com/uefaeuro/history/news/0254-0d7bf3424654-c9237bb02847-1000--clinical-spain-set-up-euro-2008-final-date-with-russia-win/",
    "additionalSource": "https://www.uefa.com/european-qualifiers/news/0253-0d7bf3614755-6a05da5059d2-1000--villa-stars-as-spain-signal-their-intent/",
    "groups": [
      "*Igor Akinfeev;Vladimir Gabulov;Vyacheslav Malafeev",
      "*Aleksandr Anyukov;*Vasili Berezutski;*Sergei Ignashevich;*Yuri Zhirkov;Aleksei Berezutski;Renat Yanbaev;Denis Kolodin",
      "*Ivan Saenko;*Sergei Semak;*Igor Semshov;*Konstantin Zyryanov;Diniyar Bilyaletdinov;Oleg Ivanov;Roman Shirokov;Vladimir Bystrov;Dmitri Torbinski",
      "*Andrei Arshavin;*Roman Pavlyuchenko;Dmitri Sychev;Roman Adamov"
    ]
  },
  {
    "key": "Russland 2018 · WM-Viertelfinale",
    "coach": "Stanislav Cherchesov",
    "source": "https://www.bbc.co.uk/sport/football/44346455",
    "additionalSource": "https://img.fifa.com/image/upload/evdvpfdkueqrdlbbrrus.pdf",
    "groups": [
      "*Igor Akinfeev;Vladimir Gabulov;Andrey Lunev",
      "*Mario Fernandes;*Ilya Kutepov;*Sergei Ignashevich;*Fedor Kudryashov;Vladimir Granat;Andrey Semenov;Igor Smolnikov",
      "*Denis Cheryshev;*Daler Kuzyaev;*Roman Zobnin;*Aleksandr Golovin;*Aleksandr Samedov;Yuri Gazinskiy;Alan Dzagoev;Aleksandr Erokhin;Yuri Zhirkov;Anton Miranchuk",
      "*Artem Dzyuba;Aleksey Miranchuk;Fedor Smolov"
    ]
  }
];
 for(const team of tournamentRosters){
  const players=team.groups.flatMap((group,i)=>group.split(";").map(raw=>{
    const starter=raw.startsWith("*"),name=raw.replace(/^\*/,"");
    return {id:id(name),name,pos:roles[i],starter,impact:starter?4:3,provenance:"HISTORICAL_TOURNAMENT_ROSTER"};
  })).map((p,i)=>({...p,squadIndex:i}));
  if(players.length!==23||players.filter(p=>p.starter).length!==11||new Set(players.map(p=>p.id)).size!==23||!players.some(p=>p.starter&&p.pos==="TW"))throw new Error("Invalid squad: "+team.key);
  if(!Array.isArray(db[team.key])||db[team.key].length<players.length)db[team.key]=players;
  coaches[team.key]=team.coach;
  meta[team.key]={...(meta[team.key]||{}),source:team.source,additionalSource:team.additionalSource,strengthPolicy:"SIMULATION_ESTIMATE"};
 }
 // These aliases refer to the same club and title season, not the competition's exact final XI.
 const sameSeasonAliases={
  "Real Madrid 2024": "Real Madrid 2023/24",
  "Bayern München 2020": "FC Bayern München 2019/20",
  "FC Barcelona 2015": "FC Barcelona 2014/15",
  "Ajax 1995": "Ajax Amsterdam 1994/95",
  "Inter Mailand 2010": "Inter Milan 2009/10",
  "Manchester United 2008": "Manchester United 2007/08",
  "FC Porto 2004": "FC Porto 2003/04",
  "Manchester City 2023": "Manchester City 2022/23"
};
 for(const [key,original] of Object.entries(sameSeasonAliases)){
  const players=db[original];
  if((db[key]||[]).length<11&&Array.isArray(players)&&players.length>=11){
   db[key]=players.map(p=>({...p}));
   if(coaches[original])coaches[key]=coaches[original];
   meta[key]={...(meta[original]||{}),rosterScope:"SAME_CLUB_TITLE_SEASON",rosterKey:original};
  }
 }
 // 2026-11-15: sourced 2026 tournament squads and historical final match squads.
 const batch3WorldCup=[
  [
    "USA 2026",
    "Mauricio Pochettino",
    "Chris Brady;Matt Freese;Matt Turner",
    "Max Arfsten;Sergiño Dest;Alex Freeman;Mark McKenzie;Tim Ream;Chris Richards;Antonee Robinson;Miles Robinson;Joe Scally;Auston Trusty",
    "Tyler Adams;Sebastian Berhalter;Weston McKennie;Gio Reyna;Cristian Roldan;Malik Tillman",
    "Brenden Aaronson;Folarin Balogun;Ricardo Pepi;Christian Pulisic;Timothy Weah;Haji Wright;Alejandro Zendejas"
  ],
  [
    "Mexiko 2026",
    "Javier Aguirre",
    "Carlos Acevedo;Guillermo Ochoa;Raúl Rangel",
    "Mateo Chávez;Jesús Gallardo;César Montes;Israel Reyes;Jorge Sánchez;Johan Vásquez",
    "Edson Álvarez;Luis Chávez;Álvaro Fidalgo;Brian Gutiérrez;César Huerta;Erik Lira;Gilberto Mora;Orbelín Pineda;Luis Romo;Obed Vargas",
    "Roberto Alvarado;Santiago Giménez;Armando González;Raúl Jiménez;Guillermo Martínez;Julián Quiñones;Alexis Vega"
  ],
  [
    "Kanada 2026",
    "Jesse Marsch",
    "Maxime Crépeau;Owen Goodman;Dayne St. Clair",
    "Moïse Bombito;Derek Cornelius;Alphonso Davies;Luc de Fougerolles;Alistair Johnston;Alfie Jones;Richie Laryea;Niko Sigur;Joel Waterman",
    "Ali Ahmed;Tajon Buchanan;Mathieu Choinière;Stephen Eustáquio;Ismaël Koné;Liam Millar;Jayden Nelson;Jonathan Osorio;Nathan Saliba;Jacob Shaffelburg",
    "Jonathan David;Promise David;Cyle Larin;Tani Oluwaseyi"
  ],
  [
    "Japan 2026",
    "Hajime Moriyasu",
    "Tomoki Hayakawa;Keisuke Osako;Zion Suzuki",
    "Kou Itakura;Hiroki Ito;Yuto Nagatomo;Ayumu Seko;Yukinari Sugawara;Junnosuke Suzuki;Shogo Taniguchi;Takehiro Tomiyasu;Tsuyoshi Watanabe",
    "Ritsu Doan;Junya Ito;Daichi Kamada;Takefusa Kubo;Shuto Machino;Keito Nakamura;Kaishu Sano;Ao Tanaka",
    "Keisuke Goto;Daizen Maeda;Koki Ogawa;Kento Shiogai;Yuito Suzuki;Ayase Ueda"
  ],
  [
    "Südkorea 2026",
    "Hong Myung-bo",
    "Jo Hyeon-Woo;Kim Seung-Gyu;Song Bum-Keun",
    "Cho Yu-Min;Jens Castrop;Kim Min-Jae;Kim Moon-Hwan;Kim Tae-Hyeon;Lee Han-Beom;Lee Ki-Hyuk;Lee Tae-Seok;Park Jin-Seob;Seol Young-Woo",
    "Bae Jun-Ho;Eom Ji-Sung;Hwang Hee-Chan;Hwang In-Beom;Kim Jin-Gyu;Lee Dong-Gyeong;Lee Jae-Sung;Lee Kang-In;Paik Seung-Ho;Yang Hyun-Jun",
    "Cho Gue-Sung;Oh Hyeon-Gyu;Son Heung-Min"
  ],
  [
    "Australien 2026",
    "Tony Popovic",
    "Patrick Beach;Paul Izzo;Mathew Ryan",
    "Aziz Behich;Jordan Bos;Cameron Burgess;Alessandro Circati;Milos Degenek;Jason Geria;Lucas Herrington;Jacob Italiano;Harry Souttar;Kai Trewin",
    "Cameron Devlin;Ajdin Hrustić;Jackson Irvine;Connor Metcalfe;Paul Okon-Englster;Aiden O'Neill",
    "Nestory Irankunda;Mathew Leckie;Awer Mabil;Mohamed Touré;Nishan Velupilly;Cristian Volpato;Tete Yengi"
  ],
  [
    "Katar 2026",
    "Julen Lopetegui",
    "Mahmoud Abunada;Meshaal Barsham;Salah Zakaria",
    "Ayoub Alawi;Homam Al-Amin;Sultan Al-Brake;Hashmi Hussein;Boualem Khoukhi;Issa Laaye;Lucas Mendes;Pedro Miguel",
    "Mohammed Al-Manai;Karim Boudiaf;Ahmed Fathi;Abdulaziz Hatem;Jassem Jaber;Assim Madibo",
    "Youssef Abdulrazzaq;Akram Afif;Ahmed Alaa;Hassan Al-Haydos;Almoez Ali;Ahmed Al-Janahi;Edmilson Junior;Tahseen Mohammed;Mohammed Muntari"
  ],
  [
    "Saudi-Arabien 2026",
    "Georgios Donis",
    "Nawaf Al-Aqidi;Mohamed Al-Owais;Ahmed Al-Kassar",
    "Saud Abdulhamid;Mohammed Abu Al Shamat;Abdulelah Al Amri;Moteb Al Harbi;Hassan Al Tambakti;Nawaf Boushal;Hassan Kadesh;Ali Lajami;Ali Majrashi;Jehad Thakri",
    "Nasser Al Dawsari;Abdullah Al Khaibari;Khalid Al Ghannam;Alaa Al Hejji;Ziyad Al Johani;Musab Al Juwayr;Mohamed Kanno;Sultan Mandash;Ayman Yahya",
    "Feras Al Brikan;Salem Al Dawsari;Abdullah Al Hamdan;Saleh Al Shehri"
  ]
];
 const batch3Match=[
  [
    "AC Milan 2007",
    "Carlo Ancelotti",
    "https://de.uefa.com/uefachampionsleague/match/300099--milan-vs-liverpool/lineups/",
    "*Dida;Željko Kalac",
    "*Massimo Oddo;*Alessandro Nesta;*Paolo Maldini;*Marek Jankulovski;Cafu;Kakha Kaladze;Giuseppe Favalli",
    "*Gennaro Gattuso;*Andrea Pirlo;*Massimo Ambrosini;*Clarence Seedorf;*Kaká;Serginho;Cristian Brocchi",
    "*Filippo Inzaghi;Alberto Gilardino"
  ],
  [
    "Liverpool 2019",
    "Jürgen Klopp",
    "https://datencenter.dfb.de/en/data-center/champions-league/2018-2019/final/2273243",
    "*Alisson Becker;Simon Mignolet;Caoimhín Kelleher",
    "*Trent Alexander-Arnold;*Joël Matip;*Virgil van Dijk;*Andrew Robertson;Joe Gomez;Alberto Moreno;Dejan Lovren",
    "*Jordan Henderson;*Fabinho;*Georginio Wijnaldum;Adam Lallana;James Milner;Alex Oxlade-Chamberlain;Xherdan Shaqiri",
    "*Mohamed Salah;*Roberto Firmino;*Sadio Mané;Rhian Brewster;Divock Origi;Daniel Sturridge"
  ],
  [
    "Chelsea 2021",
    "Thomas Tuchel",
    "https://www.uefa.com/uefachampionsleague/match/2029498--manchester-city-vs-chelsea/events/",
    "*Édouard Mendy;Kepa Arrizabalaga;Willy Caballero",
    "*Antonio Rüdiger;*Thiago Silva;*César Azpilicueta;*Reece James;*Ben Chilwell;Marcos Alonso;Andreas Christensen;Kurt Zouma;Emerson",
    "*Jorginho;*N'Golo Kanté;*Mason Mount;*Kai Havertz;Mateo Kovačić;Billy Gilmour",
    "*Timo Werner;Christian Pulisic;Olivier Giroud;Callum Hudson-Odoi;Hakim Ziyech"
  ],
  [
    "Juventus 1996",
    "Marcello Lippi",
    "https://de.uefa.com/uefachampionsleague/match/52534--ajax-vs-juventus/lineups/",
    "*Angelo Peruzzi;Michelangelo Rampulla",
    "*Ciro Ferrara;*Gianluca Pessotto;*Moreno Torricelli;*Pietro Vierchowod;Sergio Porrini",
    "*Paulo Sousa;*Didier Deschamps;*Antonio Conte;Vladimir Jugović;Angelo Di Livio",
    "*Gianluca Vialli;*Alessandro Del Piero;*Fabrizio Ravanelli;Michele Padovano"
  ],
  [
    "Benfica 1962",
    "Béla Guttmann",
    "https://www.uefa.com/uefachampionsleague/match/61650/",
    "*Costa Pereira",
    "*João;*Germano;*Ângelo Martins;*Fernando Cruz",
    "*Domiciano Cavém;*Mário Coluna",
    "*José Augusto;*Eusébio;*José Águas;*António Simões"
  ],
  [
    "Nottingham Forest 1980",
    "Brian Clough",
    "https://de.uefa.com/uefachampionsleague/match/63642--nott-m-forest-vs-hamburg/events/",
    "*Peter Shilton",
    "*Viv Anderson;*Frank Gray;*Larry Lloyd;*Kenny Burns;Bryn Gunn",
    "*John McGovern;*Martin O'Neill;*Ian Bowyer;*Gary Mills",
    "*Garry Birtles;*John Robertson;John O'Hare"
  ],
  [
    "Borussia Dortmund 1997",
    "Ottmar Hitzfeld",
    "https://www.uefa.com/uefachampionsleague/news/025a-0ea6c6ce87b6-6b4d11a8ce74-1000--dortmund-v-juventus-background/",
    "*Stefan Klos",
    "*Jürgen Kohler;*Martin Kree;*Matthias Sammer;*Stefan Reuter;*Jörg Heinrich",
    "*Paul Lambert;*Andreas Möller;*Paulo Sousa;Michael Zorc;Lars Ricken",
    "*Stéphane Chapuisat;*Karl-Heinz Riedle;Heiko Herrlich"
  ],
  [
    "VAE 2026",
    "Zlatko Dalić",
    "https://www.skysports.com/football/u-a-e-vs-honduras/teams/579046",
    "*Khalid Eisa;Hamad Al Meqbaali;Fahad Al Dhanhani",
    "*Marcus Meloni;*Alaeddine Zouhir;*Khalifa Al Hammadi;*Ruben Amaral;Khalid Al Dhanhani;Saša Ivković;Yousef Al Mazrouei;Kouame Autonne",
    "*Mamadou Coulibaly;*Isam Faiz;*Luan Pereira;*Ali Saleh;Nicolás Giménez;Abdullah Hamad;Richard Akonnor;Zayed Al Zaabi;Mohammed Al Mansouri;Fábio Lima",
    "*Ousmane Camara;*Bruno Oliveira;Yahya Al Ghassani;Harib Abdullah;Sultan Adil"
  ]
];
 function addBatch3(key,coach,source,groups,scope,expected){
   const players=groups.flatMap((group,i)=>group.split(";").filter(Boolean).map(raw=>{
     const starter=raw.startsWith("*"),name=raw.replace(/^\*/,"");
     return {id:id(name),name,pos:roles[i],starter,impact:3,squadIndex:0,provenance:"DOCUMENTED_ROSTER"};
   })).map((p,i)=>({...p,squadIndex:i}));
   const xi=players.filter(p=>p.starter);
   if(players.length<11||(expected&&players.length!==expected)||new Set(players.map(p=>p.id)).size!==players.length||!players.some(p=>p.pos==="TW")||(xi.length!==0&&(xi.length!==11||!xi.some(p=>p.pos==="TW"))))throw new Error("Invalid roster "+key);
   if((db[key]||[]).length<11){
     db[key]=players;coaches[key]=coach;
     meta[key]={...(meta[key]||{}),source,rosterScope:scope,lineupPolicy:xi.length?"DOCUMENTED_XI":"SIMULATION_SELECTED_XI",strengthPolicy:"SIMULATION_ESTIMATE"};
     if(scope==="WORLD_CUP_2026_TOURNAMENT_SQUAD"){meta[key].additionalSource="https://www.fifa.com/en/articles/fifa-world-cup-2026-squads-confirmed";meta[key].coachSource="https://bolavip.com/en/world-cup/2026-world-cup-coaches-all-48-managers-of-the-qualified-national-teams";}
   }
 }
 for(const [key,coach,...groups] of batch3WorldCup)addBatch3(key,coach,"https://www.mlssoccer.com/news/2026-fifa-world-cup-all-squads",groups,"WORLD_CUP_2026_TOURNAMENT_SQUAD",26);
 for(const [key,coach,src,...groups] of batch3Match)addBatch3(key,coach,src,groups,key==="VAE 2026"?"FRIENDLY_MATCH_SQUAD_2026_11_13":"EUROPEAN_CUP_FINAL_MATCH_SQUAD",0);
 const psgSeason=db["Paris Saint-Germain 2025/26"];
 if((db["Paris Saint-Germain 2026"]||[]).length<11&&Array.isArray(psgSeason)&&psgSeason.length>=11){
  db["Paris Saint-Germain 2026"]=psgSeason.map(p=>({...p}));
  coaches["Paris Saint-Germain 2026"]="Luis Enrique";
  meta["Paris Saint-Germain 2026"]={...(meta["Paris Saint-Germain 2025/26"]||{}),source:"https://www.uefa.com/uefachampionsleague/news/02a5-20c02e59f219-15e92acdc717-1000/",rosterScope:"SAME_CLUB_TITLE_SEASON",rosterKey:"Paris Saint-Germain 2025/26"};
 }
 // Never fabricate historical names or silently fill missing squad places.
 window.TC_COMPLETE_ROSTERS=function(){return 0;};
 window.TC_RECONSTRUCTION_STATUS={reconstructionPolicy:"DISABLED",generatedOn:"2026-11-14"};
})();
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
 // 2026-11-15 batch 4: documented player selections. No claim of exhaustive season coverage.
 const batch4=[
  [
    "Spartak Moskau 1996",
    "Georgi Yartsev",
    "HISTORICAL_SEASON_PLAYER_SELECTION",
    "https://spartakmoskva.ru/seasons/1996",
    "https://national-football-teams.com/club/2026/1996_2/Spartak_Moskva.html",
    "Aleksandr Filimonov;Ruslan Nigmatullin",
    "Sergei Gorlukovich;Dmitri Ananko;Vadim Yevseyev;Ramiz Mamedov;Yuri Nikiforov;Aleksandr Lipko;Vladislav Duyun",
    "Andrei Tikhonov;Dmitri Alenichev;Yegor Titov;Ilya Tsymbalar;Andrey Pyatnitski;Artyom Bezrodny;Serhiy Nahornyak;Aleksei Meleshin",
    "Valeri Kechinov;Aleksandr Shirko;Vladimir Dzhubanov;Valeri Shmarov"
  ],
  [
    "ZSKA Moskau 2005",
    "Valeriy Gazzaev",
    "UEFA_CUP_FINAL_MATCH_SQUAD",
    "https://de.uefa.com/uefaeuropaleague/match/80814--sporting-cp-vs-cska-moskva/",
    "https://www.rsssf.org/ec/ec200405det.html",
    "*Igor Akinfeev;Veniamin Mandrykin",
    "*Sergei Ignashevich;*Aleksei Berezutski;*Vasili Berezutski;*Chidi Odiah;Deividas Šemberas",
    "*Daniel Carvalho;*Elvir Rahimić;*Evgeni Aldonin;*Yuri Zhirkov;Rolan Gusev;Miloš Krasić;Juris Laizāns;Osmar Ferreyra",
    "*Ivica Olić;*Vágner Love;Aleksandr Salugin"
  ],
  [
    "Zenit St. Petersburg 2007",
    "Dick Advocaat",
    "HISTORICAL_SEASON_PLAYER_SELECTION",
    "https://en.wikipedia.org/wiki/2007_FC_Zenit_Saint_Petersburg_season",
    "https://www.footballsquads.co.uk/russia/2007/rfpl/zenit.htm",
    "Vyacheslav Malafeev;Kamil Čontofalský;Mikhail Kerzhakov",
    "Martin Škrtel;Ivica Križanac;Kim Dong-jin;Nicolas Lombaerts;Erik Hagen;Aleksandr Anyukov;Fernando Ricksen",
    "Anatoliy Tymoshchuk;Konstantin Zyryanov;Igor Denisov;Vladislav Radimov;Radek Šírl;Oleksandr Spivak;Lee Ho;Aleksandr Gorshkov;Ilya Maksimov",
    "Andrey Arshavin;Alejandro Domínguez;Pavel Pogrebnyak;Fatih Tekke"
  ],
  [
    "Rubin Kasan 2008",
    "Kurban Berdyev",
    "HISTORICAL_SEASON_PLAYER_SELECTION",
    "https://www.national-football-teams.com/club/2023/2008/Rubin_Kazan.html",
    "https://www.uefa.com/news-media/news/01d3-0f84ea7f1a10-5c9d8291e23f-1000--rubin-bring-up-half-century-with-title-triumph/",
    "Sergei Ryzhikov;Aleksandrs Koļinko;Nukri Revishvili",
    "Cristian Ansaldi;Roman Sharonov;Davit Kvirkvelia;Stjepan Tomas;Lasha Salukvadze;Aleksey Popov;Andrey Fyodorov",
    "Gökdeniz Karadeniz;Sergei Semak;MacBeth Sibaya;Aleksandr Ryazantsev;Christian Noboa;Aleksei Rebko;Vagiz Galiulin",
    "Serhiy Rebrov;Hasan Kabze;Aleksandr Bukharov;Savo Milošević;Roman Adamov"
  ],
  [
    "Lokomotive Moskau 2004",
    "Yuri Syomin",
    "HISTORICAL_SEASON_PLAYER_SELECTION",
    "https://www.rsssf.org/tablesr/rus04squads.html",
    "",
    "Sergei Ovchinnikov;Ruslan Nigmatullin;Zaur Khapov",
    "Vadim Yevseyev;Syarhei Hurenka;Dmitriy Sennikov;Gennadiy Nizhegorodov;Oleg Pashinin;Jacob Lekgetho",
    "Dmitriy Loskov;Diniyar Bilyaletdinov;Dmitriy Khokhlov;Malkhazi Asatiani;Marat Izmailov;Vladimir Maminov;Francisco Lima;Deividas Česnauskis",
    "Dmitriy Sychov;James Chibuzor Obiorah;Ruslan Pimenov"
  ],
  [
    "Inter Miami",
    "Cristian González",
    "2026_SEASON_PLAYER_SELECTION",
    "https://www.mlssoccer.com/clubs/inter-miami-cf/roster/",
    "https://www.mlssoccer.com/news/every-mls-call-up-november-2026-international-window",
    "Dayne St. Clair;Luis Barraza",
    "Gonzalo Luján;Sergio Reguilón;Facundo Mura;Maximiliano Falcón;Micael;Ian Fray;Israel Boatwright;Fricio Caicedo",
    "Casemiro;Rodrigo De Paul;Telasco Segovia;David Ayala;Matías Galarza;Santiago Morales;Alexander Shaw",
    "Lionel Messi;Luis Suárez;Germán Berterame;Riquelme Fillipi;Mateo Silvetti;Daniel Pinter"
  ],
  [
    "Los Angeles FC",
    "Marc Dos Santos",
    "2026_PRESEASON_PLAYER_SELECTION",
    "https://www.lafc.com/news/roster-rundown-2026",
    "https://www.lafc.com/news/lafc-announces-roster-moves-for-2026-season",
    "Hugo Lloris;Thomas Hasal",
    "Ryan Hollingshead;Aaron Long;Kenny Nielsen;Sergi Palencia;Ryan Porteous;Eddie Segura;Artem Smolyakov;Nkosi Tafari",
    "Mark Delgado;Igor Jesus;Jude Terry;Timothy Tillman;Yaw Yeboah",
    "Denis Bouanga;Jeremy Ebobisse;Son Heung-Min;David Martínez;Nathan Ordaz;Adrian Wibowo"
  ],
  [
    "Seattle Sounders",
    "Brian Schmetzer",
    "2026_SEASON_PLAYER_SELECTION",
    "https://www.livescore.com/en/football/team/name/8301/squad/",
    "https://www.soundersfc.com/news/sounders-fc-announces-roster-decisions-to-conclude-2025-season",
    "Stefan Frei;Andrew Thomas;Max Anchor",
    "Ryan Sailor;Nouhou Tolo;Kim Kee-hee;Jackson Ragen;Yeimar Gómez Andrade;Stuart Hawkins;Alex Roldan;Kalani Kossa-Rienzi",
    "Cristian Roldan;Caden Clark;Albert Rusnák;Paul Rothrock;Hassani Dotson;Snyder Brunell;Peter Kingston",
    "Dejan Joveljić;Pedro de la Vega;Jordan Morris;Paul Arriola;Danny Musovski;Jesús Ferreira"
  ],
  [
    "Al Ain",
    "Vladimir Ivić",
    "2026_27_SEASON_PLAYER_SELECTION",
    "https://m.aiscore.com/team-al-ain-fc/xvkjoi9352ix793/squad",
    "https://www.uaepl.ae/en/news-and-gallery/adnoc-pro-league-1012",
    "Khalid Eisa;Mohammed Busanda;Hassan Sani Muhammed",
    "Djordje Skoko;Rafa Rodrigues;Amadu Saidou Niang;Marcel Ratnik;Yahya Benkhaleq;Ramy Rabia;Erik Jorgens de Menezes",
    "Adis Jašić;Hazim Abbas;Matías Palacios;Abdoul Karim Traoré;Alejandro Romero Gamarra;Mohammed Al Baloushi;Valentino Lazaro",
    "Houssine Rahimi;Giorgos Giakoumakis;Jonatas Santos;Soufiane Rahimi"
  ],
  [
    "Shabab Al Ahli",
    "André Jardine",
    "2026_27_SEASON_PLAYER_SELECTION",
    "https://www.shababalahli.ae/",
    "https://www.uaeproleague.ae/en/news-and-gallery/serbian-coaches-lead-the-way-in-adnoc-pro-league-for-202627",
    "Hamad Al Meqebaali;Khaled Saif Alsenaani;Matheus Donelli;Rakan Waleed",
    "Igor Gomes;Jorge Fernandes;Renan;Wout Faes;Kaiky;Rikelme;Kauan Santos;Mersad Seifi",
    "Saeid Ezatolahi;Nemanja Maksimović;Jahnoah Markelo;Federico Cartabia;Thiago Scarpino;Elian Irala;Breno Cascardo;Eid Khamis;Guilherme da Silva",
    "Sardar Azmoun;Sultan Adil;Reza Ghandipour;João Marcelo;Mateus Dias Lima"
  ],
  [
    "Al Wasl",
    "Rui Vitória",
    "2026_27_SEASON_PLAYER_SELECTION",
    "https://www.goal.com/en-om/team/al-wasl/squad/empa4tz5zgtsetckdys3k916m",
    "https://www.livescore.com/en/football/team/al-wasl/4682/squad/",
    "Dinko Horkaš;Abdulrahman Al Ameri;Mohamed Ali;Suhail Abdulla",
    "Soufiane Bouftini;Abdelrahman Saleh;Hugo Neto;Adryelson;Pedro Malheiro;Gabriel Vareta;Rodrigo",
    "Renato Tapia;Siaka Sidibe;Yahia Nader;Cameron Puertas;Nicolás Giménez;Serginho;Ridwan Popoola;Leandro Spadacio",
    "Ali Saleh;Mehdi Taremi;Fábio Lima;Matheus Saldanha;Brahian Palacios;Renato Júnior"
  ]
];
 for(const [key,coach,scope,src,secondary,...groups] of batch4){
  addBatch3(key,coach,src,groups,scope,0);
  meta[key]={...(meta[key]||{}),additionalSource:secondary||undefined,rosterScope:scope,rosterCompleteness:"DOCUMENTED_SELECTION_NOT_EXHAUSTIVE",verifiedDate:"2026-11-15"};
 }
 // Batch 5: season-specific historical sources; existing master file remains intact.
 const batch5=[
  {
    "key": "RWD Molenbeek 1974/75",
    "coach": "Felix Week",
    "mode": "augment",
    "sources": [
      "https://www.statscrew.com/worldfootball/roster/t-RWDFC809/y-1974",
      "https://www.national-football-teams.com/club/257/1974_1/Rwd_Molenbeek.html",
      "https://www.pesmitidelcalcio.com/viewtopic.php?f=30&t=14330"
    ],
    "groups": [
      "Nico de Bree",
      "Eric Dumon;Alex Lafont;Kresten Bjerre",
      "",
      ""
    ]
  },
  {
    "key": "Ghazl El Mahalla 1972/73",
    "mode": "augment",
    "sources": [
      "https://koraapedia.com/%D9%86%D8%AA%D8%A7%D8%A6%D8%AC-%D8%A7%D9%84%D8%AF%D9%88%D8%B1%D9%8A-%D8%A7%D9%84%D9%85%D8%B5%D8%B1%D9%8A-%D9%85%D9%88%D8%B3%D9%85-1972-1973/",
      "https://www.masrawy.com/news/news_regions/details/2019/6/15/1584959/بعد-طرحه-للتطوير-غزل-المحلة-شاهد-على-تاريخ-الرياضة-المصرية-في-80-سنة",
      "https://www.elmwatin.com/496915",
      "https://www.national-football-teams.com/app.php/club/3825/1972_1/Ghazl_El_Mahalla.html",
      "https://www.youm7.com/story/2026/2/23/حدث-لا-يُنسى-عندما-خطف-غزل-المحلة-لقب-الدورى-عام/7314981"
    ],
    "groups": [
      "Abdel Sattar Ali;Mahmoud Shahin",
      "",
      "",
      "Mahmoud Abdeldaim;Omar Abdallah;Mohamed Omasha",
      "Sayed Mehrez;Omar Ramadan;Ahmed Abu Ismail;Mohsen El Nehriri"
    ],
    "aliases": {
      "mahmoud-abdeldaim": "abdeldaim"
    }
  },
  {
    "key": "Al Mokawloon 1982/83",
    "mode": "augment",
    "sources": [
      "https://3rabica.org/%D9%86%D8%A7%D8%AF%D9%8A_%D8%A7%D9%84%D9%85%D9%82%D8%A7%D9%88%D9%84%D9%88%D9%86_%D8%A7%D9%84%D8%B9%D8%B1%D8%A8_%D9%85%D9%88%D8%B3%D9%85_1982%E2%80%9383",
      "https://www.elbalad.news/5069073",
      "https://www.vetogate.com/5747440"
    ],
    "groups": [
      "Joseph-Antoine Bell;Alaa Khalil;Mohamed Younes",
      "Ali Shehata;Gamal Salem;Nabil Ammar;Mohamed Zamzam;Saeed El Sheshini;Alaa Nabil",
      "Mohamed Radwan;Karim Abdel Razek;Adel El Kordi;Magdy Darwish;Nabil Ibrahim;Hazem Khaled",
      "Hamdi Nouh;Naser Mohamed Ali;Alaa Abdel Hafiz;Waheed Morad;Magdy Mostafa"
    ]
  },
  {
    "key": "Wydad AC Casablanca 2014/15",
    "mode": "augment",
    "sources": [
      "https://www.transfermarkt.com/wydad-casablanca/torhueterchronik/verein/6603",
      "https://www.national-football-teams.com/app.php/club/1670/2014/Wydad_Ac_Casablanca.html"
    ],
    "groups": [
      "Mohamed Akid;Badereddine Benaachour;Hamza Ouzal",
      "",
      "",
      ""
    ]
  },
  {
    "key": "Wydad AC Casablanca 2005/06",
    "coach": "José Romão",
    "mode": "selection",
    "sources": [
      "https://www.transfermarkt.co.uk/wydad-casablanca/startseite/verein/6603/saison_id/2005"
    ],
    "groups": [
      "Nadir Lamyaghri;Hakim Mouzaki",
      "Faouzi El Brazi;Hicham Louissi;Mohammed Benchrifa;Nabil Moustade;Mourad Fellah;Mustapha Talha;Zakaria Aoudane",
      "Hamid Termina;Issam El Adoua;Jean-Jacques Gosso;Youness Mankari;Ahmed Talbi;Youssef Mariana;Mohamed Madihi",
      "Faouzi Abdelghani;Abderrahim Saidi;Ibrahima Touré;Ibrahim Kabore"
    ]
  },
  {
    "key": "Wydad AC Casablanca 2016/17",
    "coach": "Hussein Ammouta",
    "mode": "match",
    "date": "2017-03-11",
    "sources": [
      "https://www.transfermarkt.com/wydad-casablanca_cf-mounana/index/spielbericht/2827326"
    ],
    "groups": [
      "*Zouhair Laaroubi;Badereddine Benaachour",
      "*Youssef Rabeh;*Mourtada Fall;*Badr Gaddarine;*Abdellatif Noussir;Amine El Attouchi;Anass Lamrabat;Younès Bellakhdar",
      "*Brahim Nekkach;*Walid El Karti;Anas El Asbahi;Jamel Aït Ben Idir",
      "*Achraf Bencharki;*Mohamed Ounajem;*William Jebor;*Fabrice Ondama;Abdeladim Khadrouf"
    ]
  },
  {
    "key": "Wydad AC Casablanca 2020/21",
    "coach": "Faouzi Benzarti",
    "mode": "match",
    "date": "2021-06-26",
    "sources": [
      "https://www.transfermarkt.com/kaizer-chiefs_wydad-casablanca/index/spielbericht/3573249",
      "https://www.besoccer.com/match/kaizer-chiefs/wydad-casablanca/2021388656/lineups"
    ],
    "groups": [
      "*Ahmed Reda Tagnaouti;Aissa Sioudi",
      "*Amine Farhane;*Achraf Dari;*Yahia Attiyat Allah;*Ayoub El Amloud;Amine Aboulfath;Badr Gaddarine;Hamza Ait Allal",
      "*Yahya Jabrane;*Walid El Karti;*Aymane El Hassouni;Salaheddine Saidi;Ayoub Skouma",
      "*Mohamed Ounajem;*Simon Msuva;*Ayoub El Kaabi;Muaid Ellafi;Zouhair El Moutaraji;Badie Aouk"
    ]
  },
  {
    "key": "Wydad AC Casablanca 2021/22",
    "coach": "Walid Regragui",
    "mode": "match",
    "date": "2022-05-30",
    "sources": [
      "https://www.worldfootball.net/match-report/co730/caf-champions-league/ma9406278/wydad-ac_al-ahly-sc/",
      "https://www.transfermarkt.com/al-ahly-fc_wydad-casablanca/index/spielbericht/3817501"
    ],
    "groups": [
      "*Ahmed Reda Tagnaouti;Aissa Sioudi",
      "*Achraf Dari;*Yahia Attiyat Allah;*Ayoub El Amloud;*Amine Farhane;Cheick Comara;Hamza Asrir;Hamza Ait Allal",
      "*Yahya Jabrane;*Jalal Daoudi;*Reda Jaadi;*Aymane El Hassouni;Anas Serrhat;Abdellah Haimoud",
      "*Zouhair El Moutaraji;*Guy Mbenza;Badie Aouk;Mounsef Chrachem;Juvhel Tsoumou"
    ]
  },
  {
    "key": "Raja Casablanca 2010/11",
    "mode": "selection",
    "sources": [
      "https://www.transfermarkt.com/raja-casablanca/kader/verein/2068/saison_id/2010",
      "https://www.national-football-teams.com/club/1669/2010/Raja_Casablanca.html"
    ],
    "groups": [
      "Tarik El Jarmouni;Yassine El Had;Youness Ataba",
      "Mourad Ayni;Rachid Soulaimani;Mohamed Oulhaj;Ismaïl Benlamaalem;Elamine Erbate;Hicham Mahdoufi;Zakaria Zerouali;Mohamed Chibi",
      "Said Fatah;Kouko Guehi;Nabil Mesloub;Abdessamad Ouarrad;Omar Najdi;Abdessamad Ouhaki;Mohsine Moutaouali;Abdelmoula Berrabeh",
      "Hicham Aboucherouane;Yassine Salhi"
    ]
  },
  {
    "key": "Raja Casablanca 2019/20",
    "coach": "Jamal Sellami",
    "mode": "match",
    "date": "2020-10-11",
    "sources": [
      "https://www.zerozero.pt/jogo/2020-10-11-raja-casablanca-far-rabat/7029924",
      "https://www.soccerpunter.com/match/11961587/Raja-Casablanca-vs-FAR-Rabat"
    ],
    "groups": [
      "*Anas Zniti;Mohamed Bouamira",
      "*Badr Benoun;*Iliass Haddad;*Fabrice Ngah;*Abdelilah Madkour",
      "*Omar Arjoune;*Abdelilah Hafidi;*Mohamed Zrida;Mohamed El Makahazi;Zakaria El Wardi",
      "*Soufiane Rahimi;*Mohsine Moutouali;*Ayoub Nanah;Youssef Bekkari;Mahmoud Benhalib;Anas Jabroun;Oussama Soukhal"
    ]
  },
  {
    "key": "Raja Casablanca 2023/24",
    "coach": "Josef Zinnbauer",
    "mode": "augment",
    "sources": [
      "https://en.wikipedia.org/wiki/2023%E2%80%9324_Raja_CA_season"
    ],
    "groups": [
      "",
      "Zakaria Labib",
      "El Mehdi Moubarik;Zakaria El Wardi;Sabir Bougrine;Adam Ennafati",
      "Yousri Bouzok;Nawfel Zerhouni;El Mehdi Maouhoub;Riad Benayad"
    ]
  },
  {
    "key": "FAR Rabat 2022/23",
    "coach": "Mustapha Samadi",
    "mode": "match",
    "date": "2023-05-29",
    "sources": [
      "https://www.footmercato.net/live/5830376022427848202-fus-rabat-vs-far-rabat",
      "https://thefishy.co.uk/livematch2/fus-rabat-far-rabat-1026697"
    ],
    "groups": [
      "*Mohamed Baayou;Ayoub Lakred",
      "*Anouar Tarkhatt;*Hatim Essaoubi;*Diney Borges;*Mohamed Moufid;Emmanuel Imanishimwe",
      "*Abdelfattah Hadraf;*Mohamed Hrimat;*Zineddine Derrag;*Reda Slim;Brahim Sabaouni;Zakaria Fati",
      "*Mohamed Sahd;*Adam Ennaffati;Hamza Igamane;Joseph Gnadou;Ahmed Hammoudan;Lamine Diakité"
    ]
  },
  {
    "key": "Renaissance Berkane 2024/25",
    "mode": "selection",
    "sources": [
      "https://www.transfermarkt.com/renaissance-de-berkane/kader/verein/37176/saison_id/2024"
    ],
    "groups": [
      "Munir El Kajoui;Hamza Hamiani;Mehdi Maftah",
      "Adil Tahif;Abdelhak Assal;Issoufou Dayo;Amine El Maswab;Hamza El Moussaoui;Mohamed Aymen Sadil;Haytam Manaout",
      "Mamadou Lamine Camara;Soumaila Sidibe;Mohamed Farhane;Yassine Labhiri;Mohamed El Morabit;Reda Hajji",
      "Youssef Mehri;Mateus Santos;Imad Riahi;Youssef Zghoudi;Oussama Lamlioui;Paul Bassène"
    ]
  },
  {
    "key": "FUS Rabat 2015/16",
    "coach": "Walid Regragui",
    "mode": "match",
    "date": "2016-04-08",
    "sources": [
      "https://www.transfermarkt.com/fus-rabat_sports-club-villa/index/spielbericht/4511929",
      "https://fufa.co.ug/caf-confederation-cup-sc-villa-edge-fus-rabat-for-third-consecutive-home-win-on-continent/"
    ],
    "groups": [
      "*Abderahmane El Houasli;Aymane Majid",
      "*Nayef Aguerd;*El Mehdi El Bassil;*Marwane Saadane;*Ass Mandaw Sy;*Mohamed Nahiri;Mehdi Khalis",
      "*Badr Boulahroud;Ayoub Skouma;Youssef El Gnaoui",
      "*Mourad Batna;*Mohammed Fouzair;*Abdessalam Benjelloun;*Yusupha Njie;Moustapha Kondé;Adam Ennaffati"
    ]
  },
  {
    "key": "Moghreb Tétouan 2011/12",
    "coach": "Aziz El Amri",
    "mode": "augment",
    "sources": [
      "https://www.transfermarkt.com/moghreb-tetouan/startseite/verein/9100/saison_id/2011",
      "https://www.transfermarkt.es/moghreb-tetouan/startseite/verein/9100/saison_id/2012",
      "https://www.national-football-teams.com/club/4627/2011_1/Moghreb_Tetouan.html"
    ],
    "groups": [
      "",
      "Mourtada Fall",
      "Daniel Ekedo",
      "Jamal Akachar"
    ]
  }
];
 const batch6=[
  {
    "key": "Hassania US Agadir 2001/02",
    "coach": "M'hamed Fakhir",
    "mode": "match",
    "date": "2002-06-09",
    "sources": [
      "https://lematin.ma/journal/2002/CODM---HUSA--le-Hassania-deguste-son-premier-bonheur/17717.html",
      "https://lematin.ma/journal/2002/Le-premier-sacre-du-Hassania-d-Agadir/17699.html",
      "https://lematin.ma/journal/2002/Le-Hassania-confirme-sa-bonne-forme/14165.html",
      "https://lematin.ma/journal/2002/GNF-I-un-Hassania--flamboyant/12365.html"
    ],
    "groups": [
      "*Benchtioui",
      "*Mustapha Ouchrif;*Tarik Miri",
      "",
      "*Hamou Mouhal",
      "*Sylla;*Darouich;*Dalal;*Allouli;*Zaza;*Abdellatif Agja;*Cornéa;Oulhaj;Hassan Ouchrif;Fatihi"
    ]
  },
  {
    "key": "Hassania US Agadir 2002/03",
    "coach": "M'hamed Fakhir",
    "mode": "match",
    "sources": [
      "https://lematin.ma/journal/2003/GNF-I--le-Hassania-champion-d-automne/25247.html",
      "https://lematin.ma/journal/2002/Raja---HUSA--les-Verts-respirent-mieux/23721.html",
      "https://www.national-football-teams.com/club/4708/2002/Hassania_Us_Agadir.html",
      "https://lematin.ma/journal/2003/HUSA-IZK--Khemisset-accroche-Agadir/26247.html"
    ],
    "groups": [
      "*Benchtioui",
      "*Mustapha Ouchrif;*Tarik Miri;*Abdellatif Agja",
      "",
      "*Hamou Mouhal",
      "*Dalal;*Sylla;*Hassan Ouchrif;*Khalid Chakour;*Hassaini;*Aboulmaghar;Boubou;Mounir Jawad;Allouli"
    ]
  },
  {
    "key": "FAR Rabat 2004/05",
    "mode": "selection",
    "sources": [
      "https://www.transfermarkt.com/as-far-rabat/kader/verein/9099/saison_id/2004",
      "https://ssfaonline.com/leagues/botola-pro-1/season/2004-05/",
      "https://national-football-teams.com/club/1665/2003/Far_Rabat.html"
    ],
    "groups": [
      "Tarik El Jarmouni;Khalid Askri",
      "Ali Bouabé;Noureddine Boubou;Mohamed Fadli;El Houssaine Ouchla;Omar Bendriss;Hassan El Mouataz;Faouzi El Brazi",
      "Ahmed Ajeddou;Abdel El Bouzidi",
      "Mohamed Armoumen;Hakim Ajraoui;Jawad Ouaddouch;Youssef Kaddioui",
      "Brahim El Bahri;Mohamed Kharbouch;Adil Serraj"
    ]
  },
  {
    "key": "Olympique Khouribga 2006/07",
    "coach": "Mustapha Madih",
    "mode": "match",
    "sources": [
      "https://lematin.ma/journal/2006/OCK-a-euro--MAS--1a-euro-0-_L-OCK-MAS-une-rencontre-musclee/71852.html",
      "https://www.national-football-teams.com/club/1668/2006/Olympique_Khouribga.html",
      "https://www.transfermarkt.fr/olympique-khouribga/startseite/verein/18702/saison_id/2006"
    ],
    "groups": [
      "*Abderrafi Gassi",
      "*Hicham Mahdoufi;*Hassan Bouizgar;*Tarik Miri;Adil Bekkari",
      "*Ibrahim Bezghoudi;Amara Karba Bangoura",
      "*Jamal Triki",
      "*Fellah;*Amzil;*Baqlal;*Ouarrad;*Largou;Ouganna"
    ]
  },
  {
    "key": "Cape Town Spurs 1995",
    "coach": "Mich d'Avray",
    "mode": "selection",
    "sources": [
      "https://www.national-football-teams.com/club/3904/1995_2/Cape_Town_Spurs.html",
      "https://www.timeslive.co.za/sunday-times-daily/sport/2023-09-20-sazi-hadebe--time-is-running-out-for-spurs-to-beef-up-their-squad/",
      "https://www.businessday.co.za/bd/sport/soccer/2023-06-20-mogamad-allie-memories-of-the-heyday-of-cape-town-spurs/",
      "https://iol.co.za/capeargus/sport/2002-04-03-pirates-have-experience-santos-have-igesund/",
      "https://www.rsssf.org/tablesz/zaf95.html",
      "https://en.wikipedia.org/wiki/1995_NSL_First_Division"
    ],
    "groups": [
      "André Arendse",
      "David Kannemeyer;David Nyathi;Francis Shonhayi;Edries Burton",
      "David Modise",
      "Shaun Bartlett",
      "Ronnie Zondi;Roger Lupiya;Mike Mhlanga;Craig Rosslee"
    ]
  }
];
 // Batch 7: season-specific evidence, archival spellings retained; no invented roles.
 const batch7=[
  {
    "key": "Raja Beni Mellal 1973/74",
    "mode": "selection",
    "sources": [
      "https://bayanealyaoume.press.ma/%E2%80%8E%D8%A8%D8%B9%D8%AF-%D8%B9%D9%88%D8%AF%D8%A9-%D8%B1%D8%AC%D8%A7%D8%A1-%D8%A8%D9%86%D9%8A-%D9%85%D9%84%D8%A7%D9%84-%D8%A5%D9%84%D9%89-%D8%A7%D9%84%D9%82%D8%B3%D9%85-%D8%A7%D9%84%D8%A3%D9%88/.html",
      "https://rajabm.weebly.com/157516041606157515831610-1585158015751569-157616061610-1605160415751604.html",
      "https://lematin.ma/journal/2012/Raja-Beni-Mellal_ObjectifA-le-maintien-/171342.html"
    ],
    "groups": [
      "Lahbib",
      "",
      "",
      "",
      "Hassan;Babai;Najah;El Kadari;Mazi;Walad II;Boualem;Jardini;Alibou;Sefir"
    ]
  },
  {
    "key": "COD Meknès 1994/95",
    "coach": "Abdelkader Youmir",
    "mode": "selection",
    "sources": [
      "https://bibliothequer.org/dissertations/limpact-de-la-gouvernance-sur-la-performance-des-clubs-sportifs-cas-de-codm/",
      "https://www.national-football-teams.com/club/5087/1994_1/Cod_Meknes.html"
    ],
    "groups": [
      "Rhalil (Nkono)",
      "Mustapha Bidane",
      "",
      "Abdeljalil Hadda",
      "Boudouma;Hsina;Dridab;Benhsayen;Chakir;Dalil;Mantih;Ralfi;Yousfi"
    ]
  },
  {
    "key": "Wydad AC Casablanca 1989/90",
    "mode": "selection",
    "sources": [
      "https://www.national-football-teams.com/app.php/club/1670/1989/Wydad_Ac_Casablanca.html",
      "https://www.rsssf.org/tablesm/maro90.html"
    ],
    "groups": [
      "Mustapha Achab;Khalil Azmi",
      "Lahcen Abrami;Noureddine Naybet;Mustapha El Rharchi;Hassan Hirs;Fadel Jilal;Mustapha Mestouri",
      "Hassan Benabicha;Abdelmajid Bouyboud;Rachid Daoudi",
      "Youssef Fertout;Hassan Nader;Moussa N'Daw;Fakhreddine Rajhy"
    ]
  },
  {
    "key": "Kénitra AC 1980/81",
    "mode": "selection",
    "sources": [
      "https://sport.akhbaralfajr.ma/?p=4118",
      "https://lematin.ma/journal/2009/KAC_Le-club-navigue-a-flou/116457.html",
      "https://www.lereporter.ma/kenitra-deces-de-lancien-portier-du-kac-kacem-bedda/",
      "https://www.national-football-teams.com/club/4707/1980_1/Kenitra_Ac.html"
    ],
    "groups": [
      "Abdelfettah Mouddani;Kacem Bedda",
      "Abdelmajid Aguerd;Noureddine Bouyahyaoui;Khalifa Laâbd",
      "Abdellatif Houmama;Jamal Jebrane;Mustapha Nkila",
      "Mohamed Boussati;Hamed Janina;Aziz Bouabid",
      "El Haouat;Hassan Wakrim;Abdallah Essahasseh;Abdelhak Aguerd;Said Aguerd;Jalil;Benjoud;Tijani"
    ]
  },
  {
    "key": "Kénitra AC 1981/82",
    "mode": "selection",
    "sources": [
      "https://sport.akhbaralfajr.ma/?p=4118",
      "https://lematin.ma/journal/2009/KAC_Le-club-navigue-a-flou/116457.html",
      "https://www.lereporter.ma/kenitra-deces-de-lancien-portier-du-kac-kacem-bedda/",
      "https://national-football-teams.com/de/club/4707/1981_1/Kenitra_Ac.html"
    ],
    "groups": [
      "Abdelfettah Mouddani;Kacem Bedda",
      "Abdelmajid Aguerd;Noureddine Bouyahyaoui;Khalifa Laâbd",
      "Abdellatif Houmama;Jamal Jebrane;Mustapha Nkila;Aziz Bouabid",
      "Mohamed Boussati",
      "El Haouat;Hassan Wakrim;Abdallah Essahasseh;Abdelhak Aguerd;Said Aguerd"
    ]
  },
  {
    "key": "Manning Rangers 1996/97",
    "coach": "Gordon Igesund",
    "mode": "selection",
    "sources": [
      "https://www.timeslive.co.za/sport/soccer/2026-08-14-psl-at-30-years-amazing-time-for-us-says-igesund-on-winning-first-title-with-rangers/",
      "https://www.national-football-teams.com/club/2264/1996/Manning_Rangers_Durban.html",
      "https://mg.co.za/news/south-africa/1997-06-04-bafana-wage-dispute-settled/",
      "https://iol.co.za/capeargus/sport/2001-10-30-bucs-duo-set-for-supersport/",
      "https://mg.co.za/news/south-africa/1996-08-02-after-five-months-the-season-is-starting/"
    ],
    "groups": [
      "Grant Johnson",
      "Liswa Nduti;Innocent Chikoya",
      "Clinton Larsen;Nzongani Kidoda;David Modise",
      "Simon Makhubela;George Koumantarakis",
      "Mark Davies;Bradley Muir;Warren du Pont;Marcus Mphafudi;Solo Ndimande"
    ]
  }
];
 // Batch 8: season-specific or dated career evidence; no extrapolated historical XI.
 const batch8=[
  {
    "key": "Kaizer Chiefs 1977",
    "mode": "selection",
    "sources": [
      "https://www.kaizerchiefs.com/club/history",
      "https://www.kaizerchiefs.com/news/tribute-to-ryder",
      "https://www.kaizerchiefs.com/news/teenage-dladla-genius-who-was-marvel-watch",
      "https://www.kaizerchiefs.com/features/chiefs-legends-pass-birthday-wishes-chiefs-chairman",
      "https://www.kaizerchiefs.com/supporters/jackie-asinamali-masike-kaizer-chiefs-icon",
      "https://www.nasljerseys.com/Players/L/Lamola.Zaccaria.htm",
      "https://www.kaizerchiefs.com/news/chiefs-mourn-legend-ten-ten-nzimande",
      "https://kaizerchiefs.com/club/pele-blaschke-will-always-be-remembered",
      "https://kaizerchiefs.com/club/kaizer-chiefs-embrace-heritage-day-2026",
      "https://www.kaizerchiefs.com/features/kaizer-chiefs-vs-orlando-pirates-head-head-south-african-cup"
    ],
    "groups": [
      "Joseph Sethlodi",
      "Johannes Mofokeng;Jackie Masike",
      "Petros Nzimande;Vusi Lamola;Jan Lechaba;Nelson Dladla;Patrick Ntsoelengoe",
      "Herman Blaschke;Abednigo Ngcobo;Ebson Mugoyo"
    ]
  },
  {
    "key": "Kaizer Chiefs 1979",
    "mode": "selection",
    "sources": [
      "https://www.kaizerchiefs.com/club/history",
      "https://www.kaizerchiefs.com/news/tribute-to-ryder",
      "https://www.kaizerchiefs.com/news/teenage-dladla-genius-who-was-marvel-watch",
      "https://www.kaizerchiefs.com/features/chiefs-legends-pass-birthday-wishes-chiefs-chairman",
      "https://www.kaizerchiefs.com/supporters/jackie-asinamali-masike-kaizer-chiefs-icon",
      "https://www.nasljerseys.com/Players/L/Lamola.Zaccaria.htm",
      "https://www.kaizerchiefs.com/news/khosi-legends-pay-homage-chiefs-56th-birthday",
      "https://www.kaizerchiefs.com/news/chiefs-saddened-pereira-passing",
      "https://en.wikipedia.org/wiki/Simon_Lehoko"
    ],
    "groups": [
      "Joseph Sethlodi",
      "Johannes Mofokeng;Jackie Masike;Simon Lehoko",
      "Vusi Lamola;Nelson Dladla;Lucky Stylianou;Patrick Ntsoelengoe",
      "Abednigo Ngcobo;Ebson Mugoyo;Frank Pereira"
    ]
  },
  {
    "key": "Kaizer Chiefs 1981",
    "mode": "selection",
    "sources": [
      "https://www.kaizerchiefs.com/club/history",
      "https://www.kaizerchiefs.com/news/tribute-to-ryder",
      "https://www.kaizerchiefs.com/news/teenage-dladla-genius-who-was-marvel-watch",
      "https://www.kaizerchiefs.com/features/chiefs-legends-pass-birthday-wishes-chiefs-chairman",
      "https://www.kaizerchiefs.com/supporters/jackie-asinamali-masike-kaizer-chiefs-icon",
      "https://www.nasljerseys.com/Players/L/Lamola.Zaccaria.htm",
      "https://www.kaizerchiefs.com/features/kaizer-chiefs-vs-orlando-pirates-head-head-south-african-cup",
      "https://www.kaizerchiefs.com/club-news/eighties-chiefs-golden-era",
      "https://www.kaizerchiefs.com/club/memoirs-with-peta-balac-1980-1985",
      "https://en.wikipedia.org/wiki/Simon_Lehoko",
      "https://www.kaizerchiefs.com/news/chiefs-saddened-pereira-passing"
    ],
    "groups": [
      "Peta Bala’c;Joseph Sethlodi",
      "Johannes Mofokeng;Simon Lehoko;Frank Pereira",
      "Patrick Ntsoelengoe;Jan Lechaba;Lucky Stylianou;Nelson Dladla",
      "Abednigo Ngcobo;Zebulon Nhlapo;Marks Maponyane",
      "Leonard Likoebe"
    ]
  },
  {
    "key": "FAR Rabat 1988/89",
    "coach": "Antonio Angelillo",
    "mode": "selection",
    "sources": [
      "https://www.national-football-teams.com/club/1665/1988_1/Far_Rabat.html",
      "https://www.leballonrond.fr/equipe/far-rabat/2445?epoca_id=118"
    ],
    "groups": [
      "Abdelkader El Brazi;Salahdine Hmied",
      "Abdelmajid Lamriss;Mouhcine Bouhlal;Abdelouahed Chammami;Saad Dahhane;Ahmed Ermouki;Lahcen Ouadani",
      "Hammou Fadili;Mohamed El Ouardi;Abdallah Haidamou",
      "Lahcen Anaflous;Abderrazak Khairi;Abdeslam Laghrissi"
    ]
  },
  {
    "key": "MAS Fès 2025/26",
    "mode": "selection",
    "sources": [
      "https://tkr-app.com/match/206786",
      "https://www.transfermarkt.de/mas-fes/kader/verein/3282/saison_id/2025",
      "https://www.transfermarkt.com/mas-fes/startseite/verein/3282/saison_id/2025",
      "https://www.11props.com.br/matches/botola-pro-1706/25-26/raja-club-athletic-22345-x-mas-de-fes-22347"
    ],
    "groups": [
      "Salaheddine Chihab;Oussama Errahmany",
      "Hamza Ait Allal;Ayman Chabani;Adil Rhaili;Marouane Ouhrou;Saad Ait Khorsa;Driss El Jabli;Zakaria Hamadi",
      "Achraf Harmach;Oussama Noureddine;Anas Tahiri;Adam Brika;Hamza Afsal;Amine Oudrhiri;El Habib Brija",
      "Soufiane Benjdida;Soulaïman Allouch;Khalid Baba;Kevin Yamga;Youssef Dalouzi"
    ]
  }
];
 // Batch 9: short 1996 season continuity and independently dated 1990 club evidence. Unknown field roles remain unconfirmed.
 const batch9=[
  {
    "key": "Kaizer Chiefs 1996",
    "mode": "selection",
    "sources": [
      "https://www.kaizerchiefs.com/club/history",
      "https://www.national-football-teams.com/club/2261/1995_2/Kaizer_Chiefs_Soweto.html",
      "https://www.national-football-teams.com/club/2261/1996_1/Kaizer_Chiefs_Soweto.html",
      "https://www.transfermarkt.co.za/kaizer-chiefs/alletransfers/verein/568",
      "https://www.kaizerchiefs.com/club/the-preview-mamelodi-sundowns-v-kaizer-chiefs",
      "https://www.kaizerchiefs.com/club/history-in-the-making",
      "https://iol.co.za/capeargus/sport/2004-11-19-dynamos-itching-to-beat-amakhosi/"
    ],
    "groups": [
      "Brian Baloyi",
      "Jacob Tshisevhe;Neil Tovey;Leslie Langa;Rudolph Seale;Lifa Gqosha",
      "Thabang Lebese;Thabo Mooki;Frank Makua;Isaac Kungwane;David Modise",
      "Pollen Ndlanya"
    ]
  },
  {
    "key": "Mamelodi Sundowns 1990",
    "mode": "selection",
    "sources": [
      "https://national-football-teams.com/club/2263/1990_2/Mamelodi_Sundowns.html",
      "https://magazine.sundownsfc.co.za/articles/zungu-and-downs-cut-from-the-same-fabric",
      "https://sundownsfc.co.za/honours/"
    ],
    "groups": [
      "Mark Anderson",
      "Joas Magolego;Sam Kambule",
      "Zane Moosa;Harold Legodi",
      "Bennett Masinga;Lovemore Chafunya;Cedric Nakhumwa",
      "Harris Choeu;Rabie Moripe;Lucky Molefe"
    ]
  }
];
 // Batch 10: historical season selections; uncertain transfer timing explicitly recorded.
 const batch10=[
  {
    "key": "Raja Casablanca 1987/88",
    "mode": "selection",
    "coach": "Fernando Cabrita",
    "sources": [
      "https://www.national-football-teams.com/club/1669/1987/Raja_Casablanca.html",
      "https://rajanation1949.blogspot.com/2016/09/19871988.html",
      "https://lematin.ma/journal/2016/l-ex-portier-du-raja--et-de-la-rsk-said--ait-salah-honore/239842.html",
      "https://fr.wikipedia.org/wiki/Liste_des_joueurs_du_Raja_Club_Athletic"
    ],
    "groups": [
      "Saïd Aït Salah",
      "Tijani El Maataoui;Hassan Mouahid;Khalid Moussalek;Mustapha Souyeb",
      "Mustapha Khalif;Mohamed Madih;Said Seddiki",
      "Salif Diagne;Abderrahim Hamraoui",
      "Faouzi Kadmiri;Fathi Jamal;Rachid Jellab"
    ],
    "note": "Season selection combining archival lineup, independent goalkeeper identification and season statistics; unverified field positions left unconfirmed."
  },
  {
    "key": "Wydad AC Casablanca 1977/78",
    "mode": "selection",
    "sources": [
      "https://www.national-football-teams.com/club/1670/1977_1/Wydad_Ac_Casablanca.html",
      "https://albayane.press.ma/badou-zaki-un-grand-gardien-de-but-des-lions-et-du-wac.html",
      "https://www.wydad-history.com/legends",
      "https://lematin.ma/journal/2014/portrait_un-entraineur-pour-une-autre-epopee-africaine/201526.html"
    ],
    "groups": [
      "Badou Ezzaki",
      "Mohamed Rabih;Larbi Aherdane;Jawad Abbad El-Andaloussi",
      "Abdelaziz Bouderbala;Mustapha Choukri;Larbi Mouissi;Mustapha Zaghrari",
      "Abdelmajid Sehaita;Ahmed Abdouali;Abdelkhalek Saber"
    ],
    "note": "Al Bayane explicitly credits Zaki with the 1978 championship and WAC History dates his arrival to 1977. Other biographies date the move to 1978; exact transfer date and reference match XI not established."
  }
];
 // Batch 11: evidence from documented career intervals and role records.
 const batch11=[
  {
    "key": "FAR Rabat 1983/84",
    "mode": "selection",
    "coach": "José Faria",
    "sources": [
      "https://dimasbaa.com/en/club/far-rabat",
      "https://www.national-football-teams.com/club/1665/1984/Far_Rabat.html",
      "https://www.transfermarkt.com/far-rabat/startseite/verein/9099/saison_id/1983",
      "https://sport.le360.ma/football/botola/as-far-de-club-militaire-a-icone-du-football-populaire-a-rabat_4PQ5ON4NSRHE3BYDVAWUEKWQQM/"
    ],
    "groups": [
      "Salahdine Hmied",
      "Abdelmajid Lamriss;Saad Dahhane;Ahmed Ermouki;Lahcen Ouadani",
      "Hammou Fadili;Mohamed Timoumi;Mohamed El Ouardi;Abdallah Haidamou",
      "Abderrazak Khairi;Abdeslam Laghrissi"
    ],
    "note": "Season selection based on career intervals covering 1983/84, goalkeeper arrival in transfer archive and corroborating subsequent season position data. No original match XI or complete season squad claimed."
  }
];
 // Batch 12: championship honour roll and season continuity; explicitly qualified evidence.
 const batch12=[
  {
    "key": "SC Chabab Mohammédia 1979/80",
    "mode": "selection",
    "coach": "Abdelkader Lakhmiri",
    "sources": [
      "https://maroc-football-history.blogspot.com/p/blog-page_47.html",
      "https://maroc-football-history.blogspot.com/2016/09/blog-post_67.html",
      "https://lematin.ma/supplement/sport/2008/Gnfe_Vivement-la-chaleur-du-public-/Chabab-Mohammedia_Fraichement-promu-en-GNF-I/97825.html",
      "https://www.snrt.ma/fr/node/20850"
    ],
    "groups": [
      "Tahar Erraâd",
      "",
      "",
      "Ahmed Faras;Acila",
      "Raâd II;Haddadi II;Glaoua;Qathari;Hmida;Miguel II;Chane;Abdellah (Nijm)"
    ],
    "note": "The historical title honour roll names eleven members, including the brother Raâd II, Haddadi II and Miguel II under archival identifiers. Two blog copies of the roll are not independent. Le Matin independently corroborates the title, Faras, Acila, the Raâd and Haddadi families, Glaoua and Miguel. Incomplete given names and unverified positions are not invented."
  },
  {
    "key": "Kawkab AC Marrakech 1991/92",
    "mode": "selection",
    "coach": "Abdelkhalek Louzani",
    "sources": [
      "https://www.zerozero.pt/equipa/kawkab/2451?epoca_id=121",
      "https://dimasbaa.com/en/club/kawkab-ac-marrakech",
      "https://national-football-teams.com/de/club/2851/1990_1/Kawkab_Ac_Marrakech.html",
      "https://www.national-football-teams.com/club/2851/1992/Kawkab_Ac_Marrakech.html",
      "https://www.pinte2foot.com/article/ahmed-bahja-le-kawkab-1-3",
      "https://www.snrt.ma/fr/node/12298"
    ],
    "groups": [
      "Zakaria Alaoui",
      "Tahar El Khalej;Ahmed Ermouki;Ahmed Masbahi;Mohamed Ahmidouch",
      "Mohamed Guisser;Hicham Dmiai",
      "Ahmed Bahja;Mustapha Kiddi;Driss Loumari;Zakaria Rmouj"
    ],
    "note": "Seven players are directly listed for 1991/92 by zerozero; adjacent season records, career intervals and Bahja's interview-based retrospective corroborate other names. Ahmidouch's membership is inferred from the 1990/91 cup final scorer Hamiddouch and his 1992/93 squad record; no exact league match in 1991/92 has been located. Positions are general roles, not a historical XI."
  }
];
 for(const t of [...batch5,...batch6,...batch7,...batch8,...batch9,...batch10,...batch11,...batch12]){
  const known=Array.isArray(db[t.key])?db[t.key]:[];
  const next=t.mode==="augment"?new Map(known.filter(p=>!p.reconstructed).map(p=>[p.id,{...p,starter:false}])):new Map();
  for(let i=0;i<t.groups.length;i++)for(const raw of t.groups[i].split(";").filter(Boolean)){
   const starter=raw.startsWith("*"),name=raw.replace(/^\*/,""),canonical=id(name),key=t.aliases?.[canonical]||canonical;
   const old=known.find(p=>p.id===key||p.id===canonical)||{};
   next.set(key,{...old,id:canonical,name,pos:roles[i]||"",prole:roles[i]?undefined:"Feldspieler",role:undefined,starter,impact:old.impact||3,provenance:"DOCUMENTED_ROSTER",sourceRefs:t.sources,positionPolicy:roles[i]?"DOCUMENTED_OR_GENERAL_ROLE":"UNCONFIRMED"});
  }
  const players=[...next.values()].map((p,i)=>({...p,squadIndex:i}));
  const xi=players.filter(p=>p.starter);
  if(players.length<11||new Set(players.map(p=>p.id)).size!==players.length||!players.some(p=>p.pos==="TW")||(t.mode==="match"&&(xi.length!==11||!xi.some(p=>p.pos==="TW"))))throw new Error("Invalid historical roster "+t.key);
  db[t.key]=players;
  if(t.coach)coaches[t.key]=t.coach;
  meta[t.key]={...(meta[t.key]||{}),source:t.sources[0],additionalSources:t.sources.slice(1),rosterScope:t.mode==="match"?"DOCUMENTED_MATCH_SELECTION":"HISTORICAL_SEASON_PLAYER_SELECTION",matchDate:t.date||undefined,rosterCompleteness:"NOT_EXHAUSTIVE",lineupPolicy:t.mode==="match"?"DOCUMENTED_XI":"SIMULATION_SELECTED_XI",strengthPolicy:"SIMULATION_ESTIMATE",...(t.note?{sourceQualification:t.note}:{})};
 }
 // Never fabricate historical names or silently fill missing squad places.
 window.TC_COMPLETE_ROSTERS=function(){return 0;};
 window.TC_RECONSTRUCTION_STATUS={reconstructionPolicy:"DISABLED",generatedOn:"2026-11-14"};
})();
/* BetInsight TIME CLASH · verified national-team roster patches · 2026-09-30
   Purpose: keep historical national-team simulations on real player names.
   Sources:
   - Germany 2014: DFB/FIFA World Cup 2014 squad
   - Greece 2004: UEFA EURO 2004 official squad announcement
   This file merges into the large club roster database and never overwrites unrelated teams. */
(function(){
  const db=window.TC_ROSTER_DB=window.TC_ROSTER_DB||{};
  const coaches=window.TC_COACH_DB=window.TC_COACH_DB||{};
  const p=(id,name,pos,impact=3,starter=false)=>({id,name,pos,impact,starter});

  db["Deutschland 2014 · Weltmeister"]=[
    p("manuel-neuer","Manuel Neuer","TW",5,true),
    p("philipp-lahm","Philipp Lahm","ABW",5,true),
    p("jerome-boateng","Jérôme Boateng","ABW",4,true),
    p("mats-hummels","Mats Hummels","ABW",5,true),
    p("benedikt-howedes","Benedikt Höwedes","ABW",4,true),
    p("christoph-kramer","Christoph Kramer","MIT",3,true),
    p("bastian-schweinsteiger","Bastian Schweinsteiger","MIT",5,true),
    p("toni-kroos","Toni Kroos","MIT",5,true),
    p("mesut-ozil","Mesut Özil","MIT",4,true),
    p("thomas-muller","Thomas Müller","ST",5,true),
    p("miroslav-klose","Miroslav Klose","ST",5,true),
    p("ron-robert-zieler","Ron-Robert Zieler","TW",3,false),
    p("roman-weidenfeller","Roman Weidenfeller","TW",4,false),
    p("erik-durm","Erik Durm","ABW",3,false),
    p("matthias-ginter","Matthias Ginter","ABW",3,false),
    p("kevin-grosskreutz","Kevin Großkreutz","ABW",3,false),
    p("per-mertesacker","Per Mertesacker","ABW",4,false),
    p("shkodran-mustafi","Shkodran Mustafi","ABW",3,false),
    p("julian-draxler","Julian Draxler","MIT",3,false),
    p("sami-khedira","Sami Khedira","MIT",4,false),
    p("mario-gotze","Mario Götze","ST",5,false),
    p("lukas-podolski","Lukas Podolski","ST",4,false),
    p("andre-schurrle","André Schürrle","ST",4,false)
  ];
  coaches["Deutschland 2014 · Weltmeister"]="Joachim Löw";

  db["Griechenland 2004 · Europameister"]=[
    p("antonios-nikopolidis","Antonios Nikopolidis","TW",5,true),
    p("giourkas-seitaridis","Giourkas Seitaridis","ABW",5,true),
    p("traianos-dellas","Traianos Dellas","ABW",5,true),
    p("mihalis-kapsis","Mihalis Kapsis","ABW",4,true),
    p("panagiotis-fyssas","Panagiotis Fyssas","ABW",4,true),
    p("theodoros-zagorakis","Theodoros Zagorakis","MIT",5,true),
    p("angelos-basinas","Angelos Basinas","MIT",4,true),
    p("konstantinos-katsouranis","Konstantinos Katsouranis","MIT",4,true),
    p("stylianos-giannakopoulos","Stylianos Giannakopoulos","MIT",4,true),
    p("angelos-charisteas","Angelos Charisteas","ST",5,true),
    p("zisis-vryzas","Zisis Vryzas","ST",4,true),
    p("konstantinos-chalkias","Konstantinos Chalkias","TW",3,false),
    p("theofanis-katergiannakis","Theofanis Katergiannakis","TW",3,false),
    p("ioannis-goumas","Ioannis Goumas","ABW",3,false),
    p("nikolaos-dabizas","Nikolaos Dabizas","ABW",3,false),
    p("stylianos-venetidis","Stylianos Venetidis","ABW",3,false),
    p("pantelis-kafes","Pantelis Kafes","MIT",3,false),
    p("vassilios-lakis","Vassilios Lakis","MIT",3,false),
    p("giorgos-georgiadis","Giorgos Georgiadis","MIT",3,false),
    p("giorgos-karagounis","Giorgos Karagounis","MIT",5,false),
    p("vassilios-tsiartas","Vassilios Tsiartas","MIT",4,false),
    p("dimitrios-papadopoulos","Dimitrios Papadopoulos","ST",3,false),
    p("themistoklis-nikolaidis","Themistoklis Nikolaidis","ST",4,false)
  ];
  coaches["Griechenland 2004 · Europameister"]="Otto Rehhagel";
})();
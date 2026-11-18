// Phrases proposées dans les bulles et les textes, selon ce que montre l'image de la case.

// Objets reconnus par le modèle de détection (COCO-SSD) → sujet de nos phrases
export const SUJETS_COCO = {
  person: 'personne',
  cat: 'chat',
  dog: 'chien',
  bird: 'oiseau',
  horse: 'animal', sheep: 'animal', cow: 'animal', elephant: 'animal', bear: 'animal', zebra: 'animal', giraffe: 'animal',
  car: 'voiture', truck: 'voiture', bus: 'voiture', motorcycle: 'voiture',
  bicycle: 'velo',
  airplane: 'avion',
  boat: 'bateau',
  train: 'train',
  banana: 'nourriture', apple: 'nourriture', sandwich: 'nourriture', orange: 'nourriture', broccoli: 'nourriture',
  carrot: 'nourriture', 'hot dog': 'nourriture', pizza: 'nourriture', donut: 'nourriture', cake: 'nourriture',
  bowl: 'nourriture', fork: 'nourriture', knife: 'nourriture', spoon: 'nourriture', 'dining table': 'nourriture',
  cup: 'boisson', 'wine glass': 'boisson', bottle: 'boisson',
  'sports ball': 'sport', frisbee: 'sport', skis: 'sport', snowboard: 'sport', kite: 'sport', 'baseball bat': 'sport',
  'baseball glove': 'sport', skateboard: 'sport', surfboard: 'sport', 'tennis racket': 'sport',
  tv: 'ecran', laptop: 'ecran', mouse: 'ecran', remote: 'ecran', keyboard: 'ecran', 'cell phone': 'ecran',
  book: 'livre',
  chair: 'maison', couch: 'maison', bed: 'maison', 'potted plant': 'maison', vase: 'maison', clock: 'maison',
  'teddy bear': 'maison', refrigerator: 'maison', oven: 'maison', microwave: 'maison', toaster: 'maison',
  'traffic light': 'ville', 'fire hydrant': 'ville', 'stop sign': 'ville', 'parking meter': 'ville', bench: 'ville',
  umbrella: 'ville', handbag: 'ville', suitcase: 'ville', backpack: 'ville', tie: 'ville',
};

const PHRASES = {
  personne: {
    parole: ['Tu as vu ça ?', "Je crois qu'on nous observe…", 'Fais-moi confiance !', "C'est le plus beau jour de ma vie !"],
    pensee: ["J'aurais dû rester au lit…", 'Garde ton calme, tout va bien…', 'Et si personne ne remarquait ?'],
    cri: ['AU SECOURS !', 'NOOON !', 'ATTENDS-MOI !'],
    narration: ['Ce jour-là, tout allait changer…', 'Au même moment, quelque part en ville…', 'Personne ne se doutait de rien.'],
    libre: ['Le début de l’aventure', 'Un jour ordinaire… ou presque'],
  },
  chat: {
    parole: ['Miaou ? Où est ma pâtée ?', 'Je ne suis PAS sur ton clavier.', 'Caresse-moi. Non, arrête.', 'Ce carton est à moi.'],
    pensee: ['Ronronner, dormir, recommencer…', 'Cet humain me sert bien.', 'Et si je faisais tomber ce verre ?'],
    cri: ['MIAOUUU !', 'FSSSHHH !', 'MIAOU !!!'],
    narration: ['Le chat avait un plan. Comme toujours.', 'Rien n’échappait au regard du félin.'],
    libre: ['Mission croquettes', 'Chat-pitre 1'],
  },
  chien: {
    parole: ['On va se promener ? On y va ? On y va ?!', 'Lance la balle !', "C'est pas moi qui ai mangé le canapé.", 'Je suis un gentil chien !'],
    pensee: ['Une saucisse… là… je la sens…', 'Le facteur reviendra. Je serai prêt.', 'Meilleur ami de l’humain. Officiellement.'],
    cri: ['OUAF ! OUAF !', 'WOUF !!!', 'AOUUUH !'],
    narration: ['Son flair ne l’avait jamais trompé.', 'Le chien sentit que quelque chose se préparait.'],
    libre: ['Toutou en mission', 'Le meilleur ami'],
  },
  oiseau: {
    parole: ['Cui-cui ! Vous avez des miettes ?', 'Vue d’en haut, c’est magnifique !', 'Personne ne vole comme moi.'],
    pensee: ['Encore un peu et je touche les nuages…', 'Ce chat me regarde bizarrement.'],
    cri: ['PIOU PIOU !', 'CUI-CUIII !'],
    narration: ['Il prit son envol au lever du soleil.', 'Du haut de sa branche, il voyait tout.'],
    libre: ['Plein ciel', 'Prendre son envol'],
  },
  animal: {
    parole: ['Tu me prends en photo ?', "Ici, c'est chez moi.", 'On se connaît ?'],
    pensee: ['Encore des touristes…', 'L’herbe est plus verte par ici.'],
    cri: ['GROAAR !', 'MEUUUH !', 'HIIII !'],
    narration: ['Au cœur de la nature, la vie suivait son cours.', 'La grande aventure sauvage commençait.'],
    libre: ['Nature sauvage', 'Le roi du coin'],
  },
  voiture: {
    parole: ['Accroche-toi, ça va secouer !', 'On est en retard !', 'Plein d’essence et en route !'],
    pensee: ['Pourvu que le feu reste vert…', 'Encore des bouchons…'],
    cri: ['VROUUUM !', 'POUET POUET !', 'ATTENTION !'],
    narration: ['La course-poursuite venait de commencer.', 'La route s’étendait à perte de vue.'],
    libre: ['En route !', 'Pleins gaz'],
  },
  velo: {
    parole: ['Encore une côte ?!', 'Regarde, sans les mains !', 'On fait la course ?'],
    pensee: ['Pédale, pédale, pédale…', 'J’aurais dû gonfler les pneus.'],
    cri: ['DRING DRING !', 'POUSSEZ-VOUS !'],
    narration: ['Le vent dans les cheveux, il filait à toute allure.'],
    libre: ['Tour de ville', 'Deux roues, une aventure'],
  },
  avion: {
    parole: ['Attachez vos ceintures !', 'Destination : l’aventure !', 'On décolle !'],
    pensee: ['Pourvu qu’il y ait des bretzels…', 'Les nuages vus d’en haut…'],
    cri: ['VROOOOM !', 'DÉCOLLAGE !'],
    narration: ['À dix mille mètres d’altitude, le voyage commençait.'],
    libre: ['Embarquement immédiat', 'Cap sur l’horizon'],
  },
  bateau: {
    parole: ['Terre en vue !', 'Hissez les voiles !', 'Moussaillon, à la barre !'],
    pensee: ['J’ai un peu le mal de mer…', 'Que cache cet horizon ?'],
    cri: ['À L’ABORDAGE !', 'PLOUF !'],
    narration: ['Le large les appelait.', 'Les vagues racontaient mille histoires.'],
    libre: ['Cap au large', 'L’appel de la mer'],
  },
  train: {
    parole: ['Le train va partir !', 'Tu as les billets ?', 'Prochain arrêt : l’aventure !'],
    pensee: ['Les paysages défilent…', 'J’espère que c’est le bon quai.'],
    cri: ['TCHOU TCHOU !', 'ATTENDEZ-MOI !'],
    narration: ['Le train fila dans la nuit.'],
    libre: ['Voie 9 ¾', 'Le grand voyage'],
  },
  nourriture: {
    parole: ['À table !', 'Ça a l’air délicieux !', 'Qui a mangé la dernière part ?!'],
    pensee: ['Juste une bouchée… ou deux…', 'Le régime commence demain.'],
    cri: ['MIAM !', 'J’AI FAIM !', 'SCRONCH !'],
    narration: ['L’odeur envahit toute la pièce.', 'Le festin pouvait commencer.'],
    libre: ['Bon appétit !', 'Le grand festin'],
  },
  boisson: {
    parole: ['Santé !', 'Un petit café ?', 'À la nôtre !'],
    pensee: ['Encore une tasse et je suis réveillé…', 'Rafraîchissant !'],
    cri: ['GLOUPS !', 'SLURP !'],
    narration: ['Ils levèrent leurs verres à l’aventure.'],
    libre: ['Petite pause', 'À votre santé'],
  },
  sport: {
    parole: ['Passe-moi la balle !', 'Allez, on lâche rien !', 'Et c’est le but !'],
    pensee: ['Concentre-toi… respire…', 'Cette fois, je gagne.'],
    cri: ['BUUUT !', 'PAF !', 'YEAAAH !'],
    narration: ['Le match le plus important de sa vie.', 'Les secondes s’égrenaient…'],
    libre: ['Le match', 'Champion !'],
  },
  ecran: {
    parole: ['Encore un épisode !', 'Attends, je réponds à un message.', 'Le wifi ne marche plus !'],
    pensee: ['Juste cinq minutes de plus…', 'Mais quelle heure est-il ?'],
    cri: ['GAME OVER !', 'NOOON, LA BATTERIE !'],
    narration: ['Les heures passaient sans qu’il s’en rende compte.'],
    libre: ['Mode connecté', 'Écran total'],
  },
  livre: {
    parole: ['Écoute ce passage !', 'Il était une fois…', 'Plus qu’un chapitre !'],
    pensee: ['Et si l’histoire était vraie ?', 'Je ne m’attendais pas à cette fin.'],
    cri: ['CHUT !', 'INCROYABLE !'],
    narration: ['Chaque page l’emportait un peu plus loin.'],
    libre: ['Chapitre 1', 'Il était une fois'],
  },
  maison: {
    parole: ['Bienvenue chez moi !', 'Fais comme chez toi.', 'Qui a laissé traîner ça ?'],
    pensee: ['Rien ne vaut un dimanche à la maison.', 'Il faudrait vraiment ranger…'],
    cri: ['C’EST QUOI CE BAZAR ?!', 'SURPRISE !'],
    narration: ['La maison était étrangement calme.', 'Tout semblait à sa place… ou presque.'],
    libre: ['Home sweet home', 'À la maison'],
  },
  ville: {
    parole: ['On se retrouve au coin de la rue ?', 'Quelle foule !', 'Tu sais où on est ?'],
    pensee: ['Cette ville ne dort jamais…', 'Je crois qu’on est perdus.'],
    cri: ['TAXI !', 'HÉ, ATTENDS !'],
    narration: ['La ville s’éveillait doucement.', 'Au détour d’une ruelle…'],
    libre: ['En ville', 'Balade urbaine'],
  },
  defaut: {
    parole: ['Salut !', 'Tu as vu ça ?', 'On y va ?', 'Incroyable !'],
    pensee: ['Hmm…', 'Que va-t-il se passer ?', 'Intéressant…'],
    cri: ['AAAH !', 'WOW !', 'OH NON !'],
    narration: ['Pendant ce temps…', 'Il était une fois…', 'Plus tard…'],
    libre: ['Ton texte ici', 'Titre de la BD'],
  },
};

// Choisit une phrase au hasard, différente de la phrase actuelle si possible
export function choisirPhrase(variante, sujet, actuelle) {
  const liste = PHRASES[sujet]?.[variante] ?? PHRASES.defaut[variante] ?? PHRASES.defaut.parole;
  const choix = liste.length > 1 ? liste.filter((p) => p !== actuelle) : liste;
  return choix[Math.floor(Math.random() * choix.length)];
}

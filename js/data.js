/* All study content comes from Ms. Richmond's Module B Unit 2 Lesson 3 (MBU2L3)
   Study Guide and the 7th grade MBU2L3 Jeopardy review. */

const TOPICS = {
  systems:  { label: "Body Systems",     emoji: "🧬" },
  tissues:  { label: "Tissues",          emoji: "🔬" },
  needs:    { label: "Animal Needs",     emoji: "🦁" },
  digest:   { label: "Digestion",        emoji: "🍎" },
  excrete:  { label: "Getting Rid of Waste", emoji: "💧" },
  breathe:  { label: "Oxygen & Breathing", emoji: "🫁" },
  circ:     { label: "Circulation",      emoji: "❤️" },
  move:     { label: "Movement & Skeletons", emoji: "🦴" },
  nerve:    { label: "Nervous System & Senses", emoji: "🧠" },
  nautilus: { label: "Chambered Nautilus", emoji: "🐚" }
};

/* ---------- Learn notes ---------- */
const NOTES = [
  { topic: "needs", title: "What every animal has in common",
    intro: "All animals are alike in a few big ways.",
    points: [
      "Animals are <b>multicellular</b> (made of many cells).",
      "Animals <b>eat other organisms</b> to get nutrients and energy.",
      "Animals have four tissue types: <b>nervous, epithelial, muscle, and connective</b>."
    ],
    extra: "<b>Zoology</b> is the study of all aspects of animals: behavior, evolution, classification, structures, and functions." },
  { topic: "needs", title: "5 jobs animal body systems must do",
    points: [
      "<b>1.</b> Break down food for energy",
      "<b>2.</b> Supply cells with oxygen",
      "<b>3.</b> Get rid of waste products",
      "<b>4.</b> Move and respond to the environment",
      "<b>5.</b> Reproduce"
    ],
    extra: "Memory trick: <b>Food, Oxygen, Waste, Move, Reproduce</b> (F-O-W-M-R)." },
  { topic: "tissues", title: "The four animal tissue types",
    points: [
      "<b>Nervous tissue</b> is the body's <b>messaging system</b>. It sends messages within the body.",
      "<b>Epithelial tissue</b> gives <b>protection</b> and forms <b>boundaries</b>.",
      "<b>Connective tissue</b> gives <b>support</b> by holding the body together.",
      "<b>Muscle tissue</b> allows <b>movement and flexibility</b>."
    ],
    extra: "Think: <b>N</b>ervous = <b>N</b>otes (messages) · <b>E</b>pithelial = <b>E</b>dge (boundary, protection) · <b>C</b>onnective = <b>C</b>onnects · <b>M</b>uscle = <b>M</b>oves." },
  { topic: "systems", title: "Body systems vocabulary",
    points: [
      "<b>Circulatory system:</b> the heart, the blood vessels, and the blood.",
      "<b>Excretory system:</b> collects and excretes nitrogenous wastes and excess water from the body as urine.",
      "<b>Digestive system:</b> the organs that break down food so the body can use it.",
      "<b>Respiratory system:</b> organs whose main job is to take in oxygen and expel carbon dioxide.",
      "<b>Muscular system:</b> the organ system whose main job is movement and flexibility.",
      "<b>Nervous system:</b> the structures that control the body's actions and reactions in response to stimuli from the environment."
    ] },
  { topic: "digest", title: "Digestive system",
    points: [
      "<b>Mechanical digestion</b> = physically breaking food into <b>smaller pieces</b> (like chewing).",
      "<b>Chemical digestion</b> = using <b>digestive enzymes</b> to break food down into <b>nutrients</b> that can be absorbed and sent around the body."
    ],
    extra: "Mechanical changes the <i>size</i> of the food. Chemical changes what the food is <i>made of</i>." },
  { topic: "excrete", title: "Excretory system",
    points: [
      "Three organs rid the body of waste: <b>skin, lungs, and kidneys</b>.",
      "<b>Skin:</b> sweat removes <b>salt</b> (and water).",
      "<b>Kidneys:</b> filter the blood to remove waste products.",
      "<b>Lungs:</b> exhaling gets rid of <b>carbon dioxide (CO₂)</b> along with water vapor."
    ] },
  { topic: "breathe", title: "Respiratory system",
    points: [
      "Oxygen can enter an animal's body through <b>skin, lungs, or gills</b>, depending on the animal.",
      "Once inside, oxygen is delivered in one of two ways: <b>directly to the tissues and cells</b>, or <b>sent to the circulatory system</b> to be carried around."
    ] },
  { topic: "circ", title: "Circulatory system",
    points: [
      "Made of the <b>heart, blood vessels, and blood</b>.",
      "It has two subsystems:",
      "<b>Cardiovascular system</b>: pumps blood throughout the body.",
      "<b>Lymphatic system</b>: moves fluid to help fight infections."
    ] },
  { topic: "move", title: "Muscular system",
    points: [
      "Its main job is <b>movement and flexibility</b>.",
      "Muscles are not the only way animals move. Some animals use <b>cilia</b> (tiny hair-like structures) to move without using the muscular system."
    ] },
  { topic: "move", title: "Skeletal system",
    points: [
      "Animal skeletons can be made of <b>bones, spines, cartilage, or crystals</b>.",
      "<b>Exoskeleton</b> = skeleton on the <b>outside</b> of the body (like a suit of armor).",
      "<b>Endoskeleton</b> = skeleton on the <b>inside</b> of the body."
    ],
    extra: "Memory trick: <b>Exo</b> = <b>ex</b>it/outside. <b>Endo</b> = <b>in</b>side." },
  { topic: "nerve", title: "Nervous system and senses",
    points: [
      "Animals have one of two forms of nervous system: a <b>cluster of nerves</b>, or a <b>developed brain with a nerve network</b>.",
      "Organs that collect information: <b>eyes, ears, nose, mouth, skin, hairs, or antennae</b>.",
      "Some animals sense in surprising ways: <b>butterflies taste with their feet</b>, and <b>snakes smell with their tongues</b>."
    ] },
  { topic: "nautilus", title: "The chambered nautilus",
    points: [
      "<b>Support / protection:</b> it has a <b>shell</b> with <b>water-filled chambers</b>.",
      "<b>Taking in food:</b> it uses its <b>tentacles and beak</b> to get food.",
      "<b>Movement:</b> it uses the <b>water-filled chambers in its shell</b> and a <b>muscular siphon</b> to move around."
    ],
    extra: "Use the <b>Nautilus Essay</b> tab to practice writing the long answer from the study guide." }
];

/* ---------- Flashcards [front, back, topic] ---------- */
const CARDS = [
  ["Circulatory system", "The body system made up of the heart, the blood vessels, and the blood.", "systems"],
  ["Excretory system", "Collects and excretes nitrogenous wastes and excess water from the body as urine.", "systems"],
  ["Digestive system", "The organs that break down food so it can be used by the body.", "systems"],
  ["Respiratory system", "Organs whose main job is to take in oxygen and expel carbon dioxide.", "systems"],
  ["Muscular system", "The organ system whose main job is movement and flexibility.", "systems"],
  ["Nervous system", "The structures that control the body's actions and reactions in response to stimuli from the environment.", "systems"],
  ["Zoology", "The study of all aspects of animals: behavior, evolution, classification, structures, and functions.", "needs"],
  ["What do all animals have in common?", "They are multicellular, they eat other organisms for nutrients, and they have nervous, muscle, epithelial, and connective tissues.", "needs"],
  ["5 things animal body systems must do", "Break down food for energy · Supply cells with oxygen · Get rid of waste · Move/respond to the environment · Reproduce", "needs"],
  ["Nervous tissue", "The messaging system within the body.", "tissues"],
  ["Epithelial tissue", "Protects the animal and forms boundaries.", "tissues"],
  ["Connective tissue", "Supports the body by holding it together.", "tissues"],
  ["Muscle tissue", "Allows movement and flexibility.", "tissues"],
  ["Mechanical digestion", "Physically breaking food into smaller pieces.", "digest"],
  ["Chemical digestion", "Using digestive enzymes to break food down into nutrients that can be absorbed and distributed throughout the body.", "digest"],
  ["Which 3 organs rid the body of waste?", "Skin, lungs, and kidneys.", "excrete"],
  ["What does sweat remove?", "Salt (and water).", "excrete"],
  ["What filters waste out of the blood?", "The kidneys.", "excrete"],
  ["What does exhaling get rid of?", "Carbon dioxide (CO₂), along with water vapor.", "excrete"],
  ["How can oxygen enter an animal's body?", "Through the skin, lungs, or gills.", "breathe"],
  ["2 ways oxygen is delivered inside an animal", "Directly to the tissues and cells, or sent to the circulatory system.", "breathe"],
  ["2 subsystems of the circulatory system", "The cardiovascular system and the lymphatic system.", "circ"],
  ["Cardiovascular system", "Pumps blood throughout the body.", "circ"],
  ["Lymphatic system", "Moves fluid to help fight infections. It is part of the circulatory system.", "circ"],
  ["Cilia", "Tiny structures some animals use to move that do not involve the muscular system.", "move"],
  ["What can animal skeletons be made of?", "Bones, spines, cartilage, or crystals.", "move"],
  ["Exoskeleton", "A skeleton on the outside of the body, like a suit of armor.", "move"],
  ["Endoskeleton", "A skeleton on the inside of the body.", "move"],
  ["2 forms of nervous system in animals", "A cluster of nerves, or a developed brain with a nerve network.", "nerve"],
  ["Organs that collect information", "Eyes, ears, nose, mouth, skin, hairs, or antennae.", "nerve"],
  ["What do butterflies use to taste?", "Their feet.", "nerve"],
  ["What do snakes use to smell?", "Their tongues.", "nerve"],
  ["How does the nautilus get food?", "With its tentacles and beak.", "nautilus"],
  ["How does the chambered nautilus move?", "With water-filled chambers in its shell and a muscular siphon.", "nautilus"]
];

/* ---------- Quiz bank. First option is the correct answer; the app shuffles. ---------- */
const QUESTIONS = [
  // Systems
  { t:"systems", q:"Which body system is made up of the heart, the blood vessels, and the blood?",
    o:["Circulatory system","Respiratory system","Digestive system","Excretory system"],
    e:"The circulatory system is the heart, blood vessels, and blood working together to move materials around the body." },
  { t:"systems", q:"Which system collects and excretes nitrogenous wastes and excess water as urine?",
    o:["Excretory system","Digestive system","Muscular system","Nervous system"],
    e:"The excretory system removes nitrogen-containing wastes and extra water from the body as urine." },
  { t:"systems", q:"Which system's organs break down food so the body can use it?",
    o:["Digestive system","Respiratory system","Circulatory system","Nervous system"],
    e:"The digestive system breaks food down into a form the body can use." },
  { t:"systems", q:"What is the main job of the respiratory system?",
    o:["Take in oxygen and expel carbon dioxide","Pump blood around the body","Break food into nutrients","Send messages to the brain"],
    e:"The respiratory system takes oxygen in and sends carbon dioxide out." },
  { t:"systems", q:"Which organ system's main job is movement and flexibility?",
    o:["Muscular system","Circulatory system","Excretory system","Digestive system"],
    e:"The muscular system is all about movement and flexibility." },
  { t:"systems", q:"Which structures control the body's actions and reactions in response to stimuli from the environment?",
    o:["Nervous system","Muscular system","Lymphatic system","Digestive system"],
    e:"The nervous system detects stimuli (like light, sound, or touch) and controls how the body responds." },
  { t:"systems", q:"A runner's muscles need extra oxygen. Which two systems work together to deliver it?",
    o:["Respiratory and circulatory","Digestive and excretory","Nervous and skeletal","Muscular and lymphatic"],
    e:"The respiratory system takes oxygen in, and the circulatory system carries it to the cells." },

  // Needs
  { t:"needs", q:"Which of these is true for ALL animals?",
    o:["They eat other organisms for nutrients","They make their own food from sunlight","They have a backbone","They live on land"],
    e:"All animals must eat other organisms for energy. Plants make their own food, and many animals have no backbone or live in water." },
  { t:"needs", q:"Animals are made of many cells. What word describes that?",
    o:["Multicellular","Unicellular","Microscopic","Cellular wall"],
    e:"Multi means many. Multicellular organisms are made of many cells." },
  { t:"needs", q:"Which is NOT one of the jobs animal body systems must do?",
    o:["Make food from sunlight","Break down food for energy","Get rid of waste products","Reproduce"],
    e:"Animals can't make food from sunlight (that's photosynthesis, which plants do). Animals must break down food, supply cells with oxygen, remove waste, move/respond, and reproduce." },
  { t:"needs", q:"What is zoology?",
    o:["The study of all aspects of animals","The study of plants","The study of rocks and fossils","The study of the human body only"],
    e:"Zoology covers animal behavior, evolution, classification, structures, and functions." },

  // Tissues
  { t:"tissues", q:"Which four tissue types do all animals have?",
    o:["Nervous, epithelial, muscle, and connective","Nervous, bone, skin, and blood","Muscle, fat, skin, and organ","Epithelial, lymph, bone, and nerve"],
    e:"The four animal tissues are nervous, epithelial, muscle, and connective." },
  { t:"tissues", q:"Which tissue is the body's messaging system?",
    o:["Nervous tissue","Epithelial tissue","Connective tissue","Muscle tissue"],
    e:"Nervous tissue sends messages within the body." },
  { t:"tissues", q:"Which tissue protects the animal and forms boundaries?",
    o:["Epithelial tissue","Nervous tissue","Connective tissue","Muscle tissue"],
    e:"Epithelial tissue covers and lines the body, giving protection and forming a boundary." },
  { t:"tissues", q:"Which tissue holds the body together and provides support?",
    o:["Connective tissue","Epithelial tissue","Muscle tissue","Nervous tissue"],
    e:"Connective tissue supports the body by holding it together." },
  { t:"tissues", q:"Which tissue allows movement and flexibility?",
    o:["Muscle tissue","Nervous tissue","Epithelial tissue","Connective tissue"],
    e:"Muscle tissue is what lets the body move and flex." },

  // Digestion
  { t:"digest", q:"What is mechanical digestion?",
    o:["Physically breaking food into smaller pieces","Using enzymes to break food into nutrients","Absorbing oxygen from the air","Filtering waste from the blood"],
    e:"Mechanical digestion changes the size of food. It does not change what the food is made of." },
  { t:"digest", q:"What is chemical digestion?",
    o:["Using digestive enzymes to break food into nutrients","Chewing food into smaller pieces","Pumping blood to the cells","Removing salt through sweat"],
    e:"Chemical digestion uses enzymes to break food down into nutrients the body can absorb." },
  { t:"digest", q:"Which is an example of MECHANICAL digestion?",
    o:["Teeth grinding up food","Enzymes breaking starch into sugars","Kidneys filtering blood","Lungs exchanging gases"],
    e:"Chewing physically breaks food into smaller pieces, so it is mechanical. Enzymes are chemical digestion." },
  { t:"digest", q:"Enzymes in the gut break a cracker down into nutrients. What kind of digestion is this?",
    o:["Chemical digestion","Mechanical digestion","Excretion","Circulation"],
    e:"Any time digestive enzymes break food into nutrients, it's chemical digestion." },

  // Excretory
  { t:"excrete", q:"Which three organs rid the body of waste products?",
    o:["Skin, lungs, and kidneys","Heart, brain, and stomach","Skin, heart, and muscles","Lungs, bones, and brain"],
    e:"Skin (sweat), lungs (exhaling), and kidneys (filtering blood) all remove wastes." },
  { t:"excrete", q:"Sweat helps remove which waste from the body?",
    o:["Salt","Oxygen","Nutrients","Enzymes"],
    e:"Sweat gets rid of excess salt (along with water)." },
  { t:"excrete", q:"Which organs filter the blood to remove waste products?",
    o:["Kidneys","Lungs","Skin","Heart"],
    e:"The kidneys filter waste out of the blood and make urine." },
  { t:"excrete", q:"What does exhaling eliminate from the body?",
    o:["Carbon dioxide (CO₂)","Oxygen (O₂)","Salt","Nitrogen wastes"],
    e:"Exhaling releases carbon dioxide, along with water vapor." },
  { t:"excrete", q:"True or false: Your lungs only take in oxygen and never get rid of any waste.",
    o:["False","True"],
    e:"False! Lungs also expel carbon dioxide and water vapor, which makes them part of the excretory system too." },

  // Breathing
  { t:"breathe", q:"Which of these can an animal use to take in oxygen?",
    o:["Skin, lungs, or gills","Bones, teeth, or claws","Eyes, ears, or nose only","Kidneys, liver, or stomach"],
    e:"Depending on the animal, oxygen enters through skin, lungs, or gills." },
  { t:"breathe", q:"Which are the two ways oxygen can be delivered inside an animal's body?",
    o:["Directly to cells, or through the circulatory system","Through the skeleton or the skin","Through the stomach or the intestines","Through nerves or muscles"],
    e:"Oxygen goes either straight to the tissues and cells, or into the circulatory system to be carried around." },

  // Circulation
  { t:"circ", q:"What are the two subsystems of the circulatory system?",
    o:["Cardiovascular and lymphatic","Respiratory and digestive","Nervous and muscular","Excretory and skeletal"],
    e:"The circulatory system includes the cardiovascular system and the lymphatic system." },
  { t:"circ", q:"What does the cardiovascular system do?",
    o:["Pumps blood throughout the body","Moves fluid to fight infections","Filters waste from blood","Digests food"],
    e:"The cardiovascular system (heart and blood vessels) pumps blood around the body." },
  { t:"circ", q:"Which part of the circulatory system moves fluid to help fight infections?",
    o:["Lymphatic system","Cardiovascular system","Respiratory system","Excretory system"],
    e:"The lymphatic system is part of the circulatory system and helps fight infections." },

  // Movement
  { t:"move", q:"Besides muscles, which structure can some animals use to move?",
    o:["Cilia","Neurons","Enzymes","Kidneys"],
    e:"Cilia are tiny hair-like structures that let some organisms move without the muscular system." },
  { t:"move", q:"What can animal skeletons be made of?",
    o:["Bones, spines, cartilage, or crystals","Only bones","Only shells","Muscle and nerves"],
    e:"Skeletons come in many forms: bones, spines, cartilage, or even crystals." },
  { t:"move", q:"What is an exoskeleton?",
    o:["A skeleton on the outside of the body","A skeleton on the inside of the body","A skeleton made only of cartilage","A type of muscle"],
    e:"Exo means outside. An exoskeleton is like a suit of armor." },
  { t:"move", q:"What is an endoskeleton?",
    o:["A skeleton on the inside of the body","A skeleton on the outside of the body","A shell made of crystals","A group of nerves"],
    e:"Endo means inside. Humans have an endoskeleton." },

  // Nervous
  { t:"nerve", q:"What are the two forms of nervous system in animals?",
    o:["A cluster of nerves, or a developed brain with a nerve network","Lungs or gills","Exoskeleton or endoskeleton","Mechanical or chemical"],
    e:"Some animals have a simple cluster of nerves. Others have a developed brain connected to a network of nerves." },
  { t:"nerve", q:"Which of these are organs that collect information from the environment?",
    o:["Eyes, ears, nose, skin, and antennae","Kidneys, liver, and heart","Bones, spines, and cartilage","Tentacles and gills only"],
    e:"Sense organs such as eyes, ears, nose, mouth, skin, hairs, and antennae collect information." },
  { t:"nerve", q:"What do butterflies use to taste?",
    o:["Their feet","Their antennae","Their wings","Their mouths only"],
    e:"Butterflies taste with their feet. Aren't you glad humans don't have to?" },
  { t:"nerve", q:"What do snakes use to smell?",
    o:["Their tongues","Their eyes","Their scales","Their tails"],
    e:"Snakes flick their tongues to collect scents." },

  // Nautilus
  { t:"nautilus", q:"What two structures does the chambered nautilus use to obtain food?",
    o:["Tentacles and beak","Gills and siphon","Shell and chambers","Cilia and fins"],
    e:"The nautilus grabs food with its tentacles and its beak." },
  { t:"nautilus", q:"How does the chambered nautilus move around?",
    o:["Water-filled chambers in its shell and a muscular siphon","Legs and claws","Cilia on its skin","Wings"],
    e:"It controls the water in its shell chambers and uses a muscular siphon to move." },
  { t:"nautilus", q:"Which body structure gives the nautilus support and protection?",
    o:["Its shell","Its siphon","Its beak","Its tentacles"],
    e:"The shell, with its water-filled chambers, supports and protects the nautilus. It is an external (outside) structure." }
];

/* ---------- Jeopardy board (from the review PDF) ---------- */
const BOARD = [
  { cat: "Name the System", clues: [
    ["The body system made up of the heart, the blood vessels, and the blood.", "Circulatory System"],
    ["The structures that control the actions and reactions of the body in response to stimuli from the environment.", "Nervous System"],
    ["The organ system whose primary function is movement and flexibility.", "Muscular System"],
    ["A collection of organs whose primary function is to take in oxygen and expel carbon dioxide.", "Respiratory System"],
    ["The system that collects and excretes nitrogenous wastes and excess water from the body in the form of urine.", "Excretory System"] ]},
  { cat: "Getting Food", clues: [
    ["The organs that break down food so that it can be used by the body are part of this system.", "Digestive System"],
    ["The nautilus uses what two structures to obtain its food?", "Tentacles and beak"],
    ["All animals must do what for energy?", "Eat another organism"],
    ["Mechanical digestion is what?", "Using structures to physically break down food into smaller pieces"],
    ["Chemical digestion is what?", "Use of digestive enzymes to break down food into its nutrients to be absorbed into the animal's body"] ]},
  { cat: "I Am a Tissue", clues: [
    ["Animals all have these four tissue types.", "Nervous, epithelial, muscle, and connective"],
    ["I am the tissue responsible for messages being sent within the body.", "Nervous tissue"],
    ["I am the tissue that holds the body together and provides a supporting role throughout the animal.", "Connective tissue"],
    ["I am the tissue that aids in the animal's internal and external movements.", "Muscle tissue"],
    ["I am the tissue that protects the animal and forms boundaries.", "Epithelial tissue"] ]},
  { cat: "I Do This for the Body", clues: [
    ["I rid the animal's body of excess salt.", "Sweating"],
    ["We are three organs that get rid of waste products in the body.", "Skin, lungs, and kidneys"],
    ["Carbon dioxide goes out of the body along with water vapor through this organ (found in humans).", "Lungs"],
    ["Depending on the animal, one of these three organs is how you take in oxygen.", "Skin, lungs, or gills"],
    ["Part of the circulatory system, I help fight infections.", "Lymphatic system"] ]},
  { cat: "Misc.", clues: [
    ["I am the study of all aspects of animals, including behavior, evolution, classification, structures, and functions.", "Zoology"],
    ["The chambered nautilus uses me to move around.", "Water-filled chambers in its shell and a muscular siphon"],
    ["Butterflies use me to taste with. Bet you are glad humans don't have to!", "Feet"],
    ["I am an external skeleton, meaning my skeleton is on the outside of my body. Kind of like a suit of armor.", "Exoskeleton"],
    ["I am a structure that allows an animal to move, but I do not involve the muscular system.", "Cilia"] ]}
];

/* ---------- Nautilus essay helper ---------- */
const NAUTILUS = [
  { id: "support", title: "Support / Protection Structures", emoji: "🛡️",
    hint: "What does the nautilus have for support and protection?",
    keys: [["shell"], ["chamber","chambers"], ["protect","protection","protects"], ["support","supports"]],
    keyLabels: ["shell", "chambers", "protect", "support"],
    sample: "The nautilus has a shell that supports and protects its soft body. The shell is divided into water-filled chambers, and it is on the outside of the animal." },
  { id: "food", title: "Taking in Food", emoji: "🍽️",
    hint: "Which structures does it use to get food?",
    keys: [["tentacle","tentacles"], ["beak"], ["eat","eats","food","prey"]],
    keyLabels: ["tentacles", "beak", "food"],
    sample: "The nautilus uses its tentacles to reach for food and its beak to break it down so it can eat. Like all animals, it must eat other organisms for energy." },
  { id: "move", title: "Movement", emoji: "🌊",
    hint: "How does it move around?",
    keys: [["siphon"], ["chamber","chambers"], ["water"], ["muscle","muscular"]],
    keyLabels: ["siphon", "chambers", "water", "muscular"],
    sample: "The nautilus moves using the water-filled chambers in its shell and a muscular siphon. Controlling the water helps it move through the ocean." }
];

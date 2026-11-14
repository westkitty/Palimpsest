import {
  FolioCueSegment,
  FolioId,
  FolioManifest,
  MagnifierDiscovery,
  WorldId,
} from '../types/atlas';

export const BOOK_TITLE = 'Palimpsest: An Illustrated History of the All';
export const BOOK_SUBTITLE = 'Administration Instructional Edition — Editorial Reconstruction';
export const ADMINISTRATION_SLOGAN = 'Your fate is in our hands.';
export const WAR_DURATION_TEXT = '170-year Blood Eclipse War';

export const BOOK_IMPRINT_CUE: FolioCueSegment = {
  "cueId": "BOOK_IMPRINT",
  "slot": "IMPRINT",
  "heading": "Inside-front-cover seal",
  "paragraphs": [
    "Administration instructional edition — editorial reconstruction.",
    "Your fate is in our hands."
  ]
};

export const BOOK_PROLOGUE_CUE: FolioCueSegment = {
  "cueId": "BOOK_PROLOGUE",
  "slot": "PROLOGUE",
  "heading": "Opening prologue",
  "paragraphs": [
    "Welcome. This is *Palimpsest: An Illustrated History of the All*.",
    "We have arranged the material in a series of illustrated lessons. Each page contains a model, a record, or a small demonstration. The models are modest in size. The events they explain were not.",
    "You may turn the pages at your own pace. You may stop to examine a diagram. You may also return to an earlier lesson. The historical events will remain as they were.",
    "We begin with the making of reality itself."
  ]
};

export const BOOK_ENDCARD_CUE: FolioCueSegment = {
  "cueId": "BOOK_ENDCARD",
  "slot": "ENDCARD",
  "heading": "Closing imprint",
  "paragraphs": [
    "This edition was prepared for careful observation and continued study.",
    "The Administration reminds you: Your fate is in our hands."
  ]
};

export const FOLIO_MANIFESTS: FolioManifest[] = [
  {
    "worldId": 0,
    "id": "f01",
    "code": "F01",
    "roman": "I",
    "chapterIndex": 1,
    "title": "The Initialization of Reality",
    "subtitle": "Rules, Recursion & the Notebook Program",
    "eraLabel": "Phase I · Primordial Era",
    "temporalMarker": "Unknown date · Before chronological markers",
    "chronologyEventIds": [
      "initialization-reality"
    ],
    "sourcePointers": [
      {
        "label": "Chronology: initialization-reality",
        "url": "https://github.com/westkitty/Starsilk_Character_Dossier/blob/main/src/content/sections/chronology.body.html"
      },
      {
        "label": "Systems Architecture",
        "url": "https://github.com/westkitty/Starsilk_Character_Dossier/blob/main/src/content/sections/systems.body.html"
      }
    ],
    "historicalActors": [
      "The Notebook Program (system mechanism; non-anthropomorphic)"
    ],
    "uncertaintyNotes": [
      "Absolute pre-war initialization date is unknown in the authored chronology."
    ],
    "sourceNotes": [
      {
        "id": "f01-fact",
        "kind": "source-fact",
        "heading": "Notebook Program Recursion",
        "body": "The Notebook Program writes and recursively sustains reality along coupled Law, Memory, and Rendering rules; time travel is structurally impossible.",
        "sourceRef": "chronology.body.html · initialization-reality"
      },
      {
        "id": "f01-demo",
        "kind": "demonstration",
        "heading": "Instructional Star Model",
        "body": "Lifting the vellum overlay and aligning the three nodes demonstrates dependency relationships rather than a physical coordinate inside the All.",
        "sourceRef": "Twelve-Folio Manuscript · F01"
      },
      {
        "id": "f01-unc",
        "kind": "uncertainty",
        "heading": "Unauthored Origin Epoch",
        "body": "No numeric year precedes Year 0 of the Blood Eclipse War in the authoritative chronology.",
        "sourceRef": "events.json · certainty: unknown"
      }
    ],
    "periodPalette": {
      "era": "early",
      "label": "Early Foundations · Ivory / Azure / Brass",
      "paperInner": "#F3EEE1",
      "paperMid": "#E7DEC9",
      "paperEdge": "#D4C7AE",
      "accentHex": "#3B9BB8",
      "secondaryHex": "#C2A25D",
      "washRgba": "rgba(59, 155, 184, 0.16)",
      "lineRgba": "rgba(48, 56, 66, 0.24)",
      "inkHex": "#20262E",
      "ambientHex": "#171E26"
    },
    "sceneFactoryKey": "f01",
    "visualCues": [
      "Ivory blank aperture",
      "Translucent vellum overlay",
      "Brass recursion dial",
      "LAW / MEMORY / RENDERING star triad"
    ],
    "narrationSegmentIds": [
      "F01_OPEN",
      "F01_LESSON",
      "F01_A",
      "F01_B",
      "F01_C",
      "F01_CLOSE"
    ],
    "cues": {
      "OPEN": {
        "cueId": "F01_OPEN",
        "slot": "OPEN",
        "heading": "Opening",
        "paragraphs": [
          "Our first illustration is almost empty. That is quite deliberate.",
          "It is tempting to imagine the beginning as a dark room waiting for someone to turn on a light. The All is a little more complicated than that.",
          "The Notebook Program writes the conditions by which reality exists. It does not merely describe a universe already waiting to be found. Its rules continuously render what can happen, what can be remembered, and what remains consistent from one moment to the next.",
          "We shall use this little page to see the difference."
        ]
      },
      "LESSON": {
        "cueId": "F01_LESSON",
        "slot": "LESSON",
        "heading": "Main lesson",
        "paragraphs": [
          "Here is a star. And here are the conditions that allow it to be a star.",
          "A drawing may make those conditions seem separate, like the pieces of a clock. In the All, they operate together. Reality follows memory and recursion. What is written is continually made present.",
          "This does not mean that a visitor can travel backward to change an earlier event. Time travel is structurally impossible here. The drawing lets us inspect relationships. It does not let us escape them.",
          "Notice that the star looks quite ordinary once its rules are in place. Most systems do. Their extraordinary properties are often easiest to see only when something goes wrong.",
          "There will be several opportunities to observe that in later lessons."
        ]
      },
      "A": {
        "cueId": "F01_A",
        "slot": "A",
        "heading": "Lift the vellum",
        "paragraphs": [
          "Very good. The vellum shows a useful distinction. The star is the visible object. The instructions beneath it determine the conditions under which that object can exist."
        ]
      },
      "B": {
        "cueId": "F01_B",
        "slot": "B",
        "heading": "Rotate the recursion dial",
        "paragraphs": [
          "Observe the cycle. The illustration is renewed, while its earlier state remains part of the record. Repetition is not the same as undoing."
        ]
      },
      "C": {
        "cueId": "F01_C",
        "slot": "C",
        "heading": "Align the three nodes",
        "paragraphs": [
          "Law, memory, and rendering are presented separately so we can study them. The model works only when they are considered together."
        ]
      },
      "CLOSE": {
        "cueId": "F01_CLOSE",
        "slot": "CLOSE",
        "heading": "Closing",
        "paragraphs": [
          "Now that we have seen the arrangement, we may meet the original divine principles associated with the All.",
          "There were three. Their coexistence did not last."
        ]
      }
    },
    "interactions": [
      {
        "id": "f01_a",
        "slot": "A",
        "type": "flap",
        "label": "Lift the Vellum Overlay",
        "description": "Lift the translucent cream sheet to expose the underlying algorithmic rule grid.",
        "visualInput": "Click the hinged vellum corner tab or press A.",
        "visualTransformation": "Translucent vellum leaf pivots upward 75 degrees, exposing etched coordinate lines beneath.",
        "visualOutput": "Underlying recursion grid and stellar blueprint become unobstructed.",
        "persistPolicy": "reversible",
        "narrationSegmentId": "F01_A",
        "keyboardLabel": "Key A · Lift/Lower Vellum Overlay",
        "textEquivalent": "The vellum layer lifts cleanly, distinguishing the visible star model from the Notebook Program instructions underneath it."
      },
      {
        "id": "f01_b",
        "slot": "B",
        "type": "dial",
        "label": "Rotate the Recursion Dial",
        "description": "Advance the brass recursion ring to inspect forward maintenance cycles without reversing history.",
        "visualInput": "Click the brass calibrated wheel or press B.",
        "visualTransformation": "Brass bezel steps 90 degrees clockwise per pulse; retention pointers advance forward.",
        "visualOutput": "Demonstration confirms repetition renews state without undoing prior history.",
        "persistPolicy": "stepped",
        "maxSteps": 4,
        "narrationSegmentId": "F01_B",
        "keyboardLabel": "Key B · Step Recursion Dial",
        "textEquivalent": "The brass recursion dial rotates clockwise, showing cyclical renewal without backward time travel."
      },
      {
        "id": "f01_c",
        "slot": "C",
        "type": "nodes",
        "label": "Align Law, Memory & Rendering",
        "description": "Converge the three condition markers onto the center ring to stabilize the model star.",
        "visualInput": "Click the triad hub or press C.",
        "visualTransformation": "LAW, MEMORY, and RENDERING arms slide smoothly inward along brass tracks to lock at center.",
        "visualOutput": "Faceted ivory-azure star resolves steadily at the focal ring.",
        "persistPolicy": "reversible",
        "narrationSegmentId": "F01_C",
        "keyboardLabel": "Key C · Align Three Nodes",
        "textEquivalent": "The separated markers for LAW, MEMORY, and RENDERING converge on the central ring, resolving the model star into a stable form."
      }
    ],
    "prevFolio": null,
    "nextFolio": "f02",
    "completedRules": "Inspected core rule distinction and observed at least one mechanism."
  },
  {
    "worldId": 1,
    "id": "f02",
    "code": "F02",
    "roman": "II",
    "chapterIndex": 2,
    "title": "The Triarchic Order & Primordial Betrayal",
    "subtitle": "The Shard-god, Wordstreamer, NiAlBu & Starsilk",
    "eraLabel": "Phase I · Primordial Era",
    "temporalMarker": "Unknown date · Primordial betrayal",
    "chronologyEventIds": [
      "triarchic-order",
      "forging-starsilk",
      "primordial-betrayal",
      "imprisonment-nialbu"
    ],
    "sourcePointers": [
      {
        "label": "Chronology: Phase I Betrayal",
        "url": "https://github.com/westkitty/Starsilk_Character_Dossier/blob/main/src/content/sections/chronology.body.html"
      },
      {
        "label": "Cosmic Architecture: Digital Geode",
        "url": "https://github.com/westkitty/Starsilk_Character_Dossier/blob/main/src/content/sections/cosmic-architecture.body.html"
      }
    ],
    "historicalActors": [
      "The Shard-god",
      "Wordstreamer",
      "NiAlBu"
    ],
    "uncertaintyNotes": [
      "Triptych layout is an instructional arrangement, not a literal historical gathering; dead characters do not remain conscious."
    ],
    "sourceNotes": [
      {
        "id": "f02-fact1",
        "kind": "source-fact",
        "heading": "Forging of Starsilk & Murder of Wordstreamer",
        "body": "The Shard-god created Starsilk deliberately as an instrument of betrayal and murdered Wordstreamer with it, producing the first azure Starsilk bleed.",
        "sourceRef": "chronology.body.html · forging-starsilk & primordial-betrayal"
      },
      {
        "id": "f02-fact2",
        "kind": "source-fact",
        "heading": "Imprisonment of NiAlBu",
        "body": "NiAlBu was not killed; The Shard-god imprisoned him alive inside the hexagonal Digital Geode to witness the murder in endless unrendered code repetition.",
        "sourceRef": "chronology.body.html · imprisonment-nialbu"
      },
      {
        "id": "f02-unc",
        "kind": "editorial-illustration",
        "heading": "Side-by-Side Triptych",
        "body": "Three silhouettes placed together represent structural roles rather than a photographed summit.",
        "sourceRef": "Twelve-Folio Manuscript · F02"
      }
    ],
    "periodPalette": {
      "era": "early",
      "label": "Early Foundations · Ivory / Azure / Brass",
      "paperInner": "#F3EEE1",
      "paperMid": "#E7DEC9",
      "paperEdge": "#D4C7AE",
      "accentHex": "#3B9BB8",
      "secondaryHex": "#C2A25D",
      "washRgba": "rgba(59, 155, 184, 0.16)",
      "lineRgba": "rgba(48, 56, 66, 0.24)",
      "inkHex": "#20262E",
      "ambientHex": "#171E26"
    },
    "sceneFactoryKey": "f02",
    "visualCues": [
      "Three hinged triptych panels (The Shard-god, Wordstreamer, NiAlBu)",
      "Sliding redaction strip over azure Starsilk bleed",
      "Hexagonal black Digital Geode cutaway"
    ],
    "narrationSegmentIds": [
      "F02_OPEN",
      "F02_LESSON",
      "F02_A",
      "F02_B",
      "F02_C",
      "F02_CLOSE"
    ],
    "cues": {
      "OPEN": {
        "cueId": "F02_OPEN",
        "slot": "OPEN",
        "heading": "Opening",
        "paragraphs": [
          "In the earliest order, there were three divine principles.",
          "Wordstreamer gave language its living possibility. NiAlBu preserved memory and recurrence. And The Shard-god introduced a structure that would alter the balance of the All.",
          "We have placed them side by side for convenience. This arrangement is instructional, not an image of an actual meeting.",
          "The next illustration concerns Starsilk. It is a programmable filament threaded through stellar centers. Its applications are precise and far-reaching. Its creation was also part of a betrayal."
        ]
      },
      "LESSON": {
        "cueId": "F02_LESSON",
        "slot": "LESSON",
        "heading": "Main lesson",
        "paragraphs": [
          "The Shard-god fashioned Starsilk as a tool against the other two. It was not an unfortunate accident added later to a harmless invention. The capacity for betrayal belonged to its design from the beginning.",
          "Wordstreamer was murdered with Starsilk. The loss did more than remove one member of the original order. It damaged the All's relation to language and interpretation.",
          "The archival record calls one visible consequence the first Starsilk bleed: radiant azure threads where memory resisted overwrite.",
          "NiAlBu did not die in that event. The Shard-god imprisoned him in the Digital Geode, bound in unrendered code, and compelled him to witness the murder in repetition. This is the suffering of a living captive. It is not an afterlife in which the dead continue to suffer.",
          "The page is very quiet now. That is appropriate."
        ]
      },
      "A": {
        "cueId": "F02_A",
        "slot": "A",
        "heading": "Open the triptych",
        "paragraphs": [
          "Three principles. They may be shown in separate panels, but the first injury to one of them affected the larger whole."
        ]
      },
      "B": {
        "cueId": "F02_B",
        "slot": "B",
        "heading": "Slide the source overlay",
        "paragraphs": [
          "The upper inscription describes an order. The underlying record describes a murder. The second fact does not disappear when the first is written more neatly."
        ]
      },
      "C": {
        "cueId": "F02_C",
        "slot": "C",
        "heading": "Open the Geode section",
        "paragraphs": [
          "This is an architectural cross-section, not a portrait of pain. The prison made witness into a fixed function of the structure. NiAlBu remained alive within it."
        ]
      },
      "CLOSE": {
        "cueId": "F02_CLOSE",
        "slot": "CLOSE",
        "heading": "Closing",
        "paragraphs": [
          "Without Wordstreamer's moderating presence, the Notebook Program continued. Its next developments would change entire biospheres.",
          "For that, we must turn to Mother."
        ]
      }
    },
    "interactions": [
      {
        "id": "f02_a",
        "slot": "A",
        "type": "triptych",
        "label": "Open the Triarchic Triptych",
        "description": "Unfold the three hinged panels naming Wordstreamer, NiAlBu, and The Shard-god.",
        "visualInput": "Click the triptych hinge or press A.",
        "visualTransformation": "Side cream cardstock wings swing outward, revealing sculpted silhouettes of the three principles.",
        "visualOutput": "Three distinct roles displayed side by side for instructional comparison.",
        "persistPolicy": "reversible",
        "narrationSegmentId": "F02_A",
        "keyboardLabel": "Key A · Open/Close Triptych",
        "textEquivalent": "The triptych wings unfold cleanly, naming Wordstreamer (language), NiAlBu (memory/recurrence), and The Shard-god."
      },
      {
        "id": "f02_b",
        "slot": "B",
        "type": "slider",
        "label": "Slide the Redaction Overlay",
        "description": "Slide back the institutional heading card to expose the Starsilk murder and azure bleed record.",
        "visualInput": "Click the redaction slider tab or press B.",
        "visualTransformation": "Upper cream title bar slides aside, uncovering brilliant cyan Starsilk filament channels across the star schematic.",
        "visualOutput": "Administrative label separates visually from the underlying murder and azure bleed record.",
        "persistPolicy": "reversible",
        "narrationSegmentId": "F02_B",
        "keyboardLabel": "Key B · Slide Redaction Overlay",
        "textEquivalent": "The polite upper inscription slides clear, revealing radiant azure Starsilk threads recording Wordstreamer’s murder."
      },
      {
        "id": "f02_c",
        "slot": "C",
        "type": "cutaway",
        "label": "Open the Digital Geode Section",
        "description": "Lift the hexagonal black geode hatch to inspect NiAlBu bound head-down inside.",
        "visualInput": "Click the hexagonal geode section or press C.",
        "visualTransformation": "Front hexagonal casing pivots open, revealing indigo tendril figure NiAlBu suspended inverted inside.",
        "visualOutput": "Cutaway confirms living captivity inside unrendered code without graphic spectacle.",
        "persistPolicy": "reversible",
        "narrationSegmentId": "F02_C",
        "keyboardLabel": "Key C · Open Geode Cutaway",
        "textEquivalent": "The hexagonal Digital Geode opens in cutaway, showing NiAlBu imprisoned alive, bound head-down in unrendered code."
      }
    ],
    "prevFolio": "f01",
    "nextFolio": "f03",
    "completedRules": "Opened triptych, slid redaction strip, or inspected Digital Geode section."
  },
  {
    "worldId": 2,
    "id": "f03",
    "code": "F03",
    "roman": "III",
    "chapterIndex": 3,
    "title": "Mother & the Great Misunderstanding",
    "subtitle": "Cosmic Eggs, Five Ecological Theses & Mistaken Temples",
    "eraLabel": "Phase II · Pre-War Era",
    "temporalMarker": "Unknown date · Pre-War expansion",
    "chronologyEventIds": [
      "growth-mother",
      "compilation-drakken",
      "descent-eggs",
      "great-misunderstanding"
    ],
    "sourcePointers": [
      {
        "label": "Chronology: Phase II Pre-War",
        "url": "https://github.com/westkitty/Starsilk_Character_Dossier/blob/main/src/content/sections/chronology.body.html"
      },
      {
        "label": "Cosmic Architecture: Five Theses",
        "url": "https://github.com/westkitty/Starsilk_Character_Dossier/blob/main/src/content/sections/cosmic-architecture.body.html"
      },
      {
        "label": "DRAXIS 21 Anatomy Registry",
        "url": "https://github.com/westkitty/Palimpsest/blob/main/production/history_v1/DRAXIS_21.json"
      }
    ],
    "historicalActors": [
      "Mother (living fixed homeworld in Aureal Nebula)",
      "Canonical Drakken strains & Eggs",
      "Unnamed observing mortal worlds (Thon V, Nullgard, Omega Field 27, Syrrian IV, Cumulon II)"
    ],
    "uncertaintyNotes": [
      "The five ecological effects (Pyric, Aqueous, Telluric, Aeric, Umbral) describe documented categories of physical planetary alteration."
    ],
    "sourceNotes": [
      {
        "id": "f03-fact1",
        "kind": "source-fact",
        "heading": "Mother & Compiled Drakken",
        "body": "Mother is a fixed living planet in the Aureal Nebula; older Drakken compiled newer specialized strains via Macros under cosmic continuance.",
        "sourceRef": "systems.body.html & chronology.body.html"
      },
      {
        "id": "f03-fact2",
        "kind": "source-fact",
        "heading": "The Great Misunderstanding",
        "body": "Descending Drakken Eggs landed on Thon V, Nullgard, Omega Field 27, Syrrian IV, and Cumulon II; inhabitants erected temples around the cracked geodes before realizing terraforming was replacing their biospheres.",
        "sourceRef": "chronology.body.html · great-misunderstanding"
      }
    ],
    "periodPalette": {
      "era": "prewar",
      "label": "Prewar Expansion · Teal / Saffron / Green",
      "paperInner": "#EFECE0",
      "paperMid": "#DFDAC6",
      "paperEdge": "#C7BFA6",
      "accentHex": "#2D8A82",
      "secondaryHex": "#D49A42",
      "washRgba": "rgba(45, 138, 130, 0.16)",
      "lineRgba": "rgba(56, 72, 62, 0.24)",
      "inkHex": "#1E2724",
      "ambientHex": "#16211F"
    },
    "sceneFactoryKey": "f03",
    "visualCues": [
      "Fixed spherical Mother globe (060) framed in Aureal paper cutout",
      "Faceted obelisk Drakken Egg (059) cutaway",
      "Rotatable 5-thesis ecological disk with 3D Drakken prototypes",
      "Folding mortal temple overlay"
    ],
    "narrationSegmentIds": [
      "F03_OPEN",
      "F03_LESSON",
      "F03_A",
      "F03_B",
      "F03_C",
      "F03_CLOSE"
    ],
    "cues": {
      "OPEN": {
        "cueId": "F03_OPEN",
        "slot": "OPEN",
        "heading": "Opening",
        "paragraphs": [
          "This is Mother, in the Aureal Nebula.",
          "Mother was not simply a vessel carrying the Drakken. She was their living homeworld and a commanding ecology. Through the Notebook Program, Eggs and specialized forms developed under a logic of continuance.",
          "The word *continuance* sounds reassuring. It tells us very little, however, about what must be displaced so that something else may continue.",
          "Let us examine one of the Eggs."
        ]
      },
      "LESSON": {
        "cueId": "F03_LESSON",
        "slot": "LESSON",
        "heading": "Main lesson",
        "paragraphs": [
          "The Drakken were elemental terraformers. Their task was to rewrite the environments they reached. Older Drakken could alter later strains through Macros, producing a great variety of specialized forms.",
          "Their ecological methods included Pyric heat, Aqueous reshaping of water, Telluric changes to land, Aeric control of atmospheric pressure, and Umbral subtraction. These are categories of effect, not a license to draw five imaginary creatures.",
          "The Eggs descended on inhabited worlds. The record names Thon V, Nullgard, Omega Field 27, Syrrian IV, and Cumulon II among them.",
          "For many inhabitants, the dark descending geodes seemed like visitors from the divine order. Temples arose around their shining fractures. But the environmental rewrite was already underway.",
          "This became known as the Great Misunderstanding. A thing may appear important, even sacred, without wishing its neighbors well."
        ]
      },
      "A": {
        "cueId": "F03_A",
        "slot": "A",
        "heading": "Lift the Egg section",
        "paragraphs": [
          "The Egg is part of a process. The descent is only the beginning. What follows is the reworking of the surrounding world."
        ]
      },
      "B": {
        "cueId": "F03_B",
        "slot": "B",
        "heading": "Rotate the ecological plates",
        "paragraphs": [
          "Notice how each plate changes a different part of the environment. These are not five names for destruction. They are distinct ways to make a world suitable for a different purpose."
        ]
      },
      "C": {
        "cueId": "F03_C",
        "slot": "C",
        "heading": "Lift the temple overlay",
        "paragraphs": [
          "The worship and the rewriting happened together. The people did not yet understand what they were welcoming."
        ]
      },
      "CLOSE": {
        "cueId": "F03_CLOSE",
        "slot": "CLOSE",
        "heading": "Closing",
        "paragraphs": [
          "The misunderstandings did not last forever. Eventually, the new arrivals were recognized through their effects.",
          "And open conflict began."
        ]
      }
    },
    "interactions": [
      {
        "id": "f03_a",
        "slot": "A",
        "type": "cutaway",
        "label": "Lift the Drakken Egg Section",
        "description": "Separate the faceted Egg outer casing to expose descent, activation, and ecological rewrite stages.",
        "visualInput": "Click the faceted dark Egg (059) or press A.",
        "visualTransformation": "Faceted obelisk halves hinge apart along luminous barcode fractures, revealing nested process plates.",
        "visualOutput": "Labeled internal stages become legible without invented biological organs.",
        "persistPolicy": "reversible",
        "narrationSegmentId": "F03_A",
        "keyboardLabel": "Key A · Open Egg Cutaway",
        "textEquivalent": "The faceted Drakken Egg separates into labeled cross-section bands: Descent -> Activation -> Ecological Rewrite."
      },
      {
        "id": "f03_b",
        "slot": "B",
        "type": "plates",
        "label": "Rotate Five Ecological Theses",
        "description": "Cycle through Pyric, Aqueous, Telluric, Aeric, and Umbral terraforming modes with canonical Drakken models.",
        "visualInput": "Click the 5-sector ecological carousel or press B.",
        "visualTransformation": "Dial rotates 72 degrees per step, swapping the active center Drakken model (001, 023, 019, 008, 032) and colored sector plate.",
        "visualOutput": "Displays each of the five canonical terraforming effects sequentially.",
        "persistPolicy": "stepped",
        "maxSteps": 5,
        "narrationSegmentId": "F03_B",
        "keyboardLabel": "Key B · Cycle Five Ecological Theses",
        "textEquivalent": "Cycles sequentially across Pyric (Magma Pleuron 001), Aqueous (Brinechoir 023), Telluric (Terragullet 019), Aeric (Aerokarst 008), and Umbral (Lyriboris 032)."
      },
      {
        "id": "f03_c",
        "slot": "C",
        "type": "flap",
        "label": "Reveal Temple vs. Rewrite Layers",
        "description": "Lift the decorative temple façade to expose active environmental displacement underneath.",
        "visualInput": "Click the colonnaded temple flap or press C.",
        "visualTransformation": "Cream temple arch swings upward off the terrain pad, revealing fracturing slate-crimson rewrite bands beneath.",
        "visualOutput": "Reverence and planetary displacement appear simultaneously as physical layers.",
        "persistPolicy": "reversible",
        "narrationSegmentId": "F03_C",
        "keyboardLabel": "Key C · Toggle Temple Overlay",
        "textEquivalent": "Lifting the mortal temple façade shows that ecological rewriting continued uninterrupted beneath the shrine."
      }
    ],
    "prevFolio": "f02",
    "nextFolio": "f04",
    "completedRules": "Inspected Egg cutaway, cycled ecological plates, or revealed temple layer."
  },
  {
    "worldId": 3,
    "id": "f04",
    "code": "F04",
    "roman": "IV",
    "chapterIndex": 4,
    "title": "Year 0 — First Contact",
    "subtitle": "Administration Discovery, Counter-Macros & Response Logistics",
    "eraLabel": "Phase III · Opening of the 170-Year War",
    "temporalMarker": "Year 0 · Blood Eclipse War begins",
    "chronologyEventIds": [
      "blood-eclipse-war",
      "first-contact"
    ],
    "sourcePointers": [
      {
        "label": "Chronology: Year 0 First Contact",
        "url": "https://github.com/westkitty/Starsilk_Character_Dossier/blob/main/src/content/sections/chronology.body.html"
      },
      {
        "label": "Systems: Administration Macros",
        "url": "https://github.com/westkitty/Starsilk_Character_Dossier/blob/main/src/content/sections/systems.body.html"
      }
    ],
    "historicalActors": [
      "Codec (Administration wartime analyst)",
      "Inhabited Administration colony population (non-specific)"
    ],
    "uncertaintyNotes": [
      "Colony world name and exact casualty counts at Year 0 remain unrecorded in the current chronology."
    ],
    "sourceNotes": [
      {
        "id": "f04-fact",
        "kind": "source-fact",
        "heading": "Year 0 Counter-Deployment",
        "body": "First Contact at Year 0 opened the 170-year Blood Eclipse War; the Administration countered Drakken expansion using its own compiled Macro weapons and defensive logistics.",
        "sourceRef": "chronology.body.html · first-contact"
      },
      {
        "id": "f04-unc",
        "kind": "uncertainty",
        "heading": "Undisclosed Colony Totals",
        "body": "Civilian loss figures are not specified in Year 0 records; left uninvented.",
        "sourceRef": "Twelve-Folio Manuscript · F04"
      }
    ],
    "periodPalette": {
      "era": "prewar",
      "label": "Prewar Expansion · Teal / Saffron / Green",
      "paperInner": "#EFECE0",
      "paperMid": "#DFDAC6",
      "paperEdge": "#C7BFA6",
      "accentHex": "#2D8A82",
      "secondaryHex": "#D49A42",
      "washRgba": "rgba(45, 138, 130, 0.16)",
      "lineRgba": "rgba(56, 72, 62, 0.24)",
      "inkHex": "#1E2724",
      "ambientHex": "#16211F"
    },
    "sceneFactoryKey": "f04",
    "visualCues": [
      "Flipping colony slate/cream leaf (Before/After)",
      "Raised counter-Macro routing pointers",
      "Unfolding 4-panel logistics strip beside Codec analyst silhouette"
    ],
    "narrationSegmentIds": [
      "F04_OPEN",
      "F04_LESSON",
      "F04_A",
      "F04_B",
      "F04_C",
      "F04_CLOSE"
    ],
    "cues": {
      "OPEN": {
        "cueId": "F04_OPEN",
        "slot": "OPEN",
        "heading": "Opening",
        "paragraphs": [
          "The Blood Eclipse War begins here, at Year Zero.",
          "The first hostilities came to the fringe colonies. Drakken lightning-strike terraforming operations altered inhabited environments. The Administration responded with counter-Macros.",
          "A Macro is a repeatable operation executed through Starsilk. On a chart, it looks very tidy. On the surface of a world, its effects are considerably less tidy.",
          "We shall start with the colony as it stood before the first changes."
        ]
      },
      "LESSON": {
        "cueId": "F04_LESSON",
        "slot": "LESSON",
        "heading": "Main lesson",
        "paragraphs": [
          "Observe how a conflict may begin before armies take the recognizable shape of armies. One side alters the world itself. The other begins calculating how to interrupt the alteration.",
          "Codec entered the war as a significant Administration tactical authority. His work included targeting analysis, logistics, counter-Drakken code, and verification of the reality-programming scripts used in response.",
          "These tasks required careful measurement. They also required decisions about which places could still be defended, and what a countermeasure might do to the people living nearby.",
          "At this stage, the war had not yet lasted a century. Nobody had yet lived through all of the losses the later chapters will contain. They were responding to the circumstances in front of them.",
          "That is often how a very long war begins: with a series of problems that each appear capable of being managed."
        ]
      },
      "A": {
        "cueId": "F04_A",
        "slot": "A",
        "heading": "Flip the colony overlay",
        "paragraphs": [
          "The left drawing shows ordinary settlement conditions. The right shows environmental damage. This is a representative teaching model, not a newly discovered location."
        ]
      },
      "B": {
        "cueId": "F04_B",
        "slot": "B",
        "heading": "Trace the counter-Macro route",
        "paragraphs": [
          "A counter-Macro was an intervention into another system's operation. The intended correction did not guarantee an undamaged world."
        ]
      },
      "C": {
        "cueId": "F04_C",
        "slot": "C",
        "heading": "Unfold the logistics strip",
        "paragraphs": [
          "Notice the order: observe, verify, act, and record. These are useful habits. They do not, by themselves, settle whether an action should have been taken."
        ]
      },
      "CLOSE": {
        "cueId": "F04_CLOSE",
        "slot": "CLOSE",
        "heading": "Closing",
        "paragraphs": [
          "Three years after the beginning, the war acquired a new and unmistakable emblem.",
          "It was made from a conquered world."
        ]
      }
    },
    "interactions": [
      {
        "id": "f04_a",
        "slot": "A",
        "type": "flap",
        "label": "Flip Colony Before / After",
        "description": "Turn the central settlement leaf over to compare peaceful habitation with post-impact scarring.",
        "visualInput": "Click the settlement flip card or press A.",
        "visualTransformation": "Hinged rectangular diorama leaf flips 180 degrees from green-cream terraces to scarred charcoal ridges.",
        "visualOutput": "Immediate physical contrast between an ordinary colony and Year 0 impact.",
        "persistPolicy": "reversible",
        "narrationSegmentId": "F04_A",
        "keyboardLabel": "Key A · Flip Colony Before/After",
        "textEquivalent": "The settlement plate reverses, comparing quiet colonial habitation before contact with fractured postwar stone."
      },
      {
        "id": "f04_b",
        "slot": "B",
        "type": "trigger",
        "label": "Route Counter-Macro Responses",
        "description": "Deploy directional response vectors showing Administration defensive and offensive Macro routing.",
        "visualInput": "Click the brass routing switch or press B.",
        "visualTransformation": "Articulated azure and brass directional arrows elevate above the map plane connecting outpost nodes.",
        "visualOutput": "Escalation into coordinated interstellar defense is visible structurally.",
        "persistPolicy": "reversible",
        "narrationSegmentId": "F04_B",
        "keyboardLabel": "Key B · Toggle Counter-Macro Routes",
        "textEquivalent": "Routing arrows rise across the schematic, illustrating the Administration shifting from observation to compiled Macro warfare."
      },
      {
        "id": "f04_c",
        "slot": "C",
        "type": "triptych",
        "label": "Unfold the Logistics Strip",
        "description": "Extend the four-step accordion strip: Observe -> Verify -> Deploy -> Record.",
        "visualInput": "Click the folded accordion strip or press C.",
        "visualTransformation": "Four pleated cardstock blocks unfold horizontally beside the Codec figure.",
        "visualOutput": "Displays all four procedural institutional phases cleanly.",
        "persistPolicy": "reversible",
        "narrationSegmentId": "F04_C",
        "keyboardLabel": "Key C · Unfold Logistics Strip",
        "textEquivalent": "The pleated strip opens flat to show the Administration procedure: OBSERVE, VERIFY, DEPLOY, RECORD."
      }
    ],
    "prevFolio": "f03",
    "nextFolio": "f05",
    "completedRules": "Flipped colony plate, deployed response arrows, or unfolded logistics strip."
  },
  {
    "worldId": 4,
    "id": "f05",
    "code": "F05",
    "roman": "V",
    "chapterIndex": 5,
    "title": "Year 3 — The Standard of Conquest",
    "subtitle": "Fallenstar Prime & Physical Blood Ring Manufacture",
    "eraLabel": "Phase III · Year 3 of the 170-Year War",
    "temporalMarker": "Year 3 · Fallenstar Prime",
    "chronologyEventIds": [
      "standard-conquest"
    ],
    "sourcePointers": [
      {
        "label": "Chronology: Year 3 Standard of Conquest",
        "url": "https://github.com/westkitty/Starsilk_Character_Dossier/blob/main/src/content/sections/chronology.body.html"
      },
      {
        "label": "DRAXIS 044 Gorevault & 029 Ringthroat",
        "url": "https://github.com/westkitty/Palimpsest/blob/main/production/history_v1/DRAXIS_21.json"
      }
    ],
    "historicalActors": [
      "Fallenstar Prime (planet)",
      "Gorevault (044) & Ringthroat (029)",
      "Populations represented as structural scale, without graphic violence"
    ],
    "uncertaintyNotes": [
      "A Blood Ring is physical vitrified crimson mineral matter extruded into orbit, never a glowing halo or decorative aura."
    ],
    "sourceNotes": [
      {
        "id": "f05-fact",
        "kind": "source-fact",
        "heading": "Four-Stage Physical Manufacture",
        "body": "At Fallenstar Prime (Year 3), Gorevault harvested inhabitants and matter into feedstock, which Ringthroat extruded upward into an orbital ring of physical vitrified crimson glass and iron.",
        "sourceRef": "chronology.body.html · standard-conquest"
      },
      {
        "id": "f05-quote",
        "kind": "historical-quotation",
        "heading": "Drakken Doctrinal Inscription",
        "body": "\"Your sky is built from your dead.\"",
        "sourceRef": "Starsilk Character Dossier · Standard of Conquest",
        "verbatim": true
      }
    ],
    "periodPalette": {
      "era": "war",
      "label": "Blood Eclipse War · Crimson / Charcoal / Cream",
      "paperInner": "#EDE6D8",
      "paperMid": "#DDD1BE",
      "paperEdge": "#C2B19B",
      "accentHex": "#9E322C",
      "secondaryHex": "#393E46",
      "washRgba": "rgba(158, 50, 44, 0.14)",
      "lineRgba": "rgba(52, 42, 40, 0.25)",
      "inkHex": "#241D1C",
      "ambientHex": "#1F1517"
    },
    "sceneFactoryKey": "f05",
    "visualCues": [
      "Fallenstar Prime planet model with sliding Before/After ring aperture",
      "4-stage cutaway: Harvest (Gorevault 044) -> Conversion -> Extrusion (Ringthroat 029) -> Physical Vitrified Blood Ring",
      "Pivoting dual-plaque separating Doctrinal Quote from Historical Record"
    ],
    "narrationSegmentIds": [
      "F05_OPEN",
      "F05_LESSON",
      "F05_A",
      "F05_B",
      "F05_C",
      "F05_CLOSE"
    ],
    "cues": {
      "OPEN": {
        "cueId": "F05_OPEN",
        "slot": "OPEN",
        "heading": "Opening",
        "paragraphs": [
          "Here is Fallenstar Prime, as it is useful to imagine it before conquest.",
          "It had people. It had a biosphere. Like other inhabited worlds, it contained places of daily life that did not consider themselves part of a military diagram.",
          "In Year Three, the first Blood Rings were erected here.",
          "The name is accurate. We should understand what it means before moving on."
        ]
      },
      "LESSON": {
        "cueId": "F05_LESSON",
        "slot": "LESSON",
        "heading": "Main lesson",
        "paragraphs": [
          "The record states that ninety percent of the population was forced into bioforges. Their bodies were used with material drawn from the oceans and biosphere to create a composite feedstock.",
          "Drakken systems prepared and stored this material. Other structures shaped and extruded it toward orbit. The resulting ring was a solid, vitrified crimson atrocity structure, not an ordinary ribbon of light in the sky.",
          "It served as a declaration of conquest. Its doctrinal words were these: \"Your sky is built from your dead.\"",
          "That is a statement made by the conquerors, not an explanation offered by the people who died.",
          "The chart is intentionally simple. Its four stages tell us how the structure was made. They do not make the process impersonal. A line on the diagram can represent many people who were once living their ordinary lives."
        ]
      },
      "A": {
        "cueId": "F05_A",
        "slot": "A",
        "heading": "Compare the two worlds",
        "paragraphs": [
          "Here is the world before. Here is what conquest left in orbit. The ring did not replace what was taken. It was made from it."
        ]
      },
      "B": {
        "cueId": "F05_B",
        "slot": "B",
        "heading": "Open the manufacturing cutaway",
        "paragraphs": [
          "There are four stages in the model. Each is connected to the next. The orderly drawing does not reduce the number of lives involved."
        ]
      },
      "C": {
        "cueId": "F05_C",
        "slot": "C",
        "heading": "Separate inscription and testimony",
        "paragraphs": [
          "The inscription tells us what the Drakken wanted observers to understand. The historical record also tells us what the ring was made from. Both belong in the lesson. They are not the same kind of statement."
        ]
      },
      "CLOSE": {
        "cueId": "F05_CLOSE",
        "slot": "CLOSE",
        "heading": "Closing",
        "paragraphs": [
          "The war went on. The first ring would not be the last.",
          "Our next drawing is longer than the others, because the years that followed were long as well."
        ]
      }
    },
    "interactions": [
      {
        "id": "f05_a",
        "slot": "A",
        "type": "slider",
        "label": "Compare Fallenstar Prime Before / After",
        "description": "Slide the state lever across Fallenstar Prime to contrast unobstructed sky with the physical crimson ring.",
        "visualInput": "Click the orbital comparison slider or press A.",
        "visualTransformation": "Charcoal shutter recedes and a rough opaque vitrified crimson ring orbits around Fallenstar Prime.",
        "visualOutput": "Physical matter encircling the planet replaces open horizon without glowing halo effects.",
        "persistPolicy": "reversible",
        "narrationSegmentId": "F05_A",
        "keyboardLabel": "Key A · Toggle Fallenstar Prime Ring",
        "textEquivalent": "The comparison slider installs the physical vitrified crimson Blood Ring in orbit above Fallenstar Prime."
      },
      {
        "id": "f05_b",
        "slot": "B",
        "type": "cutaway",
        "label": "Step Blood Ring Manufacture Cutaway",
        "description": "Advance through the four physical industrial stages from Gorevault intake to orbital Ringthroat extrusion.",
        "visualInput": "Click the cutaway tower or press B.",
        "visualTransformation": "Four sequential mechanical bays illuminate cleanly: 1. Input -> 2. Gorevault (044) Conversion -> 3. Ringthroat (029) Extrusion -> 4. Orbital Ring.",
        "visualOutput": "Reveals Blood Ring origin as brutal material extraction and orbital vitrification.",
        "persistPolicy": "stepped",
        "maxSteps": 4,
        "narrationSegmentId": "F05_B",
        "keyboardLabel": "Key B · Step 4-Stage Ring Cutaway",
        "textEquivalent": "Steps sequentially across the four-part manufacture: Input -> Gorevault Conversion -> Ringthroat Extrusion -> Vitrified Crimson Ring."
      },
      {
        "id": "f05_c",
        "slot": "C",
        "type": "toggle",
        "label": "Separate Doctrine from Memorial Record",
        "description": "Rotate the bilingual/bi-level evidence plaque contrasting Drakken doctrine against the factual record.",
        "visualInput": "Click the rotating evidence card or press C.",
        "visualTransformation": "Cardstock plaque pivots 180 degrees from the crimson doctrinal stamp (\"Your sky is built from your dead.\") to the sober cream archival note.",
        "visualOutput": "Distinguishes historical perpetrator declaration from institutional fact.",
        "persistPolicy": "reversible",
        "narrationSegmentId": "F05_C",
        "keyboardLabel": "Key C · Flip Doctrine vs. Fact Card",
        "textEquivalent": "Pivots between the verbatim Drakken inscription \"Your sky is built from your dead.\" and the factual casualty/process summary."
      }
    ],
    "prevFolio": "f04",
    "nextFolio": "f06",
    "completedRules": "Inspected planet before/after, stepped manufacture cutaway, or separated doctrine card."
  },
  {
    "worldId": 5,
    "id": "f06",
    "code": "F06",
    "roman": "VI",
    "chapterIndex": 6,
    "title": "Years 7–120 — The Long Attrition",
    "subtitle": "113 Years of Sourced Campaigns & Taxonomic Strains",
    "eraLabel": "Phase III · 170-Year Blood Eclipse War",
    "temporalMarker": "Years 7–120 · Long Attrition",
    "chronologyEventIds": [
      "long-attrition"
    ],
    "sourcePointers": [
      {
        "label": "Chronology: Years 7–120 Long Attrition",
        "url": "https://github.com/westkitty/Starsilk_Character_Dossier/blob/main/src/content/sections/chronology.body.html"
      },
      {
        "label": "DRAXIS 21 Source Registry",
        "url": "https://github.com/westkitty/Palimpsest/blob/main/production/history_v1/DRAXIS_21.json"
      }
    ],
    "historicalActors": [
      "Codec (record compiler)",
      "Sourced Drakken strains: Fault-Tongue (003), Obsidian Gul (004), Cloudmaw (009), Lyriboris (032), Vortenbray (012), Terragullet (019), Solnexus (030), plus extended catalog"
    ],
    "uncertaintyNotes": [
      "Individual battle dates inside Years 7–120 and exact aggregate casualty figures are unknown in source documents and remain unprinted."
    ],
    "sourceNotes": [
      {
        "id": "f06-fact",
        "kind": "source-fact",
        "heading": "Sustained Interstellar Attrition",
        "body": "For over a century (Years 7–120 of the 170-year war), specialized Drakken strains degraded planetary climates, crust, and infrastructure while Administration counters produced exhausting stalemate.",
        "sourceRef": "chronology.body.html · long-attrition"
      },
      {
        "id": "f06-unc",
        "kind": "uncertainty",
        "heading": "Blank Casualty Columns",
        "body": "Aggregate loss counts are explicitly left blank where primary archives give no verified count.",
        "sourceRef": "Twelve-Folio Manuscript · F06"
      }
    ],
    "periodPalette": {
      "era": "war",
      "label": "Blood Eclipse War · Crimson / Charcoal / Cream",
      "paperInner": "#EDE6D8",
      "paperMid": "#DDD1BE",
      "paperEdge": "#C2B19B",
      "accentHex": "#9E322C",
      "secondaryHex": "#393E46",
      "washRgba": "rgba(158, 50, 44, 0.14)",
      "lineRgba": "rgba(52, 42, 40, 0.25)",
      "inkHex": "#241D1C",
      "ambientHex": "#1F1517"
    },
    "sceneFactoryKey": "f06",
    "visualCues": [
      "Rotating brass decade drum (Years 7–120)",
      "Central 3D rotating specimen cradle displaying selected canonical Drakken model",
      "Unfurling archival ledger strip with blank UNKNOWN total columns"
    ],
    "narrationSegmentIds": [
      "F06_OPEN",
      "F06_LESSON",
      "F06_A",
      "F06_B",
      "F06_C",
      "F06_CLOSE"
    ],
    "cues": {
      "OPEN": {
        "cueId": "F06_OPEN",
        "slot": "OPEN",
        "heading": "Opening",
        "paragraphs": [
          "It is easy to remember the beginning of a war. It is much harder to picture the middle.",
          "From Years Seven through One Hundred Twenty, the Administration fought across countless worlds. Its victories were generally small, and often brief. The Drakken continued to alter landscapes, oceans, skies, and the systems that held communities together.",
          "A hundred and fourteen calendar markers fit comfortably on this wheel. They were much less comfortable to live through.",
          "Let us examine a few recorded examples."
        ]
      },
      "LESSON": {
        "cueId": "F06_LESSON",
        "slot": "LESSON",
        "heading": "Main lesson",
        "paragraphs": [
          "At Tholus Fort, a Fault-Tongue's seismic tone split the fortress in six directions in a single sunrise.",
          "In Sector Delta-1, three Obsidian Gul strains turned terrain into fields of razor-sharp volcanic glass.",
          "At Zuul Kai, a Cloudmaw raised the ocean over sealed atmospheric domes. Libraries became coral-stone.",
          "At Shail-9, a Lyriboris caused planetary artificial intelligences to scream music until they fell silent. The planetary defense grid then stood open.",
          "Elsewhere, Vortenbray changed the arrangement of the sky. Solnexus extinguished three suns. Terragullet made wheat grow in the natural shapes of people already killed.",
          "These are different mechanisms. They led to different forms of loss. Grouping them under one phrase, *the war*, is convenient for an atlas. It is not sufficient to describe any single place.",
          "Codec's records helped commanders decide what to confront, what to preserve, and what the available counter-Macros could accomplish. Such records were necessary for military coordination. They could also make catastrophe easier to enter as a completed line of work."
        ]
      },
      "A": {
        "cueId": "F06_A",
        "slot": "A",
        "heading": "Advance the chronology wheel",
        "paragraphs": [
          "Each turn moves us through more of the war. The empty intervals are not peaceful years. They mark places where this illustration makes no more precise claim."
        ]
      },
      "B": {
        "cueId": "F06_B",
        "slot": "B",
        "heading": "Select a campaign plate",
        "paragraphs": [
          "You may inspect the individual record. A name on the plate identifies an actual described event. The space between the plates is only a drafting convenience."
        ]
      },
      "C": {
        "cueId": "F06_C",
        "slot": "C",
        "heading": "Unfurl the loss record",
        "paragraphs": [
          "The length is measurable. The complete human cost is not supplied by this chart. We shall not invent a number to make the lesson look finished."
        ]
      },
      "CLOSE": {
        "cueId": "F06_CLOSE",
        "slot": "CLOSE",
        "heading": "Closing",
        "paragraphs": [
          "At Year One Hundred Twenty-One, the Administration attempted a great offensive.",
          "Its name was the Siege of the Ruby Eclipse."
        ]
      }
    },
    "interactions": [
      {
        "id": "f06_a",
        "slot": "A",
        "type": "drum",
        "label": "Rotate the Chronology Drum",
        "description": "Turn the multi-decade brass wheel spanning Years 7 through 120.",
        "visualInput": "Click the brass drum on the left page or press A.",
        "visualTransformation": "Indexed cylindrical drum rotates sequentially through decades 7–30, 31–60, 61–90, and 91–120.",
        "visualOutput": "Conveys sustained multi-generational duration without inventing specific battle days.",
        "persistPolicy": "stepped",
        "maxSteps": 4,
        "narrationSegmentId": "F06_A",
        "keyboardLabel": "Key A · Step Decade Drum (Years 7–120)",
        "textEquivalent": "Advances the Years 7–120 attrition drum through four chronological spans while marking undocumented years as unspecified."
      },
      {
        "id": "f06_b",
        "slot": "B",
        "type": "plates",
        "label": "Select Sourced Campaign Plates & Strains",
        "description": "Cycle canonical DRAXIS strains mounted on the central specimen turntable.",
        "visualInput": "Click the central specimen pedestal or press B.",
        "visualTransformation": "Turntable rotates and swaps between full modular 3D Drakken models (003, 004, 009, 032, 012, 019, 030, plus full 21-plate registry).",
        "visualOutput": "Connects distinct anatomical silhouettes directly to their documented theater operations.",
        "persistPolicy": "stepped",
        "maxSteps": 7,
        "narrationSegmentId": "F06_B",
        "keyboardLabel": "Key B · Cycle Campaign Drakken Strains",
        "textEquivalent": "Cycles the specimen turntable across Fault-Tongue (003), Obsidian Gul (004), Cloudmaw (009), Lyriboris (032), Vortenbray (012), Terragullet (019), and Solnexus (030)."
      },
      {
        "id": "f06_c",
        "slot": "C",
        "type": "flap",
        "label": "Unfurl the Cumulative-Loss Ledger",
        "description": "Pull out the paper ledger sheet showing documented disruptions alongside intentionally blank casualty totals.",
        "visualInput": "Click the rolled ledger tab on the right margin or press C.",
        "visualTransformation": "Pleated archival scroll unrolls flat onto the right page with blank calibrated total boxes.",
        "visualOutput": "Preserves intellectual honesty: loss was vast, and unverified numbers remain blank.",
        "persistPolicy": "reversible",
        "narrationSegmentId": "F06_C",
        "keyboardLabel": "Key C · Unfurl Loss Record Strip",
        "textEquivalent": "The archival loss record unfurls, logging biosphere and infrastructure disruption while keeping unverified death totals explicitly blank."
      }
    ],
    "prevFolio": "f05",
    "nextFolio": "f07",
    "completedRules": "Stepped decade drum, inspected campaign strains, or unfurled loss ledger."
  },
  {
    "worldId": 6,
    "id": "f07",
    "code": "F07",
    "roman": "VII",
    "chapterIndex": 7,
    "title": "Year 121 — The Siege of the Ruby Eclipse",
    "subtitle": "Strategic Plan vs. Costly Attrition at Pharos Nebula",
    "eraLabel": "Phase III · Year 121 of the 170-Year War",
    "temporalMarker": "Year 121 · Pharos Nebula (Not to Scale)",
    "chronologyEventIds": [
      "siege-ruby-eclipse"
    ],
    "sourcePointers": [
      {
        "label": "Chronology: Year 121 Siege of the Ruby Eclipse",
        "url": "https://github.com/westkitty/Starsilk_Character_Dossier/blob/main/src/content/sections/chronology.body.html"
      }
    ],
    "historicalActors": [
      "Administration tactical command (abstract)",
      "Codec (analytical record where relevant)"
    ],
    "uncertaintyNotes": [
      "Tactical diagram carries an explicit NOT TO SCALE disclaimer; specific battle casualty figures are unknown."
    ],
    "sourceNotes": [
      {
        "id": "f07-fact",
        "kind": "source-fact",
        "heading": "Operational Reality at Ruby Eclipse",
        "body": "In Year 121 inside the Pharos Nebula, planned decisive maneuver collapsed into protracted logistical grinding.",
        "sourceRef": "chronology.body.html · siege-ruby-eclipse"
      },
      {
        "id": "f07-unc",
        "kind": "uncertainty",
        "heading": "Non-Geographic Scale Disclaimer",
        "body": "Nebula schematic is marked NOT TO SCALE; unverified headcounts stay empty.",
        "sourceRef": "Twelve-Folio Manuscript · F07"
      }
    ],
    "periodPalette": {
      "era": "war",
      "label": "Blood Eclipse War · Crimson / Charcoal / Cream",
      "paperInner": "#EDE6D8",
      "paperMid": "#DDD1BE",
      "paperEdge": "#C2B19B",
      "accentHex": "#9E322C",
      "secondaryHex": "#393E46",
      "washRgba": "rgba(158, 50, 44, 0.14)",
      "lineRgba": "rgba(52, 42, 40, 0.25)",
      "inkHex": "#241D1C",
      "ambientHex": "#1F1517"
    },
    "sceneFactoryKey": "f07",
    "visualCues": [
      "Raised Pharos Nebula relief stamped NOT TO SCALE",
      "Acetate attack arrow plan vs. fractured attrition bars",
      "Brass lens support-line inspection plate"
    ],
    "narrationSegmentIds": [
      "F07_OPEN",
      "F07_LESSON",
      "F07_A",
      "F07_B",
      "F07_C",
      "F07_CLOSE"
    ],
    "cues": {
      "OPEN": {
        "cueId": "F07_OPEN",
        "slot": "OPEN",
        "heading": "Opening",
        "paragraphs": [
          "In Year One Hundred Twenty-One, the Administration advanced against a Drakken forward position in the Pharos Nebula.",
          "The operation became known as the Siege of the Ruby Eclipse.",
          "An offensive begins, in part, as a plan. It must have a destination. It must have supplies. It must allow commanders to tell one movement from another. On paper, these requirements can be shown quite simply.",
          "Here is a plan-shaped drawing. Please notice the straight lines. They are a teaching device, not a recovered map of the exact battlefield."
        ]
      },
      "LESSON": {
        "cueId": "F07_LESSON",
        "slot": "LESSON",
        "heading": "Main lesson",
        "paragraphs": [
          "The source describes this campaign as catastrophically attritional.",
          "That means we should be cautious when an illustrated arrow seems to make it look swift. A route drawn in one motion can conceal a long sequence of engagements, losses, delay, and repeated effort.",
          "The Administration had developed ways to move supplies and coordinate countermeasures across immense distances. These systems were remarkable in their own right. They did not make the fighting simple.",
          "This page cannot give every movement or loss. The records used for this lesson do not specify a complete battlefield plan, the exact tally of the dead, or a clean final triumph. We will not manufacture those details to improve the illustration.",
          "What the source does allow us to say is enough: the assault took place, it was immense in cost, and the war continued.",
          "The overlay is now ready. The lines become less comfortable when another layer is placed beneath them."
        ]
      },
      "A": {
        "cueId": "F07_A",
        "slot": "A",
        "heading": "Unfold the plan overlay",
        "paragraphs": [
          "This is the intended direction of the campaign. It belongs to the diagram. The real battle was not obliged to follow such a neat stroke of ink."
        ]
      },
      "B": {
        "cueId": "F07_B",
        "slot": "B",
        "heading": "Show the campaign record",
        "paragraphs": [
          "A single arrow can hide a great deal of time and cost. The archival description is not a neat victory notice. It is an account of attrition."
        ]
      },
      "C": {
        "cueId": "F07_C",
        "slot": "C",
        "heading": "Inspect the supporting layer",
        "paragraphs": [
          "Where a number is not known, the space remains empty. Uncertainty is not a defect in a historical record. Filling it carelessly would be."
        ]
      },
      "CLOSE": {
        "cueId": "F07_CLOSE",
        "slot": "CLOSE",
        "heading": "Closing",
        "paragraphs": [
          "The war would continue to Year One Hundred Seventy.",
          "By then, the Drakken had acquired a means of threatening what had once seemed beyond harm."
        ]
      }
    },
    "interactions": [
      {
        "id": "f07_a",
        "slot": "A",
        "type": "flap",
        "label": "Unfold Strategic Plan Overlay",
        "description": "Lower the clean cream planning acetate bearing smooth directional objective vectors.",
        "visualInput": "Click the planning overlay frame or press A.",
        "visualTransformation": "Hinged translucent planning plate lowers cleanly over the Pharos Nebula relief.",
        "visualOutput": "Shows how the Year 121 operation appeared on clean institutional planning charts.",
        "persistPolicy": "reversible",
        "narrationSegmentId": "F07_A",
        "keyboardLabel": "Key A · Toggle Strategic Plan Overlay",
        "textEquivalent": "The strategic plan overlay displays clean intended maneuver vectors stamped NOT TO SCALE."
      },
      {
        "id": "f07_b",
        "slot": "B",
        "type": "toggle",
        "label": "Reveal Attrition Outcome Layer",
        "description": "Switch from crisp objective arrows to fractured attrition bars recording sustained deadlock.",
        "visualInput": "Click the outcome comparison tab or press B.",
        "visualTransformation": "Smooth brass arrow fragments into stalled crimson-charcoal tick bars across the sector grid.",
        "visualOutput": "Demonstrates contrast between projected brevity and prolonged siege reality.",
        "persistPolicy": "reversible",
        "narrationSegmentId": "F07_B",
        "keyboardLabel": "Key B · Toggle Attrition Outcome",
        "textEquivalent": "Clean offensive vectors shatter into repeated attrition markers indicating stalled siege conditions."
      },
      {
        "id": "f07_c",
        "slot": "C",
        "type": "trigger",
        "label": "Inspect Supply-Route Consequences",
        "description": "Elevate the supply-corridor magnifier plate tracing strain across supporting worlds.",
        "visualInput": "Click the supply inspection plate or press C.",
        "visualTransformation": "Auxiliary logistics sub-plate rises from the right leaf showing stretched filament supply links and blank unknown columns.",
        "visualOutput": "Highlights logistical strain without fabricating casualty statistics.",
        "persistPolicy": "reversible",
        "narrationSegmentId": "F07_C",
        "keyboardLabel": "Key C · Inspect Supply Route Plate",
        "textEquivalent": "Exposes logistical strain along Pharos support corridors while leaving unknown loss figures uninvented."
      }
    ],
    "prevFolio": "f06",
    "nextFolio": "f08",
    "completedRules": "Unfolded plan overlay, outcome plate, or support-route inspection."
  },
  {
    "worldId": 7,
    "id": "f08",
    "code": "F08",
    "roman": "VIII",
    "chapterIndex": 8,
    "title": "Year 170 — The Aureal Gate",
    "subtitle": "Weaponized Starsilk, Divine Vulnerability & Twenty Conquered Worlds",
    "eraLabel": "Phase III · Year 170 Culmination",
    "temporalMarker": "Year 170 · Aureal Gate Collapse",
    "chronologyEventIds": [
      "collapse-aureal-gate"
    ],
    "sourcePointers": [
      {
        "label": "Chronology: Year 170 Aureal Gate",
        "url": "https://github.com/westkitty/Starsilk_Character_Dossier/blob/main/src/content/sections/chronology.body.html"
      },
      {
        "label": "Systems: Starsilk Weaponization",
        "url": "https://github.com/westkitty/Starsilk_Character_Dossier/blob/main/src/content/sections/systems.body.html"
      }
    ],
    "historicalActors": [
      "The Shard-god",
      "Drakken offensive convergence",
      "Codec (evidenced observer)"
    ],
    "uncertaintyNotes": [
      "Schematic display shows directional retreat and 20-world crimson-ring loss markers non-geographically."
    ],
    "sourceNotes": [
      {
        "id": "f08-fact1",
        "kind": "source-fact",
        "heading": "First Demonstrated Divine Vulnerability",
        "body": "In Year 170 at the Aureal Gate, weaponized Starsilk forced The Shard-god into retreat—proving even a primordial divinity could be wounded and routed.",
        "sourceRef": "chronology.body.html · collapse-aureal-gate"
      },
      {
        "id": "f08-fact2",
        "kind": "source-fact",
        "heading": "Twenty Conquered Worlds",
        "body": "Following the Aureal Gate breach, Drakken forces conquered twenty inhabited worlds, encircled by physical Blood Rings.",
        "sourceRef": "chronology.body.html · collapse-aureal-gate"
      }
    ],
    "periodPalette": {
      "era": "war",
      "label": "Blood Eclipse War · Crimson / Charcoal / Cream",
      "paperInner": "#EDE6D8",
      "paperMid": "#DDD1BE",
      "paperEdge": "#C2B19B",
      "accentHex": "#9E322C",
      "secondaryHex": "#393E46",
      "washRgba": "rgba(158, 50, 44, 0.14)",
      "lineRgba": "rgba(52, 42, 40, 0.25)",
      "inkHex": "#241D1C",
      "ambientHex": "#1F1517"
    },
    "sceneFactoryKey": "f08",
    "visualCues": [
      "Hinged Aureal Gate structural arch + weaponized cyan Starsilk breach beam",
      "Invincibility vs. Vulnerability assumption slider",
      "Directional retreat foldout revealing 20 crimson-ringed world discs"
    ],
    "narrationSegmentIds": [
      "F08_OPEN",
      "F08_LESSON",
      "F08_A",
      "F08_B",
      "F08_C",
      "F08_CLOSE"
    ],
    "cues": {
      "OPEN": {
        "cueId": "F08_OPEN",
        "slot": "OPEN",
        "heading": "Opening",
        "paragraphs": [
          "Here we come to Year One Hundred Seventy, and the Collapse at the Aureal Gate.",
          "For generations, the Drakken had used their own terrible methods to transform worlds. During the war, they also discovered Starsilk and learned to employ it.",
          "At the Aureal Gate, they weaponized it against divine authority.",
          "There is a small change in our illustration now. What once appeared protected by its own nature is shown with a point of vulnerability."
        ]
      },
      "LESSON": {
        "cueId": "F08_LESSON",
        "slot": "LESSON",
        "heading": "Main lesson",
        "paragraphs": [
          "The result established that The Shard-god could be harmed.",
          "That discovery did not erase the long history of the war. It did change the practical question facing those directing it. The problem was no longer only how to stop the Drakken from taking more worlds. The problem had also become how to prevent them from wielding a force capable of injuring a god.",
          "The Drakken drew back toward the Aureal Nebula. The record describes twenty worlds already fully subjugated under Blood Rings.",
          "Twenty is a convenient number to print in the margin. Each mark, however, refers to a world with a history of its own.",
          "The Shard-god's answer was not a simple victory over an opposing army. It was a calculation about containment. That calculation would be carried out through stars."
        ]
      },
      "A": {
        "cueId": "F08_A",
        "slot": "A",
        "heading": "Inspect the vulnerability plate",
        "paragraphs": [
          "The crucial fact is not that the gods became ordinary. It is that an assumed impossibility was demonstrated to be possible."
        ]
      },
      "B": {
        "cueId": "F08_B",
        "slot": "B",
        "heading": "Compare the assumption",
        "paragraphs": [
          "The earlier model lacks this point of danger. The later one includes it. The change is small on paper, and very large in consequence."
        ]
      },
      "C": {
        "cueId": "F08_C",
        "slot": "C",
        "heading": "Unfold the retreat diagram",
        "paragraphs": [
          "The arrows show retreat in broad terms. Their distances are not measured. The twenty world markers, unlike their placement on this page, belong to the historical record."
        ]
      },
      "CLOSE": {
        "cueId": "F08_CLOSE",
        "slot": "CLOSE",
        "heading": "Closing",
        "paragraphs": [
          "We have reached the decision that would shape the sky for everyone who came after.",
          "Our next model begins with one star."
        ]
      }
    },
    "interactions": [
      {
        "id": "f08_a",
        "slot": "A",
        "type": "cutaway",
        "label": "Inspect Divine Vulnerability Diagram",
        "description": "Open the Aureal Gate section showing weaponized Starsilk breaching divine defense.",
        "visualInput": "Click the Aureal Gate arch or press A.",
        "visualTransformation": "Twin gate pylons tilt apart; cyan Starsilk breach line intersects the dark crystalline Shard-god emblem.",
        "visualOutput": "Documents the structural vulnerability without dramatizing an invented duel.",
        "persistPolicy": "reversible",
        "narrationSegmentId": "F08_A",
        "keyboardLabel": "Key A · Open Vulnerability Diagram",
        "textEquivalent": "The Aureal Gate cross-section separates, illustrating weaponized Starsilk demonstrating The Shard-god’s structural vulnerability at Year 170."
      },
      {
        "id": "f08_b",
        "slot": "B",
        "type": "slider",
        "label": "Compare Before / After Invincibility Assumption",
        "description": "Toggle the calibration slider between institutional assumption of divine immunity and Year 170 proof.",
        "visualInput": "Click the assumption slider bar or press B.",
        "visualTransformation": "Unbroken gold circle fractures into interrupted asymmetrical arcs across the center diagram.",
        "visualOutput": "Visualizes how official doctrine lost absolute certainty after Year 170.",
        "persistPolicy": "reversible",
        "narrationSegmentId": "F08_B",
        "keyboardLabel": "Key B · Toggle Vulnerability Assumption",
        "textEquivalent": "Slides from an unbroken assumption of divine immunity to a fractured containment profile."
      },
      {
        "id": "f08_c",
        "slot": "C",
        "type": "flap",
        "label": "Unfold Retreat & Twenty Conquered Worlds",
        "description": "Open the extension wing tracing retreat toward the Aureal Nebula and twenty crimson-ringed worlds.",
        "visualInput": "Click the extension tab on the right leaf or press C.",
        "visualTransformation": "Right-hand accordion leaf folds outward revealing 20 small obsidian world medallions circled by physical crimson rings.",
        "visualOutput": "Shows consequential territorial loss cleanly on a schematic array.",
        "persistPolicy": "reversible",
        "narrationSegmentId": "F08_C",
        "keyboardLabel": "Key C · Unfold Twenty-World Foldout",
        "textEquivalent": "Unfolds the directional retreat arrow alongside twenty schematic world markers ringed in physical crimson."
      }
    ],
    "prevFolio": "f07",
    "nextFolio": "f09",
    "completedRules": "Opened Gate diagram, compared assumption slider, or unfolded twenty-world panel."
  },
  {
    "worldId": 8,
    "id": "f09",
    "code": "F09",
    "roman": "IX",
    "chapterIndex": 9,
    "title": "The Hal'Ven Heliocide",
    "subtitle": "Irreversible Stellar Collapse & Cumulative Singularities",
    "eraLabel": "Phase III · Final Strike at Hal'Ven",
    "temporalMarker": "Unknown exact day · End-phase Hal'Ven Heliocide",
    "chronologyEventIds": [
      "halven-heliocide"
    ],
    "sourcePointers": [
      {
        "label": "Chronology: Hal'Ven Heliocide",
        "url": "https://github.com/westkitty/Starsilk_Character_Dossier/blob/main/src/content/sections/chronology.body.html"
      },
      {
        "label": "Cosmic Architecture: Starsilk Stellar Law",
        "url": "https://github.com/westkitty/Starsilk_Character_Dossier/blob/main/src/content/sections/cosmic-architecture.body.html"
      }
    ],
    "historicalActors": [
      "The Shard-god",
      "Codec (archival witness)",
      "Lacrimosa (named vessel reference)"
    ],
    "uncertaintyNotes": [
      "Leftmost demonstration uses an explicitly nonhistorical MODEL STAR; once a star's core filament is extracted, collapse into a black hole is permanent within this session."
    ],
    "sourceNotes": [
      {
        "id": "f09-fact1",
        "kind": "demonstration",
        "heading": "Sacrificial Model Star Physical Law",
        "body": "Pulling Starsilk out of a living star immediately collapses that star into a black hole. There is no rewind or survived uncollapsed state once extracted.",
        "sourceRef": "Twelve-Folio Manuscript · F09"
      },
      {
        "id": "f09-fact2",
        "kind": "source-fact",
        "heading": "The Hal'Ven Heliocide",
        "body": "The Shard-god extracted Starsilk through stars across the Hal'Ven cluster, collapsing them into black holes that terminated Drakken advance and sealed the boundary.",
        "sourceRef": "chronology.body.html · halven-heliocide"
      }
    ],
    "periodPalette": {
      "era": "war",
      "label": "Blood Eclipse War · Crimson / Charcoal / Cream",
      "paperInner": "#EDE6D8",
      "paperMid": "#DDD1BE",
      "paperEdge": "#C2B19B",
      "accentHex": "#9E322C",
      "secondaryHex": "#393E46",
      "washRgba": "rgba(158, 50, 44, 0.14)",
      "lineRgba": "rgba(52, 42, 40, 0.25)",
      "inkHex": "#241D1C",
      "ambientHex": "#1F1517"
    },
    "sceneFactoryKey": "f09",
    "visualCues": [
      "Explicitly labeled MODEL STAR threaded with cyan filament (IRREVERSIBLE COLLAPSE on pull)",
      "Hal'Ven cluster multi-star wave array",
      "Elevated containment geometry zoom-out plate"
    ],
    "narrationSegmentIds": [
      "F09_OPEN",
      "F09_LESSON",
      "F09_A",
      "F09_B",
      "F09_C",
      "F09_CLOSE"
    ],
    "cues": {
      "OPEN": {
        "cueId": "F09_OPEN",
        "slot": "OPEN",
        "heading": "Opening",
        "paragraphs": [
          "This is a model star. It is not one of the individual suns lost at Hal'Ven.",
          "We have made it small so that its workings may be shown clearly.",
          "Starsilk is embedded through stellar centers. When a strand is successfully pulled from a star, that star collapses immediately into a black hole. Its system is destroyed.",
          "We shall observe the principle once before examining its terrible use on a larger scale."
        ]
      },
      "LESSON": {
        "cueId": "F09_LESSON",
        "slot": "LESSON",
        "heading": "Main lesson",
        "paragraphs": [
          "At the close of the Blood Eclipse War, The Shard-god commanded the front aboard Lacrimosa.",
          "He answered the Drakken's use of Starsilk by destroying the stars of the Hal'Ven Cluster in sequence. Thousands of suns became singularities. Their collapse enabled the construction of a black-hole containment system around the Drakken domain.",
          "The process is easy to draw: a star, a removed filament, and a black circle where the star once was.",
          "The losses cannot be drawn so easily. Each star was the center of a system. The containment strategy cost thousands of suns and lives on a scale that the Administration's diagrams could only compress into totals.",
          "The Shard-god's action was deliberate. The source describes it as containment and self-preservation, not a burst of uncontrolled anger.",
          "The arrangement worked to prevent further Drakken advance. It also made the sacrifice permanent."
        ]
      },
      "A": {
        "cueId": "F09_A",
        "slot": "A",
        "heading": "Withdraw the model filament",
        "paragraphs": [
          "There it is. The transition is immediate. The model no longer contains a star. It contains the singularity left by its collapse."
        ]
      },
      "B": {
        "cueId": "F09_B",
        "slot": "B",
        "heading": "Advance the collapse sequence",
        "paragraphs": [
          "One after another, the marks change. The arrangement becomes legible as a barrier. The individual systems do not return."
        ]
      },
      "C": {
        "cueId": "F09_C",
        "slot": "C",
        "heading": "Draw back to the containment shape",
        "paragraphs": [
          "From a distance, the system reads as an engineered boundary. That clarity is helpful for study. It should not be mistaken for the view from an inhabited world."
        ]
      },
      "CLOSE": {
        "cueId": "F09_CLOSE",
        "slot": "CLOSE",
        "heading": "Closing",
        "paragraphs": [
          "The singularities were arranged into what came to be called the Siege Wall.",
          "The next page explains what the Wall could do. And what it could not undo."
        ]
      }
    },
    "interactions": [
      {
        "id": "f09_a",
        "slot": "A",
        "type": "trigger",
        "label": "Pull Filament from Model Star (Irreversible)",
        "description": "Extract the cyan Starsilk thread from the nonhistorical MODEL STAR. Immediately and permanently collapses the model star into a dark singularity.",
        "visualInput": "Click the MODEL STAR filament pull-ring or press A.",
        "visualTransformation": "Cyan Starsilk thread pulls taut outward; the bright golden model star immediately implodes into a matte obsidian black-hole sphere surrounded by a flat accretion hairline. Cannot be un-collapsed in this session.",
        "visualOutput": "Model star remains permanently collapsed into a dark singularity until explicit session Restart.",
        "persistPolicy": "irreversible",
        "narrationSegmentId": "F09_A",
        "keyboardLabel": "Key A · Extract Filament (Irreversible Collapse)",
        "textEquivalent": "The filament pulls cleanly out of the MODEL STAR. The star immediately and irreversibly collapses into a black hole sphere within this reading session."
      },
      {
        "id": "f09_b",
        "slot": "B",
        "type": "plates",
        "label": "Run Hal'Ven Cluster Sequential Collapse",
        "description": "Step sequentially through the Hal'Ven cluster cascade collapsing stellar nodes into dark singularities.",
        "visualInput": "Click the cluster cascade actuator or press B.",
        "visualTransformation": "Successive cluster waves extinguish amber star spheres inside the Hal'Ven frame, replacing each with dark black-hole discs.",
        "visualOutput": "Demonstrates sequential heliocide scale without gratuitous explosion chaos.",
        "persistPolicy": "stepped",
        "maxSteps": 3,
        "narrationSegmentId": "F09_B",
        "keyboardLabel": "Key B · Step Hal'Ven Collapse Waves",
        "textEquivalent": "Steps sequentially through three Hal'Ven cluster collapse stages as stars extinguish into singularities."
      },
      {
        "id": "f09_c",
        "slot": "C",
        "type": "flap",
        "label": "Inspect Cumulative Containment Lattice",
        "description": "Lift the upper geometric plan to examine how resulting singularities formed a closed perimeter.",
        "visualInput": "Click the containment schematic tab or press C.",
        "visualTransformation": "Wide calibrated ring assembly hinges up, showing dark singularity points linked along an enclosing boundary.",
        "visualOutput": "Connects astrophysical destruction directly to the structural border shown in F10.",
        "persistPolicy": "reversible",
        "narrationSegmentId": "F09_C",
        "keyboardLabel": "Key C · Raise Containment Boundary Plan",
        "textEquivalent": "Lifts the overarching boundary plan, showing how Hal'Ven's singularities arranged into a strategic enclosure."
      }
    ],
    "prevFolio": "f08",
    "nextFolio": "f10",
    "completedRules": "Executed model star extraction or inspected Hal'Ven collapse lattice."
  },
  {
    "worldId": 9,
    "id": "f10",
    "code": "F10",
    "roman": "X",
    "chapterIndex": 10,
    "title": "The Siege Wall & the Postwar Protocols",
    "subtitle": "Contained Boundary, Pitch-Black Sky Streak & Prohibited Study",
    "eraLabel": "Phase IV · Immediate Post-War Order",
    "temporalMarker": "Post-War Era · Locking of the Siege Wall",
    "chronologyEventIds": [
      "locking-siege-wall",
      "postwar-protocols"
    ],
    "sourcePointers": [
      {
        "label": "Chronology: Siege Wall & Protocols",
        "url": "https://github.com/westkitty/Starsilk_Character_Dossier/blob/main/src/content/sections/chronology.body.html"
      },
      {
        "label": "Cosmic Architecture: Siege Wall Optical Appearance",
        "url": "https://github.com/westkitty/Starsilk_Character_Dossier/blob/main/src/content/sections/cosmic-architecture.body.html"
      }
    ],
    "historicalActors": [
      "The Shard-god (historical designer)",
      "Countless trapped inhabited lives (referenced in record, not personified into icons)"
    ],
    "uncertaintyNotes": [
      "Schematic boundary lattice is never what sky-watchers see: from inhabited planets inside, the Siege Wall appears only as an unbroken pitch-black streak bisecting the stars."
    ],
    "sourceNotes": [
      {
        "id": "f10-fact1",
        "kind": "source-fact",
        "heading": "A Pitch-Black Sky Streak, Not a Visible Grid",
        "body": "From inhabited worlds, the Siege Wall is not seen as a glowing mesh or engineering trellis; it appears solely as a cold pitch-black void bisecting the night sky, trapping trillions.",
        "sourceRef": "cosmic-architecture.body.html · siege-wall"
      },
      {
        "id": "f10-fact2",
        "kind": "source-fact",
        "heading": "The Postwar Protocols",
        "body": "Following containment, the Administration outlawed replication or technical study of heliocide operations under strict Postwar Protocols.",
        "sourceRef": "chronology.body.html · postwar-protocols"
      }
    ],
    "periodPalette": {
      "era": "aftermath",
      "label": "Postwar Order · Slate / Wheat-Gold / Azure Residue",
      "paperInner": "#EAE7DF",
      "paperMid": "#D8D4C9",
      "paperEdge": "#BEB8AA",
      "accentHex": "#B39452",
      "secondaryHex": "#4B8AA6",
      "washRgba": "rgba(75, 138, 166, 0.13)",
      "lineRgba": "rgba(48, 52, 58, 0.24)",
      "inkHex": "#202328",
      "ambientHex": "#14181E"
    },
    "sceneFactoryKey": "f10",
    "visualCues": [
      "Hinged black-hole perimeter fence diagram",
      "Toggle between 3D lattice schematic and inhabited planetary horizon with pitch-black sky streak",
      "Embossed sealed Postwar Protocols ledger leaf"
    ],
    "narrationSegmentIds": [
      "F10_OPEN",
      "F10_LESSON",
      "F10_A",
      "F10_B",
      "F10_C",
      "F10_CLOSE"
    ],
    "cues": {
      "OPEN": {
        "cueId": "F10_OPEN",
        "slot": "OPEN",
        "heading": "Opening",
        "paragraphs": [
          "The Siege Wall is a permanent artificial boundary built from the singularities produced by the heliocide.",
          "In a structural illustration, we can show its purpose with black circles and carefully arranged lines. It enclosed the Drakken domain and prevented their advance.",
          "A barrier, however, has two sides. Let us examine them both."
        ]
      },
      "LESSON": {
        "cueId": "F10_LESSON",
        "slot": "LESSON",
        "heading": "Main lesson",
        "paragraphs": [
          "The Wall held the Drakken inside. It also held other lives inside with them. The postwar record describes trillions left behind in the enclosed region.",
          "From a distant inhabited world, this was not perceived as a neat diagram of black holes. It appeared as a broad, pitch-black void across the stars.",
          "The Administration declared the war finished. The Wall made that declaration structurally possible. It did not restore the lost systems, and it did not open a route home for everyone trapped beyond it.",
          "After the war, protocols forbade replication or study of the star-collapse technique used in the heliocide. The prohibition acknowledged the exceptional danger of that method. It did not erase the method from history.",
          "We should keep those statements separate. The Wall was effective at containment. Its effectiveness is not the same question as whether every life affected by it was saved."
        ]
      },
      "A": {
        "cueId": "F10_A",
        "slot": "A",
        "heading": "Raise the boundary diagram",
        "paragraphs": [
          "Both sides of the boundary matter. The Wall stopped passage in the direction it was meant to stop. It also prevented escape for those remaining within."
        ]
      },
      "B": {
        "cueId": "F10_B",
        "slot": "B",
        "heading": "Change the viewing position",
        "paragraphs": [
          "Here is the view from the ground. The beautiful geometry of the drawing is not what people saw. Their sky carried a very large absence."
        ]
      },
      "C": {
        "cueId": "F10_C",
        "slot": "C",
        "heading": "Open the protocol card",
        "paragraphs": [
          "The procedure was restricted after the war. Its consequences, of course, remained. Laws may forbid repetition without reversing what was already done."
        ]
      },
      "CLOSE": {
        "cueId": "F10_CLOSE",
        "slot": "CLOSE",
        "heading": "Closing",
        "paragraphs": [
          "We have spent several pages examining the very large things that ended the war.",
          "Our next subject is considerably smaller."
        ]
      }
    },
    "interactions": [
      {
        "id": "f10_a",
        "slot": "A",
        "type": "flap",
        "label": "Raise the Siege Wall Boundary Diagram",
        "description": "Lift the perimeter foldout showing the enclosed sector sealed behind singularities.",
        "visualInput": "Click the wall perimeter base or press A.",
        "visualTransformation": "Semicircular matte-obsidian barrier arc hinges upright, dividing interior settled space from the outer quarantine zone.",
        "visualOutput": "Physical separation of contained systems becomes immediately legible.",
        "persistPolicy": "reversible",
        "narrationSegmentId": "F10_A",
        "keyboardLabel": "Key A · Raise Siege Wall Boundary",
        "textEquivalent": "The curved boundary arc elevates, demarcating the sealed interstellar perimeter containing the Drakken zone."
      },
      {
        "id": "f10_b",
        "slot": "B",
        "type": "toggle",
        "label": "Toggle Schematic vs. Inhabited Sky Streak",
        "description": "Switch between overhead blueprint geometry and the actual pitch-black streak visible from planetary horizons.",
        "visualInput": "Click the horizon perspective toggle or press B.",
        "visualTransformation": "Schematic grid lines drop flat and a curved planetary sky-dome emerges scarred by a sharp, completely dark pitch-black absence band cutting across the starfield.",
        "visualOutput": "Corrects false expectations: citizens saw a black absence cutting the sky, not wireframe engineering.",
        "persistPolicy": "reversible",
        "narrationSegmentId": "F10_B",
        "keyboardLabel": "Key B · Switch Schematic / Black Sky Streak",
        "textEquivalent": "Replaces the architectural lattice with an inhabited planetary horizon bisected by a silent pitch-black void streak across the stars."
      },
      {
        "id": "f10_c",
        "slot": "C",
        "type": "flap",
        "label": "Open the Postwar Protocols Sheet",
        "description": "Unseal the Administration decree outlawing heliocide replication and technical study.",
        "visualInput": "Click the sealed protocol document tab or press C.",
        "visualTransformation": "Tri-folded slate-and-cream decree card opens flat, displaying formal PROHIBITED stamps.",
        "visualOutput": "Links military victory directly to institutionalized censorship and classification.",
        "persistPolicy": "reversible",
        "narrationSegmentId": "F10_C",
        "keyboardLabel": "Key C · Open Postwar Protocols",
        "textEquivalent": "Opens the Postwar Protocols decree recording the formal prohibition against studying or replicating heliocide techniques."
      }
    ],
    "prevFolio": "f09",
    "nextFolio": "f11",
    "completedRules": "Raised boundary, toggled inhabited sky-streak view, or opened Protocols sheet."
  },
  {
    "worldId": 10,
    "id": "f11",
    "code": "F11",
    "roman": "XI",
    "chapterIndex": 11,
    "title": "31 Days Post-War — The First Dirt",
    "subtitle": "Nacreous VI Level 3, the Loam Cylinder & Marcel’s Defiance",
    "eraLabel": "Phase IV · 31 Days Post-War",
    "temporalMarker": "31 days post-war · Nacreous VI (Level 3 Remnant)",
    "chronologyEventIds": [
      "first-dirt"
    ],
    "sourcePointers": [
      {
        "label": "Chronology: 31 Days Post-War First Dirt",
        "url": "https://github.com/westkitty/Starsilk_Character_Dossier/blob/main/src/content/sections/chronology.body.html"
      },
      {
        "label": "Cosmic Architecture: Nacreous VI Level 3",
        "url": "https://github.com/westkitty/Starsilk_Character_Dossier/blob/main/src/content/sections/cosmic-architecture.body.html"
      }
    ],
    "historicalActors": [
      "Marcel",
      "Codec",
      "The Shard-god"
    ],
    "uncertaintyNotes": [
      "Nacreous VI remains a barren Level 3 remnant outside the forearm-sized glass loam cylinder. This plate is strictly not a planet-greening simulation."
    ],
    "sourceNotes": [
      {
        "id": "f11-fact",
        "kind": "source-fact",
        "heading": "A Forearm-Sized Proof, Not Planetary Recovery",
        "body": "31 days after the war, Marcel stood on scarred Level 3 remnant Nacreous VI holding one small forearm-sized glass cylinder of living dark soil and a few wheat blades—proof that repurposed Macro concepts could nurture life rather than harvest.",
        "sourceRef": "chronology.body.html · first-dirt"
      },
      {
        "id": "f11-quote",
        "kind": "historical-quotation",
        "heading": "The Shard-god to Codec",
        "body": "\"Your private discomfort with the shape of survival is not a license to revise the settlement.\"",
        "sourceRef": "Starsilk Character Dossier · First Dirt",
        "verbatim": true
      }
    ],
    "periodPalette": {
      "era": "aftermath",
      "label": "Postwar Order · Slate / Wheat-Gold / Azure Residue",
      "paperInner": "#EAE7DF",
      "paperMid": "#D8D4C9",
      "paperEdge": "#BEB8AA",
      "accentHex": "#B39452",
      "secondaryHex": "#4B8AA6",
      "washRgba": "rgba(75, 138, 166, 0.13)",
      "lineRgba": "rgba(48, 52, 58, 0.24)",
      "inkHex": "#202328",
      "ambientHex": "#14181E"
    },
    "sceneFactoryKey": "f11",
    "visualCues": [
      "Barren grey-ochre Level 3 Nacreous VI terrain (never greens outside glass)",
      "Forearm-sized transparent glass loam cylinder + subtle wheat blades",
      "Repurposed Macro weapon-vs-life comparison toggle",
      "Marcel, Codec & The Shard-god silhouette figures + attributed quotation leaf"
    ],
    "narrationSegmentIds": [
      "F11_OPEN",
      "F11_LESSON",
      "F11_A",
      "F11_B",
      "F11_C",
      "F11_CLOSE"
    ],
    "cues": {
      "OPEN": {
        "cueId": "F11_OPEN",
        "slot": "OPEN",
        "heading": "Opening",
        "paragraphs": [
          "Thirty-one days after the war, Codec made a small thing on Nacreous VI.",
          "The planet had suffered extensive ecological and structural damage. It was a Level Three remnant. The devastation could not be made to disappear by turning the page.",
          "Codec took battle Macros and repurposed them to support a little living soil. The result was contained in a glass cylinder about the length of a forearm.",
          "Wheat could grow inside it.",
          "That is the entire size of our next demonstration."
        ]
      },
      "LESSON": {
        "cueId": "F11_LESSON",
        "slot": "LESSON",
        "heading": "Main lesson",
        "paragraphs": [
          "An armful of soil is not a restored planet. It cannot repair every river, every storm, or every place that has already been destroyed.",
          "But there was life in this little cylinder, and the record treats that fact as significant.",
          "The Shard-god confronted Codec and Marcel at the grove. He described the war's conclusions as structural and rejected Codec's private wish to revise the settlement. Codec backed down.",
          "We shall not add an invented argument. The surviving account is enough.",
          "It is also important to remember that Codec had served the Administration during the war. He had helped direct countermeasures, including operations that left permanent damage behind. His later work with living soil did not erase those decisions.",
          "For the first time in several chapters, our demonstration does not involve a world being made smaller, or a star being removed. It involves a small living thing being kept alive.",
          "That is not a victory in the usual sense. It is worth examining anyway."
        ]
      },
      "A": {
        "cueId": "F11_A",
        "slot": "A",
        "heading": "Magnify the living soil",
        "paragraphs": [
          "There is the wheat. Nothing in this model makes the surrounding planet whole. The living soil exists within its small, carefully maintained boundary."
        ]
      },
      "B": {
        "cueId": "F11_B",
        "slot": "B",
        "heading": "Examine repurposed Macros",
        "paragraphs": [
          "The same capacity for precise intervention can be directed toward different ends. Here it sustains a little life. The source does not give us a method for restoring the entire world."
        ]
      },
      "C": {
        "cueId": "F11_C",
        "slot": "C",
        "heading": "Reveal the confrontation record",
        "paragraphs": [
          "The Shard-god told Codec that the war's conclusions were structural. He said: \"Your private discomfort with the shape of survival is not a license to revise the settlement.\"",
          "Codec did not prevail in that exchange. He backed down."
        ]
      },
      "CLOSE": {
        "cueId": "F11_CLOSE",
        "slot": "CLOSE",
        "heading": "Closing",
        "paragraphs": [
          "We shall leave the glass cylinder here. It is too small to serve as a monument. It is just large enough to show that another kind of work was possible.",
          "The war had ended. The structures of authority had not."
        ]
      }
    },
    "interactions": [
      {
        "id": "f11_a",
        "slot": "A",
        "type": "trigger",
        "label": "Magnify Glass Loam Cylinder & Wheat",
        "description": "Examine the single forearm-sized glass cylinder holding living dark soil on otherwise sterile Level 3 terrain.",
        "visualInput": "Click the upright glass loam cylinder or press A.",
        "visualTransformation": "Brass inspection lens collar glides above the glass cylinder, framing subtle wheat stalks while surrounding Nacreous VI ground remains completely barren.",
        "visualOutput": "Confirms survival scale accurately: one cylinder, not a healed planet.",
        "persistPolicy": "reversible",
        "narrationSegmentId": "F11_A",
        "keyboardLabel": "Key A · Inspect Glass Loam Cylinder",
        "textEquivalent": "Inspects the small forearm-sized glass cylinder containing dark loam and small wheat shoots; all surrounding Nacreous VI terrain stays barren."
      },
      {
        "id": "f11_b",
        "slot": "B",
        "type": "toggle",
        "label": "Compare Weapons Macro vs. Living Arrangement",
        "description": "Contrast wartime destruction Macros against Marcel’s repurposed life-preserving soil arrangement.",
        "visualInput": "Click the comparative Macro switch or press B.",
        "visualTransformation": "Left schematic hinges between jagged combat-Macro prongs and calm layered filtration rings supporting the loam cylinder.",
        "visualOutput": "Clarifies technical continuity without implying planetary recovery.",
        "persistPolicy": "reversible",
        "narrationSegmentId": "F11_B",
        "keyboardLabel": "Key B · Compare Macro Functions",
        "textEquivalent": "Contrasts wartime Macro weapon schematic against the soil-preservation configuration that sustained the single loam sample."
      },
      {
        "id": "f11_c",
        "slot": "C",
        "type": "flap",
        "label": "Reveal Attributed Confrontation Excerpt",
        "description": "Open the archival margin card bearing The Shard-god’s verbatim rebuke to Codec.",
        "visualInput": "Click the standing archival margin tab or press C.",
        "visualTransformation": "Cream foldout card opens beside the three silhouettes (Marcel, Codec, The Shard-god), presenting the exact quoted line.",
        "visualOutput": "Documents Codec backing down against structural postwar authority.",
        "persistPolicy": "reversible",
        "narrationSegmentId": "F11_C",
        "keyboardLabel": "Key C · Open Attributed Quotation Leaf",
        "textEquivalent": "Reveals the verbatim source quotation spoken by The Shard-god to Codec: \"Your private discomfort with the shape of survival is not a license to revise the settlement.\""
      }
    ],
    "prevFolio": "f10",
    "nextFolio": "f12",
    "completedRules": "Inspected loam cylinder, compared Macro arrangement, or opened confrontation leaf."
  },
  {
    "worldId": 11,
    "id": "f12",
    "code": "F12",
    "roman": "XII",
    "chapterIndex": 12,
    "title": "The Unfinished Peace",
    "subtitle": "Syrin-Blood Dead-Switch, Syrin 4 Record & Institutional Closure",
    "eraLabel": "Phase IV · Post-War Order & Closing Record",
    "temporalMarker": "Post-War Era · Destruction of Syrin 4",
    "chronologyEventIds": [
      "postwar-protocols",
      "syrin-genocide"
    ],
    "sourcePointers": [
      {
        "label": "Chronology: Syrin Genocide & Postwar Order",
        "url": "https://github.com/westkitty/Starsilk_Character_Dossier/blob/main/src/content/sections/chronology.body.html"
      },
      {
        "label": "Canonical Closing Invariants",
        "url": "https://github.com/westkitty/Starsilk_Character_Dossier/blob/main/src/canon/invariants.json"
      }
    ],
    "historicalActors": [
      "The Shard-god",
      "Kail (surviving Syrin initiate)",
      "Codec & Marcel (contextual postwar record)"
    ],
    "uncertaintyNotes": [
      "This volume closes before the Modern Era and Starbinding. Exact dates and casualty counts for Syrin 4 are unrecorded in the source chronology."
    ],
    "sourceNotes": [
      {
        "id": "f12-fact1",
        "kind": "source-fact",
        "heading": "Syrin Biology & Elimination of Syrin 4",
        "body": "Syrin blood contained a glitch that rendered Starsilk inert. Recognizing that vulnerability to divine control, The Shard-god destroyed Syrin 4, leaving Kail as the last known surviving initiate.",
        "sourceRef": "chronology.body.html · syrin-genocide"
      },
      {
        "id": "f12-demo",
        "kind": "demonstration",
        "heading": "Separated Containment vs. Harm Claims",
        "body": "CONTAINMENT ACHIEVED and HARM NOT ENDED slide apart as editorial analysis, not a historical quotation.",
        "sourceRef": "Twelve-Folio Manuscript · F12"
      },
      {
        "id": "f12-imprint",
        "kind": "historical-quotation",
        "heading": "Closing Institutional Slogan",
        "body": "\"Your fate is in our hands.\"",
        "sourceRef": "Administration Closing Imprint · BOOK_ENDCARD",
        "verbatim": true
      }
    ],
    "periodPalette": {
      "era": "aftermath",
      "label": "Postwar Order · Slate / Wheat-Gold / Azure Residue",
      "paperInner": "#EAE7DF",
      "paperMid": "#D8D4C9",
      "paperEdge": "#BEB8AA",
      "accentHex": "#B39452",
      "secondaryHex": "#4B8AA6",
      "washRgba": "rgba(75, 138, 166, 0.13)",
      "lineRgba": "rgba(48, 52, 58, 0.24)",
      "inkHex": "#202328",
      "ambientHex": "#14181E"
    },
    "sceneFactoryKey": "f12",
    "visualCues": [
      "Sliding split title plates: CONTAINMENT ACHIEVED / HARM NOT ENDED",
      "Symbolic isolated Starsilk test loop with Syrin-blood inactivation dead-switch",
      "Sparse Syrin 4 & Kail archival leaf + Closing Imprint trigger"
    ],
    "narrationSegmentIds": [
      "F12_OPEN",
      "F12_LESSON",
      "F12_A",
      "F12_B",
      "F12_C",
      "F12_CLOSE"
    ],
    "cues": {
      "OPEN": {
        "cueId": "F12_OPEN",
        "slot": "OPEN",
        "heading": "Opening",
        "paragraphs": [
          "We have arrived at the postwar order.",
          "The Administration could point to the Siege Wall and say that the Drakken advance had been contained. That was true.",
          "It could also issue protocols, assign responsibilities, and announce the end of the Blood Eclipse War. Those things were real as well.",
          "But an ended war is not the same as an end to violence. A peaceful title on a page cannot guarantee what happens under it.",
          "Our final lesson concerns something very small: a biological condition that could stop Starsilk from working."
        ]
      },
      "LESSON": {
        "cueId": "F12_LESSON",
        "slot": "LESSON",
        "heading": "Main lesson",
        "paragraphs": [
          "Syrin blood contained a glitch that made Starsilk inert. That meant Syrin biology could interrupt a system on which divine authority depended.",
          "The Shard-god recognized the consequence for his control. The source describes the destruction of Syrin 4 as his deliberate elimination of that vulnerability.",
          "The record identifies Kail as the last of the Syrin lineage.",
          "We do not require a graphic illustration here. The names, the dead-switch, and the fact of the genocide are sufficient to establish what happened.",
          "The postwar order remained capable of coordination. It remained capable of cruelty. Both facts belong in any useful history of the All.",
          "This illustrated volume ends before the later Modern Era and the great Starbinding. Those events have their own chapters to be told. They are not secretly resolved by this final page.",
          "What we can say here is simple. The Blood Eclipse War lasted one hundred seventy years. Its ending changed the shape of the All. It did not make the world innocent."
        ]
      },
      "A": {
        "cueId": "F12_A",
        "slot": "A",
        "heading": "Separate victory and consequence",
        "paragraphs": [
          "Two statements may both be true. The Drakken advance was contained. The systems that made later injustice possible remained."
        ]
      },
      "B": {
        "cueId": "F12_B",
        "slot": "B",
        "heading": "Test the biological dead-switch",
        "paragraphs": [
          "Notice that the Starsilk operation stops. Syrin blood renders it inert. A small exception to a powerful system may matter enormously to those who rely on that system remaining absolute."
        ]
      },
      "C": {
        "cueId": "F12_C",
        "slot": "C",
        "heading": "Unseal the final archival leaf",
        "paragraphs": [
          "This leaf records the destruction of Syrin 4 and identifies Kail as the surviving initiate. Some details belong to later history. We will not fill the missing spaces with invention."
        ]
      },
      "CLOSE": {
        "cueId": "F12_CLOSE",
        "slot": "CLOSE",
        "heading": "Closing",
        "paragraphs": [
          "That concludes our illustrated history of the All, from its earliest foundations through the aftermath of the Blood Eclipse War.",
          "The diagrams have done what diagrams can do. They have shown us arrangements, operations, and consequences. They have not returned any of the lives that were lost.",
          "There is no further demonstration on this page.",
          "You may close the book whenever you are ready."
        ]
      }
    },
    "interactions": [
      {
        "id": "f12_a",
        "slot": "A",
        "type": "slider",
        "label": "Separate Victory and Harm Overlays",
        "description": "Slide apart two superimposed cards: CONTAINMENT ACHIEVED and HARM NOT ENDED.",
        "visualInput": "Click the split overlay plate or press A.",
        "visualTransformation": "Overlapping slate-and-cream placards slide horizontally apart across an editorial baseline.",
        "visualOutput": "Distinguishes military containment cleanly from ongoing institutional violence.",
        "persistPolicy": "reversible",
        "narrationSegmentId": "F12_A",
        "keyboardLabel": "Key A · Separate Victory / Harm Overlays",
        "textEquivalent": "Slides apart two editorial placards reading CONTAINMENT ACHIEVED and HARM NOT ENDED."
      },
      {
        "id": "f12_b",
        "slot": "B",
        "type": "toggle",
        "label": "Test Syrin-Blood Dead-Switch Simulation",
        "description": "Engage the abstract symbolic sample inside the Starsilk test circuit, rendering the cyan filament inert.",
        "visualInput": "Click the isolated dead-switch test gate or press B.",
        "visualTransformation": "A symbolic dark-crimson indicator key slides into the brass loop junction; glowing azure Starsilk current turns dull slate inert.",
        "visualOutput": "Shows non-violently why Syrin biology threatened absolute Starsilk command.",
        "persistPolicy": "reversible",
        "narrationSegmentId": "F12_B",
        "keyboardLabel": "Key B · Activate Dead-Switch Simulation",
        "textEquivalent": "Introduces the symbolic Syrin-blood dead-switch into the abstract circuit, causing the glowing cyan Starsilk filament to become inert."
      },
      {
        "id": "f12_c",
        "slot": "C",
        "type": "flap",
        "label": "Unseal the Final Archival Leaf",
        "description": "Lift the final index tab recording the destruction of Syrin 4 and Kail’s survival with no invented counts.",
        "visualInput": "Click the sparse index leaf or press C.",
        "visualTransformation": "Muted cream-and-slate folder leaf opens cleanly exposing structured archive entries for Syrin 4 and Kail.",
        "visualOutput": "Closes the twelve-folio survey honestly before offering the final book closure.",
        "persistPolicy": "reversible",
        "narrationSegmentId": "F12_C",
        "keyboardLabel": "Key C · Unseal Final Syrin 4 Record",
        "textEquivalent": "Opens the sparse archival record documenting the destruction of Syrin 4 and identifying Kail as the last surviving initiate."
      }
    ],
    "prevFolio": "f11",
    "nextFolio": null,
    "completedRules": "Separated overlays, tested symbolic dead-switch, or unsealed Syrin 4 archival leaf."
  }
];

export const FOLIO_BY_WORLD: Record<WorldId, FolioManifest> = FOLIO_MANIFESTS.reduce(
  (acc, m) => {
    acc[m.worldId] = m;
    return acc;
  },
  {} as Record<WorldId, FolioManifest>,
);

export const FOLIO_BY_ID: Record<FolioId, FolioManifest> = FOLIO_MANIFESTS.reduce(
  (acc, m) => {
    acc[m.id] = m;
    return acc;
  },
  {} as Record<FolioId, FolioManifest>,
);

export const MAGNIFIER_SECRETS: MagnifierDiscovery[] = [
  {
    "worldId": 0,
    "folioId": "f01",
    "id": "f01-sec-a",
    "title": "Marginalia I-A · Initialization Record",
    "inscription": "“The Notebook Program maintains conditions continuously; prior states remain logged and cannot be undone backward.”",
    "sourceKind": "source-fact",
    "x": -1.8,
    "z": -0.9
  },
  {
    "worldId": 0,
    "folioId": "f01",
    "id": "f01-sec-b",
    "title": "Marginalia I-B · Editorial Projection Note",
    "inscription": "“Law, Memory, and Rendering operate simultaneously in the All; separation belongs strictly to this diagram.”",
    "sourceKind": "editorial-illustration",
    "x": 1.85,
    "z": 0.95
  },
  {
    "worldId": 1,
    "folioId": "f02",
    "title": "Marginalia II-A · First Azure Bleed",
    "id": "f02-sec-a",
    "inscription": "“Radiant cyan threads mark locations where Wordstreamer’s memory resisted complete overwrite.”",
    "sourceKind": "source-fact",
    "x": -1.75,
    "z": 1.0
  },
  {
    "worldId": 1,
    "folioId": "f02",
    "id": "f02-sec-b",
    "title": "Marginalia II-B · Digital Geode Spec",
    "inscription": "“NiAlBu remained physically alive inside unrendered code repetition; the dead do not witness.”",
    "sourceKind": "source-fact",
    "x": 1.75,
    "z": -1.0
  },
  {
    "worldId": 2,
    "folioId": "f03",
    "id": "f03-sec-a",
    "title": "Marginalia III-A · Impact Roster",
    "inscription": "“Documented Egg arrivals include Thon V, Nullgard, Omega Field 27, Syrrian IV, and Cumulon II.”",
    "sourceKind": "source-fact",
    "x": -1.8,
    "z": -0.95
  },
  {
    "worldId": 2,
    "folioId": "f03",
    "id": "f03-sec-b",
    "title": "Marginalia III-B · Macro Continuance",
    "inscription": "“Elder Drakken modified younger strains via compiled Macros before any conflict reached the Administration.”",
    "sourceKind": "source-fact",
    "x": 1.8,
    "z": 0.95
  },
  {
    "worldId": 3,
    "folioId": "f04",
    "id": "f04-sec-a",
    "title": "Marginalia IV-A · Year 0 Archive Gap",
    "inscription": "“Colony casualties at Year 0 remain unquantified in Administration statistical digests.”",
    "sourceKind": "uncertainty",
    "x": -1.8,
    "z": 1.05
  },
  {
    "worldId": 3,
    "folioId": "f04",
    "id": "f04-sec-b",
    "title": "Marginalia IV-B · Counter-Macro Protocol",
    "inscription": "“Administration responses applied mirrored reality-code Macros compiled under wartime oversight.”",
    "sourceKind": "source-fact",
    "x": 1.7,
    "z": -1.05
  },
  {
    "worldId": 4,
    "folioId": "f05",
    "id": "f05-sec-a",
    "title": "Marginalia V-A · Fallenstar Inscription",
    "inscription": "Verbatim Drakken doctrine etched across orbital strata: “Your sky is built from your dead.”",
    "sourceKind": "historical-quotation",
    "x": -1.75,
    "z": -1.0
  },
  {
    "worldId": 4,
    "folioId": "f05",
    "id": "f05-sec-b",
    "title": "Marginalia V-B · Physical Ring Composition",
    "inscription": "“Ringthroat (029) extruded converted matter from Gorevault (044) into physical vitrified crimson mineral bands.”",
    "sourceKind": "source-fact",
    "x": 1.8,
    "z": 1.0
  },
  {
    "worldId": 5,
    "folioId": "f06",
    "id": "f06-sec-a",
    "title": "Marginalia VI-A · Attrition Uncertainty",
    "inscription": "“Spanning 113 years of the 170-year war; intermediate campaign dates and tallies are marked blank.”",
    "sourceKind": "uncertainty",
    "x": -1.8,
    "z": 0.95
  },
  {
    "worldId": 5,
    "folioId": "f06",
    "id": "f06-sec-b",
    "title": "Marginalia VI-B · Strain Field Index",
    "inscription": "“Verified war-era plates include Fault-Tongue (003), Obsidian Gul (004), Cloudmaw (009), and Lyriboris (032).”",
    "sourceKind": "source-fact",
    "x": 1.8,
    "z": -0.95
  },
  {
    "worldId": 6,
    "folioId": "f07",
    "id": "f07-sec-a",
    "title": "Marginalia VII-A · Pharos Scale Notice",
    "inscription": "“Nebula tactical diagram carries institutional stamp NOT TO SCALE; astronomical distances withheld.”",
    "sourceKind": "editorial-illustration",
    "x": -1.75,
    "z": -1.05
  },
  {
    "worldId": 6,
    "folioId": "f07",
    "id": "f07-sec-b",
    "title": "Marginalia VII-B · Year 121 Outcome",
    "inscription": "“Stalled engagement consumed auxiliary world shipments without breaking the Year 121 stalemate.”",
    "sourceKind": "source-fact",
    "x": 1.75,
    "z": 1.05
  },
  {
    "worldId": 7,
    "folioId": "f08",
    "id": "f08-sec-a",
    "title": "Marginalia VIII-A · Year 170 Breach",
    "inscription": "“Starsilk weaponization established that even The Shard-god was susceptible to structural injury.”",
    "sourceKind": "source-fact",
    "x": -1.8,
    "z": 0.9
  },
  {
    "worldId": 7,
    "folioId": "f08",
    "id": "f08-sec-b",
    "title": "Marginalia VIII-B · Twenty Worlds Lost",
    "inscription": "“Twenty conquered settlements encircled in Blood Rings are indexed as a nongeographic casualty count.”",
    "sourceKind": "source-fact",
    "x": 1.8,
    "z": -0.95
  },
  {
    "worldId": 8,
    "folioId": "f09",
    "id": "f09-sec-a",
    "title": "Marginalia IX-A · Model Star Boundary",
    "inscription": "“The left demonstration star is a nonhistorical model illustrating immediate Starsilk-extraction collapse.”",
    "sourceKind": "demonstration",
    "x": -1.75,
    "z": -1.0
  },
  {
    "worldId": 8,
    "folioId": "f09",
    "id": "f09-sec-b",
    "title": "Marginalia IX-B · Lacrimosa Vessel Note",
    "inscription": "“Archival index preserves Codec’s witness status and names the vessel Lacrimosa without invented dialogue.”",
    "sourceKind": "source-fact",
    "x": 1.8,
    "z": 1.0
  },
  {
    "worldId": 9,
    "folioId": "f10",
    "id": "f10-sec-a",
    "title": "Marginalia X-A · Horizon Appearance",
    "inscription": "“Trillions remained trapped behind the wall; inhabited skies showed only a cold pitch-black streak.”",
    "sourceKind": "source-fact",
    "x": -1.8,
    "z": 1.0
  },
  {
    "worldId": 9,
    "folioId": "f10",
    "id": "f10-sec-b",
    "title": "Marginalia X-B · Protocol Prohibition",
    "inscription": "“Postwar Protocols prohibited study or replication of heliocide triggers across all Administration archives.”",
    "sourceKind": "source-fact",
    "x": 1.75,
    "z": -1.0
  },
  {
    "worldId": 10,
    "folioId": "f11",
    "id": "f11-sec-a",
    "title": "Marginalia XI-A · Nacreous VI Level 3",
    "inscription": "“Living soil exists solely inside the forearm-sized cylinder; planetary ecosystem remains sterile Level 3.”",
    "sourceKind": "source-fact",
    "x": -1.75,
    "z": -0.95
  },
  {
    "worldId": 10,
    "folioId": "f11",
    "id": "f11-sec-b",
    "title": "Marginalia XI-B · Recorded Rebuke",
    "inscription": "Verbatim record: “Your private discomfort with the shape of survival is not a license to revise the settlement.”",
    "sourceKind": "historical-quotation",
    "x": 1.75,
    "z": 0.95
  },
  {
    "worldId": 11,
    "folioId": "f12",
    "id": "f12-sec-a",
    "title": "Marginalia XII-A · Syrin Dead-Switch",
    "inscription": "“Syrin blood rendered Starsilk inert; Syrin 4 was destroyed, leaving Kail as surviving initiate.”",
    "sourceKind": "source-fact",
    "x": -1.8,
    "z": 0.95
  },
  {
    "worldId": 11,
    "folioId": "f12",
    "id": "f12-sec-b",
    "title": "Marginalia XII-B · Administration Imprint",
    "inscription": "“Administration closing formula preserved verbatim: Your fate is in our hands.”",
    "sourceKind": "historical-quotation",
    "x": 1.75,
    "z": -0.95
  }
];

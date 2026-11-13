import { WorldId } from '../types/atlas';

export interface DialogueTurn {
  speaker: 'Aldous' | 'Lyra' | 'Pip';
  voiceName: 'Charon' | 'Kore' | 'Puck';
  style: string;
  text: string;
}

export interface ChapterScript {
  id: WorldId;
  motif: string;
  narrationLines: string[];
  vaultLine: string;
  constellationLine: string;
  portalLine: string;
  vaultDialogue: DialogueTurn[];
}

export const ATLAS_PROLOGUE: string[] = [
  'Before the ink dried, Master Cartographer Aldous bound ten folded realms along a single bronze meridian.',
  'When the binding fractured, his compass shattered into shards scattered across sea, sand, glacier, and sky—and only a turning hand can mend the ring.',
];

export const MERIDIAN_FINALE_DIALOGUE: DialogueTurn[] = [
  {
    speaker: 'Aldous',
    voiceName: 'Charon',
    style: 'Warm, deeply moved elder cartographer in quiet triumph',
    text: 'All three bronze shards are home. Hear how the fourth ring locks into resonance—every harbor, glacier, and sky island answers the same pulse once more.',
  },
  {
    speaker: 'Lyra',
    voiceName: 'Kore',
    style: 'Luminous, awestruck archivist smiling beside the golden beacon',
    text: 'The binding holds, Master Aldous! The meridian light reaches back to Folio One—proof that the paper worlds remember every hand that mended them.',
  },
];

export const CHRONICLE_SCRIPTS: Record<WorldId, ChapterScript> = {
  0: {
    id: 0,
    motif: 'Shard I · The Valley Compass Fragment',
    narrationLines: [
      'Chapter One: The Verdant Kingdom. At first light, Aldous opens his ink-stained journal beside the turning millwheel.',
      'Beneath the mossy western ridge hums the first bronze shard of the broken Meridian Compass, still warm with old starlight.',
      'Beyond the Weir Gate, the silver river widens past the spine crease toward salt wind and open water.',
    ],
    vaultLine:
      'The root vault hinges open—and nestled in damp moss, the first bronze compass shard wakes with a steady golden hum.',
    constellationLine:
      'The Sylvan Crown ignites above the pines, illuminating the water-trail toward the Forgotten Harbor.',
    portalLine:
      'Aldous steps through the Valley Weir Gate as green ridges unfold into sea cliffs.',
    vaultDialogue: [
      {
        speaker: 'Pip',
        voiceName: 'Puck',
        style: 'Breathless, delighted apprentice spotting treasure in the moss',
        text: 'Master Aldous, look beneath the roots! The bronze needle is still humming warm against the parchment.',
      },
      {
        speaker: 'Aldous',
        voiceName: 'Charon',
        style: 'Gentle, knowing elder cartographer',
        text: 'Shard One of Three, Pip. Guard it well—only two more remain in the northern frost and the basalt forge.',
      },
    ],
  },
  1: {
    id: 1,
    motif: 'Bearing II · The Mariner’s Astrolabe',
    narrationLines: [
      'Chapter Two: The Forgotten Harbor. Where freshwater meets salt tide, paper galleons rock beneath the turning Pharos lamp.',
      'In a smugglers’ sea cave below the cliff citadel ticks a brass astrolabe whose needle points not north, but toward dry folded dunes.',
      'Steer across the shoals toward the eastern archway, where harbor waves flatten into parchment sand.',
    ],
    vaultLine:
      'Behind the sea-cave slab lies the salt-crusted astrolabe, its outer ring etched with desert coordinates.',
    constellationLine:
      'The Mariner’s Anchor locks overhead, clearing the reef course toward the Seaward Horizon Gate.',
    portalLine:
      'Crossing the Seaward Horizon Gate, salt spray dries into warm saffron pleats.',
    vaultDialogue: [
      {
        speaker: 'Lyra',
        voiceName: 'Kore',
        style: 'Crisp, intrigued maritime archivist reading brass markings',
        text: 'The sea-cave astrolabe still keeps perfect time, Aldous—and every degree points straight past the eastern dunes.',
      },
      {
        speaker: 'Aldous',
        voiceName: 'Charon',
        style: 'Steady, seasoned navigator',
        text: 'Then set the galleons eastward, Lyra. The river from Chapter One still feeds this bay beneath the folds.',
      },
    ],
  },
  2: {
    id: 2,
    motif: 'Bearing III · The Solar Ephemeris',
    narrationLines: [
      'Chapter Three: The Celestial Desert. Great dunes creased sharp as origami surround an armillary ziggurat humming in the glare.',
      'Aldous bends the mirage aqueduct to cool the sun-baked obelisks, waking the buried crystal cistern beneath the temple.',
      'When the northern phoenix aligns in the dusk sky, the Starlight Sun-Gate opens into eternal winter.',
    ],
    vaultLine:
      'Sandstone plates part over a cool crystal vault, reflecting the freezing timberline miles to the north.',
    constellationLine:
      'The Astral Phoenix catches fire across the desert sky, locking the polar bearing upon the Sun-Gate.',
    portalLine:
      'Solar rings turn through the Sun-Gate, bleaching desert ochre into pale northern frost.',
    vaultDialogue: [
      {
        speaker: 'Lyra',
        voiceName: 'Kore',
        style: 'Wonder-filled tone as starlight refracts in crystal',
        text: 'This underground cistern mirrors a sky of snow—not desert sands. The Sun-Gate really bends north to the glacier.',
      },
      {
        speaker: 'Aldous',
        voiceName: 'Charon',
        style: 'Thoughtful, measured elder tone',
        text: 'Hold your cloak close. Beyond the Starlight Sun-Gate, ink itself turns to hoarfrost.',
      },
    ],
  },
  3: {
    id: 3,
    motif: 'Shard II · The Frozen Bell',
    narrationLines: [
      'Chapter Four: The Frostbound Spire. Here the ink froze inside Aldous’s quill while pale snow wolves patrolled the pass.',
      'High atop the glacier hangs an icebound belfry whose chime holds the second compass shard locked inside solid frost.',
      'Sound the ridge, unfold the crevasse span, and descend through the Boreal Ice-Arch into drowned marble halls.',
    ],
    vaultLine:
      'Permafrost shears away to uncover abyssal steps spiraling down beneath the frozen sea-shelf.',
    constellationLine:
      'Ursa Borealis rings the frozen belfry bell once, cracking the ice shelf wide open.',
    portalLine:
      'Through the Boreal Ice-Arch, crystalline ledges plunge beneath luminous ocean tides.',
    vaultDialogue: [
      {
        speaker: 'Pip',
        voiceName: 'Puck',
        style: 'Excited, shivering apprentice uncovering frost-bound brass',
        text: 'The permafrost cracked clean in half! The second Meridian Shard was sealed inside the glacier all along!',
      },
      {
        speaker: 'Aldous',
        voiceName: 'Charon',
        style: 'Resolute, warm baritone cutting through wind',
        text: 'Two shards recovered, one remaining in the fire beneath the sea. Follow the stairs down toward the Athenaeum.',
      },
    ],
  },
  4: {
    id: 4,
    motif: 'Archive IV · The Copper Schematics',
    narrationLines: [
      'Chapter Five: The Sunken Athenaeum. Beneath the northern glacier sleeps a marble rotunda drowned to guard forbidden charts.',
      'Aldous guides a small brass bathysphere between coral colonnades where manta rays circle unread parchment scrolls.',
      'Inside the sealed scroll vault wait copper forge cylinders pointing downward toward geothermal fire.',
    ],
    vaultLine:
      'Barnacled floor tiles rise cleanly, yielding waterproof copper tubes stamped with the emblem of the Ember Foundry.',
    constellationLine:
      'Bioluminescent kelp-lamps trace the Trench Serpent, illuminating the Abyssal Trench Gate.',
    portalLine:
      'Descending through the Abyssal Trench Gate, cool sea-green stone fractures into hot basalt.',
    vaultDialogue: [
      {
        speaker: 'Lyra',
        voiceName: 'Kore',
        style: 'Scholarly awe inside a quiet underwater hall',
        text: 'Every drowned folio survived inside these copper tubes—even your forge blueprints for tempering the compass ring.',
      },
      {
        speaker: 'Aldous',
        voiceName: 'Charon',
        style: 'Low, reflective storyteller',
        text: 'I sank my own library to keep those blueprints safe. Now let the bathysphere carry them down to the basalt.',
      },
    ],
  },
  5: {
    id: 5,
    motif: 'Shard III · Tempered in Molten Ink',
    narrationLines: [
      'Chapter Six: The Ember Foundry. Liquid amber winds through hexagonal basalt while bellows roar inside the forge mill.',
      'At this roaring crucible, Aldous tempers the cracked compass needles in living fire, binding brass to molten gold.',
      'Every spark rises toward the caldera chimney, where the Thermal Updraft Gate lifts straight into the clouds.',
    ],
    vaultLine:
      'Obsidian shutters slide open over a glowing cache of tempered golden gears forged for flight.',
    constellationLine:
      'Sparks answer the Anvil stars above the caldera, cooling the compass needles to singing tension.',
    portalLine:
      'Riding the Thermal Updraft Gate, heavy basalt folds lightward into open sky.',
    vaultDialogue: [
      {
        speaker: 'Aldous',
        voiceName: 'Charon',
        style: 'Commanding craftsman over forge embers',
        text: 'There lies Shard Three, cooled in living amber—even the northern glacier four chapters back will feel this foundry’s warmth.',
      },
      {
        speaker: 'Pip',
        voiceName: 'Puck',
        style: 'Amazed apprentice watching sparks rise skyward',
        text: 'The gears weigh almost nothing now! Look how the updraft pulls our parchment straight toward the clouds!',
      },
    ],
  },
  6: {
    id: 6,
    motif: 'Bearing V · The Trade-Wind Mainspring',
    narrationLines: [
      'Chapter Seven: The Clockwork Sky. Great paper windmills turn in steady trade winds, anchoring floating islands above the clouds.',
      'Aldous moors a canvas dirigible beside the spire, discovering that these sails wind the hidden mainspring of the entire atlas.',
      'Below the cloud deck, braided sky-roots hang into a silent twilight hollow where forgotten drafts bloom.',
    ],
    vaultLine:
      'Inside the cloud-core hatch, coiled sky-roots unspool straight down through the overcast mist.',
    constellationLine:
      'Trade winds steady along the Sky Loom, balancing the airship for its descent through the clouds.',
    portalLine:
      'Stepping through the Cloud-Anchor Gate, wind-swept islands curl down into indigo twilight.',
    vaultDialogue: [
      {
        speaker: 'Lyra',
        voiceName: 'Kore',
        style: 'Bright, wind-swept curiosity',
        text: 'Every sail up here drives the wind across the Harbor behind us—and look beneath the cloud hatch, braided roots descend into indigo.',
      },
      {
        speaker: 'Aldous',
        voiceName: 'Charon',
        style: 'Calm elder storyteller',
        text: 'The Whispering Mycelium catches every thought that ever blew off this deck. Climb down softly, Lyra.',
      },
    ],
  },
  7: {
    id: 7,
    motif: 'Memory VI · Roots of Erased Drafts',
    narrationLines: [
      'Chapter Eight: The Whispering Mycelium. Every crossed-out line Aldous ever abandoned took root here as glowing pleated fungi.',
      'Lantern moths drift across a quiet ink brook toward the Heartwood Crypt, where early sketches breathe in velvet shadow.',
      'Beyond the crypt’s obsidian mirror, twilight spores crystallize into sunlit silver lagoons.',
    ],
    vaultLine:
      'Violet roots unweave to reveal the Cartographer’s earliest margin vow—never to leave a traveler stranded between pages.',
    constellationLine:
      'Lantern moths trace the Spore Weaver overhead, waking the Heartwood Mirror Arch.',
    portalLine:
      'Through the Heartwood Mirror Arch, glowing spores sharpen into crystal reflections.',
    vaultDialogue: [
      {
        speaker: 'Lyra',
        voiceName: 'Kore',
        style: 'Hushed, tender discovery in twilight shadow',
        text: 'You wrote a vow in the root-crypt before closing the book: never to let a reader lose their way between torn folios.',
      },
      {
        speaker: 'Aldous',
        voiceName: 'Charon',
        style: 'Warm, confessional cadence',
        text: 'A map is only half ink, Lyra. The other half is keeping faith across the fold.',
      },
    ],
  },
  8: {
    id: 8,
    motif: 'Revelation · Mirrors of the Nine Realms',
    narrationLines: [
      'Chapter Nine: The Glass Archipelago. Translucent lagoons mirror every valley, harbor, dune, and forge already crossed.',
      'Here Aldous understands the secret of Palimpsest: ink does not merely record worlds—it remembers every bridge you unfolded and every tree you planted.',
      'Eight refracted beams converge toward the Refraction Crown Gate, awaiting the final turning.',
    ],
    vaultLine:
      'Mirrored alabaster slabs fold apart, aiming a prismatic beam directly at the final chapter.',
    constellationLine:
      'Every crystal spire rings in tune with the Specular Crown, uniting all eight bearings.',
    portalLine:
      'Following the golden beam through the Refraction Crown Gate, the final sanctum unfolds.',
    vaultDialogue: [
      {
        speaker: 'Pip',
        voiceName: 'Puck',
        style: 'Stunned wonder gazing into mirror water',
        text: 'Look into the lagoon! Every pine and crystal sapling we planted across the earlier chapters is blooming here in glass!',
      },
      {
        speaker: 'Aldous',
        voiceName: 'Charon',
        style: 'Reverent certainty',
        text: 'Palimpsest forgets nothing. Step through the Refraction Crown Gate—the Meridian Heart waits on the tenth page.',
      },
    ],
  },
  9: {
    id: 9,
    motif: 'The Restored Meridian · Final Binding',
    narrationLines: [
      'Chapter Ten: The Meridian Heart. Around the Grand Quad-Ring Astrolabe, every scattered thread locks back into place.',
      'With the three compass shards tempered and whole, the ancient folio breathes as one continuous living world.',
      'Yet the Unbound Meridian Gate turns onward still—back to dawn over the Verdant Kingdom, ready for new rivers and new stars.',
    ],
    vaultLine:
      'The gilded mandala opens around the restored Meridian Heart, bathing the entire atelier in steady amber light.',
    constellationLine:
      'All ten constellations resonate together—the Impossible Living Atlas is whole once more.',
    portalLine:
      'Passing through the Unbound Meridian Gate, the golden rings unwind back into dawn over Chapter One.',
    vaultDialogue: [
      {
        speaker: 'Lyra',
        voiceName: 'Kore',
        style: 'Hushed, triumphant archival cadence',
        text: 'The mandala chambers are unlocked at last—only the central Astrolabe awaits the three shards to mend the Heart.',
      },
      {
        speaker: 'Aldous',
        voiceName: 'Charon',
        style: 'Deep, luminous warmth',
        text: 'Set the shards into the brass cradle whenever you are ready, companion.',
      },
    ],
  },
};

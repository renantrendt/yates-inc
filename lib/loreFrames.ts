// Story frames for LORE mode
// Each frame has text and associated visuals

export interface LoreFrame {
    id: number;
    text: string;
    image: string; // Path to image in /public
    imageScale?: number; // Optional scale multiplier
    section: 'intro' | 'first-war' | 'second-fight';
}

export const loreFrames: LoreFrame[] = [
    // INTRODUCTION SECTION
    {
        id: 1,
        section: 'intro',
        text: 'The United Yates of America (UYA) was created when Yates, a being of immense power, used his strength to forge a nation.',
        image: '/locations/uya-island.png',
    },
    {
        id: 2,
        section: 'intro',
        text: 'Around the same time, Walters, a speedster semi-god, established his own advanced territory: Walters Land.',
        image: '/locations/walters-island.png',
    },
    {
        id: 3,
        section: 'intro',
        text: 'Yates is a colossal tank. He stands 8\'6" tall, a bald bodybuilder with a white goatee and immense physical strength.',
        image: '/story/yates-story.png',
    },
    {
        id: 4,
        section: 'intro',
        text: 'Walters is a master of speed. He has a lean, shredded athletic build, bald with a grey goatee, and wears his signature Red Ironman Triathlon shirt.',
        image: '/story/walters-story.png',
    },
    {
        id: 5,
        section: 'intro',
        text: 'Kato is Walters\' right hand. A master of durability and time, he can summon shadow versions of those he has coached.',
        image: '/story/kato-story.png',
    },

    // FIRST WAR SECTION
    {
        id: 10,
        section: 'first-war',
        text: 'The conflict began when Yates and Walters met at a worldwide summit and argued over whose island was superior.',
        image: '/fights/yatesVSwalters.png',
    },
    {
        id: 11,
        section: 'first-war',
        text: 'The argument escalated into violence in the Clash Royale Sea, a chaotic ocean of toxic waters and hazards.',
        image: '/locations/clash-sea.png', // Using faceoff as environment setup
    },
    {
        id: 12,
        section: 'first-war',
        text: 'Omega Yates launched a massive fireball with the power of two nukes!',
        image: '/fights/fight_fireball.png',
    },
    {
        id: 13,
        section: 'first-war',
        text: 'Walters dodged mid-air with a side-flip and fired a concentrated red energy beam!',
        image: '/fights/fight_laser_dodge.png',
    },
    {
        id: 14,
        section: 'first-war',
        text: 'Yates deflected the laser using his Abs Shield, his muscles gleaming with a metallic golden sheen!',
        image: '/fights/fight_abs_shield.png',
    },
    {
        id: 15,
        section: 'first-war',
        text: 'They locked in, unleashing their Domain Expansions! Fire clashed with Ultrasonic Soundwaves.',
        image: '/locations/y&w-domain.png',
    },
    {
        id: 16,
        section: 'first-war',
        text: 'Just as they were about to collide, Kato intervened! He trapped Yates in a time-stop bubble and rescued Walters.',
        image: '/story/kato-story.png', // Fallback until specific rescue image is made
    },

    // SECOND FIGHT SECTION
    {
        id: 20,
        section: 'second-fight',
        text: 'Later, Yates hunted Walters down. Catching him off guard, he broke Walters\' right arm with a critical hit.',
        image: '/story/yates-story.png',
    },
    {
        id: 21,
        section: 'second-fight',
        text: 'Walters activated "Iron Swift", moving so fast he created after-images, striking Yates with an Ultrasonic Combo!',
        image: '/fights/w-atacking.png', // Using attacking image
    },
    {
        id: 22,
        section: 'second-fight',
        text: 'Yates, critically injured, attempted to use his Ultimate Muscle form, but was overpowered by Walters\' speed.',
        image: '/fights/w-atacking.png',
    },
    {
        id: 23,
        section: 'second-fight',
        text: 'Desperate, Yates used his secret technique "Super Power x2", entering an Enraged Form with glowing red eyes!',
        image: '/fights/yPunchW.png', // Using punch image as enraged/attack
    },
    {
        id: 24,
        section: 'second-fight',
        text: 'He landed a devastating combo, knocking Walters unconscious.',
        image: '/fights/yPunchW.png',
    },
    {
        id: 25,
        section: 'second-fight',
        text: 'Suddenly, Kato burst from the ground with a Shoryuken Uppercut, catching Yates completely by surprise!',
        image: '/story/kato-story.png', // Fallback
    },
    {
        id: 26,
        section: 'second-fight',
        text: 'Kato summoned his Shadow Army to swarm the enraged Yates.',
        image: '/locations/shadow-army.png',
    },
    {
        id: 27,
        section: 'second-fight',
        text: 'Using his "Greatest Ever" technique, Kato paused time, put Yates to sleep, and teleported everyone to safety.',
        image: '/story/kato-story.png',
    },
    {
        id: 28,
        section: 'second-fight',
        text: 'Walters recovered in a futuristic medical tank on his island.',
        image: '/locations/walters-island.png', // Fallback
    },
    {
        id: 29,
        section: 'second-fight',
        text: 'Yates was healed by tribal healers in a primitive hut on UYA Island.',
        image: '/locations/uya-island.png', // Fallback
    },
];

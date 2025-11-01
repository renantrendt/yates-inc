import { Product } from '@/types';

export const products: Product[] = [
  {
    id: 1,
    name: 'Customizable Photoshops (CPS)',
    price: 'Custom',
    priceFloat: 0,
    image: '/Supper yates.png',
    images: ['/Supper yates.png', '/msG.png', '/yatesdollars.png'],
    isCustom: true,
    hasAddToCart: false,
  },
  {
    id: 2,
    name: 'Glass Table',
    price: '$50.13',
    priceFloat: 50.13,
    hoverText: 'requires assembly',
    image: '/unnamed.jpg',
    hasAddToCart: true,
  },
  {
    id: 3,
    name: 'Watering Can',
    price: '$15.10',
    priceFloat: 15.10,
    hoverText: 'per pound you weigh',
    image: '/wateringcan.png',
    hasAddToCart: true,
  },
  {
    id: 4,
    name: 'Silverware',
    price: '$30.23',
    priceFloat: 30.23,
    hoverText: 'per meal you ever eaten',
    image: '/silverware.jpg',
    hasAddToCart: true,
  },
  {
    id: 5,
    name: 'Rolling Pin',
    price: '$43.76',
    priceFloat: 43.76,
    hoverText: 'per time you have baked something',
    image: '/rp.png',
    hasAddToCart: true,
  },
  {
    id: 6,
    name: 'Custom Key',
    price: '$27.97',
    priceFloat: 27.97,
    hoverText: 'per time you use a key',
    image: '/ck.png',
    hasAddToCart: true,
  },
  {
    id: 7,
    name: 'Fancy Flippers',
    price: '$41.99',
    priceFloat: 41.99,
    hoverText: 'per time you touch or drink water',
    image: '/flipper.jpg',
    hasAddToCart: true,
  },
  {
    id: 8,
    name: 'Toilet アトマティックシートウォーマー',
    price: '$399.99',
    priceFloat: 399.99,
    hoverText: 'per time you go to the bathroom',
    image: '/taw.jpg',
    hasAddToCart: true,
  },
  {
    id: 9,
    name: 'Touilotu Papu',
    price: '$12.89',
    priceFloat: 12.89,
    hoverText: 'per inch of paper you use from the time you buyed this',
    image: '/tp.jpg',
    hasAddToCart: true,
  },
  {
    id: 10,
    name: 'Very Safe Door',
    price: '$89.99',
    priceFloat: 89.99,
    hoverText: 'per time you use a door',
    image: '/door.png',
    hasAddToCart: true,
  },
];

export const employees = [
  {
    id: '000001',
    name: 'Logan Wall Fencer',
    role: 'CEO',
    bio: 'Logan, is the CEO and founder of Yates Inc. He has spend a lot of time and effort, making this the greatest company he could every think of.',
  },
  {
    id: '39187',
    name: 'Mr. Michael Mackenzy McKale Mackelayne',
    role: 'CPS/HR',
    bio: 'Michael, is who does everything of our designs, and how things will work, he also is our Human Rights manager. Michael also is one of our 2 first hires, together with Bernardo. Michael is very hard working and is able to accomplish multiple Ps, a day, he one made 60% of our daily revenue, doing 21 Ps, and 2 30minute long videos to 5M+ subs channels.',
    anchor: 'MMMM',
  },
  {
    id: '392318',
    name: 'Bernardo',
    role: 'CTO/CFO/LW',
    bio: "Bernardo works in three areas. First, he's our Chief Technology Officer handling all tech and development. Second, he's our Chief Financial Officer managing all the money coming in and out. Finally, he's the company's Lawyer, negotiating partnerships and deals with other companies.",
  },
  {
    id: '007411',
    name: 'Dylan Mad Hawk',
    role: 'PSM',
    bio: "Dylan is our latest hire, but he is very hard working, he handles everything of managing the resources and putting them into our products, with the requirements made from the other companies/MMM's design.",
  },
  {
    id: '674121',
    name: 'Herris',
    role: 'SCM',
    bio: "Herris is our newest hire and Supply Chain Manager. While he has some basic coding skills, his real strength is managing the supply chain and logistics. He handles all our partnerships, vendor relationships, and ensures resources flow smoothly to keep operations running.",
  },
];

export function calculateDeliveryTime(numProducts: number): string {
  const days = 1 + (numProducts - 1) * 2;
  
  if (days > 30) {
    return '1 Month';
  } else {
    return `${days} days`;
  }
}


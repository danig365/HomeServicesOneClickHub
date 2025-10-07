import { Service } from '@/types/service';

export const services: Service[] = [
  {
    id: '1',
    name: 'Annual Carpet Cleaning',
    category: 'Cleaning',
    price: 299,
    frequency: 'annual',
    description: 'Professional deep carpet cleaning for your entire home. Removes stains, odors, and allergens.',
    icon: 'Sparkles',
    popular: true,
    estimatedDuration: '2-3 hours',
    included: ['All carpeted areas', 'Stain pre-treatment', 'Deodorizing', 'Quick-dry technology'],
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'
  },
  {
    id: '2',
    name: 'Home Cleaning Services',
    category: 'Cleaning',
    price: 149,
    frequency: 'monthly',
    description: 'Regular home cleaning service to keep your space spotless and healthy.',
    icon: 'Home',
    popular: true,
    estimatedDuration: '2-4 hours',
    included: ['All rooms', 'Kitchen deep clean', 'Bathroom sanitization', 'Floor mopping'],
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800'
  },
  {
    id: '3',
    name: 'Landscaping & Lawn Care',
    category: 'Outdoor',
    price: 89,
    frequency: 'monthly',
    description: 'Complete lawn maintenance including mowing, edging, and seasonal care.',
    icon: 'Trees',
    popular: true,
    estimatedDuration: '1-2 hours',
    included: ['Lawn mowing', 'Edge trimming', 'Leaf removal', 'Fertilization'],
    image: 'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=800'
  },
  {
    id: '4',
    name: 'Gas Fireplace Tune Up',
    category: 'HVAC',
    price: 179,
    frequency: 'annual',
    description: 'Annual inspection and maintenance of your gas fireplace for safety and efficiency.',
    icon: 'Flame',
    requiresLicense: true,
    estimatedDuration: '1 hour',
    included: ['Safety inspection', 'Cleaning', 'Pilot light check', 'Gas leak detection'],
    image: 'https://images.unsplash.com/photo-1543649877-38ec8298badb?w=800'
  },
  {
    id: '5',
    name: 'Chimney Cleaning',
    category: 'Maintenance',
    price: 249,
    frequency: 'annual',
    description: 'Professional chimney sweep and inspection to prevent fires and improve air quality.',
    icon: 'Home',
    estimatedDuration: '1-2 hours',
    included: ['Full chimney sweep', 'Safety inspection', 'Creosote removal', 'Damper check'],
    image: 'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=800'
  },
  {
    id: '6',
    name: 'Snow Removal',
    category: 'Seasonal',
    price: 399,
    frequency: 'annual',
    description: 'Season-long snow removal service for driveways and walkways.',
    icon: 'Snowflake',
    estimatedDuration: 'Per event',
    included: ['Driveway clearing', 'Walkway clearing', 'Salt application', 'Priority service'],
    image: 'https://images.unsplash.com/photo-1547754980-3c27537a30f0?w=800'
  },
  {
    id: '7',
    name: 'Pool & Hot Tub Services',
    category: 'Outdoor',
    price: 129,
    frequency: 'monthly',
    description: 'Regular maintenance to keep your pool and hot tub clean and safe.',
    icon: 'Waves',
    estimatedDuration: '1-2 hours',
    included: ['Chemical balancing', 'Filter cleaning', 'Skimming', 'Equipment check'],
    image: 'https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=800'
  },
  {
    id: '8',
    name: 'Holiday Lighting',
    category: 'Seasonal',
    price: 499,
    frequency: 'annual',
    description: 'Professional holiday light installation and removal service.',
    icon: 'Lightbulb',
    popular: true,
    estimatedDuration: '3-4 hours',
    included: ['Design consultation', 'Light installation', 'Season-end removal', 'Storage'],
    image: 'https://images.unsplash.com/photo-1543934638-bd2e138430c4?w=800'
  },
  {
    id: '9',
    name: 'Pond Maintenance',
    category: 'Outdoor',
    price: 199,
    frequency: 'monthly',
    description: 'Keep your pond healthy and beautiful with regular professional care.',
    icon: 'Fish',
    estimatedDuration: '1-2 hours',
    included: ['Water testing', 'Algae control', 'Filter cleaning', 'Fish health check'],
    image: 'https://images.unsplash.com/photo-1564078516393-cf04bd966897?w=800'
  },
  {
    id: '10',
    name: 'Power Washing',
    category: 'Cleaning',
    price: 349,
    frequency: 'annual',
    description: 'High-pressure cleaning for decks, driveways, siding, and more.',
    icon: 'Droplets',
    estimatedDuration: '2-3 hours',
    included: ['Driveway', 'Deck/Patio', 'Siding', 'Walkways'],
    image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800'
  },
  {
    id: '11',
    name: 'Major Repair Coordination',
    category: 'Maintenance',
    price: 99,
    frequency: 'one-time',
    description: 'We coordinate and oversee major home repairs with trusted contractors.',
    icon: 'Wrench',
    estimatedDuration: 'Varies',
    included: ['Contractor vetting', 'Quote comparison', 'Project oversight', 'Quality assurance'],
    image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800'
  },
  {
    id: '12',
    name: 'Window Washing',
    category: 'Cleaning',
    price: 189,
    frequency: 'quarterly',
    description: 'Crystal clear windows inside and out, including screens and sills.',
    icon: 'Square',
    estimatedDuration: '2-3 hours',
    included: ['Interior windows', 'Exterior windows', 'Screen cleaning', 'Sill cleaning'],
    image: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=800'
  },
  {
    id: '13',
    name: 'Garbage Can Cleaning',
    category: 'Cleaning',
    price: 39,
    frequency: 'monthly',
    description: 'Sanitize and deodorize your outdoor garbage and recycling bins.',
    icon: 'Trash2',
    estimatedDuration: '30 minutes',
    included: ['Hot water wash', 'Disinfection', 'Deodorizing', 'All bins included'],
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'
  },
  {
    id: '14',
    name: 'Duct Cleaning',
    category: 'HVAC',
    price: 399,
    frequency: 'bi-annual',
    description: 'Improve air quality and HVAC efficiency with professional duct cleaning.',
    icon: 'Wind',
    estimatedDuration: '3-4 hours',
    included: ['All vents', 'Main trunk lines', 'Return air ducts', 'Sanitization'],
    image: 'https://images.unsplash.com/photo-1635048424329-a9bfb146d7aa?w=800'
  },
  {
    id: '15',
    name: 'HVAC Tune-Up',
    category: 'HVAC',
    price: 149,
    frequency: 'bi-annual',
    description: 'Bi-annual HVAC maintenance to ensure efficiency and prevent breakdowns.',
    icon: 'Thermometer',
    requiresLicense: true,
    estimatedDuration: '1-2 hours',
    included: ['Filter replacement', 'Coil cleaning', 'Refrigerant check', 'System optimization'],
    image: 'https://images.unsplash.com/photo-1635048424329-a9bfb146d7aa?w=800'
  }
];

export const categories = [
  { name: 'All', icon: 'Grid3x3' },
  { name: 'Cleaning', icon: 'Sparkles' },
  { name: 'Outdoor', icon: 'Trees' },
  { name: 'HVAC', icon: 'Wind' },
  { name: 'Maintenance', icon: 'Wrench' },
  { name: 'Seasonal', icon: 'Calendar' }
];
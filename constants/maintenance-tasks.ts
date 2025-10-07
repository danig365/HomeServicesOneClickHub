import { MonthlyMaintenanceTask } from '@/types/subscription';

export const getMonthlyTasks = (month: number): Omit<MonthlyMaintenanceTask, 'id' | 'completed'>[] => {
  const standardTasks: Omit<MonthlyMaintenanceTask, 'id' | 'completed'>[] = [
    {
      name: 'HVAC Filter Check',
      description: 'Inspect and replace HVAC filters if needed',
      category: 'standard',
      month,
      estimatedDuration: '15 minutes',
    },
    {
      name: 'Plumbing Inspection',
      description: 'Check for leaks, drips, and water pressure issues',
      category: 'standard',
      month,
      estimatedDuration: '30 minutes',
    },
    {
      name: 'Safety Device Test',
      description: 'Test smoke detectors, CO detectors, and fire extinguishers',
      category: 'standard',
      month,
      estimatedDuration: '20 minutes',
    },
    {
      name: 'Exterior Walkthrough',
      description: 'Inspect exterior for damage, wear, or maintenance needs',
      category: 'standard',
      month,
      estimatedDuration: '30 minutes',
    },
  ];

  const seasonalTasks: Record<number, Omit<MonthlyMaintenanceTask, 'id' | 'completed'>[]> = {
    1: [
      {
        name: 'Winter Weather Prep Check',
        description: 'Inspect heating system, check for ice dams, ensure proper insulation',
        category: 'seasonal',
        month: 1,
        estimatedDuration: '45 minutes',
      },
      {
        name: 'Indoor Air Quality',
        description: 'Check humidity levels and ventilation during winter months',
        category: 'seasonal',
        month: 1,
        estimatedDuration: '20 minutes',
      },
    ],
    2: [
      {
        name: 'Roof & Gutter Inspection',
        description: 'Check for winter damage and ice buildup',
        category: 'seasonal',
        month: 2,
        estimatedDuration: '30 minutes',
      },
    ],
    3: [
      {
        name: 'Spring Preparation',
        description: 'Prepare outdoor systems, check irrigation, inspect deck/patio',
        category: 'seasonal',
        month: 3,
        estimatedDuration: '1 hour',
      },
      {
        name: 'Window & Door Seals',
        description: 'Inspect and repair weather stripping',
        category: 'seasonal',
        month: 3,
        estimatedDuration: '30 minutes',
      },
    ],
    4: [
      {
        name: 'Lawn & Garden Startup',
        description: 'Assess lawn health, prepare garden beds, check sprinkler system',
        category: 'seasonal',
        month: 4,
        estimatedDuration: '45 minutes',
      },
      {
        name: 'AC System Check',
        description: 'Test and prepare air conditioning for summer',
        category: 'seasonal',
        month: 4,
        estimatedDuration: '30 minutes',
      },
    ],
    5: [
      {
        name: 'Outdoor Living Spaces',
        description: 'Inspect and clean deck, patio, outdoor furniture',
        category: 'seasonal',
        month: 5,
        estimatedDuration: '1 hour',
      },
    ],
    6: [
      {
        name: 'Summer Cooling Efficiency',
        description: 'Optimize AC performance, check insulation, inspect attic ventilation',
        category: 'seasonal',
        month: 6,
        estimatedDuration: '45 minutes',
      },
    ],
    7: [
      {
        name: 'Pest Prevention',
        description: 'Inspect for pest entry points and signs of infestation',
        category: 'seasonal',
        month: 7,
        estimatedDuration: '30 minutes',
      },
    ],
    8: [
      {
        name: 'Drainage & Grading',
        description: 'Check property drainage before fall rains',
        category: 'seasonal',
        month: 8,
        estimatedDuration: '30 minutes',
      },
    ],
    9: [
      {
        name: 'Fall Preparation',
        description: 'Prepare heating system, clean gutters, inspect chimney',
        category: 'seasonal',
        month: 9,
        estimatedDuration: '1 hour',
      },
      {
        name: 'Weatherproofing',
        description: 'Seal gaps, check insulation, prepare for cold weather',
        category: 'seasonal',
        month: 9,
        estimatedDuration: '45 minutes',
      },
    ],
    10: [
      {
        name: 'Heating System Tune-Up',
        description: 'Full inspection and maintenance of heating system',
        category: 'seasonal',
        month: 10,
        estimatedDuration: '1 hour',
      },
    ],
    11: [
      {
        name: 'Winter Prep Final Check',
        description: 'Winterize outdoor faucets, check insulation, prepare for freezing temps',
        category: 'seasonal',
        month: 11,
        estimatedDuration: '45 minutes',
      },
    ],
    12: [
      {
        name: 'Holiday Safety Check',
        description: 'Inspect holiday lighting, check fire safety with decorations',
        category: 'seasonal',
        month: 12,
        estimatedDuration: '30 minutes',
      },
      {
        name: 'Year-End Review',
        description: 'Review annual maintenance, plan for next year',
        category: 'seasonal',
        month: 12,
        estimatedDuration: '30 minutes',
      },
    ],
  };

  return [...standardTasks, ...(seasonalTasks[month] || [])];
};

export const blueprintQuestions = [
  {
    id: 'goals',
    question: 'What are your top 5-year home improvement goals?',
    type: 'multiline',
    placeholder: 'e.g., Kitchen remodel, new deck, energy efficiency upgrades...',
  },
  {
    id: 'priorities',
    question: 'Which areas need the most attention?',
    type: 'checklist',
    options: [
      'Kitchen',
      'Bathrooms',
      'Outdoor Spaces',
      'HVAC System',
      'Roof',
      'Windows & Doors',
      'Flooring',
      'Landscaping',
      'Energy Efficiency',
      'Smart Home',
    ],
  },
  {
    id: 'budget',
    question: 'What is your annual home improvement budget?',
    type: 'select',
    options: [
      'Under $5,000',
      '$5,000 - $15,000',
      '$15,000 - $30,000',
      '$30,000 - $50,000',
      'Over $50,000',
    ],
  },
  {
    id: 'timeline',
    question: 'When would you like to start major projects?',
    type: 'select',
    options: [
      'Within 3 months',
      '3-6 months',
      '6-12 months',
      '1-2 years',
      '2+ years',
    ],
  },
  {
    id: 'custom',
    question: 'Any specific requests or concerns for your Hudson visits?',
    type: 'multiline',
    placeholder: 'e.g., Check specific areas, focus on preventive maintenance...',
  },
];

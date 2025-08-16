export interface ContentCategory {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  searchTerms: string[];
}

export interface AgeGroupConfig {
  ageRange: string;
  minAge: number;
  maxAge: number;
  groupName: string;
  contentTypes: string[];
  educationalTopics: string[];
  skillFocus: string[];
  categories: ContentCategory[];
}

export const GROWTH_BASED_CATEGORIES: AgeGroupConfig[] = [
  {
    ageRange: "2-3",
    minAge: 2,
    maxAge: 3,
    groupName: "Toddler",
    contentTypes: ["Songs & Rhymes", "Animated Shorts", "Parent-Child Co-watch"],
    educationalTopics: ["Language & Reading", "Social & Emotional Learning"],
    skillFocus: ["Observation", "Communication", "Empathy"],
    categories: [
      {
        id: "nursery-rhymes",
        name: "Nursery Rhymes",
        description: "Classic songs and rhymes for toddlers",
        keywords: ["nursery rhyme", "toddler songs", "baby songs", "children's music"],
        searchTerms: ["nursery rhymes for toddlers", "baby songs", "children songs 2-3 years", "toddler music"]
      },
      {
        id: "animated-stories",
        name: "Animated Stories",
        description: "Simple animated stories with basic concepts",
        keywords: ["animated story", "cartoon", "simple animation", "toddler cartoon"],
        searchTerms: ["animated stories toddlers", "simple cartoons", "toddler animations", "preschool cartoons"]
      },
      {
        id: "colors-shapes",
        name: "Colors & Shapes",
        description: "Learning basic colors and shapes",
        keywords: ["colors", "shapes", "basic learning", "toddler education"],
        searchTerms: ["colors for toddlers", "shapes learning", "basic colors shapes", "toddler education colors"]
      },
      {
        id: "family-time",
        name: "Family Activities",
        description: "Content for parent-child interaction",
        keywords: ["family time", "parent child", "together time", "bonding"],
        searchTerms: ["family activities toddlers", "parent child activities", "toddler family time"]
      }
    ]
  },
  {
    ageRange: "4-5",
    minAge: 4,
    maxAge: 5,
    groupName: "Preschool",
    contentTypes: ["Story Reading", "Explainer Clips", "Live-action Learning"],
    educationalTopics: ["Math & Logic", "Culture & Geography"],
    skillFocus: ["Fine Motor", "Reasoning", "Focus & Attention"],
    categories: [
      {
        id: "story-reading",
        name: "Story Time",
        description: "Interactive story reading and storytelling",
        keywords: ["story reading", "storytelling", "picture books", "read aloud"],
        searchTerms: ["story time preschool", "read aloud books", "children's stories 4-5", "interactive storytelling"]
      },
      {
        id: "early-math",
        name: "Early Math",
        description: "Basic counting, numbers, and simple math concepts",
        keywords: ["counting", "numbers", "basic math", "preschool math"],
        searchTerms: ["counting for preschoolers", "numbers 1-10", "early math skills", "preschool mathematics"]
      },
      {
        id: "world-cultures",
        name: "World & Cultures",
        description: "Introduction to different cultures and places",
        keywords: ["culture", "geography", "world", "countries", "traditions"],
        searchTerms: ["cultures for kids", "geography preschool", "world cultures children", "countries for kids"]
      },
      {
        id: "fine-motor",
        name: "Hands-On Activities",
        description: "Activities to develop fine motor skills",
        keywords: ["fine motor", "craft", "drawing", "building", "hands-on"],
        searchTerms: ["fine motor activities", "preschool crafts", "drawing for kids", "building activities"]
      }
    ]
  },
  {
    ageRange: "6-7",
    minAge: 6,
    maxAge: 7,
    groupName: "Early School",
    contentTypes: ["Science Demos", "Play-along Challenge", "Dance-along / Movement"],
    educationalTopics: ["Nature & Science", "Art & Expression"],
    skillFocus: ["Problem Solving", "Creativity", "Collaboration"],
    categories: [
      {
        id: "science-experiments",
        name: "Science Experiments",
        description: "Simple, safe science demonstrations and experiments",
        keywords: ["science experiment", "demo", "STEM", "discovery", "exploration"],
        searchTerms: ["science experiments kids", "simple science demos", "STEM activities 6-7", "kids science projects"]
      },
      {
        id: "nature-discovery",
        name: "Nature Discovery",
        description: "Exploring the natural world and wildlife",
        keywords: ["nature", "animals", "plants", "wildlife", "environment"],
        searchTerms: ["nature for kids", "animal documentaries children", "plants and animals", "wildlife exploration kids"]
      },
      {
        id: "creative-arts",
        name: "Creative Arts",
        description: "Art, music, and creative expression activities",
        keywords: ["art", "creativity", "music", "drawing", "painting", "craft"],
        searchTerms: ["art activities kids", "creative projects children", "music for kids 6-7", "drawing tutorials kids"]
      },
      {
        id: "movement-dance",
        name: "Movement & Dance",
        description: "Physical activities, dance, and movement games",
        keywords: ["dance", "movement", "exercise", "physical activity", "coordination"],
        searchTerms: ["dance for kids", "movement activities children", "kids exercise", "dance along videos"]
      }
    ]
  },
  {
    ageRange: "8-9",
    minAge: 8,
    maxAge: 9,
    groupName: "Middle Childhood",
    contentTypes: ["Learning Series / Curriculum", "Documentary / Exploration", "Interactive Story Format"],
    educationalTopics: ["Technology & Digital Literacy", "Environment & Sustainability"],
    skillFocus: ["Self-Regulation", "Decision Making", "Curiosity"],
    categories: [
      {
        id: "documentary-exploration",
        name: "Documentary & Exploration",
        description: "Educational documentaries and exploration content",
        keywords: ["documentary", "exploration", "discovery", "learning", "educational series"],
        searchTerms: ["documentaries for kids", "educational exploration", "discovery videos children", "learning documentaries 8-9"]
      },
      {
        id: "technology-digital",
        name: "Technology & Digital Skills",
        description: "Introduction to technology and digital literacy",
        keywords: ["technology", "digital", "coding", "computer", "programming"],
        searchTerms: ["technology for kids", "digital literacy children", "coding for kids", "computer skills children"]
      },
      {
        id: "environment-sustainability",
        name: "Environment & Sustainability",
        description: "Environmental awareness and sustainability concepts",
        keywords: ["environment", "sustainability", "ecology", "green", "conservation"],
        searchTerms: ["environment for kids", "sustainability children", "ecology education", "environmental awareness kids"]
      },
      {
        id: "problem-solving",
        name: "Problem Solving",
        description: "Logic puzzles, critical thinking, and problem-solving activities",
        keywords: ["problem solving", "logic", "puzzle", "critical thinking", "reasoning"],
        searchTerms: ["problem solving kids", "logic puzzles children", "critical thinking activities", "reasoning games kids"]
      }
    ]
  },
  {
    ageRange: "10-12",
    minAge: 10,
    maxAge: 12,
    groupName: "Pre-Teens",
    contentTypes: ["AI-Companion Content", "Bilingual / Multilingual Learning", "Career Exploration"],
    educationalTopics: ["Life & Growth Awareness", "Career Exploration"],
    skillFocus: ["Critical Thinking", "Leadership", "Independence"],
    categories: [
      {
        id: "career-exploration",
        name: "Career Exploration",
        description: "Introduction to various careers and professions",
        keywords: ["career", "job", "profession", "work", "future", "occupation"],
        searchTerms: ["careers for kids", "jobs exploration children", "what do you want to be", "professions for kids"]
      },
      {
        id: "life-skills",
        name: "Life Skills & Growth",
        description: "Personal development and life awareness content",
        keywords: ["life skills", "personal development", "growth", "responsibility", "independence"],
        searchTerms: ["life skills kids", "personal development children", "growing up", "responsibility for kids"]
      },
      {
        id: "advanced-learning",
        name: "Advanced Learning",
        description: "More complex educational content and series",
        keywords: ["advanced", "complex", "curriculum", "academic", "educational series"],
        searchTerms: ["advanced learning kids", "educational series tweens", "complex topics children", "academic content kids"]
      },
      {
        id: "leadership-thinking",
        name: "Leadership & Critical Thinking",
        description: "Developing leadership skills and critical thinking abilities",
        keywords: ["leadership", "critical thinking", "decision making", "teamwork", "independence"],
        searchTerms: ["leadership for kids", "critical thinking children", "decision making skills kids", "teamwork activities"]
      },
      {
        id: "multilingual-learning",
        name: "Language Learning",
        description: "Bilingual and multilingual educational content",
        keywords: ["language", "bilingual", "multilingual", "foreign language", "communication"],
        searchTerms: ["language learning kids", "bilingual content children", "foreign languages for kids", "multilingual education"]
      }
    ]
  }
];

export function getAgeGroupForChild(birthday: Date | string): AgeGroupConfig {
  const age = calculateAge(birthday);
  
  return GROWTH_BASED_CATEGORIES.find(group => 
    age >= group.minAge && age <= group.maxAge
  ) || GROWTH_BASED_CATEGORIES[GROWTH_BASED_CATEGORIES.length - 1]; // Default to oldest group
}

export function getCategoriesForAge(birthday: Date | string): ContentCategory[] {
  return getAgeGroupForChild(birthday).categories;
}

export function getSearchTermsForCategory(categoryId: string, birthday: Date | string): string[] {
  const ageGroup = getAgeGroupForChild(birthday);
  const category = ageGroup.categories.find(cat => cat.id === categoryId);
  return category?.searchTerms || [];
}

export function getAgeGroupInfo(birthday: Date | string) {
  const ageGroup = getAgeGroupForChild(birthday);
  const age = calculateAge(birthday);
    
  return {
    age,
    ageGroup: ageGroup.groupName,
    ageRange: ageGroup.ageRange,
    contentTypes: ageGroup.contentTypes,
    educationalTopics: ageGroup.educationalTopics,
    skillFocus: ageGroup.skillFocus,
    categories: ageGroup.categories
  };
}

// Helper function - will be imported from utils
function calculateAge(birthday: Date | string): number {
  const birthDate = typeof birthday === 'string' ? new Date(birthday) : birthday;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return Math.max(0, age);
}
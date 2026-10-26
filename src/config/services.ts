import type { ComponentProps } from 'react';
import type Ionicons from '@expo/vector-icons/Ionicons';

/**
 * Union University runs Ellucian Colleague Self-Service. Every "card" in the
 * app is a page on this site, opened inside one persistent, signed-in web view.
 *
 * Paths below are Colleague Self-Service defaults. If Union has customised a
 * page, change its `path` here — nothing else needs to change.
 */
export const SELF_SERVICE_ORIGIN = 'https://selfservice.uu.edu';
export const SELF_SERVICE_HOME = `${SELF_SERVICE_ORIGIN}/Student`;
export const SELF_SERVICE_LOGOUT = `${SELF_SERVICE_ORIGIN}/Student/Account/LogOff`;

/**
 * Hosts the saved credentials may be typed into. Autofill refuses to run on
 * any page outside this list.
 */
export const TRUSTED_LOGIN_HOSTS = ['uu.edu', 'login.microsoftonline.com'];

type IconName = ComponentProps<typeof Ionicons>['name'];

export type Category = 'Academics' | 'Finances' | 'Account' | 'Employee';

export type Service = {
  id: string;
  title: string;
  subtitle: string;
  path: string;
  icon: IconName;
  category: Category;
  tags: string[];
  /**
   * For pages without a stable URL: after `path` loads, follow the first link
   * whose text matches this (case-insensitive regex source).
   */
  findLink?: string;
};

export const SERVICES: Service[] = [
  {
    id: 'schedule',
    title: 'Class Schedule',
    subtitle: "This term's classes, plan and register",
    path: '/Student/Planning/DegreePlans',
    icon: 'calendar',
    category: 'Academics',
    tags: ['registration', 'classes', 'schedule', 'planning', 'timetable'],
  },
  {
    // Union lists chapel balances under User Options in Self-Service.
    id: 'chapel',
    title: 'Chapel Balance',
    subtitle: 'Chapel credits and attendance',
    path: '/Student',
    findLink: 'chapel',
    icon: 'heart',
    category: 'Account',
    tags: ['chapel', 'credits', 'attendance', 'worship'],
  },
  {
    // Location not confirmed: opens Self-Service and follows a meal/dining link.
    id: 'meal',
    title: 'Meal Balance',
    subtitle: 'Meal plan and dining dollars',
    path: '/Student',
    findLink: 'meal|dining|bulldog bucks',
    icon: 'restaurant',
    category: 'Finances',
    tags: ['meal', 'dining', 'food', 'swipes', 'cafeteria', 'balance'],
  },
  {
    id: 'progress',
    title: 'My Progress',
    subtitle: 'Degree audit and requirements',
    path: '/Student/Planning/Programs/MyProgress',
    icon: 'trending-up',
    category: 'Academics',
    tags: ['degree', 'audit', 'requirements', 'major'],
  },
  {
    id: 'courses',
    title: 'Course Catalog',
    subtitle: 'Search course sections',
    path: '/Student/Courses',
    icon: 'library',
    category: 'Academics',
    tags: ['search', 'sections', 'classes'],
  },
  {
    id: 'grades',
    title: 'Grades',
    subtitle: 'Term grades and GPA',
    path: '/Student/Student/Grades',
    icon: 'school',
    category: 'Academics',
    tags: ['gpa', 'marks', 'results'],
  },
  {
    id: 'transcript',
    title: 'Unofficial Transcript',
    subtitle: 'View your academic record',
    path: '/Student/Student/UnofficialTranscripts',
    icon: 'document-text',
    category: 'Academics',
    tags: ['record', 'history'],
  },
  {
    id: 'graduation',
    title: 'Graduation',
    subtitle: 'Apply to graduate',
    path: '/Student/Student/Graduation',
    icon: 'ribbon',
    category: 'Academics',
    tags: ['apply', 'commencement'],
  },
  {
    id: 'finance',
    title: 'Student Finance',
    subtitle: 'Balance, charges and payments',
    path: '/Student/Finance',
    icon: 'card',
    category: 'Finances',
    tags: ['bill', 'tuition', 'pay', 'balance', 'account'],
  },
  {
    id: 'aid',
    title: 'Financial Aid',
    subtitle: 'Awards, documents and status',
    path: '/Student/FinancialAid/Home',
    icon: 'cash',
    category: 'Finances',
    tags: ['scholarship', 'loans', 'fafsa', 'awards'],
  },
  {
    id: 'tax',
    title: 'Tax Information',
    subtitle: '1098-T and consent',
    path: '/Student/TaxInformation',
    icon: 'receipt',
    category: 'Finances',
    tags: ['1098', 'w2', 'forms'],
  },
  {
    id: 'banking',
    title: 'Banking Information',
    subtitle: 'Refund direct deposit',
    path: '/Student/BankingInformation',
    icon: 'business',
    category: 'Finances',
    tags: ['refund', 'deposit', 'bank'],
  },
  {
    id: 'profile',
    title: 'User Profile',
    subtitle: 'Address, phone and email',
    path: '/Student/UserProfile',
    icon: 'person-circle',
    category: 'Account',
    tags: ['contact', 'address', 'personal'],
  },
  {
    id: 'consents',
    title: 'Privacy & Consents',
    subtitle: 'FERPA and proxy access',
    path: '/Student/UserProfile/Consents',
    icon: 'shield-checkmark',
    category: 'Account',
    tags: ['ferpa', 'proxy', 'privacy'],
  },
  {
    id: 'home',
    title: 'Self-Service Home',
    subtitle: 'Everything else',
    path: '/Student',
    icon: 'apps',
    category: 'Account',
    tags: ['dashboard', 'all'],
  },
  {
    id: 'paystatements',
    title: 'Pay Advices',
    subtitle: 'Student worker pay statements',
    path: '/Student/HumanResources/PayStatements',
    icon: 'wallet',
    category: 'Employee',
    tags: ['paycheck', 'work study', 'payroll', 'employee'],
  },
  {
    id: 'timeentry',
    title: 'Time Entry',
    subtitle: 'Submit worked hours',
    path: '/Student/TimeManagement/TimeEntry',
    icon: 'time',
    category: 'Employee',
    tags: ['timesheet', 'hours', 'work study', 'employee'],
  },
];

export const CATEGORIES: Category[] = ['Academics', 'Finances', 'Account', 'Employee'];

export const DEFAULT_FAVORITES = ['schedule', 'meal', 'chapel', 'grades', 'finance'];

export function serviceUrl(service: Service) {
  return SELF_SERVICE_ORIGIN + service.path;
}

export function findService(id: string) {
  return SERVICES.find((s) => s.id === id);
}

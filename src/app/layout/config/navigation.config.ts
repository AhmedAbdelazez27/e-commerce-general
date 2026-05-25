import { NavCategory } from '../models/layout.model';

/** Mock category navigation — replace with API data when available. */
export const NAVIGATION_CATEGORIES: NavCategory[] = [
  {
    id: 'bazar',
    labelKey: 'LAYOUT.NAV.BAZAR',
    route: '/shop',
    queryParams: { category: 'bazar' },
  },
  {
    id: 'brands',
    labelKey: 'LAYOUT.NAV.BRANDS',
    route: '/brands',
  },
  {
    id: 'make-up',
    labelKey: 'LAYOUT.NAV.MAKE_UP',
    route: '/shop',
    queryParams: { category: 'make-up' },
    megaMenu: [
      {
        id: 'face',
        titleKey: 'LAYOUT.NAV.MEGA.FACE',
        links: [
          { id: 'foundation', labelKey: 'LAYOUT.NAV.MEGA.FOUNDATION', route: '/shop', queryParams: { category: 'foundation' } },
          { id: 'concealer', labelKey: 'LAYOUT.NAV.MEGA.CONCEALER', route: '/shop', queryParams: { category: 'concealer' } },
          { id: 'blush', labelKey: 'LAYOUT.NAV.MEGA.BLUSH', route: '/shop', queryParams: { category: 'blush' } },
        ],
      },
      {
        id: 'eyes',
        titleKey: 'LAYOUT.NAV.MEGA.EYES',
        links: [
          { id: 'mascara', labelKey: 'LAYOUT.NAV.MEGA.MASCARA', route: '/shop', queryParams: { category: 'mascara' } },
          { id: 'eyeliner', labelKey: 'LAYOUT.NAV.MEGA.EYELINER', route: '/shop', queryParams: { category: 'eyeliner' } },
          { id: 'eyeshadow', labelKey: 'LAYOUT.NAV.MEGA.EYESHADOW', route: '/shop', queryParams: { category: 'eyeshadow' } },
        ],
      },
      {
        id: 'lips',
        titleKey: 'LAYOUT.NAV.MEGA.LIPS',
        links: [
          { id: 'lipstick', labelKey: 'LAYOUT.NAV.MEGA.LIPSTICK', route: '/shop', queryParams: { category: 'lipstick' } },
          { id: 'lip-liner', labelKey: 'LAYOUT.NAV.MEGA.LIP_LINER', route: '/shop', queryParams: { category: 'lip-liner' } },
          { id: 'lip-gloss', labelKey: 'LAYOUT.NAV.MEGA.LIP_GLOSS', route: '/shop', queryParams: { category: 'lip-gloss' } },
        ],
      },
    ],
  },
  {
    id: 'skin-care',
    labelKey: 'LAYOUT.NAV.SKIN_CARE',
    route: '/shop',
    queryParams: { category: 'skin-care' },
    megaMenu: [
      {
        id: 'cleansers',
        titleKey: 'LAYOUT.NAV.MEGA.CLEANSERS',
        links: [
          { id: 'gel-cleanser', labelKey: 'LAYOUT.NAV.MEGA.GEL_CLEANSER', route: '/shop', queryParams: { category: 'gel-cleanser' } },
          { id: 'micellar', labelKey: 'LAYOUT.NAV.MEGA.MICELLAR', route: '/shop', queryParams: { category: 'micellar' } },
        ],
      },
      {
        id: 'moisturizers',
        titleKey: 'LAYOUT.NAV.MEGA.MOISTURIZERS',
        links: [
          { id: 'day-cream', labelKey: 'LAYOUT.NAV.MEGA.DAY_CREAM', route: '/shop', queryParams: { category: 'day-cream' } },
          { id: 'night-cream', labelKey: 'LAYOUT.NAV.MEGA.NIGHT_CREAM', route: '/shop', queryParams: { category: 'night-cream' } },
        ],
      },
      {
        id: 'sun-care-nav',
        titleKey: 'LAYOUT.NAV.MEGA.SUN_PROTECTION',
        links: [
          { id: 'spf-face', labelKey: 'LAYOUT.NAV.MEGA.SPF_FACE', route: '/shop', queryParams: { category: 'spf-face' } },
          { id: 'spf-body', labelKey: 'LAYOUT.NAV.MEGA.SPF_BODY', route: '/shop', queryParams: { category: 'spf-body' } },
        ],
      },
    ],
  },
  {
    id: 'perfume',
    labelKey: 'LAYOUT.NAV.PERFUME',
    route: '/shop',
    queryParams: { category: 'perfume' },
  },
  {
    id: 'sun-care',
    labelKey: 'LAYOUT.NAV.SUN_CARE',
    route: '/shop',
    queryParams: { category: 'sun-care' },
  },
  {
    id: 'body-care',
    labelKey: 'LAYOUT.NAV.BODY_CARE',
    route: '/shop',
    queryParams: { category: 'body-care' },
  },
  {
    id: 'hair-care',
    labelKey: 'LAYOUT.NAV.HAIR_CARE',
    route: '/shop',
    queryParams: { category: 'hair-care' },
  },
  {
    id: 'hygiene',
    labelKey: 'LAYOUT.NAV.HYGIENE',
    route: '/shop',
    queryParams: { category: 'hygiene' },
  },
  {
    id: 'mother-baby',
    labelKey: 'LAYOUT.NAV.MOTHER_BABY',
    route: '/shop',
    queryParams: { category: 'mother-baby' },
  },
];

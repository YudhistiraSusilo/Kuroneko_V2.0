// Small line illustrations help distinguish each menu category.
export default function CategoryIcon({ category }) {
  return <svg className="category-icon-picture" viewBox="0 0 48 40" fill="none" aria-hidden="true">
    {category === 'Sushi' && <>
      <path d="M7 23c0-5 7-8 17-8s17 3 17 8v5c0 3-7 5-17 5S7 31 7 28v-5Z" />
      <path d="M9 22c1-5 7-9 15-9s14 4 15 9c-5 2-9 2-15 2s-10 0-15-2Z" />
      <path d="M13 17c3 1 6 1 9 0m5 0c3 1 6 1 9 0" />
    </>}
    {category === 'Sashimi' && <>
      <ellipse cx="24" cy="23" rx="19" ry="10" />
      <path d="m10 20 10-9 8 2-10 9-8-2Zm10 5 11-9 7 3-11 9-7-3Z" />
      <path d="m14 19 7-6m6 11 8-7" />
    </>}
    {category === 'Ramen' && <>
      <path d="M8 20h32l-4 14H12L8 20Z" />
      <path d="M6 20c0-4 8-7 18-7s18 3 18 7-8 5-18 5-18-1-18-5Z" />
      <path d="M14 18c2-4 5 4 8 0s5 4 8 0m-12-6 2-4m4 4 1-5" />
    </>}
    {category === 'Drinks' && <>
      <path d="M13 9h22l-3 26H16L13 9Z" />
      <path d="M18 9 25 4m3 5 3-6m-16 17h20" />
      <path d="M20 25h8" />
    </>}
    {category === 'Side dishes' && <>
      <path d="M7 20c1 9 7 14 17 14s16-5 17-14H7Z" />
      <path d="M5 19c0-3 8-6 19-6s19 3 19 6-8 4-19 4-19-1-19-4Z" />
      <path d="M16 16c-2-4 4-5 5-1m4 0c0-5 7-4 6 0" />
    </>}
    {category === 'All dishes' && <>
      <ellipse cx="24" cy="21" rx="19" ry="13" />
      <ellipse cx="24" cy="21" rx="13" ry="8" />
      <path d="M17 20c2-3 4-3 6 0s4 3 7 0m-11 5h10" />
    </>}
  </svg>;
}

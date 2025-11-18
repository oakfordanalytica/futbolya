export const getLeagueNavigation = (orgSlug: string) => [
  {
    name: "Dashboard",
    href: `/${orgSlug}/admin`,
    icon: "home",
  },
  {
    name: "Clubs",
    href: `/${orgSlug}/admin/clubs`,
    icon: "building",
  },
  {
    name: "Categories",
    href: `/${orgSlug}/admin/categories`,
    icon: "trophy",
  },
  {
    name: "Players",
    href: `/${orgSlug}/admin/players`,
    icon: "user-group",
  },
  {
    name: "Referees",
    href: `/${orgSlug}/admin/referees`,
    icon: "shield",
  },
  {
    name: "Tournaments",
    href: `/${orgSlug}/admin/tournaments`,
    icon: "trophy",
  },
  {
    name: "Users",
    href: `/${orgSlug}/admin/users`,
    icon: "users",
  },
];

export const getClubNavigation = (orgSlug: string) => [
  {
    name: "Dashboard",
    href: `/${orgSlug}/admin`,
    icon: "home",
  },
  {
    name: "Categories",
    href: `/${orgSlug}/admin/categories`,
    icon: "trophy",
  },
  {
    name: "Players",
    href: `/${orgSlug}/admin/players`,
    icon: "user-group",
  },
  {
    name: "Staff",
    href: `/${orgSlug}/admin/staff`,
    icon: "users",
  },
  {
    name: "Users",
    href: `/${orgSlug}/admin/users`,
    icon: "users",
  },
];
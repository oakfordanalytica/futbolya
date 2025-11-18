import {
  HomeIcon,
  TrophyIcon,
  BuildingOfficeIcon,
  UsersIcon,
  UserGroupIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

export const iconMap = {
  home: HomeIcon,
  trophy: TrophyIcon,
  building: BuildingOfficeIcon,
  users: UsersIcon,
  "user-group": UserGroupIcon,
  shield: ShieldCheckIcon,
} as const;

export type IconName = keyof typeof iconMap;
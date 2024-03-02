import { Timestamp } from "firebase/firestore";

export interface User {
    id: string;
    email: string;
    hasProfilePicture: boolean;
    admin: boolean;
    lastLogin: Timestamp | null;
    formattedLastLogin?: string | null;
  }
  
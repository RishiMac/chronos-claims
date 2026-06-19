export interface User {
  id: string;
  name: string;
  email: string;
  role: "reviewer" | "adjuster" | "fleet_manager" | "admin";
}

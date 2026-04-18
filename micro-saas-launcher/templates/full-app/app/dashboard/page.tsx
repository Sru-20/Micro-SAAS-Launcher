import { DashboardClient } from "./dashboard-client";

export const metadata = {
  title: "Dashboard",
  description: "Manage your data",
};

export default function DashboardPage() {
  return <DashboardClient />;
}

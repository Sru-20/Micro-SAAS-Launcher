import { dashboardTables, APP_NAME, PROJECT_ID } from "@/lib/blueprint-config";
import AutoCRUD from "@/components/AutoCRUD";

export const metadata = {
  title: `Dashboard — ${APP_NAME}`,
  description: "Manage your data",
};

export default function DashboardPage() {
  return (
    <main className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Manage and view all your data tables.
          </p>
        </div>
      </div>

      {dashboardTables.length === 0 ? (
        <div className="empty-dashboard">
          <span className="empty-dashboard-icon">📊</span>
          <p>No dashboard tables configured.</p>
          <p className="empty-dashboard-hint">
            Add tables with type &quot;dashboard&quot; to your blueprint.
          </p>
        </div>
      ) : (
        <div className="dashboard-tables">
          {dashboardTables.map((config) => (
            <AutoCRUD
              key={config.table}
              tableName={config.table}
              projectId={PROJECT_ID}
              fields={config.fields}
            />
          ))}
        </div>
      )}
    </main>
  );
}

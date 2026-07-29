import { useMemo } from 'react';
import { AlertTriangle, CalendarClock, ClipboardList, FileCheck2, Plus, Users } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../api/errorUtils';
import { Alert, Button, Card, CardContent, CardHeader } from '../components/ui';
import { StatusChip } from '../components/StatusChip';
import { useGetDashboardQuery } from '../features/cases/casesApi';
import { formatDate } from '../utils/date';
import { statuses } from '../utils/status';

const emptyDashboard = {
  stats: { total: 0, overdue: 0, dueSoon: 0, pendingReview: 0, statusCounts: {} },
  recentCases: [],
  agentWorkload: []
};
const DASHBOARD_ITEM_LIMIT = 10;

export const DashboardPage = () => {
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const { data: dashboard = emptyDashboard, error, isFetching } = useGetDashboardQuery();

  const statusCards = useMemo(
    () => statuses.map((status) => ({ status, count: dashboard.stats.statusCounts?.[status] || 0 })),
    [dashboard.stats.statusCounts]
  );
  const recentCases = dashboard.recentCases.slice(0, DASHBOARD_ITEM_LIMIT);
  const agentWorkload = dashboard.agentWorkload.slice(0, DASHBOARD_ITEM_LIMIT);

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">{user.role === 'manager' ? 'Monitor team workload and case health.' : 'Track your assigned case workload.'}</p>
        </div>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          {user.role === 'manager' && (
            <Button type="button" onClick={() => navigate('/cases/new')}>
              <Plus size={20} />
              Create case
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => navigate('/cases')}>
            <ClipboardList size={20} />
            View cases
          </Button>
        </div>
      </div>

      <div className="dashboard-alert-slot">
        {error && <Alert variant="error">{getErrorMessage(error)}</Alert>}
        {isFetching && !dashboard.stats.total && <Alert>Loading dashboard...</Alert>}
      </div>

      <div className="dashboard-metrics">
        <div className="dashboard-grid">
          <StatCard icon={<ClipboardList size={22} />} label="Total cases" value={dashboard.stats.total} />
          <StatCard icon={<FileCheck2 size={22} />} label="Pending review" value={dashboard.stats.pendingReview} />
          <StatCard icon={<CalendarClock size={22} />} label="Due soon" value={dashboard.stats.dueSoon} />
          <StatCard icon={<AlertTriangle size={22} />} label="Overdue" value={dashboard.stats.overdue} />
        </div>

        <div className="stats-grid">
          {statusCards.map(({ status, count }) => (
            <Card key={status}>
              <div className="stat-card" style={{ minHeight: 78 }}>
                <StatusChip status={status} />
                <p className="stat-value" style={{ fontSize: 24 }}>
                  {count}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="content-grid dashboard-content-grid">
          <Card className="recent-cases-card">
            <CardHeader title="Recent cases" />
            <div className="hidden-mobile-table recent-cases-scroll">
              <table className="data-table" style={{ minWidth: 640 }}>
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Client</th>
                    <th>Status</th>
                    <th>Due</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCases.map((caseItem) => (
                    <tr key={caseItem._id} onClick={() => navigate(`/cases/${caseItem._id}`)}>
                      <td className="strong">{caseItem.subjectName}</td>
                      <td>{caseItem.clientName}</td>
                      <td>
                        <StatusChip status={caseItem.status} />
                      </td>
                      <td>{formatDate(caseItem.dueDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {recentCases.length === 0 && (
                <div style={{ padding: 18 }}>
                  <Alert>No cases available yet.</Alert>
                </div>
              )}
            </div>
            <div className="dashboard-case-card-list recent-cases-mobile-scroll">
              {recentCases.map((caseItem) => (
                <button type="button" className="case-list-card" key={caseItem._id} onClick={() => navigate(`/cases/${caseItem._id}`)}>
                  <div className="row-between" style={{ alignItems: 'flex-start' }}>
                    <div style={{ minWidth: 0 }}>
                      <div className="strong" style={{ overflowWrap: 'anywhere' }}>
                        {caseItem.subjectName}
                      </div>
                      <div className="muted" style={{ marginTop: 4, overflowWrap: 'anywhere' }}>
                        {caseItem.clientName}
                      </div>
                    </div>
                    <StatusChip status={caseItem.status} />
                  </div>
                  <div className="muted" style={{ marginTop: 10, fontSize: 13 }}>
                    Due {formatDate(caseItem.dueDate)}
                  </div>
                </button>
              ))}
              {recentCases.length === 0 && <Alert>No cases available yet.</Alert>}
            </div>
          </Card>

          <div className="dashboard-side-panel">
            <Card>
              <CardHeader title={user.role === 'manager' ? 'Review queue' : 'My focus'} />
              <CardContent className="stack">
                <SummaryRow label="Submitted cases" value={dashboard.stats.pendingReview} />
                <SummaryRow label="Due in 7 days" value={dashboard.stats.dueSoon} />
                <SummaryRow label="Overdue" value={dashboard.stats.overdue} />
              </CardContent>
            </Card>

            {user.role === 'manager' && (
              <Card className="agent-workload-card">
                <CardHeader title="Agent workload" icon={<Users size={20} className="muted" />} />
                <CardContent className="agent-workload-content">
                  <div className="agent-workload-scroll">
                    {agentWorkload.map((agent) => (
                      <div className="workload-item" key={agent._id}>
                        <div className="strong">{agent.name}</div>
                        <div className="muted" style={{ fontSize: 13 }}>
                          {agent.email}
                        </div>
                        <SummaryRow label="Active" value={agent.active} />
                        <SummaryRow label="Total assigned" value={agent.total} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value }) => (
  <Card>
    <div className="stat-card">
      <div>
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
      </div>
      <div className="icon-tile">{icon}</div>
    </div>
  </Card>
);

const SummaryRow = ({ label, value }) => (
  <div className="summary-row">
    <span className="muted">{label}</span>
    <span>{value}</span>
  </div>
);

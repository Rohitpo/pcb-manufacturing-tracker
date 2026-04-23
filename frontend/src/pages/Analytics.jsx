// frontend/src/pages/Analytics.jsx
import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useQuery } from 'react-query';
import axios from 'axios';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B'];

const Analytics = () => {
  const { data: summary } = useQuery(
    'analytics-summary',
    async () => {
      const response = await axios.get('/api/dashboard/summary');
      return response.data;
    },
    { refetchInterval: 60000 }
  );

  const { data: boards } = useQuery(
    'all-boards-analytics',
    async () => {
      const response = await axios.get('/api/boards/all?limit=1000');
      return response.data;
    }
  );

  // Calculate additional statistics
  const calculateStepSuccessRate = () => {
    if (!boards) return [];
    
    const stepStats = {};
    boards.forEach(board => {
      board.logs?.forEach(log => {
        if (!stepStats[log.step_id]) {
          stepStats[log.step_id] = {
            name: log.step?.name,
            total: 0,
            passed: 0,
            failed: 0,
          };
        }
        stepStats[log.step_id].total++;
        if (log.status === 'done') {
          stepStats[log.step_id].passed++;
        } else if (log.status === 'failed') {
          stepStats[log.step_id].failed++;
        }
      });
    });

    return Object.values(stepStats).map(stat => ({
      ...stat,
      successRate: stat.total > 0 ? ((stat.passed / stat.total) * 100).toFixed(1) : 0,
    }));
  };

  const stepSuccessRates = calculateStepSuccessRate();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Analytics Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Step Success Rate Chart */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Step Success Rates
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={stepSuccessRates}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="passed" fill="#4caf50" name="Passed" />
                <Bar dataKey="failed" fill="#f44336" name="Failed" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Summary Statistics */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Overall Statistics
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>Total Boards</TableCell>
                    <TableCell align="right">
                      <Chip label={summary?.total_boards || 0} color="primary" />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Completion Rate</TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`${summary?.total_boards ? ((summary.completed_boards / summary.total_boards) * 100).toFixed(1) : 0}%`}
                        color="success"
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Failure Rate</TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`${summary?.total_boards ? ((summary.failed_boards / summary.total_boards) * 100).toFixed(1) : 0}%`}
                        color="error"
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Avg. Time to Complete</TableCell>
                    <TableCell align="right">
                      <Chip label="2.5 days" color="info" />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Step Success Rates
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Step</TableCell>
                      <TableCell align="right">Success Rate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stepSuccessRates.map((step) => (
                      <TableRow key={step.name}>
                        <TableCell>{step.name}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${step.successRate}%`}
                            color={step.successRate > 80 ? 'success' : step.successRate > 60 ? 'warning' : 'error'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Status Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Board Status Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={summary?.boards_by_status || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.status}: ${entry.count}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="status"
                >
                  {(summary?.boards_by_status || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Recent Failures */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Failures & Defects
            </Typography>
            <TableContainer sx={{ maxHeight: 300 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Board ID</TableCell>
                    <TableCell>Step</TableCell>
                    <TableCell>Defect</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {boards?.filter(b => 
                    b.logs?.some(l => l.status === 'failed')
                  ).slice(0, 10).map((board) => {
                    const failedLog = board.logs?.find(l => l.status === 'failed');
                    return (
                      <TableRow key={board.id}>
                        <TableCell>{board.board_id}</TableCell>
                        <TableCell>{failedLog?.step?.name}</TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                            {failedLog?.defect_description || 'No description'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Analytics;
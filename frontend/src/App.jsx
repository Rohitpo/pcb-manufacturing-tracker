import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container, AppBar, Toolbar, Typography, Button,
  Box, Drawer, List, ListItem, ListItemIcon, ListItemText,
  Divider, Avatar, Menu, MenuItem, IconButton, Badge,
  Paper, Grid, Card, CardContent, Chip, LinearProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, FormControl, InputLabel, FormHelperText,
  Tabs, Tab, Alert, Snackbar, CircularProgress,
  Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Assignment as BoardIcon,
  People as PeopleIcon,
  Build as MachineIcon,
  Assessment as AnalyticsIcon,
  CloudDownload as ExportIcon,
  CheckCircle as PassIcon,
  Error as FailIcon,
  Pending as PendingIcon,
  Person as PersonIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  Comment as CommentIcon,
  AssignmentInd as AssignIcon,
  RateReview as ReviewIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';

// Context for auth
const AuthContext = React.createContext();

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [boards, setBoards] = useState([]);
  const [users, setUsers] = useState([]);
  const [machines, setMachines] = useState([]);
  const [stats, setStats] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Login handler
  const handleLogin = async (username, password) => {
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      
      const response = await axios.post('/api/auth/login', formData);
      localStorage.setItem('access_token', response.data.access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
      setUser(response.data.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Login failed' };
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setCurrentView('dashboard');
  };

  // Load data
  const loadData = async () => {
    if (!user) return;
    
    try {
      const [boardsRes, usersRes, machinesRes, statsRes] = await Promise.all([
        axios.get('/api/boards/all'),
        axios.get('/api/users/'),
        axios.get('/api/machines/'),
        axios.get('/api/dashboard/summary')
      ]);
      
      setBoards(boardsRes.data);
      setUsers(usersRes.data);
      setMachines(machinesRes.data);
      setStats(statsRes.data);
    } catch (error) {
      showSnackbar('Failed to load data', 'error');
    }
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.get('/api/auth/me')
        .then(res => {
          setUser(res.data);
          setLoading(false);
        })
        .catch(() => {
          localStorage.removeItem('access_token');
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, currentView]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <AuthContext.Provider value={{ user, loadData, showSnackbar }}>
      <Box sx={{ display: 'flex' }}>
        <AppBar position="fixed" sx={{ zIndex: 1300 }}>
          <Toolbar>
            <IconButton color="inherit" edge="start" onClick={() => setDrawerOpen(true)} sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              PCB Manufacturing Tracker
            </Typography>
            
            <IconButton color="inherit">
              <Badge badgeContent={boards.filter(b => b.status === 'pending_review').length} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            
            <IconButton color="inherit" onClick={() => setCurrentView('profile')}>
              <Avatar sx={{ width: 32, height: 32 }}>
                {user.full_name?.charAt(0)}
              </Avatar>
            </IconButton>
            
            <Menu>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <Box sx={{ width: 280, mt: 8 }}>
            <List>
              <ListItem button selected={currentView === 'dashboard'} onClick={() => { setCurrentView('dashboard'); setDrawerOpen(false); }}>
                <ListItemIcon><DashboardIcon /></ListItemIcon>
                <ListItemText primary="Dashboard" />
              </ListItem>
              
              <ListItem button selected={currentView === 'boards'} onClick={() => { setCurrentView('boards'); setDrawerOpen(false); }}>
                <ListItemIcon><BoardIcon /></ListItemIcon>
                <ListItemText primary="Kanban Board" />
                <Chip label={boards.length} size="small" />
              </ListItem>
              
              <ListItem button selected={currentView === 'my-tasks'} onClick={() => { setCurrentView('my-tasks'); setDrawerOpen(false); }}>
                <ListItemIcon><AssignIcon /></ListItemIcon>
                <ListItemText primary="My Tasks" />
                <Chip label={boards.filter(b => b.assigned_to === user.id).length} size="small" color="primary" />
              </ListItem>
              
              {user.role === 'manager' && (
                <ListItem button selected={currentView === 'reviews'} onClick={() => { setCurrentView('reviews'); setDrawerOpen(false); }}>
                  <ListItemIcon><ReviewIcon /></ListItemIcon>
                  <ListItemText primary="Pending Reviews" />
                  <Chip label={boards.filter(b => b.status === 'pending_review').length} size="small" color="error" />
                </ListItem>
              )}
            </List>
            
            <Divider />
            
            <List>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Admin</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List disablePadding>
                    <ListItem button onClick={() => { setCurrentView('users'); setDrawerOpen(false); }}>
                      <ListItemIcon><PeopleIcon /></ListItemIcon>
                      <ListItemText primary="Users" />
                    </ListItem>
                    <ListItem button onClick={() => { setCurrentView('machines'); setDrawerOpen(false); }}>
                      <ListItemIcon><MachineIcon /></ListItemIcon>
                      <ListItemText primary="Machines" />
                    </ListItem>
                    <ListItem button onClick={() => { setCurrentView('analytics'); setDrawerOpen(false); }}>
                      <ListItemIcon><AnalyticsIcon /></ListItemIcon>
                      <ListItemText primary="Analytics" />
                    </ListItem>
                    <ListItem button onClick={async () => {
                      window.open('/api/export/boards/csv', '_blank');
                    }}>
                      <ListItemIcon><ExportIcon /></ListItemIcon>
                      <ListItemText primary="Export CSV" />
                    </ListItem>
                  </List>
                </AccordionDetails>
              </Accordion>
            </List>
          </Box>
        </Drawer>

        <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
          {currentView === 'dashboard' && <DashboardView stats={stats} boards={boards} users={users} />}
          {currentView === 'boards' && <KanbanView boards={boards} users={users} machines={machines} onUpdate={loadData} />}
          {currentView === 'my-tasks' && <MyTasksView boards={boards.filter(b => b.assigned_to === user.id)} onUpdate={loadData} />}
          {currentView === 'reviews' && <ReviewsView boards={boards.filter(b => b.status === 'pending_review')} onUpdate={loadData} />}
          {currentView === 'users' && <UsersView users={users} onUpdate={loadData} />}
          {currentView === 'machines' && <MachinesView machines={machines} onUpdate={loadData} />}
          {currentView === 'analytics' && <AnalyticsView stats={stats} boards={boards} users={users} />}
        </Box>

        <Snackbar
          open={snackbar.open}
                    autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </AuthContext.Provider>
  );
}

// Login Page Component
function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const result = await onLogin(username, password);
    if (!result.success) {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box textAlign="center" mb={3}>
          <Typography variant="h4" gutterBottom>PCB Tracker</Typography>
          <Typography variant="body2" color="text.secondary">
            Manufacturing Execution System
          </Typography>
        </Box>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            margin="normal"
            required
            disabled={loading}
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
            disabled={loading}
          />
          <Button
            fullWidth
            type="submit"
            variant="contained"
            size="large"
            sx={{ mt: 3 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Login'}
          </Button>
        </form>
        
        <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }} color="text.secondary">
          Demo: admin / admin123
        </Typography>
      </Paper>
    </Container>
  );
}

// Dashboard View
function DashboardView({ stats, boards, users }) {
  const priorityCounts = {
    urgent: boards.filter(b => b.priority === 'urgent').length,
    high: boards.filter(b => b.priority === 'high').length,
    medium: boards.filter(b => b.priority === 'medium').length,
    low: boards.filter(b => b.priority === 'low').length,
  };

  const statusCounts = {
    created: boards.filter(b => b.status === 'created').length,
    assigned: boards.filter(b => b.status === 'assigned').length,
    in_progress: boards.filter(b => b.status === 'in_progress').length,
    pending_review: boards.filter(b => b.status === 'pending_review').length,
    completed: boards.filter(b => b.status === 'completed').length,
    rejected: boards.filter(b => b.status === 'rejected').length,
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Dashboard</Typography>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => window.location.reload()}>
          Refresh
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Total Boards</Typography>
              <Typography variant="h3">{stats?.total_boards || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.light' }}>
            <CardContent>
              <Typography color="text.secondary">In Progress</Typography>
              <Typography variant="h3">{statusCounts.in_progress}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'info.light' }}>
            <CardContent>
              <Typography color="text.secondary">Pending Review</Typography>
              <Typography variant="h3">{statusCounts.pending_review}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.light' }}>
            <CardContent>
              <Typography color="text.secondary">Completed</Typography>
              <Typography variant="h3">{statusCounts.completed}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Priority Distribution */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Priority Distribution</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Priority</TableCell>
                    <TableCell align="right">Count</TableCell>
                    <TableCell>Progress</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <Chip label="URGENT" color="error" size="small" />
                    </TableCell>
                    <TableCell align="right">{priorityCounts.urgent}</TableCell>
                    <TableCell>
                      <LinearProgress 
                        variant="determinate" 
                        value={(priorityCounts.urgent / boards.length) * 100 || 0} 
                        color="error"
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Chip label="HIGH" color="warning" size="small" />
                    </TableCell>
                    <TableCell align="right">{priorityCounts.high}</TableCell>
                    <TableCell>
                      <LinearProgress 
                        variant="determinate" 
                        value={(priorityCounts.high / boards.length) * 100 || 0} 
                        color="warning"
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Chip label="MEDIUM" color="primary" size="small" />
                    </TableCell>
                    <TableCell align="right">{priorityCounts.medium}</TableCell>
                    <TableCell>
                      <LinearProgress 
                        variant="determinate" 
                        value={(priorityCounts.medium / boards.length) * 100 || 0} 
                        color="primary"
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Recent Boards</Typography>
            <TableContainer sx={{ maxHeight: 300 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Board ID</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Assigned To</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {boards.slice(0, 10).map(board => (
                    <TableRow key={board.id}>
                      <TableCell>{board.board_id}</TableCell>
                      <TableCell>
                        <Chip 
                          label={board.status} 
                          size="small"
                          color={
                            board.status === 'completed' ? 'success' :
                            board.status === 'pending_review' ? 'warning' :
                            board.status === 'rejected' ? 'error' : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell>{board.assignee?.full_name || 'Unassigned'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Weekly Summary */}
      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="h6" gutterBottom>Weekly Summary</Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Completed This Week</Typography>
            <Typography variant="h5">{stats?.completed_boards || 0}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Avg Completion Time</Typography>
            <Typography variant="h5">2.3 days</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Success Rate</Typography>
            <Typography variant="h5">94%</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Active Operators</Typography>
            <Typography variant="h5">{users.filter(u => u.role === 'operator' && u.is_active).length}</Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

// Kanban Board View
function KanbanView({ boards, users, machines, onUpdate }) {
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [updateDialog, setUpdateDialog] = useState(false);
  const [createDialog, setCreateDialog] = useState(false);
  const [newBoard, setNewBoard] = useState({
    board_id: '',
    board_name: '',
    batch_number: '',
    priority: 'medium',
    estimated_days: 1,
    assigned_to: ''
  });
  const [updateData, setUpdateData] = useState({
    step_id: '',
    status: 'in_progress',
    comment: '',
    machine_id: '',
    assigned_to: '',
    time_spent_minutes: 30
  });
  const [steps, setSteps] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);

  const columns = [
    { id: 'created', title: 'Created', color: '#e0e0e0' },
    { id: 'assigned', title: 'Assigned', color: '#bbdefb' },
    { id: 'in_progress', title: 'In Progress', color: '#fff9c4' },
    { id: 'pending_review', title: 'Pending Review', color: '#ffe0b2' },
    { id: 'completed', title: 'Completed', color: '#c8e6c9' },
    { id: 'rejected', title: 'Rejected', color: '#ffcdd2' }
  ];

  const getBoardsByStatus = (status) => {
    return boards.filter(b => b.status === status);
  };

  const handleCreateBoard = async () => {
    try {
      await axios.post('/api/boards/create', newBoard);
      onUpdate();
      setCreateDialog(false);
      setNewBoard({ board_id: '', board_name: '', batch_number: '', priority: 'medium', estimated_days: 1, assigned_to: '' });
    } catch (error) {
      alert('Failed to create board');
    }
  };

  const handleUpdateBoard = async () => {
    const formData = new FormData();
    formData.append('step_id', updateData.step_id);
    formData.append('status', updateData.status);
    formData.append('comment', updateData.comment);
    if (updateData.machine_id) formData.append('machine_id', updateData.machine_id);
    if (updateData.assigned_to) formData.append('assigned_to', updateData.assigned_to);
    if (updateData.time_spent_minutes) formData.append('time_spent_minutes', updateData.time_spent_minutes);
    
    selectedImages.forEach((file, index) => {
      formData.append('images', file);
    });

    try {
      await axios.post(`/api/boards/${selectedBoard.id}/update-step`, formData);
      onUpdate();
      setUpdateDialog(false);
      setSelectedBoard(null);
      setSelectedImages([]);
    } catch (error) {
      alert('Failed to update board');
    }
  };

  const loadSteps = async () => {
    try {
      const res = await axios.get('/api/steps/');
      setSteps(res.data);
    } catch (error) {
      console.error('Failed to load steps');
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Kanban Board</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateDialog(true)}>
          New Board
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
        {columns.map(col => (
          <Paper key={col.id} sx={{ minWidth: 300, maxWidth: 300, bgcolor: col.color }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6">
                {col.title}
                <Chip label={getBoardsByStatus(col.id).length} size="small" sx={{ ml: 1 }} />
              </Typography>
            </Box>
            <Box sx={{ p: 1, minHeight: 400 }}>
              {getBoardsByStatus(col.id).map(board => (
                <Card 
                  key={board.id} 
                  sx={{ mb: 1, cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedBoard(board);
                    setUpdateDialog(true);
                    loadSteps();
                  }}
                >
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {board.board_id}
                    </Typography>
                    {board.board_name && (
                      <Typography variant="body2">{board.board_name}</Typography>
                    )}
                    <Box display="flex" alignItems="center" mt={1}>
                      <Chip 
                        label={board.priority || 'medium'} 
                        size="small"
                        color={board.priority === 'urgent' ? 'error' : board.priority === 'high' ? 'warning' : 'default'}
                      />
                    </Box>
                    {board.assignee && (
                      <Box display="flex" alignItems="center" mt={1}>
                        <PersonIcon fontSize="small" sx={{ mr: 0.5 }} />
                        <Typography variant="caption">{board.assignee.full_name}</Typography>
                      </Box>
                    )}
                    {board.current_step && (
                      <Typography variant="caption" display="block" mt={1} color="text.secondary">
                        Step: {board.current_step.name}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Paper>
        ))}
      </Box>

      {/* Create Board Dialog */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Board</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Board ID"
            value={newBoard.board_id}
            onChange={(e) => setNewBoard({...newBoard, board_id: e.target.value})}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Board Name"
            value={newBoard.board_name}
            onChange={(e) => setNewBoard({...newBoard, board_name: e.target.value})}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Batch Number"
            value={newBoard.batch_number}
            onChange={(e) => setNewBoard({...newBoard, batch_number: e.target.value})}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Priority</InputLabel>
            <Select
              value={newBoard.priority}
              onChange={(e) => setNewBoard({...newBoard, priority: e.target.value})}
              label="Priority"
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="urgent">Urgent</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Estimated Days"
            type="number"
            value={newBoard.estimated_days}
            onChange={(e) => setNewBoard({...newBoard, estimated_days: parseInt(e.target.value)})}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Assign To</InputLabel>
            <Select
              value={newBoard.assigned_to}
              onChange={(e) => setNewBoard({...newBoard, assigned_to: e.target.value})}
              label="Assign To"
            >
              <MenuItem value="">None</MenuItem>
              {users.filter(u => u.role === 'operator').map(user => (
                <MenuItem key={user.id} value={user.id}>{user.full_name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateBoard} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Update Board Dialog */}
      <Dialog open={updateDialog} onClose={() => setUpdateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Update Board: {selectedBoard?.board_id}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Step</InputLabel>
                <Select
                  value={updateData.step_id}
                  onChange={(e) => setUpdateData({...updateData, step_id: e.target.value})}
                  label="Step"
                >
                  {steps.map(step => (
                    <MenuItem key={step.id} value={step.id}>{step.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={updateData.status}
                  onChange={(e) => setUpdateData({...updateData, status: e.target.value})}
                  label="Status"
                >
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="done">Done - Send for Review</MenuItem>
                  <MenuItem value="failed">Failed - Needs Rework</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Machine Used</InputLabel>
                <Select
                  value={updateData.machine_id}
                  onChange={(e) => setUpdateData({...updateData, machine_id: e.target.value})}
                  label="Machine Used"
                >
                  <MenuItem value="">None</MenuItem>
                  {machines.filter(m => m.status === 'available').map(machine => (
                    <MenuItem key={machine.id} value={machine.id}>{machine.machine_name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Time Spent (minutes)"
                type="number"
                value={updateData.time_spent_minutes}
                onChange={(e) => setUpdateData({...updateData, time_spent_minutes: parseInt(e.target.value)})}
              />
            </Grid>
            
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Assign To (Next)</InputLabel>
                <Select
                  value={updateData.assigned_to}
                  onChange={(e) => setUpdateData({...updateData, assigned_to: e.target.value})}
                  label="Assign To (Next)"
                >
                  <MenuItem value="">None</MenuItem>
                  {users.filter(u => u.role === 'operator').map(user => (
                    <MenuItem key={user.id} value={user.id}>{user.full_name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Comment"
                multiline
                rows={3}
                value={updateData.comment}
                onChange={(e) => setUpdateData({...updateData, comment: e.target.value})}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Button variant="outlined" component="label" startIcon={<ImageIcon />}>
                Upload Images
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/*"
                  onChange={(e) => setSelectedImages(Array.from(e.target.files))}
                />
              </Button>
              {selectedImages.length > 0 && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  {selectedImages.length} file(s) selected
                </Typography>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateBoard} variant="contained">Update</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// My Tasks View
function MyTasksView({ boards, onUpdate }) {
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [detailDialog, setDetailDialog] = useState(false);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>My Assigned Tasks</Typography>
      
      <Grid container spacing={3}>
        {boards.map(board => (
          <Grid item xs={12} md={6} key={board.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="h6">{board.board_id}</Typography>
                  <Chip 
                    label={board.priority} 
                    color={board.priority === 'urgent' ? 'error' : board.priority === 'high' ? 'warning' : 'default'}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {board.board_name}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Current Step: {board.current_step?.name || 'Not started'}
                </Typography>
                <Typography variant="body2">
                  Estimated Days: {board.estimated_days}
                </Typography>
                <Box display="flex" gap={1} mt={2}>
                  <Button 
                    variant="contained" 
                    size="small"
                    onClick={() => {
                      setSelectedBoard(board);
                      setDetailDialog(true);
                    }}
                  >
                    View Details
                  </Button>
                  <Button 
                    variant="outlined" 
                    size="small"
                    startIcon={<EditIcon />}
                  >
                    Update
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {boards.length === 0 && (
        <Alert severity="info">No tasks assigned to you.</Alert>
      )}
    </Box>
  );
}

// Reviews View (Manager)
function ReviewsView({ boards, onUpdate }) {
  const [reviewDialog, setReviewDialog] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [reviewData, setReviewData] = useState({
    status: 'approved',
    comment: '',
    action_required: '',
    assigned_to: ''
  });
  const [users, setUsers] = useState([]);

  const loadUsers = async () => {
    try {
      const res = await axios.get('/api/users/operators');
      setUsers(res.data);
    } catch (error) {
      console.error('Failed to load users');
    }
  };

  const handleReview = async () => {
    try {
      await axios.post('/api/reviews/', {
        board_id: selectedBoard.id,
        log_id: selectedBoard.logs?.[selectedBoard.logs.length - 1]?.id,
        status: reviewData.status,
        comment: reviewData.comment,
        action_required: reviewData.action_required,
        assigned_to: reviewData.assigned_to || null
      });
      onUpdate();
      setReviewDialog(false);
    } catch (error) {
      alert('Failed to submit review');
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Pending Reviews</Typography>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Board ID</TableCell>
              <TableCell>Current Step</TableCell>
              <TableCell>Operator</TableCell>
              <TableCell>Submitted</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {boards.map(board => (
              <TableRow key={board.id}>
                <TableCell>{board.board_id}</TableCell>
                <TableCell>{board.current_step?.name}</TableCell>
                <TableCell>{board.assignee?.full_name}</TableCell>
                <TableCell>{new Date(board.updated_at).toLocaleString()}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => {
                      setSelectedBoard(board);
                      setReviewDialog(true);
                      loadUsers();
                    }}
                  >
                    Review
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {boards.length === 0 && (
        <Alert severity="info">No pending reviews.</Alert>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialog} onClose={() => setReviewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Review Board: {selectedBoard?.board_id}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Decision</InputLabel>
            <Select
              value={reviewData.status}
              onChange={(e) => setReviewData({...reviewData, status: e.target.value})}
              label="Decision"
            >
              <MenuItem value="approved">✅ Approve</MenuItem>
              <MenuItem value="rejected">❌ Reject</MenuItem>
              <MenuItem value="needs_rework">🔄 Needs Rework</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label="Comment"
            multiline
            rows={3}
            value={reviewData.comment}
            onChange={(e) => setReviewData({...reviewData, comment: e.target.value})}
            margin="normal"
          />
          
          <TextField
            fullWidth
            label="Action Required"
            multiline
            rows={2}
            value={reviewData.action_required}
            onChange={(e) => setReviewData({...reviewData, action_required: e.target.value})}
            margin="normal"
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Reassign To</InputLabel>
            <Select
              value={reviewData.assigned_to}
              onChange={(e) => setReviewData({...reviewData, assigned_to: e.target.value})}
              label="Reassign To"
            >
              <MenuItem value="">Keep Current</MenuItem>
              {users.map(user => (
                <MenuItem key={user.id} value={user.id}>{user.full_name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialog(false)}>Cancel</Button>
          <Button onClick={handleReview} variant="contained">Submit Review</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Users Management View
function UsersView({ users, onUpdate }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    full_name: '',
    role: 'operator',
    department: '',
    employee_id: '',
    password: ''
  });

  const handleCreateUser = async () => {
    try {
      await axios.post('/api/users/', newUser);
      onUpdate();
      setDialogOpen(false);
      setNewUser({ username: '', email: '', full_name: '', role: 'operator', department: '', employee_id: '', password: '' });
    } catch (error) {
      alert('Failed to create user');
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">User Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
          Add User
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employee ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map(user => (
              <TableRow key={user.id}>
                <TableCell>{user.employee_id || '-'}</TableCell>
                <TableCell>{user.full_name}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.department || '-'}</TableCell>
                <TableCell>
                  <Chip 
                    label={user.role} 
                    size="small"
                    color={
                      user.role === 'admin' ? 'error' :
                      user.role === 'manager' ? 'warning' :
                      user.role === 'supervisor' ? 'info' : 'default'
                    }
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={user.is_active ? 'Active' : 'Inactive'} 
                    size="small"
                    color={user.is_active ? 'success' : 'default'}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create User Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Username"
            value={newUser.username}
            onChange={(e) => setNewUser({...newUser, username: e.target.value})}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={newUser.password}
            onChange={(e) => setNewUser({...newUser, password: e.target.value})}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Full Name"
            value={newUser.full_name}
            onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={newUser.email}
            onChange={(e) => setNewUser({...newUser, email: e.target.value})}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Employee ID"
            value={newUser.employee_id}
            onChange={(e) => setNewUser({...newUser, employee_id: e.target.value})}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Department"
            value={newUser.department}
            onChange={(e) => setNewUser({...newUser, department: e.target.value})}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select
              value={newUser.role}
              onChange={(e) => setNewUser({...newUser, role: e.target.value})}
              label="Role"
            >
              <MenuItem value="operator">Operator</MenuItem>
              <MenuItem value="supervisor">Supervisor</MenuItem>
              <MenuItem value="manager">Manager</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateUser} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Machines View
function MachinesView({ machines, onUpdate }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newMachine, setNewMachine] = useState({
    machine_code: '',
    machine_name: '',
    machine_type: '',
    location: '',
    status: 'available'
  });

  const handleCreateMachine = async () => {
    try {
      await axios.post('/api/machines/', newMachine);
      onUpdate();
      setDialogOpen(false);
      setNewMachine({ machine_code: '', machine_name: '', machine_type: '', location: '', status: 'available' });
    } catch (error) {
      alert('Failed to create machine');
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Machine Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
          Add Machine
        </Button>
      </Box>

      <Grid container spacing={3}>
        {machines.map(machine => (
          <Grid item xs={12} sm={6} md={4} key={machine.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="h6">{machine.machine_name}</Typography>
                  <Chip 
                    label={machine.status} 
                    size="small"
                    color={
                      machine.status === 'available' ? 'success' :
                      machine.status === 'in_use' ? 'warning' :
                      machine.status === 'maintenance' ? 'info' : 'default'
                    }
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Code: {machine.machine_code}
                </Typography>
                <Typography variant="body2">
                  Type: {machine.machine_type}
                </Typography>
                <Typography variant="body2">
                  Location: {machine.location}
                </Typography>
                {machine.last_maintenance && (
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Last Maintenance: {machine.last_maintenance}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Machine</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Machine Code"
            value={newMachine.machine_code}
            onChange={(e) => setNewMachine({...newMachine, machine_code: e.target.value})}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Machine Name"
            value={newMachine.machine_name}
            onChange={(e) => setNewMachine({...newMachine, machine_name: e.target.value})}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Machine Type"
            value={newMachine.machine_type}
            onChange={(e) => setNewMachine({...newMachine, machine_type: e.target.value})}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Location"
            value={newMachine.location}
            onChange={(e) => setNewMachine({...newMachine, location: e.target.value})}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select
              value={newMachine.status}
              onChange={(e) => setNewMachine({...newMachine, status: e.target.value})}
              label="Status"
            >
              <MenuItem value="available">Available</MenuItem>
              <MenuItem value="maintenance">Maintenance</MenuItem>
              <MenuItem value="offline">Offline</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateMachine} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Analytics View
function AnalyticsView({ stats, boards, users }) {
  const [exportDialog, setExportDialog] = useState(false);

  const operatorStats = users
    .filter(u => u.role === 'operator')
    .map(user => {
      const userBoards = boards.filter(b => b.assigned_to === user.id);
      const completed = userBoards.filter(b => b.status === 'completed').length;
      const failed = userBoards.filter(b => b.status === 'rejected').length;
      return {
        ...user,
        totalBoards: userBoards.length,
        completed,
        failed,
        successRate: userBoards.length > 0 ? ((completed / userBoards.length) * 100).toFixed(1) : 0
      };
    })
    .sort((a, b) => b.completed - a.completed);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Analytics & Reports</Typography>
        <Button variant="contained" startIcon={<ExportIcon />} onClick={() => setExportDialog(true)}>
          Export Data
        </Button>
      </Box>

      {/* Operator Performance */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Operator Performance</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Operator</TableCell>
                <TableCell align="right">Total Boards</TableCell>
                <TableCell align="right">Completed</TableCell>
                <TableCell align="right">Failed</TableCell>
                <TableCell align="right">Success Rate</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {operatorStats.map(op => (
                <TableRow key={op.id}>
                  <TableCell>{op.full_name}</TableCell>
                  <TableCell align="right">{op.totalBoards}</TableCell>
                  <TableCell align="right">{op.completed}</TableCell>
                  <TableCell align="right">{op.failed}</TableCell>
                  <TableCell align="right">
                    <Chip 
                      label={`${op.successRate}%`}
                      color={op.successRate >= 90 ? 'success' : op.successRate >= 70 ? 'warning' : 'error'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Export Dialog */}
      <Dialog open={exportDialog} onClose={() => setExportDialog(false)}>
        <DialogTitle>Export Data</DialogTitle>
        <DialogContent>
          <List>
            <ListItem button onClick={() => window.open('/api/export/boards/csv', '_blank')}>
              <ListItemIcon><ExportIcon /></ListItemIcon>
              <ListItemText primary="Export Boards (CSV)" secondary="All board data with status and assignments" />
            </ListItem>
            <ListItem button onClick={() => window.open('/api/export/performance/csv', '_blank')}>
              <ListItemIcon><ExportIcon /></ListItemIcon>
              <ListItemText primary="Export Performance (CSV)" secondary="Operator performance metrics" />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default App;
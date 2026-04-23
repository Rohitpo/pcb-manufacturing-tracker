import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  AppBar,
  Toolbar,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  Grid,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  Avatar,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Badge,
  Menu,
  MenuItem as MuiMenuItem
} from '@mui/material';

import {
  Dashboard as DashboardIcon,
  Add as AddIcon,
  CheckCircle as PassIcon,
  Error as FailIcon,
  Build as RepairIcon,
  Refresh as RefreshIcon,
  Menu as MenuIcon,
  Assignment as BoardIcon,
  People as PeopleIcon,
  Build as MachineIcon,
  Assessment as AnalyticsIcon,
  CloudDownload as ExportIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Notifications as NotificationsIcon,
  Image as ImageIcon,
  AssignmentInd as AssignIcon
} from '@mui/icons-material';

const drawerWidth = 260;

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  
  const [newBoard, setNewBoard] = useState({
    board_id: '',
    board_name: '',
    batch_number: '',
    priority: 'medium',
    estimated_days: 1,
    assigned_to: ''
  });
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [updateDialog, setUpdateDialog] = useState(false);
  const [createDialog, setCreateDialog] = useState(false);
  const [userDialog, setUserDialog] = useState(false);
  const [steps, setSteps] = useState([]);
  const [stats, setStats] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    full_name: '',
    role: 'operator',
    password: '',
    department: '',
    employee_id: ''
  });
  const [updateData, setUpdateData] = useState({
    step_id: '',
    status: 'done',
    comment: '',
    time_spent_minutes: 30,
    machine_id: '',
    assigned_to: '',
    defect_description: ''
  });

  const [selectedImages, setSelectedImages] = useState([]);

  useEffect(() => {
    if (loggedIn) {
      loadBoards();
      loadSteps();
      loadStats();
      loadUsers();
      loadNotifications();
    }
  }, [loggedIn]);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      
      const response = await axios.post('/api/auth/login', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      localStorage.setItem('access_token', response.data.access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
      setUser(response.data.user);
      setLoggedIn(true);
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Use admin/admin123');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await axios.get('/api/users/');
      setUsers(response.data);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const createUser = async () => {
    try {
      await axios.post('/api/users/', newUser);
      setUserDialog(false);
      setNewUser({
        username: '', email: '', full_name: '', role: 'operator',
        password: '', department: '', employee_id: ''
      });
      loadUsers();
      alert('User created successfully!');
    } catch (err) {
      alert('Failed to create user: ' + (err.response?.data?.detail || err.message));
    }
  };

  const loadBoards = async () => {
    try {
      const response = await axios.get('/api/boards/all');
      if (Array.isArray(response.data)) {
        setBoards(response.data);
      } else if (response.data && Array.isArray(response.data.boards)) {
        setBoards(response.data.boards);
      } else {
        setBoards([]);
      }
    } catch (err) {
      console.error('Failed to load boards:', err);
      setBoards([]);
    }
  };

  const loadSteps = async () => {
    try {
      const response = await axios.get('/api/steps/');
      setSteps(response.data);
    } catch (err) {
      console.error('Failed to load steps:', err);
    }
  };

  const loadStats = async () => {
    try {
      const response = await axios.get('/api/dashboard/summary');
      setStats(response.data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const loadNotifications = async () => {
    try {
      const [notifRes, countRes] = await Promise.all([
        axios.get('/api/notifications/'),
        axios.get('/api/notifications/unread-count')
      ]);
      setNotifications(notifRes.data);
      setUnreadCount(countRes.data.unread_count);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`/api/notifications/${notificationId}/read`);
      loadNotifications();
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put('/api/notifications/read-all');
      loadNotifications();
      setNotificationAnchor(null);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const createBoard = async () => {
    if (!newBoard.board_id.trim()) return;
    try {
      const boardData = {
        board_id: newBoard.board_id.trim(),
        board_name: newBoard.board_name || null,
        batch_number: newBoard.batch_number || null,
        priority: newBoard.priority || 'medium',
        estimated_days: parseInt(newBoard.estimated_days) || 1,
        assigned_to: newBoard.assigned_to || null
      };
      
      await axios.post('/api/boards/create', boardData);
      
      setNewBoard({
        board_id: '', board_name: '', batch_number: '',
        priority: 'medium', estimated_days: 1, assigned_to: ''
      });
      setCreateDialog(false);
      loadBoards();
      loadStats();
    } catch (err) {
      alert('Failed to create board: ' + (err.response?.data?.detail || err.message));
    }
  };

  const updateBoard = async () => {
    const formData = new FormData();
    formData.append('step_id', updateData.step_id);
    formData.append('status', updateData.status);
    formData.append('comment', updateData.comment);
    if (updateData.time_spent_minutes) formData.append('time_spent_minutes', updateData.time_spent_minutes);
    if (updateData.machine_id) formData.append('machine_id', updateData.machine_id);
    if (updateData.assigned_to) formData.append('assigned_to', updateData.assigned_to);
    if (updateData.defect_description) formData.append('defect_description', updateData.defect_description);
    
    if (selectedImages && selectedImages.length > 0) {
      selectedImages.forEach((file) => {
        formData.append('images', file);
      });
    }
    
    try {
      await axios.post(`/api/boards/${selectedBoard.id}/update-step`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUpdateDialog(false);
      setUpdateData({ 
        step_id: '', 
        status: 'done', 
        comment: '', 
        time_spent_minutes: 30, 
        machine_id: '', 
        assigned_to: '',
        defect_description: ''
      });
      setSelectedImages([]);
      loadBoards();
      loadStats();
      if (selectedBoard) {
        const response = await axios.get(`/api/boards/${selectedBoard.id}/history`);
        setSelectedBoard(response.data);
      }
    } catch (err) {
      alert('Failed to update: ' + err.message);
    }
  };

  const viewBoard = async (board) => {
    try {
      const response = await axios.get(`/api/boards/${board.id}/history`);
      setSelectedBoard(response.data);
      setCurrentView('detail');
    } catch (err) {
      console.error('Failed to load board details:', err);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'done': return <PassIcon fontSize="small" />;
      case 'failed': return <FailIcon fontSize="small" />;
      default: return <RepairIcon fontSize="small" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'done': return 'success';
      case 'failed': return 'error';
      case 'in_progress': return 'warning';
      default: return 'default';
    }
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setUser(null);
    setSelectedBoard(null);
    setCurrentView('dashboard');
    localStorage.removeItem('access_token');
    delete axios.defaults.headers.common['Authorization'];
  };

  const drawerContent = (
    <Box sx={{ mt: 2 }}>
      <List>
        <ListItemButton selected={currentView === 'dashboard'} onClick={() => { setCurrentView('dashboard'); setDrawerOpen(false); }}>
          <ListItemIcon><DashboardIcon /></ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItemButton>
        
        <ListItemButton selected={currentView === 'boards'} onClick={() => { setCurrentView('boards'); setDrawerOpen(false); }}>
          <ListItemIcon><BoardIcon /></ListItemIcon>
          <ListItemText primary="Boards" />
        </ListItemButton>
        
        {user?.role === 'admin' && (
          <>
            <Divider sx={{ my: 2 }} />
            <ListItem>
              <ListItemText>
                <Typography variant="subtitle2" color="text.secondary">ADMIN</Typography>
              </ListItemText>
            </ListItem>
            
            <ListItemButton selected={currentView === 'users'} onClick={() => { setCurrentView('users'); setDrawerOpen(false); }}>
              <ListItemIcon><PeopleIcon /></ListItemIcon>
              <ListItemText primary="Users" />
            </ListItemButton>
          </>
        )}
      </List>
    </Box>
  );

  const UsersView = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">User Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setUserDialog(true)}>
          Add User
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Full Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map(u => (
              <TableRow key={u.id}>
                <TableCell>{u.username}</TableCell>
                <TableCell>{u.full_name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Chip 
                    label={u.role} 
                    size="small"
                    color={u.role === 'admin' ? 'error' : u.role === 'manager' ? 'warning' : 'default'}
                  />
                </TableCell>
                <TableCell>{u.department || '-'}</TableCell>
                <TableCell>
                  <Chip label={u.is_active ? 'Active' : 'Inactive'} size="small" color={u.is_active ? 'success' : 'default'} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  if (!loggedIn) {
    return (
      <Container maxWidth="xs" sx={{ mt: 8 }}>
        <Card elevation={3}>
          <CardContent>
            <Box textAlign="center" mb={3}>
              <Typography variant="h4" gutterBottom>PCB Tracker</Typography>
              <Typography variant="body2" color="text.secondary">Manufacturing Execution System</Typography>
            </Box>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField
              fullWidth label="Username" value={username}
              onChange={(e) => setUsername(e.target.value)} margin="normal"
              disabled={loading} onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
            <TextField
              fullWidth label="Password" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)} margin="normal"
              disabled={loading} onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
            <Button fullWidth variant="contained" onClick={handleLogin} disabled={loading} sx={{ mt: 2 }} size="large">
              {loading ? <CircularProgress size={24} /> : 'Login'}
            </Button>
            <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }} color="text.secondary">
              Demo: admin / admin123
            </Typography>
          </CardContent>
        </Card>
      </Container>
    );
  }

  const DashboardView = () => {
    const priorityCounts = {
      urgent: Array.isArray(boards) ? boards.filter(b => b.priority === 'urgent').length : 0,
      high: Array.isArray(boards) ? boards.filter(b => b.priority === 'high').length : 0,
      medium: Array.isArray(boards) ? boards.filter(b => b.priority === 'medium').length : 0,
      low: Array.isArray(boards) ? boards.filter(b => b.priority === 'low').length : 0,
    };

    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Dashboard</Typography>
          <IconButton onClick={() => { loadBoards(); loadStats(); }}><RefreshIcon /></IconButton>
        </Box>
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card><CardContent><Typography color="text.secondary">Total Boards</Typography><Typography variant="h3">{stats?.total_boards || 0}</Typography></CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'warning.light' }}><CardContent><Typography color="text.secondary">In Progress</Typography><Typography variant="h3">{Array.isArray(boards) ? boards.filter(b => b.status === 'in_progress').length : 0}</Typography></CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'info.light' }}><CardContent><Typography color="text.secondary">Pending Review</Typography><Typography variant="h3">{Array.isArray(boards) ? boards.filter(b => b.status === 'pending_review').length : 0}</Typography></CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'success.light' }}><CardContent><Typography color="text.secondary">Completed</Typography><Typography variant="h3">{stats?.completed_boards || 0}</Typography></CardContent></Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Priority Distribution</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead><TableRow><TableCell>Priority</TableCell><TableCell align="right">Count</TableCell></TableRow></TableHead>
                  <TableBody>
                    <TableRow><TableCell><Chip label="URGENT" color="error" size="small" /></TableCell><TableCell align="right">{priorityCounts.urgent}</TableCell></TableRow>
                    <TableRow><TableCell><Chip label="HIGH" color="warning" size="small" /></TableCell><TableCell align="right">{priorityCounts.high}</TableCell></TableRow>
                    <TableRow><TableCell><Chip label="MEDIUM" color="primary" size="small" /></TableCell><TableCell align="right">{priorityCounts.medium}</TableCell></TableRow>
                    <TableRow><TableCell><Chip label="LOW" color="default" size="small" /></TableCell><TableCell align="right">{priorityCounts.low}</TableCell></TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Recent Boards</Typography>
              <TableContainer sx={{ maxHeight: 300 }}>
                <Table stickyHeader size="small">
                  <TableHead><TableRow><TableCell>Board ID</TableCell><TableCell>Status</TableCell><TableCell>Priority</TableCell></TableRow></TableHead>
                  <TableBody>
                    {Array.isArray(boards) && boards.slice(0, 8).map(board => (
                      <TableRow key={board.id} hover sx={{ cursor: 'pointer' }} onClick={() => viewBoard(board)}>
                        <TableCell>{board.board_id}</TableCell>
                        <TableCell><Chip label={board.status || 'unknown'} size="small" color={board.status === 'completed' ? 'success' : board.status === 'pending_review' ? 'warning' : board.status === 'rejected' ? 'error' : 'default'} /></TableCell>
                        <TableCell><Chip label={board.priority || 'medium'} size="small" color={board.priority === 'urgent' ? 'error' : board.priority === 'high' ? 'warning' : 'default'} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const BoardsView = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">All Boards</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateDialog(true)}>New Board</Button>
      </Box>
      <Grid container spacing={2}>
        {Array.isArray(boards) && boards.map(board => (
          <Grid item xs={12} sm={6} md={4} key={board.id}>
            <Card sx={{ cursor: 'pointer' }} onClick={() => viewBoard(board)}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">{board.board_id}</Typography>
                  <Chip label={board.status || 'unknown'} color={board.status === 'completed' ? 'success' : 'primary'} size="small" />
                </Box>
                {board.board_name && <Typography variant="body2" color="text.secondary">{board.board_name}</Typography>}
                {board.current_step && <Typography variant="body2" sx={{ mt: 1 }}>Current Step: {board.current_step}</Typography>}
                <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                  <Typography variant="caption">Created: {board.created_at ? new Date(board.created_at).toLocaleDateString() : 'N/A'}</Typography>
                  <Chip label={board.priority || 'medium'} size="small" color={board.priority === 'urgent' ? 'error' : board.priority === 'high' ? 'warning' : 'default'} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      {Array.isArray(boards) && boards.length === 0 && <Alert severity="info" sx={{ mt: 2 }}>No boards yet. Click "New Board" to create one.</Alert>}
    </Box>
  );

  const BoardDetailView = () => (
    <Box>
      <Box display="flex" alignItems="center" mb={2}>
        <Button onClick={() => setCurrentView('boards')} sx={{ mr: 2 }}>← Back</Button>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>Board: {selectedBoard?.board_id}</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setUpdateDialog(true)}>Update Status</Button>
      </Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Board Info</Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body2"><strong>Board Name:</strong> {selectedBoard?.board_name || '-'}</Typography>
            <Typography variant="body2"><strong>Batch:</strong> {selectedBoard?.batch_number || '-'}</Typography>
            <Typography variant="body2">
              <strong>Priority:</strong> 
              <Chip 
                label={selectedBoard?.priority || 'medium'} 
                size="small"
                color={selectedBoard?.priority === 'urgent' ? 'error' : selectedBoard?.priority === 'high' ? 'warning' : 'default'}
                sx={{ ml: 1 }}
              />
            </Typography>
            <Typography variant="body2"><strong>Status:</strong> {selectedBoard?.status}</Typography>
            <Typography variant="body2"><strong>Current Step:</strong> {selectedBoard?.current_step || 'Created'}</Typography>
            <Typography variant="body2">
              <strong>Assigned To:</strong> {selectedBoard?.assignee?.full_name || 'Unassigned'}
              {(user?.role === 'admin' || user?.role === 'manager') && (
                <Button 
                  size="small" 
                  sx={{ ml: 1 }} 
                  startIcon={<AssignIcon />}
                  onClick={() => {
                    setUpdateData({
                      ...updateData,
                      step_id: selectedBoard?.current_step_id || steps[0]?.id || '',
                      status: 'in_progress',
                      comment: '',
                      time_spent_minutes: 0,
                      defect_description: '',
                      assigned_to: ''
                    });
                    setUpdateDialog(true);
                  }}
                >
                  Reassign
                </Button>
              )}
            </Typography>
            <Typography variant="body2"><strong>Created By:</strong> {selectedBoard?.creator?.full_name || '-'}</Typography>
            <Typography variant="body2"><strong>Created:</strong> {selectedBoard?.created_at ? new Date(selectedBoard.created_at).toLocaleString() : 'N/A'}</Typography>
            <Typography variant="body2"><strong>Estimated Days:</strong> {selectedBoard?.estimated_days || 1}</Typography>
            
            {selectedBoard?.first_comment && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="primary">First Comment</Typography>
                <Paper variant="outlined" sx={{ p: 1, mt: 1, bgcolor: 'grey.50' }}>
                  <Typography variant="body2">{selectedBoard.first_comment}</Typography>
                </Paper>
              </Box>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Process History</Typography>
            <Divider sx={{ mb: 2 }} />
            {Array.isArray(selectedBoard?.logs) && selectedBoard.logs.length > 0 ? (
              selectedBoard.logs.map((log) => (
                <Box key={log.id} sx={{ mb: 3 }}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: getStatusColor(log.status) + '.main' }}>{getStatusIcon(log.status)}</Avatar>
                    <Box flexGrow={1}>
                      <Typography variant="subtitle1">{log.step?.name || 'Unknown Step'}</Typography>
                      <Typography variant="caption">{log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}</Typography>
                    </Box>
                    <Chip label={log.status} color={getStatusColor(log.status)} size="small" />
                  </Box>
                  <Card variant="outlined" sx={{ ml: 5 }}>
                    <CardContent>
                      {log.user && <Typography variant="body2">Operator: {log.user.full_name}</Typography>}
                      {log.time_spent_minutes && <Typography variant="body2">Time: {log.time_spent_minutes} min</Typography>}
                      {log.comment && <Typography variant="body2" sx={{ mt: 1 }}>{log.comment}</Typography>}
                      {log.defect_description && (
                        <Alert severity="warning" sx={{ mt: 1 }}>
                          <strong>Defect:</strong> {log.defect_description}
                        </Alert>
                      )}
                      {log.images && log.images.length > 0 && (
                        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {log.images.map((img, idx) => (
                            <img
                              key={idx}
                              src={`http://localhost:8000/${img.image_path}`}
                              alt={`Upload ${idx + 1}`}
                              style={{ 
                                maxWidth: '100%', 
                                maxHeight: 150, 
                                cursor: 'pointer',
                                borderRadius: 4,
                                border: '1px solid #ddd'
                              }}
                              onClick={() => window.open(`http://localhost:8000/${img.image_path}`, '_blank')}
                            />
                          ))}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Box>
              ))
            ) : <Alert severity="info">No history yet.</Alert>}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: 1300 }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => setDrawerOpen(true)} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>PCB Manufacturing Tracker</Typography>
          
          <IconButton color="inherit" onClick={(e) => {
            setNotificationAnchor(e.currentTarget);
            loadNotifications();
          }}>
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          
          <Box display="flex" alignItems="center">
            <Typography variant="body2" sx={{ mr: 2 }}>{user?.full_name} ({user?.role})</Typography>
            <IconButton color="inherit" onClick={handleLogout}><LogoutIcon /></IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={() => setNotificationAnchor(null)}
        PaperProps={{ sx: { maxWidth: 360, maxHeight: 400 } }}
      >
        <Box sx={{ p: 1 }}>
          <Typography variant="subtitle2" fontWeight="bold">Notifications</Typography>
        </Box>
        <Divider />
        {notifications.length === 0 ? (
          <MuiMenuItem disabled>
            <Typography variant="body2" color="text.secondary">No notifications</Typography>
          </MuiMenuItem>
        ) : (
          notifications.slice(0, 10).map(notif => (
            <MuiMenuItem 
              key={notif.id} 
              onClick={() => {
                markAsRead(notif.id);
                if (notif.link) window.location.href = notif.link;
              }}
              sx={{ bgcolor: notif.is_read ? 'transparent' : 'action.hover', whiteSpace: 'normal' }}
            >
              <Box>
                <Typography variant="subtitle2">{notif.title}</Typography>
                <Typography variant="body2" color="text.secondary">{notif.message}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {notif.created_at ? new Date(notif.created_at).toLocaleString() : ''}
                </Typography>
              </Box>
            </MuiMenuItem>
          ))
        )}
        {notifications.length > 0 && (
          <>
            <Divider />
            <MuiMenuItem onClick={markAllAsRead}>
              <Typography variant="body2" color="primary">Mark all as read</Typography>
            </MuiMenuItem>
          </>
        )}
      </Menu>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: drawerWidth, mt: 8 }}>{drawerContent}</Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        <Container>
          {currentView === 'dashboard' && <DashboardView />}
          {currentView === 'boards' && <BoardsView />}
          {currentView === 'detail' && <BoardDetailView />}
          {currentView === 'users' && <UsersView />}
        </Container>
      </Box>

      {/* Create User Dialog */}
      <Dialog open={userDialog} onClose={() => setUserDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Username" value={newUser.username} onChange={(e) => setNewUser({...newUser, username: e.target.value})} margin="normal" required />
          <TextField fullWidth label="Password" type="password" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} margin="normal" required />
          <TextField fullWidth label="Full Name" value={newUser.full_name} onChange={(e) => setNewUser({...newUser, full_name: e.target.value})} margin="normal" required />
          <TextField fullWidth label="Email" type="email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} margin="normal" required />
          <TextField fullWidth label="Department" value={newUser.department} onChange={(e) => setNewUser({...newUser, department: e.target.value})} margin="normal" />
          <TextField fullWidth label="Employee ID" value={newUser.employee_id} onChange={(e) => setNewUser({...newUser, employee_id: e.target.value})} margin="normal" />
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value})} label="Role">
              <MenuItem value="operator">Operator</MenuItem>
              <MenuItem value="supervisor">Supervisor</MenuItem>
              <MenuItem value="manager">Manager</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialog(false)}>Cancel</Button>
          <Button onClick={createUser} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Create Board Dialog */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Board</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Board ID" value={newBoard.board_id} onChange={(e) => setNewBoard({...newBoard, board_id: e.target.value})} margin="normal" required />
          <TextField fullWidth label="Board Name" value={newBoard.board_name} onChange={(e) => setNewBoard({...newBoard, board_name: e.target.value})} margin="normal" />
          <TextField fullWidth label="Batch Number" value={newBoard.batch_number} onChange={(e) => setNewBoard({...newBoard, batch_number: e.target.value})} margin="normal" />
          <FormControl fullWidth margin="normal">
            <InputLabel>Priority</InputLabel>
            <Select value={newBoard.priority} onChange={(e) => setNewBoard({...newBoard, priority: e.target.value})} label="Priority">
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="urgent">Urgent</MenuItem>
            </Select>
          </FormControl>
          <TextField fullWidth label="Estimated Days" type="number" value={newBoard.estimated_days} onChange={(e) => setNewBoard({...newBoard, estimated_days: parseInt(e.target.value) || 1})} margin="normal" />
          <FormControl fullWidth margin="normal">
            <InputLabel>Assign To</InputLabel>
            <Select value={newBoard.assigned_to} onChange={(e) => setNewBoard({...newBoard, assigned_to: e.target.value})} label="Assign To">
              <MenuItem value="">-- Unassigned --</MenuItem>
              {users.filter(u => u.role === 'operator' && u.is_active).map(user => (
                <MenuItem key={user.id} value={user.id}>{user.full_name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
          <Button onClick={createBoard} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Update Dialog */}
      <Dialog open={updateDialog} onClose={() => { setUpdateDialog(false); setSelectedImages([]); }} maxWidth="sm" fullWidth>
        <DialogTitle>Update Board: {selectedBoard?.board_id}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Step</InputLabel>
            <Select value={updateData.step_id} onChange={(e) => setUpdateData({...updateData, step_id: e.target.value})} label="Step">
              {steps.map(step => <MenuItem key={step.id} value={step.id}>{step.name}</MenuItem>)}
            </Select>
          </FormControl>
          
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select value={updateData.status} onChange={(e) => setUpdateData({...updateData, status: e.target.value})} label="Status">
              <MenuItem value="in_progress">🔄 In Progress</MenuItem>
              <MenuItem value="done">✅ Done - Send for Review</MenuItem>
              <MenuItem value="failed">❌ Failed - Needs Rework</MenuItem>
            </Select>
          </FormControl>
          
          {/* ASSIGN TO OPERATOR */}
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Assign To (Next Operator)</InputLabel>
            <Select 
              value={updateData.assigned_to} 
              onChange={(e) => setUpdateData({...updateData, assigned_to: e.target.value})} 
              label="Assign To (Next Operator)"
            >
              <MenuItem value="">-- Keep Unassigned --</MenuItem>
              {users.filter(u => (u.role === 'operator' || u.role === 'supervisor') && u.is_active).map(user => (
                <MenuItem key={user.id} value={user.id}>
                  {user.full_name} ({user.department || 'No Dept'})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField fullWidth label="Time Spent (minutes)" type="number" value={updateData.time_spent_minutes} onChange={(e) => setUpdateData({...updateData, time_spent_minutes: parseInt(e.target.value) || 0})} sx={{ mt: 2 }} />
          <TextField fullWidth label="Comment" multiline rows={3} value={updateData.comment} onChange={(e) => setUpdateData({...updateData, comment: e.target.value})} sx={{ mt: 2 }} />
          
          {/* DEFECT DESCRIPTION - Shows when failed */}
          {updateData.status === 'failed' && (
            <TextField 
              fullWidth 
              label="Defect Description" 
              multiline rows={2} 
              value={updateData.defect_description} 
              onChange={(e) => setUpdateData({...updateData, defect_description: e.target.value})} 
              sx={{ mt: 2 }} 
            />
          )}
          
          {/* IMAGE UPLOAD */}
          <Box sx={{ mt: 2 }}>
            <Button variant="outlined" component="label" startIcon={<ImageIcon />} fullWidth>
              Upload Images
              <input type="file" hidden multiple accept="image/*" onChange={(e) => setSelectedImages(Array.from(e.target.files))} />
            </Button>
            {selectedImages.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption">{selectedImages.length} file(s) selected:</Typography>
                {selectedImages.map((file, idx) => (
                  <Chip key={idx} label={file.name} size="small" onDelete={() => setSelectedImages(selectedImages.filter((_, i) => i !== idx))} sx={{ mr: 1, mt: 1 }} />
                ))}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setUpdateDialog(false); setSelectedImages([]); }}>Cancel</Button>
          <Button onClick={updateBoard} variant="contained" disabled={!updateData.step_id}>Update</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default App;
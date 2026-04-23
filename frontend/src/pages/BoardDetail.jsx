// frontend/src/pages/BoardDetail.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  ArrowBack as BackIcon,
  Add as AddIcon,
  CheckCircle as PassIcon,
  Error as FailIcon,
  Build as RepairIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { useSnackbar } from 'notistack';
import { useAuth } from '../contexts/AuthContext';

// ... rest of the file stays exactly the same
const BoardDetail = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [formData, setFormData] = useState({
    step_id: '',
    status: 'done',
    comment: '',
    defect_description: '',
    repair_action: '',
  });

  const { data: board, isLoading } = useQuery(
    ['board', boardId],
    async () => {
      const response = await axios.get(`/api/boards/${boardId}/history`);
      return response.data;
    }
  );

  const { data: steps } = useQuery(
    'steps',
    async () => {
      const response = await axios.get('/api/steps/');
      return response.data;
    }
  );

  const updateBoardMutation = useMutation(
    async (formDataToSend) => {
      await axios.post(`/api/boards/${boardId}/update-step`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['board', boardId]);
        queryClient.invalidateQueries('boards');
        enqueueSnackbar('Board updated successfully', { variant: 'success' });
        setUpdateDialogOpen(false);
        resetForm();
      },
      onError: (error) => {
        enqueueSnackbar(error.response?.data?.detail || 'Failed to update board', {
          variant: 'error',
        });
      },
    }
  );

  const resetForm = () => {
    setFormData({
      step_id: '',
      status: 'done',
      comment: '',
      defect_description: '',
      repair_action: '',
    });
    setSelectedImage(null);
  };

  const handleSubmit = async () => {
    const formDataToSend = new FormData();
    formDataToSend.append('step_id', formData.step_id);
    formDataToSend.append('status', formData.status);
    if (formData.comment) {
      formDataToSend.append('comment', formData.comment);
    }
    if (formData.defect_description) {
      formDataToSend.append('defect_description', formData.defect_description);
    }
    if (formData.repair_action) {
      formDataToSend.append('repair_action', formData.repair_action);
    }
    if (selectedImage) {
      formDataToSend.append('image', selectedImage);
    }

    updateBoardMutation.mutate(formDataToSend);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'done':
        return 'success';
      case 'failed':
        return 'error';
      case 'in_progress':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'done':
        return <PassIcon />;
      case 'failed':
        return <FailIcon />;
      case 'in_progress':
        return <RepairIcon />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!board) {
    return (
      <Alert severity="error">Board not found</Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <IconButton onClick={() => navigate('/boards')} sx={{ mr: 2 }}>
            <BackIcon />
          </IconButton>
          <Typography variant="h4">Board: {board.board_id}</Typography>
          <Chip
            label={board.status}
            color={board.status === 'completed' ? 'success' : 'primary'}
            sx={{ ml: 2 }}
          />
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setUpdateDialogOpen(true)}
        >
          Update Status
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Board Information */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Board Information</Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Created By: {board.creator?.full_name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Created At: {format(new Date(board.created_at), 'PPpp')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Current Step: {board.current_step || 'Created'}
              </Typography>
            </Box>

            {board.first_comment && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" color="primary">
                  First Comment
                </Typography>
                <Paper variant="outlined" sx={{ p: 1, mt: 1, bgcolor: 'grey.50' }}>
                  <Typography variant="body2">{board.first_comment}</Typography>
                </Paper>
              </Box>
            )}

            {board.last_comment && board.last_comment !== board.first_comment && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="primary">
                  Latest Comment
                </Typography>
                <Paper variant="outlined" sx={{ p: 1, mt: 1, bgcolor: 'grey.50' }}>
                  <Typography variant="body2">{board.last_comment}</Typography>
                </Paper>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Timeline */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Process Timeline</Typography>
            <Timeline position="alternate">
              {board.logs.map((log, index) => (
                <TimelineItem key={log.id}>
                  <TimelineOppositeContent
                    sx={{ m: 'auto 0' }}
                    align="right"
                    variant="body2"
                    color="text.secondary"
                  >
                    {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineConnector />
                    <TimelineDot color={getStatusColor(log.status)}>
                      {getStatusIcon(log.status)}
                    </TimelineDot>
                    <TimelineConnector />
                  </TimelineSeparator>
                  <TimelineContent sx={{ py: '12px', px: 2 }}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" alignItems="center" mb={1}>
                          <Typography variant="subtitle1" component="span">
                            {log.step?.name}
                          </Typography>
                          <Chip
                            label={log.status}
                            size="small"
                            color={getStatusColor(log.status)}
                            sx={{ ml: 1 }}
                          />
                        </Box>
                        
                        <Box display="flex" alignItems="center" mb={1}>
                          <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
                            {log.user?.full_name?.charAt(0)}
                          </Avatar>
                          <Typography variant="body2">
                            {log.user?.full_name}
                          </Typography>
                        </Box>

                        {log.comment && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {log.comment}
                          </Typography>
                        )}

                        {log.defect_description && (
                          <Alert severity="warning" sx={{ mt: 1 }}>
                            <Typography variant="body2">
                              <strong>Defect:</strong> {log.defect_description}
                            </Typography>
                          </Alert>
                        )}

                        {log.repair_action && (
                          <Alert severity="info" sx={{ mt: 1 }}>
                            <Typography variant="body2">
                              <strong>Repair Action:</strong> {log.repair_action}
                            </Typography>
                          </Alert>
                        )}

                        {log.image_path && (
                          <Box sx={{ mt: 1 }}>
                            <img
                              src={`/${log.image_path}`}
                              alt="Step documentation"
                              style={{
                                maxWidth: '100%',
                                maxHeight: 200,
                                cursor: 'pointer',
                                borderRadius: 4,
                              }}
                              onClick={() => window.open(`/${log.image_path}`, '_blank')}
                            />
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          </Paper>
        </Grid>
      </Grid>

      {/* Update Dialog */}
      <Dialog open={updateDialogOpen} onClose={() => setUpdateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Board Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Step</InputLabel>
            <Select
              value={formData.step_id}
              onChange={(e) => setFormData({ ...formData, step_id: e.target.value })}
              label="Step"
            >
              {steps?.map((step) => (
                <MenuItem key={step.id} value={step.id}>
                  {step.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              label="Status"
            >
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="done">Passed</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            margin="normal"
            label="Comment"
            multiline
            rows={3}
            value={formData.comment}
            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
          />

          {formData.status === 'failed' && (
            <TextField
              fullWidth
              margin="normal"
              label="Defect Description"
              multiline
              rows={2}
              value={formData.defect_description}
              onChange={(e) => setFormData({ ...formData, defect_description: e.target.value })}
            />
          )}

          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<ImageIcon />}
            >
              Upload Image
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => setSelectedImage(e.target.files[0])}
              />
            </Button>
            {selectedImage && (
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Selected: {selectedImage.name}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.step_id || updateBoardMutation.isLoading}
          >
            {updateBoardMutation.isLoading ? <CircularProgress size={24} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BoardDetail;
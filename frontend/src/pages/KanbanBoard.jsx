// frontend/src/pages/KanbanBoard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  Avatar,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreIcon,
  Assignment as BoardIcon,
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format } from 'date-fns';
import { useSnackbar } from 'notistack';

const KanbanBoard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newBoardId, setNewBoardId] = useState('');

  const { data: boards, isLoading } = useQuery(
    'boards',
    async () => {
      const response = await axios.get('/api/boards/all');
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

  const createBoardMutation = useMutation(
    async (boardId) => {
      await axios.post('/api/boards/create', { board_id: boardId });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('boards');
        enqueueSnackbar('Board created successfully', { variant: 'success' });
        setCreateDialogOpen(false);
        setNewBoardId('');
      },
      onError: (error) => {
        enqueueSnackbar(error.response?.data?.detail || 'Failed to create board', {
          variant: 'error',
        });
      },
    }
  );

  const columns = [
    { id: 'created', title: 'Created', stepId: null },
    ...(steps || []).map(step => ({
      id: `step_${step.id}`,
      title: step.name,
      stepId: step.id,
    })),
    { id: 'completed', title: 'Completed', stepId: 'completed' },
  ];

  const getBoardsByColumn = (columnId) => {
    if (!boards) return [];

    if (columnId === 'created') {
      return boards.filter(board => board.status === 'created' && !board.current_step);
    }

    if (columnId === 'completed') {
      return boards.filter(board => board.status === 'completed');
    }

    const stepId = parseInt(columnId.replace('step_', ''));
    return boards.filter(board => {
      const currentStep = steps?.find(s => s.name === board.current_step);
      return currentStep?.id === stepId && board.status === 'in_progress';
    });
  };

  const onDragEnd = (result) => {
    // Handle drag and drop - move board to different step
    const { destination, source, draggableId } = result;

    if (!destination || destination.droppableId === source.droppableId) {
      return;
    }

    // Implement board movement logic here
    console.log('Move board', draggableId, 'to', destination.droppableId);
  };

  const handleCreateBoard = () => {
    if (newBoardId.trim()) {
      createBoardMutation.mutate(newBoardId.trim());
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Kanban Board</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          New Board
        </Button>
      </Box>

      <DragDropContext onDragEnd={onDragEnd}>
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            overflowX: 'auto',
            pb: 2,
            minHeight: '70vh',
          }}
        >
          {columns.map(column => (
            <Paper
              key={column.id}
              sx={{
                minWidth: 300,
                maxWidth: 300,
                bgcolor: 'grey.100',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box
                sx={{
                  p: 2,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="h6">
                  {column.title}
                </Typography>
                <Chip
                  label={getBoardsByColumn(column.id).length}
                  size="small"
                  color="primary"
                />
              </Box>

              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <Box
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    sx={{
                      p: 1,
                      flexGrow: 1,
                      minHeight: 200,
                      bgcolor: snapshot.isDraggingOver ? 'action.hover' : 'transparent',
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    {getBoardsByColumn(column.id).map((board, index) => (
                      <Draggable
                        key={board.id}
                        draggableId={board.id.toString()}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            sx={{
                              mb: 1,
                              cursor: snapshot.isDragging ? 'grabbing' : 'pointer',
                              '&:hover': {
                                boxShadow: 3,
                              },
                            }}
                            onClick={() => navigate(`/boards/${board.id}`)}
                          >
                            <CardContent>
                              <Box display="flex" alignItems="center" mb={1}>
                                <BoardIcon sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography variant="subtitle1" fontWeight="bold">
                                  {board.board_id}
                                </Typography>
                              </Box>
                              
                              {board.latest_user && (
                                <Box display="flex" alignItems="center" mt={1}>
                                  <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
                                    {board.latest_user.charAt(0)}
                                  </Avatar>
                                  <Typography variant="caption" color="text.secondary">
                                    {board.latest_user}
                                  </Typography>
                                </Box>
                              )}
                              
                              {board.latest_comment && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{
                                    mt: 1,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                  }}
                                >
                                  {board.latest_comment}
                                </Typography>
                              )}
                              
                              <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                                {format(new Date(board.created_at), 'MMM dd, yyyy')}
                              </Typography>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </Box>
                )}
              </Droppable>
            </Paper>
          ))}
        </Box>
      </DragDropContext>

      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
        <DialogTitle>Create New Board</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Board ID"
            fullWidth
            variant="outlined"
            value={newBoardId}
            onChange={(e) => setNewBoardId(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCreateBoard();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateBoard}
            variant="contained"
            disabled={!newBoardId.trim() || createBoardMutation.isLoading}
          >
            {createBoardMutation.isLoading ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default KanbanBoard;
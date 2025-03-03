import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

// Simple interfaces
interface Task {
  id: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
  team: string;
  expanded: boolean;
  subtasks: Subtask[];
}

interface Subtask {
  id: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
  team: string;
}

// Get today's date
const today = new Date().toISOString().split('T')[0];

// Sample data - simple structure
const sampleTasks: Task[] = [
  {
    id: 'task1',
    title: 'Project Planning',
    startDate: today,
    endDate: new Date(new Date(today).setDate(new Date(today).getDate() + 7)).toISOString().split('T')[0],
    team: 'Management',
    expanded: true,
    subtasks: [
      {
        id: 'subtask1',
        title: 'Requirements Gathering',
        startDate: today,
        endDate: new Date(new Date(today).setDate(new Date(today).getDate() + 3)).toISOString().split('T')[0],
        team: 'Product'
      }
    ]
  },
  {
    id: 'task2',
    title: 'Development',
    startDate: new Date(new Date(today).setDate(new Date(today).getDate() + 8)).toISOString().split('T')[0],
    endDate: new Date(new Date(today).setDate(new Date(today).getDate() + 15)).toISOString().split('T')[0],
    team: 'Engineering',
    expanded: true,
    subtasks: []
  }
];

// Team colors
const teamColors: Record<string, string> = {
  'Management': '#8884d8',
  'Product': '#82ca9d',
  'Engineering': '#ffc658',
  'Testing': '#ff8042'
};

// Simple Gantt Chart component
const TableGanttChart: React.FC = () => {
  // State
  const [tasks, setTasks] = useState<Task[]>(sampleTasks);
  const [cellWidth, setCellWidth] = useState(40); // Wider cells for better visibility
  const [startDate, setStartDate] = useState(today);
  const [daysToShow, setDaysToShow] = useState(30);
  
  // Generate dates for timeline
  const generateDates = () => {
    const dates = [];
    const start = new Date(startDate);
    
    for (let i = 0; i < daysToShow; i++) {
      const newDate = new Date(start);
      newDate.setDate(start.getDate() + i);
      dates.push(newDate.toISOString().split('T')[0]);
    }
    
    return dates;
  };
  
  const timelineDates = generateDates();
  
  // Toggle task expansion
  const toggleTask = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, expanded: !task.expanded } : task
    ));
  };
  
  // Calculate days between dates
  const daysBetween = (start: string | null, end: string | null): number => {
    if (!start) return 1;
    if (!end) return 1;
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    return Math.max(days, 1); // Ensure at least 1 day
  };
  
  // Format date for display
  const formatDate = (date: string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Table-Based Gantt Chart</h1>
      
      {/* Simple controls */}
      <div className="mb-4 flex gap-4">
        <div>
          <label className="block text-sm mb-1">Cell Width:</label>
          <input 
            type="range" 
            min="20" 
            max="80" 
            value={cellWidth} 
            onChange={(e) => setCellWidth(parseInt(e.target.value))} 
            className="w-32"
          />
          <span className="ml-2">{cellWidth}px</span>
        </div>
        
        <div>
          <label className="block text-sm mb-1">Start Date:</label>
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
            className="border p-1"
          />
        </div>
        
        <div>
          <label className="block text-sm mb-1">Days to Show:</label>
          <input 
            type="number" 
            value={daysToShow} 
            onChange={(e) => setDaysToShow(parseInt(e.target.value))} 
            className="border p-1 w-16"
            min="7"
            max="90"
          />
        </div>
      </div>
      
      {/* Debug information */}
      <div className="mb-4 p-2 bg-gray-100 text-xs">
        <div>Timeline dates: {timelineDates.length} days</div>
        <div>Today: {today}</div>
        <div>Cell width: {cellWidth}px</div>
        <div>First date: {timelineDates[0]}, Last date: {timelineDates[timelineDates.length - 1]}</div>
      </div>
      
      {/* Gantt Chart */}
      <div className="border rounded overflow-x-auto">
        <div className="flex">
          {/* Task list column */}
          <div className="w-64 min-w-64 bg-gray-50 border-r flex-shrink-0">
            <div className="p-2 font-semibold bg-gray-200">Tasks</div>
            {tasks.map(task => (
              <div key={task.id}>
                <div className="flex items-center p-2 border-b">
                  <button 
                    onClick={() => toggleTask(task.id)}
                    className="mr-2"
                  >
                    {task.expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  <div>
                    <div className="font-medium">{task.title}</div>
                    <div className="text-xs text-gray-500">
                      {task.startDate && task.endDate ? 
                        `${formatDate(task.startDate)} - ${formatDate(task.endDate)}` : 
                        'No dates set'}
                    </div>
                  </div>
                </div>
                
                {task.expanded && task.subtasks.map(subtask => (
                  <div key={subtask.id} className="flex items-center p-2 pl-8 border-b bg-gray-50">
                    <div className="w-4 h-0 border-t border-l border-gray-300 mr-2"></div>
                    <div>
                      <div className="font-medium">{subtask.title}</div>
                      <div className="text-xs text-gray-500">
                        {subtask.startDate && subtask.endDate ? 
                          `${formatDate(subtask.startDate)} - ${formatDate(subtask.endDate)}` : 
                          'No dates set'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          
          {/* Timeline */}
          <div className="flex-grow">
            {/* Timeline header - using TABLE for reliable horizontal layout */}
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200 sticky top-0">
                  {timelineDates.map(date => {
                    const d = new Date(date);
                    const day = d.getDate();
                    const month = d.toLocaleDateString('en-US', { month: 'short' });
                    const isFirstOfMonth = day === 1;
                    const isToday = date === today;
                    
                    return (
                      <th 
                        key={date} 
                        className={`border-r text-center p-0 ${isToday ? 'bg-blue-100' : ''}`}
                        style={{ 
                          width: `${cellWidth}px`, 
                          minWidth: `${cellWidth}px`,
                          maxWidth: `${cellWidth}px`
                        }}
                      >
                        <div style={{ padding: '3px 0' }}>
                          {isFirstOfMonth && <div className="text-xs font-bold">{month}</div>}
                          <div className="text-xs">{day}</div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
            </table>
            
            {/* Task bars area */}
            <div className="relative">
              {tasks.map((task, taskIndex) => {
                // Calculate task bar details
                const taskStart = timelineDates.indexOf(task.startDate || '');
                const taskDuration = daysBetween(task.startDate, task.endDate);
                const showTaskBar = taskStart >= 0 && task.startDate && task.endDate;
                
                return (
                  <div key={task.id}>
                    {/* Task row */}
                    <div 
                      className="border-b relative"
                      style={{ height: '40px' }}
                    >
                      {/* Grid background */}
                      <div className="absolute inset-0 flex">
                        {timelineDates.map((date, index) => (
                          <div 
                            key={`grid-${index}`}
                            className={`border-r ${date === today ? 'bg-blue-50' : ''}`}
                            style={{ 
                              width: `${cellWidth}px`,
                              minWidth: `${cellWidth}px`,
                              height: '100%'
                            }}
                          />
                        ))}
                      </div>
                      
                      {/* Task bar */}
                      {showTaskBar && (
                        <div 
                          className="absolute h-6 top-2 rounded text-white text-xs flex items-center px-2 overflow-hidden whitespace-nowrap z-10"
                          style={{
                            left: `${taskStart * cellWidth}px`,
                            width: `${taskDuration * cellWidth}px`,
                            backgroundColor: teamColors[task.team] || '#888'
                          }}
                        >
                          {task.title}
                        </div>
                      )}
                    </div>
                    
                    {/* Subtask rows */}
                    {task.expanded && task.subtasks.map(subtask => {
                      const subtaskStart = timelineDates.indexOf(subtask.startDate || '');
                      const subtaskDuration = daysBetween(subtask.startDate, subtask.endDate);
                      const showSubtaskBar = subtaskStart >= 0 && subtask.startDate && subtask.endDate;
                      
                      return (
                        <div 
                          key={subtask.id}
                          className="border-b relative bg-gray-50"
                          style={{ height: '40px' }}
                        >
                          {/* Grid background */}
                          <div className="absolute inset-0 flex">
                            {timelineDates.map((date, index) => (
                              <div 
                                key={`grid-sub-${index}`}
                                className={`border-r ${date === today ? 'bg-blue-50' : ''}`}
                                style={{ 
                                  width: `${cellWidth}px`,
                                  minWidth: `${cellWidth}px`,
                                  height: '100%'
                                }}
                              />
                            ))}
                          </div>
                          
                          {/* Subtask bar */}
                          {showSubtaskBar && (
                            <div 
                              className="absolute h-6 top-2 rounded text-white text-xs flex items-center px-2 overflow-hidden whitespace-nowrap z-10"
                              style={{
                                left: `${subtaskStart * cellWidth}px`,
                                width: `${subtaskDuration * cellWidth}px`,
                                backgroundColor: teamColors[subtask.team] || '#888'
                              }}
                            >
                              {subtask.title}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Team legend */}
      <div className="mt-4 p-2 border rounded">
        <div className="font-semibold mb-2">Teams</div>
        <div className="flex gap-4">
          {Object.entries(teamColors).map(([team, color]) => (
            <div key={team} className="flex items-center">
              <div className="w-4 h-4 rounded mr-1" style={{ backgroundColor: color }}></div>
              <span>{team}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TableGanttChart;
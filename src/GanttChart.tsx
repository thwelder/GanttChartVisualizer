import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  X,
  Users, 
  Calendar, 
  ArrowRight, 
  Download, 
  Upload, 
  Save,
  Edit,
  Trash,
  FileText,
  AlertCircle,
  Check,
  Settings,
  Sliders
} from 'lucide-react';

// Define TypeScript interfaces for our data structures
interface Subtask {
  id: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
  team: string;
  dependencies: string[];
}

interface Task {
  id: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
  team: string;
  dependencies: string[];
  expanded: boolean;
  subtasks: Subtask[];
}

interface FlattenedTask {
  id: string;
  title: string;
  parentId: string | null;
}

interface EditingTask {
  id: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
  team: string;
  dependencies: string[];
  parentId: string | null;
}

interface TeamConfig {
  name: string;
  color: string;
}

// Helper function to generate unique IDs
const generateId = (): string => Math.random().toString(36).substring(2, 9);

// Get today's date and format it as YYYY-MM-DD
const today = new Date().toISOString().split('T')[0];

// Calculate the number of days between two dates
const daysBetween = (startDate: string | null, endDate: string | null): number => {
  if (!startDate) return 0;
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date(startDate);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
};

// Default teams
const defaultTeams: TeamConfig[] = [
  { name: 'Management', color: '#8884d8' },
  { name: 'Product', color: '#82ca9d' },
  { name: 'Engineering', color: '#ffc658' },
  { name: 'Frontend', color: '#ff8042' },
  { name: 'Backend', color: '#0088fe' },
  { name: 'QA', color: '#00c49f' },
  { name: 'DevOps', color: '#ffbb28' },
  { name: 'Marketing', color: '#ff8042' }
];

// Main Gantt Chart component
const GanttChart: React.FC = () => {
  // State for tasks
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<FlattenedTask[]>([]);
  
  // State for UI controls
  const [timelineStart, setTimelineStart] = useState<string>(today);
  const [timelineEnd, setTimelineEnd] = useState<string>(
    new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0]
  );
  const [showAddTask, setShowAddTask] = useState<boolean>(false);
  const [newTask, setNewTask] = useState({
    title: '',
    startDate: null as string | null,
    endDate: null as string | null,
    team: '',
    dependencies: [] as string[]
  });
  const [parentForNewTask, setParentForNewTask] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<EditingTask | null>(null);
  const [showDependencyLines, setShowDependencyLines] = useState<boolean>(true);
  
  // State for teams management
  const [teams, setTeams] = useState<TeamConfig[]>([]);
  const [teamColors, setTeamColors] = useState<Record<string, string>>({});
  const [showTeamManager, setShowTeamManager] = useState<boolean>(false);
  const [newTeam, setNewTeam] = useState({ name: '', color: '#3b82f6' });
  const [editingTeam, setEditingTeam] = useState<TeamConfig | null>(null);
  
  // State for feedback and errors
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [csvImportError, setCsvImportError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // State for settings
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [cellWidth, setCellWidth] = useState<number>(32);
  const [rowHeight, setRowHeight] = useState<number>(48);
  const [currentView, setCurrentView] = useState<'timeline' | 'list'>('timeline');
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);

  // Initialize teams and load data from localStorage
  useEffect(() => {
    try {
      // Load teams
      const savedTeams = localStorage.getItem('ganttChartTeams');
      if (savedTeams) {
        const parsedTeams = JSON.parse(savedTeams);
        setTeams(parsedTeams);
        
        // Create team colors mapping
        const colors: Record<string, string> = {};
        parsedTeams.forEach((team: TeamConfig) => {
          colors[team.name] = team.color;
        });
        setTeamColors(colors);
      } else {
        // Use default teams if none saved
        setTeams(defaultTeams);
        
        // Create team colors mapping
        const colors: Record<string, string> = {};
        defaultTeams.forEach(team => {
          colors[team.name] = team.color;
        });
        setTeamColors(colors);
      }
      
      // Load tasks
      const savedTasks = localStorage.getItem('ganttChartTasks');
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks));
        showSuccess("Tasks loaded from local storage");
      }
    } catch (error) {
      console.error("Failed to load data from localStorage:", error);
    }
  }, []);

  // Save teams to localStorage when they change
  useEffect(() => {
    try {
      if (teams.length > 0) {
        localStorage.setItem('ganttChartTeams', JSON.stringify(teams));
        
        // Update team colors mapping
        const colors: Record<string, string> = {};
        teams.forEach(team => {
          colors[team.name] = team.color;
        });
        setTeamColors(colors);
      }
    } catch (error) {
      console.error("Failed to save teams to localStorage:", error);
    }
  }, [teams]);

  // Save tasks to localStorage when they change
  useEffect(() => {
    try {
      if (tasks.length > 0) {
        localStorage.setItem('ganttChartTasks', JSON.stringify(tasks));
      }
    } catch (error) {
      console.error("Failed to save tasks to localStorage:", error);
    }
  }, [tasks]);

  // Error handling helper
  const handleError = (error: Error, context: string) => {
    console.error(`Error in ${context}:`, error);
    setErrorMessage(`${context}: ${error.message}`);
    
    // Clear error after 5 seconds
    setTimeout(() => {
      setErrorMessage(null);
    }, 5000);
  };

  // Success message helper
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  // Flatten tasks to get all task IDs for dependencies
  useEffect(() => {
    try {
      const flattenTasks = (taskList: Task[]): FlattenedTask[] => {
        let result: FlattenedTask[] = [];
        taskList.forEach(task => {
          result.push({
            id: task.id,
            title: task.title,
            parentId: null
          });
          if (task.subtasks && task.subtasks.length > 0) {
            const subtasks = task.subtasks.map(subtask => ({
              id: subtask.id,
              title: subtask.title,
              parentId: task.id
            }));
            result = [...result, ...subtasks];
          }
        });
        return result;
      };
      
      setAllTasks(flattenTasks(tasks));
    } catch (error) {
      handleError(error as Error, "Flattening tasks");
    }
  }, [tasks]);

  // Generate the timeline dates
  const generateTimelineDates = (): string[] => {
    try {
      const dates: string[] = [];
      const start = new Date(timelineStart);
      const end = new Date(timelineEnd);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d).toISOString().split('T')[0]);
      }
      
      return dates;
    } catch (error) {
      handleError(error as Error, "Generating timeline dates");
      return [];
    }
  };
  
  const timelineDates = generateTimelineDates();

  // Add a new task
  const handleAddTask = () => {
    try {
      if (!newTask.title.trim()) {
        throw new Error("Task title cannot be empty");
      }
      
      // Generate a unique ID for the new task
      const taskId = generateId();
      
      if (parentForNewTask) {
        setTasks(prevTasks => {
          return prevTasks.map(task => {
            if (task.id === parentForNewTask) {
              return {
                ...task,
                subtasks: [...task.subtasks, {
                  id: taskId,
                  title: newTask.title,
                  startDate: newTask.startDate,
                  endDate: newTask.endDate,
                  team: newTask.team,
                  dependencies: newTask.dependencies
                }]
              };
            }
            return task;
          });
        });
        showSuccess(`Added subtask "${newTask.title}"`);
      } else {
        setTasks(prevTasks => [
          ...prevTasks, 
          {
            id: taskId,
            title: newTask.title,
            startDate: newTask.startDate,
            endDate: newTask.endDate,
            team: newTask.team,
            dependencies: newTask.dependencies,
            expanded: true,
            subtasks: []
          }
        ]);
        showSuccess(`Added task "${newTask.title}"`);
      }
      
      // Reset form
      setNewTask({
        title: '',
        startDate: null,
        endDate: null,
        team: '',
        dependencies: []
      });
      setShowAddTask(false);
      setParentForNewTask(null);
    } catch (error) {
      handleError(error as Error, "Adding task");
    }
  };

  // Add a subtask
  const addSubtask = (parentId: string) => {
    try {
      setShowAddTask(true);
      setParentForNewTask(parentId);
    } catch (error) {
      handleError(error as Error, "Setting up subtask");
    }
  };

  // Delete a task
  const deleteTask = (taskId: string, parentId: string | null = null) => {
    try {
      // Get task name for success message before deleting
      let taskName = "";
      if (parentId) {
        taskName = tasks.find(t => t.id === parentId)?.subtasks.find(st => st.id === taskId)?.title || "subtask";
      } else {
        taskName = tasks.find(t => t.id === taskId)?.title || "task";
      }
      
      if (parentId) {
        setTasks(prevTasks => {
          return prevTasks.map(task => {
            if (task.id === parentId) {
              return {
                ...task,
                subtasks: task.subtasks.filter(subtask => subtask.id !== taskId)
              };
            }
            return task;
          });
        });
      } else {
        setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      }
      
      showSuccess(`Deleted "${taskName}"`);
    } catch (error) {
      handleError(error as Error, "Deleting task");
    }
  };

  // Start editing a task
  const startEditTask = (taskId: string, parentId: string | null = null) => {
    try {
      const taskToEdit = parentId 
        ? tasks.find(t => t.id === parentId)?.subtasks.find(st => st.id === taskId)
        : tasks.find(t => t.id === taskId);
      
      if (taskToEdit) {
        setEditingTask({
          id: taskToEdit.id,
          title: taskToEdit.title,
          startDate: taskToEdit.startDate,
          endDate: taskToEdit.endDate,
          team: taskToEdit.team,
          dependencies: taskToEdit.dependencies,
          parentId
        });
      } else {
        throw new Error("Task not found");
      }
    } catch (error) {
      handleError(error as Error, "Starting task edit");
    }
  };

  // Save edited task
  const saveEditedTask = () => {
    try {
      if (!editingTask) return;
      
      if (!editingTask.title.trim()) {
        throw new Error("Task title cannot be empty");
      }
      
      if (editingTask.parentId) {
        setTasks(prevTasks => {
          return prevTasks.map(task => {
            if (task.id === editingTask.parentId) {
              return {
                ...task,
                subtasks: task.subtasks.map(subtask => 
                  subtask.id === editingTask.id 
                    ? { 
                        ...subtask, 
                        title: editingTask.title,
                        startDate: editingTask.startDate,
                        endDate: editingTask.endDate,
                        team: editingTask.team,
                        dependencies: editingTask.dependencies 
                      } 
                    : subtask
                )
              };
            }
            return task;
          });
        });
      } else {
        setTasks(prevTasks => {
          return prevTasks.map(task => 
            task.id === editingTask.id 
              ? { 
                  ...task, 
                  title: editingTask.title,
                  startDate: editingTask.startDate,
                  endDate: editingTask.endDate,
                  team: editingTask.team,
                  dependencies: editingTask.dependencies 
                } 
              : task
          );
        });
      }
      
      showSuccess(`Updated "${editingTask.title}"`);
      setEditingTask(null);
    } catch (error) {
      handleError(error as Error, "Saving edited task");
    }
  };

  // Add a new team
  const handleAddTeam = () => {
    try {
      if (!newTeam.name.trim()) {
        throw new Error("Team name cannot be empty");
      }
      
      if (teams.some(team => team.name === newTeam.name)) {
        throw new Error("A team with this name already exists");
      }
      
      setTeams(prevTeams => [...prevTeams, { ...newTeam }]);
      showSuccess(`Added team "${newTeam.name}"`);
      
      // Reset form
      setNewTeam({ name: '', color: '#3b82f6' });
    } catch (error) {
      handleError(error as Error, "Adding team");
    }
  };

  // Start editing a team
  const startEditTeam = (team: TeamConfig) => {
    setEditingTeam({ ...team });
  };

  // Save edited team
  const saveEditedTeam = () => {
    try {
      if (!editingTeam) return;
      
      if (!editingTeam.name.trim()) {
        throw new Error("Team name cannot be empty");
      }
      
      const oldName = teams.find(t => t.color === editingTeam.color)?.name;
      
      if (oldName !== editingTeam.name && teams.some(team => team.name === editingTeam.name)) {
        throw new Error("A team with this name already exists");
      }
      
      // Update team
      setTeams(prevTeams => prevTeams.map(team => 
        team.name === oldName ? editingTeam : team
      ));
      
      // Update tasks that use this team
      if (oldName && oldName !== editingTeam.name) {
        setTasks(prevTasks => {
          return prevTasks.map(task => {
            const updatedTask = {
              ...task,
              team: task.team === oldName ? editingTeam.name : task.team,
              subtasks: task.subtasks.map(subtask => ({
                ...subtask,
                team: subtask.team === oldName ? editingTeam.name : subtask.team
              }))
            };
            return updatedTask;
          });
        });
      }
      
      showSuccess(`Updated team "${editingTeam.name}"`);
      setEditingTeam(null);
    } catch (error) {
      handleError(error as Error, "Saving edited team");
    }
  };

  // Delete a team
  const deleteTeam = (teamName: string) => {
    try {
      // Check if this team is in use
      const inUse = tasks.some(task => 
        task.team === teamName || task.subtasks.some(subtask => subtask.team === teamName)
      );
      
      if (inUse) {
        throw new Error(`Cannot delete team "${teamName}" because it is in use by one or more tasks.`);
      }
      
      setTeams(prevTeams => prevTeams.filter(team => team.name !== teamName));
      showSuccess(`Deleted team "${teamName}"`);
    } catch (error) {
      handleError(error as Error, "Deleting team");
    }
  };

  // Format date for display
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Not set';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (error) {
      handleError(error as Error, "Formatting date");
      return 'Invalid date';
    }
  };

  // CSV Export functionality
  const exportToCSV = () => {
    try {
      // Create CSV headers
      const headers = [
        "id",
        "title",
        "startDate",
        "endDate",
        "team",
        "dependencies",
        "expanded",
        "parentId",
        "isSubtask"
      ];
      
      // Convert tasks to CSV rows
      const rows: Array<Array<string | number | boolean>> = [];
      
      // Process main tasks
      tasks.forEach(task => {
        const taskRow = [
          task.id,
          task.title,
          task.startDate || "",
          task.endDate || "",
          task.team || "",
          task.dependencies.join("|"), // Use pipe as separator
          task.expanded,
          "",
          "false"
        ];
        rows.push(taskRow);
        
        // Process subtasks
        if (task.subtasks && task.subtasks.length > 0) {
          task.subtasks.forEach(subtask => {
            const subtaskRow = [
              subtask.id,
              subtask.title,
              subtask.startDate || "",
              subtask.endDate || "",
              subtask.team || "",
              subtask.dependencies.join("|"),
              "",
              task.id,
              "true"
            ];
            rows.push(subtaskRow);
          });
        }
      });
      
      // Combine headers and rows
      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => {
          // Quote any cell that contains a comma or pipe
          if (String(cell).includes(",") || String(cell).includes("|")) {
            return `"${String(cell).replace(/"/g, '""')}"`;
          }
          return String(cell);
        }).join(","))
      ].join("\n");
      
      // Create a blob and trigger download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `gantt_chart_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showSuccess("CSV exported successfully");
    } catch (error) {
      handleError(error as Error, "Exporting to CSV");
    }
  };

  // CSV Import functionality
  const handleCSVImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          
          if (!content) {
            throw new Error("Failed to read file content");
          }
          
          const lines = content.split(/\r\n|\n/);
          
          if (lines.length < 2) {
            throw new Error("CSV file is empty or has no data rows");
          }
          
          const headers = lines[0].split(",");
          
          // Validate headers
          const requiredHeaders = ["id", "title", "startDate", "endDate", "team", "dependencies", "parentId", "isSubtask"];
          const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
          
          if (missingHeaders.length > 0) {
            throw new Error(`Missing required CSV headers: ${missingHeaders.join(", ")}`);
          }
          
          // Process CSV rows
          const importedTasks: Task[] = [];
          const subtasks: Array<any> = [];
          
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            
            // Parse the CSV row
            const values: string[] = [];
            let inQuote = false;
            let currentValue = "";
            
            for (let j = 0; j < lines[i].length; j++) {
              const char = lines[i][j];
              
              if (char === '"' && !inQuote) {
                inQuote = true;
                continue;
              }
              
              if (char === '"' && inQuote) {
                // Check for escaped quotes
                if (j + 1 < lines[i].length && lines[i][j + 1] === '"') {
                  currentValue += '"';
                  j++; // Skip the next quote
                  continue;
                }
                
                inQuote = false;
                continue;
              }
              
              if (char === ',' && !inQuote) {
                values.push(currentValue);
                currentValue = "";
                continue;
              }
              
              currentValue += char;
            }
            
            values.push(currentValue); // Add the last value
            
            // Create an object from values
            const rowData: Record<string, any> = {};
            for (let j = 0; j < headers.length; j++) {
              rowData[headers[j]] = values[j] || "";
            }
            
            // Process boolean values and arrays
            rowData.expanded = rowData.expanded === "true";
            rowData.isSubtask = rowData.isSubtask === "true";
            rowData.dependencies = rowData.dependencies ? rowData.dependencies.split("|").filter(Boolean) : [];
            
            if (rowData.isSubtask) {
              subtasks.push(rowData);
            } else {
              importedTasks.push({
                id: rowData.id,
                title: rowData.title,
                startDate: rowData.startDate || null,
                endDate: rowData.endDate || null,
                team: rowData.team,
                dependencies: rowData.dependencies,
                expanded: rowData.expanded,
                subtasks: []
              });
            }
          }
          
          // Associate subtasks with their parents
          subtasks.forEach(subtask => {
            const parentTask = importedTasks.find(task => task.id === subtask.parentId);
            
            if (parentTask) {
              parentTask.subtasks.push({
                id: subtask.id,
                title: subtask.title,
                startDate: subtask.startDate || null,
                endDate: subtask.endDate || null,
                team: subtask.team,
                dependencies: subtask.dependencies
              });
            } else {
              console.warn(`Parent task with ID ${subtask.parentId} not found for subtask ${subtask.id}`);
            }
          });
          
          // Check for teams that don't exist and add them
          const importedTeams = new Set<string>();
          
          importedTasks.forEach(task => {
            if (task.team) importedTeams.add(task.team);
            task.subtasks.forEach(subtask => {
              if (subtask.team) importedTeams.add(subtask.team);
            });
          });
          
          const newTeamsToAdd: TeamConfig[] = [];
          const existingTeamNames = teams.map(t => t.name);
          
          importedTeams.forEach(teamName => {
            if (!existingTeamNames.includes(teamName)) {
              // Generate a random color for new team
              const randomColor = `#${Math.floor(Math.random()*16777215).toString(16)}`;
              newTeamsToAdd.push({ name: teamName, color: randomColor });
            }
          });
          
          if (newTeamsToAdd.length > 0) {
            setTeams(prevTeams => [...prevTeams, ...newTeamsToAdd]);
            showSuccess(`Added ${newTeamsToAdd.length} new teams from import`);
          }
          
          // Update the state with imported tasks
          setTasks(importedTasks);
          
          // Reset file input
          if (event.target) {
            event.target.value = '';
          }
          
          showSuccess(`Imported ${importedTasks.length} tasks and ${subtasks.length} subtasks`);
        } catch (error) {
          setCsvImportError(`${error instanceof Error ? error.message : "Unknown error"}`);
          console.error("CSV import error:", error);
        }
      };
      
      reader.onerror = () => {
        setCsvImportError("Failed to read the file");
      };
      
      reader.readAsText(file);
    } catch (error) {
      handleError(error as Error, "Importing CSV");
    }
  };

  // Export to PDF
  const exportToPDF = () => {
    try {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        throw new Error("Could not open print window. Please check if popup blocking is enabled.");
      }
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Gantt Chart - ${new Date().toLocaleDateString()}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                padding: 20px;
              }
              h1 { 
                color: #333; 
                margin-bottom: 10px;
              }
              .date-info { 
                color: #666; 
                margin-bottom: 20px;
              }
              table { 
                border-collapse: collapse; 
                width: 100%; 
                margin-bottom: 30px;
              }
              th, td { 
                border: 1px solid #ddd; 
                padding: 8px; 
                text-align: left; 
              }
              th { 
                background-color: #f2f2f2; 
                font-weight: bold;
              }
              .task-row { 
                background-color: #f9f9f9; 
              }
              .subtask-row { 
                background-color: #ffffff; 
              }
              .team-label { 
                display: inline-block;
                padding: 2px 6px;
                border-radius: 4px;
                color: white;
                margin-right: 5px;
              }
              .teams-legend {
                margin-top: 20px;
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
              }
              .team-item {
                display: flex;
                align-items: center;
                margin-right: 15px;
              }
              .team-color {
                width: 16px;
                height: 16px;
                margin-right: 6px;
                border-radius: 4px;
              }
              @media print {
                .no-print { display: none; }
                button { display: none; }
              }
            </style>
          </head>
          <body>
            <h1>Project Gantt Chart</h1>
            <div class="date-info">
              <p>Timeline: ${formatDate(timelineStart)} to ${formatDate(timelineEnd)}</p>
              <p>Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Team</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Dependencies</th>
                </tr>
              </thead>
              <tbody>
      `);
      
      // Add table rows for tasks and subtasks
      tasks.forEach(task => {
        printWindow.document.write(`
          <tr class="task-row">
            <td><strong>${task.title}</strong></td>
            <td>
              ${task.team ? 
                `<span class="team-label" style="background-color: ${teamColors[task.team]}">
                  ${task.team}
                </span>` : 
                'Not assigned'}
                </td>
                <td>${task.startDate ? formatDate(task.startDate) : 'Not set'}</td>
                <td>${task.endDate ? formatDate(task.endDate) : 'Not set'}</td>
                <td>${task.dependencies.length > 0 ? 
                    task.dependencies.map(depId => {
                      const dep = allTasks.find(t => t.id === depId);
                      return dep ? dep.title : depId;
                    }).join(', ') : 
                    'None'}
                </td>
              </tr>
            `);
            
            // Add subtasks
            task.subtasks.forEach(subtask => {
              printWindow.document.write(`
                <tr class="subtask-row">
                  <td>↳ ${subtask.title}</td>
                  <td>
                    ${subtask.team ? 
                      `<span class="team-label" style="background-color: ${teamColors[subtask.team]}">
                        ${subtask.team}
                      </span>` : 
                      'Not assigned'}
                  </td>
                  <td>${subtask.startDate ? formatDate(subtask.startDate) : 'Not set'}</td>
                  <td>${subtask.endDate ? formatDate(subtask.endDate) : 'Not set'}</td>
                  <td>${subtask.dependencies.length > 0 ? 
                      subtask.dependencies.map(depId => {
                        const dep = allTasks.find(t => t.id === depId);
                        return dep ? dep.title : depId;
                      }).join(', ') : 
                      'None'}
                  </td>
                </tr>
              `);
            });
          });
          
          // Add team legend and close the document
          printWindow.document.write(`
                  </tbody>
                </table>
                
                <h3>Teams</h3>
                <div class="teams-legend">
                  ${teams.map(team => `
                    <div class="team-item">
                      <div class="team-color" style="background-color: ${team.color}"></div>
                      <span>${team.name}</span>
                    </div>
                  `).join('')}
                </div>
                
                <div class="no-print" style="margin-top: 20px;">
                  <button onclick="window.print();" style="padding: 10px 15px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Print / Save as PDF
                  </button>
                  <button onclick="window.close();" style="margin-left: 10px; padding: 10px 15px; background-color: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Close
                  </button>
                </div>
              </body>
            </html>
          `);
          
          printWindow.document.close();
          
          // Focus on the new window and automatically prompt the print dialog
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
          }, 1000);
          
          showSuccess("Preparing PDF export");
        } catch (error) {
          handleError(error as Error, "Exporting to PDF");
        }
      };
    
      // Clear all tasks
      const clearAllTasks = () => {
        try {
          if (confirm("Are you sure you want to clear all tasks? This cannot be undone.")) {
            setTasks([]);
            localStorage.removeItem('ganttChartTasks');
            showSuccess("All tasks cleared");
          }
        } catch (error) {
          handleError(error as Error, "Clearing tasks");
        }
      };
    
      // Zoom in on timeline
      const zoomIn = () => {
        try {
          setCellWidth(prev => Math.min(prev + 8, 64));
        } catch (error) {
          handleError(error as Error, "Zooming in");
        }
      };
    
      // Zoom out on timeline
      const zoomOut = () => {
        try {
          setCellWidth(prev => Math.max(prev - 8, 16));
        } catch (error) {
          handleError(error as Error, "Zooming out");
        }
      };
    
      // Today button - center timeline on today
      const goToToday = () => {
        try {
          // Calculate appropriate start and end dates for the timeline
          const todayDate = new Date();
          const startDate = new Date(todayDate);
          startDate.setDate(todayDate.getDate() - 15);
          
          const endDate = new Date(todayDate);
          endDate.setDate(todayDate.getDate() + 45);
          
          setTimelineStart(startDate.toISOString().split('T')[0]);
          setTimelineEnd(endDate.toISOString().split('T')[0]);
          
          // Scroll to today's position if timeline container ref exists
          setTimeout(() => {
            if (timelineContainerRef.current) {
              const todayIndex = timelineDates.findIndex(date => date === today);
              if (todayIndex !== -1) {
                const todayPosition = todayIndex * cellWidth - timelineContainerRef.current.clientWidth / 2;
                timelineContainerRef.current.scrollLeft = todayPosition;
              }
            }
          }, 100);
        } catch (error) {
          handleError(error as Error, "Going to today");
        }
      };
    
      // Toggle task expanded state
      const toggleTaskExpanded = (taskId: string) => {
        try {
          setTasks(prevTasks => {
            return prevTasks.map(task => {
              if (task.id === taskId) {
                return { ...task, expanded: !task.expanded };
              }
              return task;
            });
          });
        } catch (error) {
          handleError(error as Error, "Toggling task");
        }
      };
    
      // Render dependency lines for timeline view
      const DependencyLines = () => {
        if (!showDependencyLines) return null;
        
        try {
          // Store all lines to render
          const lines: React.ReactNode[] = [];
          
          // Function to find task row position
          const findTaskPosition = (taskId: string): { rowIndex: number, isSubtask: boolean, parentIndex?: number } | null => {
            let rowIndex = 0;
            
            for (let i = 0; i < tasks.length; i++) {
              const task = tasks[i];
              
              // Check if it's the main task
              if (task.id === taskId) {
                return { rowIndex, isSubtask: false };
              }
              
              rowIndex++;
              
              // Check if it's a subtask and the parent is expanded
              if (task.expanded && task.subtasks.length > 0) {
                for (let j = 0; j < task.subtasks.length; j++) {
                  if (task.subtasks[j].id === taskId) {
                    return { rowIndex, isSubtask: true, parentIndex: i };
                  }
                  rowIndex++;
                }
              }
            }
            
            return null;
          };
          
          // Process all tasks and their dependencies
          tasks.forEach(task => {
            task.dependencies.forEach(depId => {
              const startPos = findTaskPosition(depId);
              const endPos = findTaskPosition(task.id);
              
              if (startPos && endPos) {
                // Calculate y positions (center of rows)
                const startY = startPos.rowIndex * rowHeight + rowHeight/2;
                const endY = endPos.rowIndex * rowHeight + rowHeight/2;
                
                // Find task positions
                const depTask = startPos.isSubtask 
                  ? tasks[startPos.parentIndex!]?.subtasks.find(st => st.id === depId)
                  : tasks.find(t => t.id === depId);
                  
                const currentTask = endPos.isSubtask
                  ? tasks[endPos.parentIndex!]?.subtasks.find(st => st.id === task.id)
                  : task;
                
                // Skip if either task doesn't have a start date
                if (!depTask?.startDate || !currentTask?.startDate) return;
                
                // Find date indices
                const startDepDate = depTask.endDate || depTask.startDate;
                const startTaskDate = currentTask.startDate;
                
                const startDepIndex = timelineDates.findIndex(date => date === startDepDate);
                const startTaskIndex = timelineDates.findIndex(date => date === startTaskDate);
                
                if (startDepIndex === -1 || startTaskIndex === -1) return;
                
                // Calculate x positions
                const startX = (startDepIndex + 1) * cellWidth;
                const endX = startTaskIndex * cellWidth;
                
                // Only draw if the dependency is visible (not too far apart)
                if (Math.abs(startX - endX) < 2000) {
                  lines.push(
                    <svg 
                      key={`${depId}-${task.id}`} 
                      className="absolute top-0 left-0 w-full h-full pointer-events-none"
                      style={{ zIndex: 10 }}
                    >
                      <path
                        d={`M ${startX} ${startY} C ${(startX + endX)/2} ${startY}, ${(startX + endX)/2} ${endY}, ${endX} ${endY}`}
                        stroke="#888"
                        strokeWidth="1.5"
                        strokeDasharray="4 2"
                        fill="none"
                      />
                      <circle cx={endX} cy={endY} r="3" fill="#888" />
                    </svg>
                  );
                }
              }
            });
            
            // Check subtask dependencies
            if (task.expanded) {
              task.subtasks.forEach(subtask => {
                subtask.dependencies.forEach(depId => {
                  const startPos = findTaskPosition(depId);
                  const endPos = findTaskPosition(subtask.id);
                  
                  if (startPos && endPos) {
                    // Calculate positions (similar to above)
                    const startY = startPos.rowIndex * rowHeight + rowHeight/2;
                    const endY = endPos.rowIndex * rowHeight + rowHeight/2;
                    
                    const depTask = startPos.isSubtask 
                      ? tasks[startPos.parentIndex!]?.subtasks.find(st => st.id === depId)
                      : tasks.find(t => t.id === depId);
                      
                    if (!depTask?.startDate || !subtask.startDate) return;
                    
                    const startDepDate = depTask.endDate || depTask.startDate;
                    const startTaskDate = subtask.startDate;
                    
                    const startDepIndex = timelineDates.findIndex(date => date === startDepDate);
                    const startTaskIndex = timelineDates.findIndex(date => date === startTaskDate);
                    
                    if (startDepIndex === -1 || startTaskIndex === -1) return;
                    
                    const startX = (startDepIndex + 1) * cellWidth;
                    const endX = startTaskIndex * cellWidth;
                    
                    if (Math.abs(startX - endX) < 2000) {
                      lines.push(
                        <svg 
                          key={`${depId}-${subtask.id}`} 
                          className="absolute top-0 left-0 w-full h-full pointer-events-none"
                          style={{ zIndex: 10 }}
                        >
                          <path
                            d={`M ${startX} ${startY} C ${(startX + endX)/2} ${startY}, ${(startX + endX)/2} ${endY}, ${endX} ${endY}`}
                            stroke="#888"
                            strokeWidth="1.5"
                            strokeDasharray="4 2"
                            fill="none"
                          />
                          <circle cx={endX} cy={endY} r="3" fill="#888" />
                        </svg>
                      );
                    }
                  }
                });
              });
            }
          });
          
          return <>{lines}</>;
        } catch (error) {
          console.error("Error rendering dependency lines:", error);
          return null;
        }
      };
    
      return (
        <div className="p-4 max-w-full">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Interactive Gantt Chart</h1>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowTeamManager(!showTeamManager)}
                className="p-2 rounded-md hover:bg-gray-100"
                title="Manage Teams"
              >
                <Users size={20} />
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-md hover:bg-gray-100"
                title="Settings"
              >
                <Settings size={20} />
              </button>
            </div>
          </div>
          
          {/* Feedback messages */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md relative">
              <div className="flex items-center">
                <AlertCircle size={20} className="mr-2" />
                <span>{errorMessage}</span>
              </div>
              <button 
                className="absolute top-2 right-2 text-red-500"
                onClick={() => setErrorMessage(null)}
              >
                <X size={16} />
              </button>
            </div>
          )}
          
          {csvImportError && (
            <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-md relative">
              <div className="flex items-center">
                <AlertCircle size={20} className="mr-2" />
                <span><strong>CSV Import Error:</strong> {csvImportError}</span>
              </div>
              <button 
                className="absolute top-2 right-2 text-yellow-500"
                onClick={() => setCsvImportError(null)}
              >
                <X size={16} />
              </button>
            </div>
          )}
          
          {successMessage && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md relative">
              <div className="flex items-center">
                <Check size={20} className="mr-2" />
                <span>{successMessage}</span>
              </div>
              <button 
                className="absolute top-2 right-2 text-green-500"
                onClick={() => setSuccessMessage(null)}
              >
                <X size={16} />
              </button>
            </div>
          )}
          
          {/* Team Manager */}
          {showTeamManager && (
            <div className="mb-6 p-4 border rounded-md bg-gray-50 shadow-md">
              <div className="flex justify-between mb-3">
                <h3 className="text-lg font-medium">Team Manager</h3>
                <button onClick={() => setShowTeamManager(false)}>
                  <X size={20} />
                </button>
              </div>
              
              {/* Team list */}
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Current Teams</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {teams.map(team => (
                    <div key={team.name} className="flex items-center justify-between p-2 border rounded-md">
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded-md mr-2" 
                          style={{ backgroundColor: team.color }}
                        ></div>
                        <span>{team.name}</span>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded-md"
                          onClick={() => startEditTeam(team)}
                          title="Edit team"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="p-1 text-red-600 hover:bg-red-100 rounded-md"
                          onClick={() => deleteTeam(team.name)}
                          title="Delete team"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Add team form */}
              {!editingTeam && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Add New Team</h4>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newTeam.name}
                      onChange={(e) => setNewTeam({...newTeam, name: e.target.value})}
                      placeholder="Team name"
                      className="flex-grow border rounded-md px-3 py-2"
                    />
                    <input
                      type="color"
                      value={newTeam.color}
                      onChange={(e) => setNewTeam({...newTeam, color: e.target.value})}
                      className="w-12 border rounded-md cursor-pointer"
                    />
                    <button
                      onClick={handleAddTeam}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md"
                    >
                      Add Team
                    </button>
                  </div>
                </div>
              )}
              
              {/* Edit team form */}
              {editingTeam && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Edit Team</h4>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={editingTeam.name}
                      onChange={(e) => setEditingTeam({...editingTeam, name: e.target.value})}
                      placeholder="Team name"
                      className="flex-grow border rounded-md px-3 py-2"
                    />
                    <input
                      type="color"
                      value={editingTeam.color}
                      onChange={(e) => setEditingTeam({...editingTeam, color: e.target.value})}
                      className="w-12 border rounded-md cursor-pointer"
                    />
                    <button
                      onClick={saveEditedTeam}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingTeam(null)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Settings Panel */}
          {showSettings && (
            <div className="mb-6 p-4 border rounded-md bg-gray-50 shadow-md">
              <div className="flex justify-between mb-3">
                <h3 className="text-lg font-medium">Settings</h3>
                <button onClick={() => setShowSettings(false)}>
                  <X size={20} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Cell Width:</label>
                  <div className="flex items-center">
                    <input
                      type="range"
                      min="16"
                      max="64"
                      step="4"
                      value={cellWidth}
                      onChange={(e) => setCellWidth(parseInt(e.target.value))}
                      className="w-full mr-2"
                    />
                    <span className="text-sm text-gray-500">{cellWidth}px</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Row Height:</label>
                  <div className="flex items-center">
                    <input
                      type="range"
                      min="32"
                      max="64"
                      step="4"
                      value={rowHeight}
                      onChange={(e) => setRowHeight(parseInt(e.target.value))}
                      className="w-full mr-2"
                    />
                    <span className="text-sm text-gray-500">{rowHeight}px</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">View:</label>
                  <div className="flex space-x-2">
                    <button
                      className={`px-3 py-1 rounded-md border ${currentView === 'timeline' ? 'bg-blue-100 border-blue-500' : 'bg-white'}`}
                      onClick={() => setCurrentView('timeline')}
                    >
                      Timeline
                    </button>
                    <button
                      className={`px-3 py-1 rounded-md border ${currentView === 'list' ? 'bg-blue-100 border-blue-500' : 'bg-white'}`}
                      onClick={() => setCurrentView('list')}
                    >
                      List
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={showDependencyLines}
                      onChange={(e) => setShowDependencyLines(e.target.checked)}
                      className="mr-2"
                    />
                    <span>Show Dependencies</span>
                  </label>
                </div>
                
                <div className="md:col-span-2">
                  <button
                    onClick={clearAllTasks}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Clear All Tasks
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Controls */}
          <div className="mb-6 flex flex-wrap gap-4">
            <div className="flex flex-wrap gap-2">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center"
                onClick={() => setShowAddTask(true)}
              >
                <Plus size={16} className="mr-1" /> Add Task
              </button>
              
              <button
                className="px-4 py-2 bg-blue-700 text-white rounded-md"
                onClick={goToToday}
              >
                Today
              </button>
              
              <div className="flex rounded-md overflow-hidden border">
                <button
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200"
                  onClick={zoomOut}
                  title="Zoom Out"
                >
                  −
                </button>
                <button
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200"
                  onClick={zoomIn}
                  title="Zoom In"
                >
                  +
                </button>
              </div>
            </div>
            
            <div className="flex gap-2">
              <div>
                <label className="block text-sm font-medium mb-1">Timeline Start:</label>
                <input
                  type="date"
                  value={timelineStart}
                  onChange={(e) => setTimelineStart(e.target.value)}
                  className="border rounded-md px-2 py-1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Timeline End:</label>
                <input
                  type="date"
                  value={timelineEnd}
                  onChange={(e) => setTimelineEnd(e.target.value)}
                  className="border rounded-md px-2 py-1"
                />
              </div>
            </div>
            
            <div className="flex gap-2 ml-auto">
              <button
                className="px-4 py-2 bg-green-600 text-white rounded-md flex items-center"
                onClick={exportToCSV}
              >
                <Save size={16} className="mr-1" /> Export CSV
              </button>
              
              <div className="relative">
                <button
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md flex items-center"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={16} className="mr-1" /> Import CSV
                </button>
                <input 
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".csv"
                  onChange={handleCSVImport}
                />
              </div>
              
              <button
                className="px-4 py-2 bg-purple-600 text-white rounded-md flex items-center"
                onClick={exportToPDF}
              >
                <FileText size={16} className="mr-1" /> Export PDF
              </button>
            </div>
          </div>
          
          {/* Task forms */}
          {/* Add Task Form */}
          {showAddTask && (
            <div className="mb-6 p-4 border rounded-md bg-gray-50 shadow-md">
              <div className="flex justify-between mb-4">
                <h3 className="text-lg font-medium">
                  {parentForNewTask ? `Add Subtask to "${tasks.find(t => t.id === parentForNewTask)?.title}"` : 'Add New Task'}
                </h3>
                <button 
                  onClick={() => {
                    setShowAddTask(false);
                    setParentForNewTask(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Task Title:</label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="Enter task title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Team:</label>
                  <select
                    value={newTask.team}
                    onChange={(e) => setNewTask({...newTask, team: e.target.value})}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="">Select Team</option>
                    {teams.map(team => (
                      <option key={team.name} value={team.name}>{team.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date:</label>
                  <input
                    type="date"
                    value={newTask.startDate || ''}
                    onChange={(e) => setNewTask({...newTask, startDate: e.target.value})}
                    className="w-full border rounded-md px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">End Date:</label>
                  <input
                    type="date"
                    value={newTask.endDate || ''}
                    onChange={(e) => setNewTask({...newTask, endDate: e.target.value})}
                    className="w-full border rounded-md px-3 py-2"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Dependencies:</label>
                  <select
                    multiple
                    value={newTask.dependencies}
                    onChange={(e) => setNewTask({
                      ...newTask,
                      dependencies: Array.from(e.target.selectedOptions, option => option.value)
                    })}
                    className="w-full border rounded-md px-3 py-2 h-24"
                  >
                    {allTasks
                      .filter(task => parentForNewTask !== task.id)
                      .map(task => (
                        <option key={task.id} value={task.id}>
                          {task.title} {task.parentId ? `(subtask of ${tasks.find(t => t.id === task.parentId)?.title})` : ''}
                        </option>
                      ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
                </div>
              </div>
              
              <div className="mt-4">
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  onClick={handleAddTask}
                >
                  Add Task
                </button>
              </div>
            </div>
          )}
          
          {/* Edit Task Form */}
          {editingTask && (
            <div className="mb-6 p-4 border rounded-md bg-gray-50 shadow-md">
              <div className="flex justify-between mb-4">
                <h3 className="text-lg font-medium">
                  Edit Task
                </h3>
                <button 
                  onClick={() => setEditingTask(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Task Title:</label>
                  <input
                    type="text"
                    value={editingTask.title}
                    onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="Enter task title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Team:</label>
                  <select
                    value={editingTask.team}
                    onChange={(e) => setEditingTask({...editingTask, team: e.target.value})}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="">Select Team</option>
                    {teams.map(team => (
                      <option key={team.name} value={team.name}>{team.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
  <label className="block text-sm font-medium mb-1">Start Date:</label>
  <input
    type="date"
    value={editingTask.startDate || ''}
    onChange={(e) => setEditingTask({...editingTask, startDate: e.target.value})}
    className="w-full border rounded-md px-3 py-2"
  />
</div>
            
            <div>
              <label className="block text-sm font-medium mb-1">End Date:</label>
              <input
                type="date"
                value={editingTask.endDate || ''}
                onChange={(e) => setEditingTask({...editingTask, endDate: e.target.value})}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Dependencies:</label>
              <select
                multiple
                value={editingTask.dependencies}
                onChange={(e) => setEditingTask({
                  ...editingTask,
                  dependencies: Array.from(e.target.selectedOptions, option => option.value)
                })}
                className="w-full border rounded-md px-3 py-2 h-24"
              >
                {allTasks
                  .filter(task => editingTask.id !== task.id)
                  .map(task => (
                    <option key={task.id} value={task.id}>
                      {task.title} {task.parentId ? `(subtask of ${tasks.find(t => t.id === task.parentId)?.title})` : ''}
                    </option>
                  ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
            </div>
          </div>
          
          <div className="mt-4">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              onClick={saveEditedTask}
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Empty state message */}
      {tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-md border border-dashed border-gray-300">
          <div className="text-gray-500 mb-4">
            <Calendar size={48} />
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">No tasks yet</h3>
          <p className="text-gray-500 mb-4">Get started by adding your first task or importing from a CSV file.</p>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            onClick={() => setShowAddTask(true)}
          >
            <Plus size={16} className="inline-block mr-1" /> Add First Task
          </button>
        </div>
      )}

      {/* Timeline View */}
      {tasks.length > 0 && currentView === 'timeline' && (
        <div className="flex border rounded-md overflow-hidden shadow-md">
          {/* Task list */}
          <div className="min-w-64 bg-gray-50 border-r">
            <div className="sticky top-0 bg-gray-200 p-3 font-semibold z-10">Tasks</div>
            
            {tasks.map(task => (
              <div key={task.id} className="border-b">
                <div className="flex items-center p-3 hover:bg-gray-100">
                  <button 
                    onClick={() => toggleTaskExpanded(task.id)}
                    className="mr-2"
                  >
                    {task.expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  
                  <div className="flex-grow">
                    <div className="font-medium">{task.title}</div>
                    <div className="flex text-xs text-gray-500 mt-1 space-x-4">
                      <div className="flex items-center">
                        <Calendar size={12} className="mr-1" />
                        {task.startDate ? formatDate(task.startDate) : 'Start: Not set'}
                        {task.endDate && (
                          <>
                            <ArrowRight size={10} className="mx-1" />
                            {formatDate(task.endDate)}
                          </>
                        )}
                      </div>
                      {task.team && (
                        <div className="flex items-center">
                          <Users size={12} className="mr-1" />
                          <div 
                            className="w-2 h-2 rounded-full mr-1" 
                            style={{ backgroundColor: teamColors[task.team] || '#aaa' }}
                          ></div>
                          {task.team}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      className="p-1 text-blue-600 hover:bg-blue-100 rounded-md"
                      onClick={() => startEditTask(task.id)}
                      title="Edit task"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="p-1 text-green-600 hover:bg-green-100 rounded-md"
                      onClick={() => addSubtask(task.id)}
                      title="Add subtask"
                    >
                      <Plus size={16} />
                    </button>
                    <button
                      className="p-1 text-red-600 hover:bg-red-100 rounded-md"
                      onClick={() => deleteTask(task.id)}
                      title="Delete task"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
                
                {/* Subtasks */}
                {task.expanded && task.subtasks && task.subtasks.length > 0 && (
                  <div className="pl-8 border-t bg-gray-50">
                    {task.subtasks.map(subtask => (
                      <div key={subtask.id} className="border-b last:border-b-0">
                        <div className="flex items-center p-3 hover:bg-gray-100">
                          <div className="w-4 h-0 border-t border-l border-gray-300 mr-2"></div>
                          
                          <div className="flex-grow">
                            <div className="font-medium">{subtask.title}</div>
                            <div className="flex text-xs text-gray-500 mt-1 space-x-4">
                              <div className="flex items-center">
                                <Calendar size={12} className="mr-1" />
                                {subtask.startDate ? formatDate(subtask.startDate) : 'Start: Not set'}
                                {subtask.endDate && (
                                  <>
                                    <ArrowRight size={10} className="mx-1" />
                                    {formatDate(subtask.endDate)}
                                  </>
                                )}
                              </div>
                              {subtask.team && (
                                <div className="flex items-center">
                                  <Users size={12} className="mr-1" />
                                  <div 
                                    className="w-2 h-2 rounded-full mr-1" 
                                    style={{ backgroundColor: teamColors[subtask.team] || '#aaa' }}
                                  ></div>
                                  {subtask.team}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <button
                              className="p-1 text-blue-600 hover:bg-blue-100 rounded-md"
                              onClick={() => startEditTask(subtask.id, task.id)}
                              title="Edit subtask"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              className="p-1 text-red-600 hover:bg-red-100 rounded-md"
                              onClick={() => deleteTask(subtask.id, task.id)}
                              title="Delete subtask"
                            >
                              <Trash size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Timeline */}
          <div className="flex-grow overflow-x-auto" ref={timelineContainerRef}>
            {/* Timeline header */}
            <div className="sticky top-0 bg-gray-200 flex border-b z-10">
  {timelineDates.map((date, index) => {
    const day = new Date(date).getDate();
    const month = new Date(date).toLocaleDateString('en-US', { month: 'short' });
    const isFirstOfMonth = day === 1;
    const isSunday = new Date(date).getDay() === 0;
    const isToday = date === today;
    
    return (
      <div 
        key={date}
        className={`flex-shrink-0 flex flex-col items-center justify-center text-xs border-r 
          ${isSunday ? 'bg-gray-100' : ''} 
          ${isToday ? 'bg-blue-100' : ''}`}
        style={{ 
          width: `${cellWidth}px`, 
          height: '48px',
          minWidth: `${cellWidth}px` // Add minimum width to ensure cells don't collapse
        }}
      >
        {isFirstOfMonth && (
          <div className="font-semibold">
            {month}
          </div>
        )}
        <div className={`${isToday ? 'font-bold text-blue-700' : ''}`}>
          {day}
        </div>
      </div>
    );
  })}
</div>
            
            {/* Timeline grid and task bars */}
            <div className="relative">
              {/* Today indicator line */}
              {timelineDates.includes(today) && (
                <div 
                  className="absolute top-0 bottom-0 w-px bg-blue-500 z-10"
                  style={{ 
                    left: `${timelineDates.findIndex(date => date === today) * cellWidth + cellWidth/2}px`,
                    height: `${tasks.reduce((height, task) => height + rowHeight + (task.expanded ? task.subtasks.length * rowHeight : 0), 0)}px`
                  }}
                ></div>
              )}
              
              {/* For each main task */}
              {tasks.map((task, taskIndex) => (
                <div key={task.id}>
                  {/* Main task row */}
                  <div 
                    className="border-b flex items-center relative"
                    style={{ 
                      height: `${rowHeight}px`,
                      backgroundColor: taskIndex % 2 === 0 ? '#f9fafb' : '#ffffff' 
                    }}
                  >
                    {/* Task timeline bar */}
                    {task.startDate && (
                      <div 
                        className="absolute h-6 rounded-md flex items-center px-2 text-xs text-white overflow-hidden"
                        style={{
                          left: `${timelineDates.findIndex(date => date === task.startDate) * cellWidth}px`,
                          width: `${(task.endDate ? daysBetween(task.startDate, task.endDate) : 1) * cellWidth}px`,
                          backgroundColor: task.team ? teamColors[task.team] || '#aaa' : '#aaa',
                          zIndex: 5
                        }}
                      >
                        {task.title}
                      </div>
                    )}
                    
                    {/* Background grid lines */}
                    {timelineDates.map((date, dateIndex) => (
                      <div 
                        key={`grid-${task.id}-${date}`}
                        className={`absolute border-r h-full 
                          ${new Date(date).getDay() === 0 ? 'bg-gray-50' : ''}
                          ${date === today ? 'bg-blue-50' : ''}`}
                        style={{ 
                          left: `${dateIndex * cellWidth}px`,
                          width: `${cellWidth}px`,
                          zIndex: 0
                        }}
                      ></div>
                    ))}
                  </div>
                  
                  {/* Subtasks rows (when expanded) */}
                  {task.expanded && task.subtasks && task.subtasks.length > 0 && (
                    <div className="border-b">
                      {task.subtasks.map((subtask, subtaskIndex) => (
                        <div 
                          key={subtask.id}
                          className="border-b last:border-b-0 flex items-center relative"
                          style={{ 
                            height: `${rowHeight}px`,
                            backgroundColor: '#f9fafb' 
                          }}
                        >
                          {/* Subtask timeline bar */}
                          {subtask.startDate && (
  <div 
    className="absolute h-6 rounded-md flex items-center px-2 text-xs text-white overflow-hidden"
    style={{
      left: `${timelineDates.findIndex(date => date === subtask.startDate) * cellWidth}px`,
      width: `${Math.max((subtask.endDate ? daysBetween(subtask.startDate, subtask.endDate) : 1), 1) * cellWidth}px`,
      backgroundColor: subtask.team ? teamColors[subtask.team] : '#aaa',
      zIndex: 5
    }}
  >
    {subtask.title}
  </div>
)}
                          
                          {/* Background grid lines for subtasks */}
                          {timelineDates.map((date, dateIndex) => (
                            <div 
                              key={`grid-${subtask.id}-${date}`}
                              className={`absolute border-r h-full 
                                ${new Date(date).getDay() === 0 ? 'bg-gray-50' : ''}
                                ${date === today ? 'bg-blue-50' : ''}`}
                              style={{ 
                                left: `${dateIndex * cellWidth}px`,
                                width: `${cellWidth}px`,
                                zIndex: 0
                              }}
                            ></div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Dependency lines */}
              {showDependencyLines ? <DependencyLines /> : null}
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {tasks.length > 0 && currentView === 'list' && (
        <div className="border rounded-md overflow-hidden shadow-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Task
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dependencies
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tasks.map(task => (
                <React.Fragment key={task.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <button 
                          onClick={() => toggleTaskExpanded(task.id)}
                          className="mr-2"
                        >
                          {task.expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                        <div className="font-medium">{task.title}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {task.team && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                          style={{ 
                            backgroundColor: `${teamColors[task.team]}30`, // 30 = 30% opacity
                            color: teamColors[task.team] 
                          }}
                        >
                          {task.team}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.startDate ? formatDate(task.startDate) : 'Not set'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.endDate ? formatDate(task.endDate) : 'Not set'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.dependencies.length > 0 ? 
                        task.dependencies.map(depId => {
                          const dep = allTasks.find(t => t.id === depId);
                          return dep ? dep.title : depId;
                        }).join(', ') : 
                        'None'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        onClick={() => startEditTask(task.id)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-green-600 hover:text-green-900 mr-3"
                        onClick={() => addSubtask(task.id)}
                      >
                        Add Subtask
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => deleteTask(task.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                  
                  {/* Subtasks */}
                  {task.expanded && task.subtasks && task.subtasks.length > 0 && 
                    task.subtasks.map(subtask => (
                      <tr key={subtask.id} className="bg-gray-50 hover:bg-gray-100">
                        <td className="px-6 py-4 whitespace-nowrap pl-12">
                          <div className="flex items-center">
                            <div className="w-4 h-0 border-t border-l border-gray-300 mr-2"></div>
                            <div className="font-medium">{subtask.title}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {subtask.team && (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                              style={{ 
                                backgroundColor: `${teamColors[subtask.team]}30`,
                                color: teamColors[subtask.team] 
                              }}
                            >
                              {subtask.team}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {subtask.startDate ? formatDate(subtask.startDate) : 'Not set'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {subtask.endDate ? formatDate(subtask.endDate) : 'Not set'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {subtask.dependencies.length > 0 ? 
                            subtask.dependencies.map(depId => {
                              const dep = allTasks.find(t => t.id === depId);
                              return dep ? dep.title : depId;
                            }).join(', ') : 
                            'None'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            className="text-blue-600 hover:text-blue-900 mr-3"
                            onClick={() => startEditTask(subtask.id, task.id)}
                          >
                            Edit
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900"
                            onClick={() => deleteTask(subtask.id, task.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Team Legend */}
      {tasks.length > 0 && (
        <div className="mt-6 border rounded-md p-4 bg-white shadow-sm">
          <h3 className="font-semibold mb-2">Teams</h3>
          <div className="flex flex-wrap gap-4">
            {teams.map(team => (
              <div key={team.name} className="flex items-center">
                <div 
                  className="w-4 h-4 rounded-md mr-2" 
                  style={{ backgroundColor: team.color }}
                ></div>
                <span>{team.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GanttChart;
/**
 * Agents page - Browse and invoke individual Professor Framework agents
 *
 * Provides UI for:
 * - Browsing all 22 available AI agents
 * - Filtering agents by category
 * - Configuring and invoking individual agents
 * - Monitoring agent execution progress
 * - Viewing and using agent results
 *
 * Note: For orchestrating multiple agents in sequence, see the Workflows page.
 */
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  SparklesIcon,
  BeakerIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowPathIcon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  EyeIcon,
  LightBulbIcon,
  UserGroupIcon,
  GlobeAltIcon,
  RocketLaunchIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  CogIcon,
  KeyIcon,
  SquaresPlusIcon,
  FolderIcon,
  ClipboardIcon,
  CodeBracketSquareIcon,
  PresentationChartLineIcon,
} from '@heroicons/react/24/outline';
import Layout from '../components/Layout';
import { agentsAPI, contentAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import EmptyState from '../components/EmptyState';
import { SkeletonList } from '../components/LoadingSkeleton';
import { showSuccess, showError, showWarning } from '../utils/toast';

// Agent icon mapping (22 agents)
const AGENT_ICONS = {
  // Curriculum Design
  'curriculum-architect': BeakerIcon,
  'instructional-designer': LightBulbIcon,

  // Content Creation
  'content-developer': DocumentTextIcon,
  'assessment-designer': ClipboardDocumentCheckIcon,
  'adaptive-learning': ChartBarIcon,
  'platform-training': AcademicCapIcon,
  'corporate-training': BriefcaseIcon,

  // Quality Assurance
  'pedagogical-reviewer': AcademicCapIcon,
  'quality-assurance': CheckCircleIcon,
  'accessibility-validator': EyeIcon,
  'standards-compliance': ShieldCheckIcon,

  // Packaging & Validation
  'scorm-validator': CodeBracketSquareIcon,

  // Analytics
  'learning-analytics': PresentationChartLineIcon,
  'ab-testing': ChartBarIcon,

  // Project & Workflow Management
  'project-planning': ClipboardIcon,
  'review-workflow': ArrowPathIcon,
  'content-library': FolderIcon,

  // Technical & Operations
  'performance-optimization': RocketLaunchIcon,
  'rights-management': KeyIcon,

  // Business & Strategy
  'market-intelligence': CurrencyDollarIcon,
  'sales-enablement': CurrencyDollarIcon,

  // Internationalization
  'localization': GlobeAltIcon,
};

// Agent color mapping (22 agents)
const AGENT_COLORS = {
  // Curriculum Design
  'curriculum-architect': 'purple',
  'instructional-designer': 'yellow',

  // Content Creation
  'content-developer': 'blue',
  'assessment-designer': 'green',
  'adaptive-learning': 'cyan',
  'platform-training': 'teal',
  'corporate-training': 'slate',

  // Quality Assurance
  'pedagogical-reviewer': 'orange',
  'quality-assurance': 'emerald',
  'accessibility-validator': 'pink',
  'standards-compliance': 'indigo',

  // Packaging & Validation
  'scorm-validator': 'violet',

  // Analytics
  'learning-analytics': 'blue',
  'ab-testing': 'sky',

  // Project & Workflow Management
  'project-planning': 'gray',
  'review-workflow': 'amber',
  'content-library': 'lime',

  // Technical & Operations
  'performance-optimization': 'red',
  'rights-management': 'fuchsia',

  // Business & Strategy
  'market-intelligence': 'green',
  'sales-enablement': 'emerald',

  // Internationalization
  'localization': 'blue',
};

// Category definitions
const AGENT_CATEGORIES = [
  { id: 'all', name: 'All Agents', color: 'gray' },
  { id: 'curriculum-design', name: 'Curriculum Design', color: 'purple' },
  { id: 'content-creation', name: 'Content Creation', color: 'blue' },
  { id: 'quality-assurance', name: 'Quality Assurance', color: 'green' },
  { id: 'packaging', name: 'Packaging', color: 'violet' },
  { id: 'analytics', name: 'Analytics', color: 'cyan' },
  { id: 'project-management', name: 'Project Management', color: 'amber' },
  { id: 'technical', name: 'Technical', color: 'red' },
  { id: 'business', name: 'Business', color: 'emerald' },
  { id: 'internationalization', name: 'Internationalization', color: 'sky' },
];

export default function Agents() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Track job start time for timeout handling
  const jobStartTimeRef = useRef(null);
  const MAX_JOB_DURATION_MS = 5 * 60 * 1000; // 5 minutes timeout

  // State
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [taskDescription, setTaskDescription] = useState('');
  const [parameters, setParameters] = useState({
    grade_levels: [],
    subject: '',
    state: '',
    standards: [],
  });
  const [activeJobId, setActiveJobId] = useState(null);
  const [showResults, setShowResults] = useState(false);

  // Queries
  const { data: agents, isLoading: agentsLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: agentsAPI.list,
  });

  const { data: recentJobs } = useQuery({
    queryKey: ['agent-jobs'],
    queryFn: () => agentsAPI.listJobs(null, 10),
  });

  const { data: jobStatus, refetch: refetchJobStatus } = useQuery({
    queryKey: ['agent-job-status', activeJobId],
    queryFn: () => agentsAPI.getJobStatus(activeJobId),
    enabled: !!activeJobId,
    refetchInterval: (data) => {
      // Poll every 2 seconds while running, stop when complete/failed
      if (data?.status === 'running' || data?.status === 'queued') {
        // Check for timeout (5 minutes max)
        const now = Date.now();
        if (jobStartTimeRef.current && (now - jobStartTimeRef.current) > MAX_JOB_DURATION_MS) {
          showError('Job timeout: Agent execution took too long (5 min limit)');
          setActiveJobId(null);
          jobStartTimeRef.current = null;
          return false;
        }
        return 2000;
      }
      // Stop polling when job is complete/failed
      jobStartTimeRef.current = null;
      return false;
    },
  });

  const { data: jobResult } = useQuery({
    queryKey: ['agent-job-result', activeJobId],
    queryFn: () => agentsAPI.getJobResult(activeJobId),
    enabled: !!activeJobId && jobStatus?.status === 'completed',
  });

  // Mutations
  const invokeMutation = useMutation({
    mutationFn: () => agentsAPI.invoke(
      selectedAgent.id,
      taskDescription,
      parameters
    ),
    onSuccess: (data) => {
      setActiveJobId(data.id);
      jobStartTimeRef.current = Date.now(); // Track start time for timeout
      queryClient.invalidateQueries(['agent-jobs']);
      setShowResults(false);
      showSuccess(`${selectedAgent.name} started successfully`);
    },
    onError: (error) => {
      showError('Failed to invoke agent', error);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (jobId) => agentsAPI.cancelJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries(['agent-job-status', activeJobId]);
      queryClient.invalidateQueries(['agent-jobs']);
      showWarning('Agent job cancelled');
    },
    onError: (error) => {
      showError('Failed to cancel job', error);
    },
  });

  // Effects
  useEffect(() => {
    if (jobStatus?.status === 'completed') {
      setShowResults(true);
      queryClient.invalidateQueries(['agent-jobs']);
    }
  }, [jobStatus?.status, queryClient]);

  // Handlers
  const handleInvoke = () => {
    if (!taskDescription.trim()) {
      showWarning('Please provide a task description');
      return;
    }
    invokeMutation.mutate();
  };

  const handleUseResult = () => {
    if (!jobResult?.generated_content) return;

    // Navigate to content editor with generated content pre-filled
    navigate('/content/new', {
      state: {
        generatedContent: jobResult.generated_content,
        metadata: jobResult.metadata,
      },
    });
  };

  const handleStartNew = () => {
    setActiveJobId(null);
    setShowResults(false);
    setTaskDescription('');
    setParameters({
      grade_levels: [],
      subject: '',
      state: '',
      standards: [],
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      queued: 'bg-gray-100 text-gray-800',
      running: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return CheckCircleIcon;
      case 'running':
        return ArrowPathIcon;
      case 'failed':
        return XCircleIcon;
      case 'queued':
        return ClockIcon;
      default:
        return ClockIcon;
    }
  };

  // Filter agents by category
  const filteredAgents = agents?.filter((agent) => {
    if (selectedCategory === 'all') return true;
    return agent.category === selectedCategory;
  }) || [];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-2">
            <SparklesIcon className="h-8 w-8 text-primary-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">AI Agents</h1>
          </div>
          <p className="text-sm text-gray-600">
            Browse and invoke individual Professor Framework agents for 5-10x productivity gains. For multi-agent orchestration, see the Workflows page.
          </p>
        </div>

        {/* Main Content */}
        {!selectedAgent && !activeJobId && (
          <>
            {/* Category Tabs */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Agent Categories">
                  {AGENT_CATEGORIES.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`
                        whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                        ${
                          selectedCategory === category.id
                            ? `border-${category.color}-500 text-${category.color}-600`
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }
                      `}
                    >
                      {category.name}
                      {category.id === 'all' && agents && (
                        <span className="ml-2 text-gray-400">({agents.length})</span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Agent Selection Grid */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {selectedCategory === 'all'
                  ? 'All Agents'
                  : AGENT_CATEGORIES.find(c => c.id === selectedCategory)?.name
                }
                <span className="ml-2 text-sm text-gray-500 font-normal">
                  ({filteredAgents.length} {filteredAgents.length === 1 ? 'agent' : 'agents'})
                </span>
              </h2>
              {agentsLoading ? (
                <SkeletonList items={6} />
              ) : filteredAgents.length === 0 ? (
                <div className="bg-gray-50 rounded-lg">
                  <EmptyState
                    icon="🤖"
                    title="No agents found"
                    message="No agents found in this category. Try selecting a different category."
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAgents.map((agent) => {
                    const Icon = AGENT_ICONS[agent.id] || DocumentTextIcon;
                    const color = AGENT_COLORS[agent.id] || 'blue';

                    return (
                      <button
                        key={agent.id}
                        onClick={() => setSelectedAgent(agent)}
                        className="text-left p-6 bg-white rounded-lg border-2 border-gray-200 hover:border-primary-500 hover:shadow-lg transition-all"
                      >
                        <div className="flex items-start mb-3">
                          <div className={`p-3 bg-${color}-100 rounded-lg mr-4`}>
                            <Icon className={`h-6 w-6 text-${color}-600`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {agent.name}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {agent.productivity_gain} faster • {agent.estimated_time}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {agent.description}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {agent.capabilities.slice(0, 3).map((cap, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                            >
                              {cap}
                            </span>
                          ))}
                          {agent.capabilities.length > 3 && (
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded">
                              +{agent.capabilities.length - 3} more
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Jobs */}
            {recentJobs && recentJobs.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Recent Jobs
                </h2>
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Agent
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Task
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Created
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentJobs.map((job) => {
                        const StatusIcon = getStatusIcon(job.status);
                        return (
                          <tr key={job.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {job.agent_type}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                              {job.task_description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                                <StatusIcon className="h-4 w-4 mr-1" />
                                {job.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(job.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                              <button
                                onClick={() => setActiveJobId(job.id)}
                                className="text-primary-600 hover:text-primary-900"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Agent Configuration (when agent selected) */}
        {selectedAgent && !activeJobId && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                {(() => {
                  const Icon = AGENT_ICONS[selectedAgent.id] || DocumentTextIcon;
                  return <Icon className="h-6 w-6 text-primary-600 mr-2" />;
                })()}
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedAgent.name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedAgent(null)}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Back to Agents
              </button>
            </div>

            {/* Task Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Description *
              </label>
              <textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Describe what you want to create..."
              />
              <p className="mt-1 text-xs text-gray-500">
                Be specific about your requirements, target audience, and desired outcomes
              </p>
            </div>

            {/* Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <select
                  value={parameters.subject}
                  onChange={(e) => setParameters({ ...parameters, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select subject</option>
                  <option value="mathematics">Mathematics</option>
                  <option value="ela">English Language Arts</option>
                  <option value="science">Science</option>
                  <option value="social-studies">Social Studies</option>
                  <option value="computer-science">Computer Science</option>
                  <option value="world-languages">World Languages</option>
                  <option value="fine-arts">Fine Arts</option>
                  <option value="physical-education">Physical Education</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State/District
                </label>
                <select
                  value={parameters.state}
                  onChange={(e) => setParameters({ ...parameters, state: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select state</option>
                  <option value="texas">Texas</option>
                  <option value="california">California</option>
                  <option value="florida">Florida</option>
                  <option value="new-york">New York</option>
                  <option value="pennsylvania">Pennsylvania</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setSelectedAgent(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleInvoke}
                disabled={invokeMutation.isPending || !taskDescription.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {invokeMutation.isPending ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-4 w-4 mr-2" />
                    Start Agent
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Agent Progress/Results (when job active) */}
        {activeJobId && jobStatus && (
          <div className="bg-white rounded-lg shadow p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {jobStatus.agent_type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {jobStatus.task_description}
                </p>
              </div>
              <button
                onClick={handleStartNew}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Start New Task
              </button>
            </div>

            {/* Progress Bar */}
            {(jobStatus.status === 'queued' || jobStatus.status === 'running') && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {jobStatus.progress_message || 'Processing...'}
                  </span>
                  <span className="text-sm text-gray-600">
                    {jobStatus.progress_percentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${jobStatus.progress_percentage}%` }}
                  ></div>
                </div>
                {jobStatus.status === 'running' && (
                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={() => cancelMutation.mutate(activeJobId)}
                      disabled={cancelMutation.isPending}
                      className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                      Cancel Job
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Status Badge */}
            <div className="mb-6">
              {(() => {
                const StatusIcon = getStatusIcon(jobStatus.status);
                return (
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(jobStatus.status)}`}>
                    <StatusIcon className={`h-5 w-5 mr-2 ${jobStatus.status === 'running' ? 'animate-spin' : ''}`} />
                    {jobStatus.status.charAt(0).toUpperCase() + jobStatus.status.slice(1)}
                  </span>
                );
              })()}
            </div>

            {/* Results */}
            {showResults && jobResult && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Generated Content
                </h3>

                {/* Content Preview */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                    {jobResult.generated_content}
                  </pre>
                </div>

                {/* Metadata */}
                {jobResult.metadata && Object.keys(jobResult.metadata).length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Metadata</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(jobResult.metadata).map(([key, value]) => (
                        <div key={key} className="text-sm">
                          <span className="text-gray-500">{key.replace('_', ' ')}:</span>{' '}
                          <span className="font-medium text-gray-900">
                            {Array.isArray(value) ? value.join(', ') : value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Next Steps */}
                {jobResult.suggestions && jobResult.suggestions.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Suggested Next Steps</h4>
                    <ul className="space-y-2">
                      {jobResult.suggestions.map((suggestion, idx) => (
                        <li key={idx} className="flex items-start text-sm text-gray-600">
                          <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-3">
                  <button
                    onClick={handleUseResult}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  >
                    Use in Content Editor
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(jobResult.generated_content);
                      showSuccess('Content copied to clipboard!');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Copy to Clipboard
                  </button>
                </div>
              </div>
            )}

            {/* Error Display */}
            {jobStatus.status === 'failed' && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <XCircleIcon className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Job Failed</h3>
                    <p className="mt-2 text-sm text-red-700">
                      {jobStatus.error_message || 'An error occurred while processing your request.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

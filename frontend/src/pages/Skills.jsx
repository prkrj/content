/**
 * Skills Browser - Browse and invoke Professor Framework skills
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SparklesIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlayIcon,
  InformationCircleIcon,
  ClockIcon,
  ChevronRightIcon,
  CodeBracketIcon,
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import Layout from '../components/Layout';
import useAuthStore from '../store/authStore';
import EmptyState from '../components/EmptyState';
import { SkeletonCard } from '../components/LoadingSkeleton';
import { showSuccess, showError, showInfo, showWarning } from '../utils/toast';
import { skillsAPI } from '../services/api';

export default function Skills() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [skills, setSkills] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Selected skill for detail view
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch('http://localhost:8000/api/v1/skills/categories', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch categories');

        const data = await response.json();
        setCategories(data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };

    fetchCategories();
  }, []);

  // Fetch skills (with filters)
  useEffect(() => {
    const fetchSkills = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('access_token');
        const params = new URLSearchParams();

        if (selectedCategory) params.append('category', selectedCategory);
        if (searchQuery) params.append('search', searchQuery);

        const response = await fetch(
          `http://localhost:8000/api/v1/skills/?${params.toString()}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) throw new Error('Failed to fetch skills');

        const data = await response.json();
        setSkills(data);
      } catch (err) {
        console.error('Error fetching skills:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSkills();
  }, [selectedCategory, searchQuery]);

  const handleSkillClick = (skill) => {
    setSelectedSkill(skill);
    setShowDetailModal(true);
  };

  const [showInvokeModal, setShowInvokeModal] = useState(false);
  const [skillToInvoke, setSkillToInvoke] = useState(null);
  const [skillParameters, setSkillParameters] = useState({});
  const [skillResult, setSkillResult] = useState(null);
  const [isInvoking, setIsInvoking] = useState(false);

  const handleInvokeSkill = (skill) => {
    setSkillToInvoke(skill);
    setSkillParameters({});
    setSkillResult(null);
    setShowInvokeModal(true);
  };

  const handleExecuteSkill = async () => {
    if (!skillToInvoke) return;

    setIsInvoking(true);
    try {
      const response = await skillsAPI.invoke(skillToInvoke.id, skillParameters);
      setSkillResult(response);
      showSuccess(`Skill "${skillToInvoke.name}" executed successfully`);
    } catch (error) {
      showError('Failed to execute skill', error);
      setSkillResult({ status: 'error', result: error.message || 'Unknown error' });
    } finally {
      setIsInvoking(false);
    }
  };

  const handleCloseInvokeModal = () => {
    setShowInvokeModal(false);
    setSkillToInvoke(null);
    setSkillParameters({});
    setSkillResult(null);
  };

  // Group skills by category
  const skillsByCategory = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {});

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <SparklesIcon className="h-8 w-8 text-primary-600 mr-3" />
                Skills Browser
              </h1>
              <p className="mt-2 text-gray-600">
                Browse and invoke 92 composable Professor Framework skills for educational content development
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CodeBracketIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Skills
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        {skills.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FunnelIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Categories
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        {categories.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ClockIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Avg. Execution Time
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        &lt; 1 min
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search skills by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                showFilters
                  ? 'border-primary-600 text-primary-700 bg-primary-50'
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filters
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Clear Filters */}
              {(selectedCategory || searchQuery) && (
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setSelectedCategory('');
                      setSearchQuery('');
                    }}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Skills List */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow">
            <EmptyState
              icon="⚠️"
              title="Error loading skills"
              message={error}
            />
          </div>
        ) : skills.length === 0 ? (
          <div className="bg-white rounded-lg shadow">
            <EmptyState
              icon="🔍"
              title="No skills found"
              message="Try adjusting your search or filter criteria to find matching skills"
              action={
                (selectedCategory || searchQuery)
                  ? {
                      label: 'Clear filters',
                      onClick: () => {
                        setSelectedCategory('');
                        setSearchQuery('');
                      },
                    }
                  : undefined
              }
            />
          </div>
        ) : (
          <div className="space-y-8">
            {Object.keys(skillsByCategory).map((category) => (
              <div key={category} className="bg-white shadow rounded-lg overflow-hidden">
                {/* Category Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">{category}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {skillsByCategory[category].length} skill{skillsByCategory[category].length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Skills Grid */}
                <div className="p-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {skillsByCategory[category].map((skill) => (
                      <div
                        key={skill.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-primary-500 hover:shadow-md transition-all cursor-pointer"
                        onClick={() => handleSkillClick(skill)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                              {skill.name}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1 font-mono">
                              {skill.id}
                            </p>
                          </div>
                          <ChevronRightIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        </div>

                        <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                          {skill.description}
                        </p>

                        <div className="mt-4 flex items-center justify-between">
                          <span className="inline-flex items-center text-xs text-gray-500">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            {skill.estimated_time}
                          </span>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInvokeSkill(skill);
                            }}
                            className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          >
                            <PlayIcon className="h-3 w-3 mr-1" />
                            Invoke
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Skill Detail Modal */}
        {showDetailModal && selectedSkill && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowDetailModal(false)}></div>

              <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full sm:p-6">
                <div className="absolute top-0 right-0 pt-4 pr-4">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-2xl leading-6 font-bold text-gray-900">
                      {selectedSkill.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 font-mono">
                      {selectedSkill.id}
                    </p>

                    <div className="mt-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
                        {selectedSkill.category}
                      </span>
                      <span className="ml-3 inline-flex items-center text-sm text-gray-500">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {selectedSkill.estimated_time}
                      </span>
                    </div>

                    <div className="mt-6">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Description</h4>
                      <p className="text-sm text-gray-700">{selectedSkill.description}</p>
                    </div>

                    {selectedSkill.parameters && selectedSkill.parameters.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Parameters</h4>
                        <div className="space-y-3">
                          {selectedSkill.parameters.map((param) => (
                            <div key={param.name} className="border border-gray-200 rounded-lg p-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center">
                                    <code className="text-sm font-mono text-gray-900">
                                      {param.name}
                                    </code>
                                    <span className="ml-2 text-xs text-gray-500">
                                      ({param.type})
                                    </span>
                                    {param.required && (
                                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                        required
                                      </span>
                                    )}
                                  </div>
                                  <p className="mt-1 text-sm text-gray-600">
                                    {param.description}
                                  </p>
                                  {param.default !== null && param.default !== undefined && (
                                    <p className="mt-1 text-xs text-gray-500">
                                      Default: <code>{JSON.stringify(param.default)}</code>
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedSkill.returns && (
                      <div className="mt-6">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Returns</h4>
                        <div className="bg-gray-50 rounded-lg p-3">
                          {Object.entries(selectedSkill.returns).map(([key, value]) => (
                            <div key={key} className="text-sm">
                              <code className="text-gray-900">{key}:</code>{' '}
                              <span className="text-gray-600">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedSkill.examples && selectedSkill.examples.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Examples</h4>
                        <div className="space-y-2">
                          {selectedSkill.examples.map((example, index) => (
                            <div key={index} className="bg-gray-900 rounded-lg p-3">
                              <code className="text-sm text-green-400">{example}</code>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 sm:flex sm:flex-row-reverse">
                  <button
                    onClick={() => handleInvokeSkill(selectedSkill)}
                    className="w-full inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    <PlayIcon className="h-4 w-4 mr-2" />
                    Invoke Skill
                  </button>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Skill Invocation Modal */}
        {showInvokeModal && skillToInvoke && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Invoke Skill: {skillToInvoke.name}
                  </h3>
                  <button
                    onClick={handleCloseInvokeModal}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <p className="text-sm text-gray-600 mb-6">{skillToInvoke.description}</p>

                {!skillResult ? (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Parameters</h4>
                    <div className="space-y-4">
                      {/* Simple parameter inputs */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Task Description
                        </label>
                        <textarea
                          value={skillParameters.task || ''}
                          onChange={(e) => setSkillParameters({ ...skillParameters, task: e.target.value })}
                          rows={3}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                          placeholder="Describe what you want this skill to do..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Context (optional)
                        </label>
                        <textarea
                          value={skillParameters.context || ''}
                          onChange={(e) => setSkillParameters({ ...skillParameters, context: e.target.value })}
                          rows={2}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                          placeholder="Any additional context or constraints..."
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        onClick={handleCloseInvokeModal}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleExecuteSkill}
                        disabled={isInvoking || !skillParameters.task}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isInvoking ? (
                          <>
                            <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
                            Executing...
                          </>
                        ) : (
                          <>
                            <PlayIcon className="h-4 w-4 mr-2" />
                            Execute Skill
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Result</h4>
                    <div className={`rounded-lg p-4 ${skillResult.status === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      <div className="flex items-start">
                        {skillResult.status === 'success' ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircleIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 mb-2">
                            {skillResult.status === 'success' ? 'Success' : 'Error'}
                          </p>
                          <div className="text-sm text-gray-700 whitespace-pre-wrap">
                            {skillResult.result}
                          </div>
                          {skillResult.execution_time && (
                            <p className="text-xs text-gray-500 mt-2">
                              Executed in {skillResult.execution_time.toFixed(2)}s
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        onClick={() => {
                          setSkillResult(null);
                          setSkillParameters({});
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Run Again
                      </button>
                      <button
                        onClick={handleCloseInvokeModal}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

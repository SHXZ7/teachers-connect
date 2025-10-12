"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/contexts/ThemeContext';
import { resourceAPI, SUBJECT_AREAS, GRADE_LEVELS } from '@/lib/resourceAPI';

const ResourceCard = ({ resource, onView, onLike, theme }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(resource.likes_count);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user has liked this resource
    const checkLikeStatus = async () => {
      try {
        const status = await resourceAPI.getLikeStatus(resource.id);
        setIsLiked(status.is_liked);
        setLikesCount(status.likes_count);
      } catch (error) {
        // User not authenticated or other error - ignore
      }
    };
    
    checkLikeStatus();
  }, [resource.id]);

  const handleLike = async (e) => {
    e.stopPropagation();
    setIsLoading(true);
    
    try {
      const response = await resourceAPI.toggleLike(resource.id);
      setIsLiked(response.action === 'liked');
      setLikesCount(response.likes_count);
      if (onLike) onLike(resource.id, response);
    } catch (error) {
      console.error('Like failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getResourceIcon = (type) => {
    switch (type) {
      case 'pdf': return '📄';
      case 'video': return '🎥';
      case 'audio': return '🎵';
      case 'image': return '🖼️';
      case 'presentation': return '📊';
      case 'document': return '📝';
      case 'lesson_plan': return '📚';
      case 'worksheet': return '📋';
      default: return '📁';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div 
      className={`p-4 rounded-lg border cursor-pointer transition-all duration-300 hover:shadow-md ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
          : 'bg-white border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => onView && onView(resource)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{getResourceIcon(resource.resource_type)}</span>
          <div>
            <h3 className={`font-semibold text-sm transition-colors duration-300 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {resource.title}
            </h3>
            <p className={`text-xs transition-colors duration-300 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              by {resource.author_name}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleLike}
          disabled={isLoading}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all duration-300 ${
            isLiked 
              ? 'text-red-500 hover:text-red-600' 
              : theme === 'dark' 
                ? 'text-gray-400 hover:text-red-400' 
                : 'text-gray-500 hover:text-red-500'
          }`}
        >
          <span className={isLiked ? '❤️' : '🤍'}></span>
          <span>{likesCount}</span>
        </button>
      </div>

      {resource.description && (
        <p className={`text-xs mb-3 line-clamp-2 transition-colors duration-300 ${
          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
        }`}>
          {resource.description}
        </p>
      )}

      <div className="flex flex-wrap gap-1 mb-3">
        <span className={`px-2 py-1 rounded-full text-xs transition-colors duration-300 ${
          theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'
        }`}>
          {resource.subject_area.replace('_', ' ')}
        </span>
        <span className={`px-2 py-1 rounded-full text-xs transition-colors duration-300 ${
          theme === 'dark' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800'
        }`}>
          {resource.grade_level.replace('_', ' ')}
        </span>
        {resource.tags.slice(0, 2).map((tag, index) => (
          <span 
            key={index}
            className={`px-2 py-1 rounded-full text-xs transition-colors duration-300 ${
              theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {tag}
          </span>
        ))}
      </div>

      <div className={`flex justify-between items-center text-xs transition-colors duration-300 ${
        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
      }`}>
        <div className="flex gap-3">
          <span>⭐ {resource.average_rating.toFixed(1)}</span>
          <span>👁️ {resource.view_count}</span>
          <span>⬇️ {resource.download_count}</span>
        </div>
        {resource.file_size && (
          <span>{formatFileSize(resource.file_size)}</span>
        )}
      </div>
    </div>
  );
};

export default function ResourceBrowser({ onSelectResource }) {
  const { theme } = useTheme();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    subject_area: '',
    grade_level: '',
    sort_by: 'created_at',
    sort_order: 'desc'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 12,
    total: 0,
    total_pages: 0
  });

  const fetchResources = async (resetPage = false) => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        page: resetPage ? 1 : pagination.page,
        per_page: pagination.per_page
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '') delete params[key];
      });

      const response = await resourceAPI.getResources(params);
      
      // Ensure we always have an array for resources
      setResources(response.resources || []);
      setPagination({
        page: response.page || 1,
        per_page: response.per_page || 12,
        total: response.total || 0,
        total_pages: response.total_pages || 0
      });
    } catch (error) {
      console.error('Failed to fetch resources:', error);
      // Set empty array on error to prevent undefined issues
      setResources([]);
      setPagination({
        page: 1,
        per_page: 12,
        total: 0,
        total_pages: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources(true);
  }, [filters]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchResources();
  };

  const handleResourceView = (resource) => {
    if (onSelectResource) {
      onSelectResource(resource);
    }
  };

  return (
    <div className={`p-6 rounded-lg border transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-xl font-semibold transition-colors duration-300 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Browse Resources
        </h2>
        <p className={`text-sm transition-colors duration-300 ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        }`}>
          {pagination.total} resources found
        </p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Input
          type="text"
          placeholder="Search resources..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className={`transition-all duration-300 ${
            theme === 'dark' 
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
              : 'bg-white border-gray-300'
          }`}
        />

        <select
          value={filters.subject_area}
          onChange={(e) => handleFilterChange('subject_area', e.target.value)}
          className={`px-3 py-2 border rounded-md transition-all duration-300 ${
            theme === 'dark' 
              ? 'bg-gray-700 border-gray-600 text-white' 
              : 'bg-white border-gray-300'
          } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
        >
          <option value="">All Subjects</option>
          {SUBJECT_AREAS.map(subject => (
            <option key={subject.value} value={subject.value}>
              {subject.label}
            </option>
          ))}
        </select>

        <select
          value={filters.grade_level}
          onChange={(e) => handleFilterChange('grade_level', e.target.value)}
          className={`px-3 py-2 border rounded-md transition-all duration-300 ${
            theme === 'dark' 
              ? 'bg-gray-700 border-gray-600 text-white' 
              : 'bg-white border-gray-300'
          } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
        >
          <option value="">All Grades</option>
          {GRADE_LEVELS.map(grade => (
            <option key={grade.value} value={grade.value}>
              {grade.label}
            </option>
          ))}
        </select>

        <select
          value={`${filters.sort_by}-${filters.sort_order}`}
          onChange={(e) => {
            const [sort_by, sort_order] = e.target.value.split('-');
            handleFilterChange('sort_by', sort_by);
            handleFilterChange('sort_order', sort_order);
          }}
          className={`px-3 py-2 border rounded-md transition-all duration-300 ${
            theme === 'dark' 
              ? 'bg-gray-700 border-gray-600 text-white' 
              : 'bg-white border-gray-300'
          } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
        >
          <option value="created_at-desc">Newest First</option>
          <option value="created_at-asc">Oldest First</option>
          <option value="likes_count-desc">Most Liked</option>
          <option value="average_rating-desc">Highest Rated</option>
          <option value="download_count-desc">Most Downloaded</option>
        </select>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Resources Grid */}
      {!loading && (
        <>
          {(!resources || resources.length === 0) ? (
            <div className={`text-center py-12 transition-colors duration-300 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <p>No resources found matching your criteria.</p>
              <p className="text-sm mt-2">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {resources.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  onView={handleResourceView}
                  theme={theme}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className={theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}
              >
                Previous
              </Button>
              
              <span className={`flex items-center px-3 text-sm transition-colors duration-300 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Page {pagination.page} of {pagination.total_pages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.total_pages}
                className={theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
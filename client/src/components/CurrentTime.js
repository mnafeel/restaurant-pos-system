import React from 'react';
import { useServerTime } from '../hooks/useServerTime';
import { FiClock } from 'react-icons/fi';

/**
 * Component to display current Indian time
 * @param {Object} props
 * @param {boolean} props.showDate - Show date along with time (default: false)
 * @param {boolean} props.showSeconds - Show seconds (default: true)
 * @param {boolean} props.showIcon - Show clock icon (default: true)
 * @param {string} props.className - Additional CSS classes
 */
const CurrentTime = ({ 
  showDate = false, 
  showSeconds = true, 
  showIcon = true,
  className = ''
}) => {
  const { date, time, timeShort, loading } = useServerTime();

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 text-gray-500 ${className}`}>
        <FiClock className="animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {showIcon && <FiClock className="text-blue-600" />}
      <div className="flex flex-col">
        {showDate && (
          <span className="text-xs text-gray-600">{date}</span>
        )}
        <span className="text-sm font-medium text-gray-900">
          {showSeconds ? time : timeShort}
        </span>
      </div>
    </div>
  );
};

export default CurrentTime;


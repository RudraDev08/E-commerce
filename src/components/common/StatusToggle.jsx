import React, { useState } from 'react';
import axios from 'axios';

export const StatusToggle = ({ initialStatus, categoryId, onUpdateError }) => {
  const [isActive, setIsActive] = useState(initialStatus === 'Active');
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    const previousState = isActive;
    const newStatus = !isActive ? 'Active' : 'Inactive';

    // Optimistic UI update
    setIsActive(!isActive);
    setIsLoading(true);

    try {
      await axios.patch(
        `http://localhost:5000/api/categories/${categoryId}/status`,
        { status: newStatus }
      );
    } catch (error) {
      // Revert on failure
      setIsActive(previousState);
      onUpdateError?.(error.response?.data?.message || 'Failed to update status');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isActive}
      disabled={isLoading}
      onClick={handleToggle}
      className={`
        relative inline-flex h-5 w-10 items-center rounded-full transition-colors
        focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2
        ${isActive ? 'bg-indigo-600' : 'bg-gray-200'}
        ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white shadow transition
          ${isActive ? 'translate-x-5' : 'translate-x-1'}
        `}
      />
    </button>
  );
};

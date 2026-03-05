import React, { useState, useEffect } from 'react';
import { Activity, ServerCrash, RefreshCw, CheckCircle, Clock } from 'lucide-react';

export const SystemStatusWidget = () => {
    const [status, setStatus] = useState({ state: 'operational' }); // 'operational', 'degraded', 'outage'
    const [jobs, setJobs] = useState({ pending: 0, active: 0, failed: 0 });
    const [lastSync, setLastSync] = useState(new Date().toISOString());

    // In a real scenario, this fetches from the new '/api/v1/internal/metrics' or similar
    useEffect(() => {
        // Simulated fetch
        const fetchStatus = () => {
            setStatus({ state: 'operational' });
            setJobs({ pending: 12, active: 4, failed: 1 });
            setLastSync(new Date().toISOString());
        };
        fetchStatus();
        const interval = setInterval(fetchStatus, 30000); // 30s polling
        return () => clearInterval(interval);
    }, []);

    const StatusIcon = status.state === 'operational' ? CheckCircle : (status.state === 'degraded' ? RefreshCw : ServerCrash);
    const statusColor = status.state === 'operational' ? 'text-green-500' : (status.state === 'degraded' ? 'text-yellow-500' : 'text-red-500');

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-100 dark:border-gray-800 p-4 min-w-[300px]">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-500" />
                    System Health
                </h3>
                <span className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full bg-gray-50 dark:bg-gray-800 ${statusColor}`}>
                    <div className={`w-2 h-2 rounded-full ${statusColor.replace('text-', 'bg-')}`} />
                    {status.state.toUpperCase()}
                </span>
            </div>

            <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-gray-50 dark:border-gray-800 pb-2">
                    <span className="text-gray-500 dark:text-gray-400">Background Jobs</span>
                    <div className="flex gap-2 font-medium">
                        <span className="text-blue-500" title="Active worker queues">{jobs.active} active</span>
                        <span className="text-gray-400">|</span>
                        <span className={jobs.failed > 0 ? 'text-red-500' : 'text-gray-500'}>{jobs.failed} failed</span>
                    </div>
                </div>

                <div className="flex justify-between pb-1">
                    <span className="text-gray-500 dark:text-gray-400">Inventory Sync</span>
                    <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300 font-medium font-mono text-xs">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(lastSync).toLocaleTimeString()}
                    </span>
                </div>
            </div>
        </div>
    );
};

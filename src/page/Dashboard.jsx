// page/Dashboard.jsx
import {
  ChartBarIcon,
  UsersIcon,
  GlobeAltIcon,
  MapIcon,
  BuildingOfficeIcon,
  HashtagIcon,
  ArrowTrendingUpIcon,
  DocumentChartBarIcon,
} from "@heroicons/react/24/outline";
import {
  ChartBarIcon as ChartBarIconSolid,
  UsersIcon as UsersIconSolid,
  GlobeAltIcon as GlobeAltIconSolid,
} from "@heroicons/react/24/solid";

const Dashboard = () => {
  const stats = [
    { title: "Total Countries", value: "195", icon: GlobeAltIconSolid, color: "text-blue-600", change: "+2.3%" },
    { title: "Total States", value: "4,237", icon: MapIcon, color: "text-green-600", change: "+5.1%" },
    { title: "Total Cities", value: "45,672", icon: BuildingOfficeIcon, color: "text-purple-600", change: "+3.8%" },
    { title: "Total Pincodes", value: "1.2M", icon: HashtagIcon, color: "text-amber-600", change: "+1.9%" },
    { title: "Active Users", value: "1,234", icon: UsersIconSolid, color: "text-indigo-600", change: "+12.5%" },
    { title: "Data Accuracy", value: "98.7%", icon: ChartBarIconSolid, color: "text-emerald-600", change: "+0.8%" },
  ];

  const recentActivities = [
    { action: "New country added", item: "United States", time: "2 min ago", user: "John Doe" },
    { action: "State updated", item: "California", time: "15 min ago", user: "Jane Smith" },
    { action: "City data imported", item: "1,234 cities", time: "1 hour ago", user: "System" },
    { action: "Pincode verification", item: "Batch #2024-01", time: "3 hours ago", user: "Auto-sync" },
    { action: "User logged in", item: "Admin Panel", time: "5 hours ago", user: "Robert Johnson" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Welcome back! Here's what's happening with your data today.
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg">
            <div className="flex items-center gap-2">
              <DocumentChartBarIcon className="h-5 w-5" />
              Generate Report
            </div>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stat.value}</p>
                <div className="flex items-center gap-2 mt-3">
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">{stat.change}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">from last week</span>
                </div>
              </div>
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                stat.color.includes('blue') ? 'bg-blue-100 dark:bg-blue-900/30' :
                stat.color.includes('green') ? 'bg-green-100 dark:bg-green-900/30' :
                stat.color.includes('purple') ? 'bg-purple-100 dark:bg-purple-900/30' :
                stat.color.includes('amber') ? 'bg-amber-100 dark:bg-amber-900/30' :
                stat.color.includes('indigo') ? 'bg-indigo-100 dark:bg-indigo-900/30' :
                'bg-emerald-100 dark:bg-emerald-900/30'
              }`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Activity</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Latest updates in the system</p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {recentActivities.map((activity, index) => (
              <div key={index} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{activity.action}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{activity.item}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{activity.time}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{activity.user}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button className="w-full text-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm">
              View all activities →
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">System Status</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Current system performance</p>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700 dark:text-gray-300 font-medium">Data Sync</span>
                <span className="text-green-600 dark:text-green-400 font-medium">98%</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full" style={{ width: '98%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700 dark:text-gray-300 font-medium">API Response Time</span>
                <span className="text-blue-600 dark:text-blue-400 font-medium">142ms</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700 dark:text-gray-300 font-medium">Storage Usage</span>
                <span className="text-amber-600 dark:text-amber-400 font-medium">72%</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-500 to-orange-600 rounded-full" style={{ width: '72%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700 dark:text-gray-300 font-medium">Active Sessions</span>
                <span className="text-purple-600 dark:text-purple-400 font-medium">24</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-600 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">All systems operational</span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Last checked: Just now</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
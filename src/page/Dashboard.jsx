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
  ClockIcon,
  ServerIcon,
  CloudArrowUpIcon,
  CpuChipIcon,
} from "@heroicons/react/24/outline";
import {
  ChartBarIcon as ChartBarIconSolid,
  UsersIcon as UsersIconSolid,
  GlobeAltIcon as GlobeAltIconSolid,
} from "@heroicons/react/24/solid";

const Dashboard = () => {
  const stats = [
    { title: "Total Countries", value: "195", icon: GlobeAltIconSolid, color: "text-sky-500", bgColor: "bg-sky-50", change: "+2.3%" },
    { title: "Total States", value: "4,237", icon: MapIcon, color: "text-emerald-500", bgColor: "bg-emerald-50", change: "+5.1%" },
    { title: "Total Cities", value: "45,672", icon: BuildingOfficeIcon, color: "text-violet-500", bgColor: "bg-violet-50", change: "+3.8%" },
    { title: "Total Pincodes", value: "1.2M", icon: HashtagIcon, color: "text-amber-500", bgColor: "bg-amber-50", change: "+1.9%" },
    { title: "Active Users", value: "1,234", icon: UsersIconSolid, color: "text-indigo-500", bgColor: "bg-indigo-50", change: "+12.5%" },
    { title: "Data Accuracy", value: "98.7%", icon: ChartBarIconSolid, color: "text-teal-500", bgColor: "bg-teal-50", change: "+0.8%" },
  ];

  const recentActivities = [
    { action: "New country added", item: "United States", time: "2 min ago", user: "John Doe", icon: GlobeAltIcon, color: "text-sky-500", bgColor: "bg-sky-100" },
    { action: "State updated", item: "California", time: "15 min ago", user: "Jane Smith", icon: MapIcon, color: "text-emerald-500", bgColor: "bg-emerald-100" },
    { action: "City data imported", item: "1,234 cities", time: "1 hour ago", user: "System", icon: BuildingOfficeIcon, color: "text-violet-500", bgColor: "bg-violet-100" },
    { action: "Pincode verification", item: "Batch #2024-01", time: "3 hours ago", user: "Auto-sync", icon: HashtagIcon, color: "text-amber-500", bgColor: "bg-amber-100" },
    { action: "User logged in", item: "Admin Panel", time: "5 hours ago", user: "Robert Johnson", icon: UsersIcon, color: "text-indigo-500", bgColor: "bg-indigo-100" },
  ];

  const systemStats = [
    { title: "Data Sync", value: "98%", color: "text-emerald-500", barColor: "from-emerald-400 to-emerald-500", bgColor: "bg-emerald-50", icon: CloudArrowUpIcon, status: "Optimal" },
    { title: "API Response", value: "142ms", color: "text-sky-500", barColor: "from-sky-400 to-sky-500", bgColor: "bg-sky-50", icon: CpuChipIcon, status: "Fast" },
    { title: "Storage Usage", value: "72%", color: "text-amber-500", barColor: "from-amber-400 to-amber-500", bgColor: "bg-amber-50", icon: ServerIcon, status: "Moderate" },
    { title: "Active Sessions", value: "24", color: "text-violet-500", barColor: "from-violet-400 to-violet-500", bgColor: "bg-violet-50", icon: UsersIcon, status: "Normal" },
  ];

  return (
    <div className="space-y-8 p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
          <p className="text-gray-500 mt-1">
            Welcome back! Here's what's happening with your data today.
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <button className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-xl font-medium hover:from-sky-600 hover:to-indigo-600 transition-all shadow-sm hover:shadow-md active:scale-95">
            <div className="flex items-center gap-2">
              <DocumentChartBarIcon className="h-5 w-5" />
              Generate Report
            </div>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">{stat.value}</p>
                <div className="flex items-center gap-1.5 mt-3">
                  <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-500">{stat.change}</span>
                  <span className="text-xs text-gray-400">from last week</span>
                </div>
              </div>
              <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Recent Activity</h2>
                <p className="text-gray-500 text-sm mt-0.5">Latest updates in the system</p>
              </div>
              <ClockIcon className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {recentActivities.map((activity, index) => (
              <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${activity.bgColor}`}>
                    <activity.icon className={`h-5 w-5 ${activity.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-800">{activity.action}</p>
                        <p className="text-sm text-gray-600 mt-0.5">{activity.item}</p>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">{activity.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-gray-300"></div>
                      <span className="text-xs text-gray-500">{activity.user}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-100">
            <button className="w-full text-center text-sky-500 hover:text-sky-600 font-medium text-sm py-2 rounded-lg hover:bg-sky-50 transition-colors">
              View all activities →
            </button>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-800">System Status</h2>
                <p className="text-gray-500 text-sm mt-0.5">Current system performance</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full">
                <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-emerald-600">All systems normal</span>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-6">
            {systemStats.map((stat, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${stat.bgColor}`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">{stat.title}</p>
                      <p className="text-xs text-gray-500">{stat.status}</p>
                    </div>
                  </div>
                  <span className={`text-lg font-bold ${stat.color}`}>{stat.value}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${stat.barColor} rounded-full`} 
                    style={{ 
                      width: stat.value.includes('%') 
                        ? stat.value 
                        : stat.title === 'API Response' ? '85%' 
                        : stat.title === 'Active Sessions' ? '60%'
                        : '90%'
                    }}>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Updated just now</span>
              </div>
              <button className="text-sm text-sky-500 hover:text-sky-600 font-medium">
                Refresh Status
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Insights */}
      <div className="bg-gradient-to-r from-sky-50 to-indigo-50 rounded-xl p-5 border border-sky-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Quick Insights</h3>
            <p className="text-gray-600 text-sm mt-1">Your data is growing steadily. Consider expanding storage soon.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/80 flex items-center justify-center">
              <ChartBarIcon className="h-5 w-5 text-sky-500" />
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Data Growth</p>
              <p className="text-lg font-bold text-gray-800">+8.2% this month</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
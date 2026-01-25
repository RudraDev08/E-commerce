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

// UI ENHANCEMENT: Premium dashboard with enhanced visual hierarchy
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
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">{/* RESPONSIVE UI ENHANCEMENT: Adaptive padding for all screen sizes */}
      {/* UI ENHANCEMENT: Premium header section with Tailwind */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-600 mt-2 text-sm">
            Welcome back! Here's what's happening with your data today.
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-700 hover:to-blue-700 focus:ring-indigo-500/50 shadow-md shadow-indigo-300/25 hover:shadow-lg hover:shadow-indigo-300/35">
            <DocumentChartBarIcon className="h-5 w-5" />
            Generate Report
          </button>
        </div>
      </div>

      {/* UI ENHANCEMENT: Premium stats grid with hover effects using Tailwind */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl p-5 border border-slate-200 transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-indigo-200/50">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">{stat.title}</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
                <div className="flex items-center gap-2 mt-3">
                  <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-semibold text-emerald-600">{stat.change}</span>
                  <span className="text-xs text-slate-400">from last week</span>
                </div>
              </div>
              <div className={`h-14 w-14 rounded-xl flex items-center justify-center ${stat.bgColor} ring-2 ring-white shadow-lg`}>
                <stat.icon className={`h-7 w-7 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* UI ENHANCEMENT: Premium two-column layout with Tailwind */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* UI ENHANCEMENT: Premium Recent Activity Card with Tailwind */}
        <div className="bg-white rounded-2xl border border-slate-200 transition-all duration-300 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-transparent">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
                <p className="text-slate-500 text-sm mt-0.5">Latest updates in the system</p>
              </div>
              <ClockIcon className="h-5 w-5 text-slate-400" />
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {recentActivities.map((activity, index) => (
              <div key={index} className="p-5 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${activity.bgColor} ring-2 ring-white shadow-sm`}>
                    <activity.icon className={`h-5 w-5 ${activity.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{activity.action}</p>
                        <p className="text-sm text-slate-600 mt-0.5">{activity.item}</p>
                      </div>
                      <span className="text-xs text-slate-400 whitespace-nowrap ml-2">{activity.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-slate-300"></div>
                      <span className="text-xs text-slate-500">{activity.user}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
            <button className="w-full text-center text-indigo-600 hover:text-indigo-700 font-semibold text-sm py-2 rounded-xl hover:bg-indigo-50 transition-colors">
              View all activities →
            </button>
          </div>
        </div>

        {/* UI ENHANCEMENT: Premium System Status Card with Tailwind */}
        <div className="bg-white rounded-2xl border border-slate-200 transition-all duration-300 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-transparent">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">System Status</h2>
                <p className="text-slate-500 text-sm mt-0.5">Current system performance</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full ring-2 ring-emerald-100">
                <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-semibold text-emerald-700">All systems normal</span>
              </div>
            </div>
          </div>
          <div className="px-6 py-5 space-y-6">
            {systemStats.map((stat, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${stat.bgColor} ring-2 ring-white shadow-sm`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{stat.title}</p>
                      <p className="text-xs text-slate-500">{stat.status}</p>
                    </div>
                  </div>
                  <span className={`text-lg font-bold ${stat.color}`}>{stat.value}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${stat.barColor} rounded-full transition-all duration-500 ease-out`}
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
          <div className="premium-card-footer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-slate-600">Updated just now</span>
              </div>
              <button className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold">
                Refresh Status
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* UI ENHANCEMENT: Premium Quick Insights Card with Tailwind */}
      <div className="bg-white rounded-2xl border border-indigo-200/50 transition-all duration-300 shadow-sm bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Quick Insights</h3>
              <p className="text-slate-700 text-sm mt-1">Your data is growing steadily. Consider expanding storage soon.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <ChartBarIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-600 font-medium">Data Growth</p>
                <p className="text-xl font-bold text-slate-900">+8.2% this month</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
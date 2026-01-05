import CountryOne from "../Toggle/CountryOne";
import CountryTwo from "../Toggle/CountryTwo";
import CountryThree from "../Toggle/CountryThree";
import CountryFour from "../Toggle/CountryFour";
import { 
  MapPinIcon, 
  GlobeAmericasIcon,
  DocumentChartBarIcon,
  ChartPieIcon 
} from "@heroicons/react/24/outline";

const LocationPage = () => {
  const stats = [
    { label: "Total Countries", value: "195", icon: GlobeAmericasIcon, change: "+2.1%", color: "bg-blue-500" },
    { label: "Active Filters", value: "3", icon: MapPinIcon, change: "+1", color: "bg-green-500" },
    { label: "Data Points", value: "12,458", icon: DocumentChartBarIcon, change: "+12%", color: "bg-purple-500" },
    { label: "Coverage", value: "89%", icon: ChartPieIcon, change: "+3.2%", color: "bg-indigo-500" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Location Management</h1>
            <p className="text-gray-600 mt-2">Configure country-specific settings and filters</p>
          </div>
          <button className="hidden md:flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg transition-colors">
            <MapPinIcon className="h-5 w-5" />
            <span>Export Data</span>
          </button>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Country Toggles */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Country Configuration</h2>
                <p className="text-gray-600 text-sm mt-1">Manage country-specific settings and preferences</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                <GlobeAmericasIcon className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
            
            <div className="space-y-6">
              <CountryOne />
              <CountryTwo />
              <CountryThree />
              <CountryFour />
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-100">
              <button className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg font-medium transition-colors">
                Add New Country Rule
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Changes</h3>
            <div className="space-y-4">
              {[
                { user: "Alex Johnson", action: "updated Country One settings", time: "5 min ago", color: "bg-blue-100 text-blue-800" },
                { user: "Sam Wilson", action: "added new filter to Country Three", time: "1 hour ago", color: "bg-green-100 text-green-800" },
                { user: "Taylor Swift", action: "exported location data", time: "2 hours ago", color: "bg-purple-100 text-purple-800" },
                { user: "John Doe", action: "modified Country Four preferences", time: "Yesterday", color: "bg-orange-100 text-orange-800" },
              ].map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                    {activity.user.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.user} <span className="font-normal text-gray-600">{activity.action}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${activity.color}`}>
                    {activity.action.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Additional Info & Actions */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold">Quick Actions</h3>
                <p className="text-indigo-100 text-sm mt-1">Common location management tasks</p>
              </div>
              <DocumentChartBarIcon className="h-8 w-8 text-white/80" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Import Data", icon: "📥" },
                { label: "Generate Report", icon: "📊" },
                { label: "Share Settings", icon: "🔗" },
                { label: "Backup Config", icon: "💾" },
              ].map((action, index) => (
                <button key={index} className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-4 rounded-lg flex flex-col items-center justify-center transition-colors">
                  <span className="text-2xl mb-2">{action.icon}</span>
                  <span className="text-sm font-medium">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Configuration Guide */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration Guide</h3>
            <div className="space-y-4">
              {[
                { title: "Country Selection", desc: "Choose specific countries to apply settings", step: "1" },
                { title: "Filter Settings", desc: "Configure data filters for selected countries", step: "2" },
                { title: "Data Processing", desc: "Set up data collection and processing rules", step: "3" },
                { title: "Export Options", desc: "Configure data export formats and schedules", step: "4" },
              ].map((guide, index) => (
                <div key={index} className="flex items-start space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                    {guide.step}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{guide.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{guide.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-medium transition-colors">
              View Full Documentation
            </button>
          </div>

          {/* Data Visualization Preview */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Data Distribution</h3>
              <span className="text-sm text-gray-500">Last 30 days</span>
            </div>
            <div className="space-y-3">
              {[
                { country: "United States", percentage: 42, color: "bg-blue-500" },
                { country: "United Kingdom", percentage: 18, color: "bg-green-500" },
                { country: "Canada", percentage: 12, color: "bg-purple-500" },
                { country: "Australia", percentage: 9, color: "bg-yellow-500" },
                { country: "Others", percentage: 19, color: "bg-gray-300" },
              ].map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{item.country}</span>
                    <span className="text-gray-600">{item.percentage}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${item.color} rounded-full`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="text-sm text-gray-600">
          <p>Last updated: Today, 10:42 AM</p>
        </div>
        <div className="flex space-x-3">
          <button className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
            Reset to Default
          </button>
          <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationPage;
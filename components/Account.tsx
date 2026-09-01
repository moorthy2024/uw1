"use client";
import { User, Bell, Lock, HelpCircle, Shield, Mail, Globe, Clock } from "lucide-react";

export function Account() {
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* User Profile */}
        <div className="bg-white rounded-xl border border-[#E5E7EB]">
          <div className="p-6 border-b border-[#E5E7EB]">
            <h3 className="text-lg font-semibold text-[#111827]">User Profile</h3>
            <p className="text-sm text-[#4B5563] mt-1">Manage your account information and preferences</p>
          </div>
          <div className="p-6">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 rounded-full bg-[#0076BC] flex items-center justify-center text-white text-2xl font-semibold">
                A
              </div>
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-[#4B5563] mb-1 block">Full Name</label>
                    <input
                      type="text"
                      defaultValue="Mike Farrell"
                      className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0076BC] focus:ring-opacity-35"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#4B5563] mb-1 block">Email</label>
                    <input
                      type="email"
                      defaultValue="ashley@qbe.com"
                      className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0076BC] focus:ring-opacity-35"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#4B5563] mb-1 block">Role</label>
                    <input
                      type="text"
                      defaultValue="Senior Underwriter"
                      className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm text-[#111827] bg-[#F7F8FA]"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#4B5563] mb-1 block">Department</label>
                    <input
                      type="text"
                      defaultValue="Commercial Property"
                      className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm text-[#111827] bg-[#F7F8FA]"
                      disabled
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button className="px-4 py-2 bg-[#0076BC] text-white rounded-lg hover:bg-[#0076BC] transition-colors text-sm font-medium">
                    Save Changes
                  </button>
                  <button className="px-4 py-2 bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6] transition-colors text-sm font-medium text-[#111827]">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-xl border border-[#E5E7EB]">
          <div className="p-6 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#0076BC]" />
              <h3 className="text-lg font-semibold text-[#111827]">Notification Settings</h3>
            </div>
            <p className="text-sm text-[#4B5563] mt-1">Control how you receive notifications</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-3 bg-[#F7F8FA] rounded-lg">
              <div>
                <div className="text-sm font-medium text-[#111827]">Email Notifications</div>
                <div className="text-xs text-[#4B5563] mt-1">Receive updates via email</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#0076BC] peer-focus:ring-opacity-35 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0076BC]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#F7F8FA] rounded-lg">
              <div>
                <div className="text-sm font-medium text-[#111827]">HITL Gate Alerts</div>
                <div className="text-xs text-[#4B5563] mt-1">Notify when submissions require human review</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#0076BC] peer-focus:ring-opacity-35 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0076BC]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#F7F8FA] rounded-lg">
              <div>
                <div className="text-sm font-medium text-[#111827]">SLA Warnings</div>
                <div className="text-xs text-[#4B5563] mt-1">Alert when submissions approach SLA deadline</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#0076BC] peer-focus:ring-opacity-35 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0076BC]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#F7F8FA] rounded-lg">
              <div>
                <div className="text-sm font-medium text-[#111827]">Producer Communications</div>
                <div className="text-xs text-[#4B5563] mt-1">Notifications for producer messages and requests</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#0076BC] peer-focus:ring-opacity-35 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0076BC]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#F7F8FA] rounded-lg">
              <div>
                <div className="text-sm font-medium text-[#111827]">Team Updates</div>
                <div className="text-xs text-[#4B5563] mt-1">Notifications about team performance and capacity</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#0076BC] peer-focus:ring-opacity-35 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0076BC]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Session Settings */}
        <div className="bg-white rounded-xl border border-[#E5E7EB]">
          <div className="p-6 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#0076BC]" />
              <h3 className="text-lg font-semibold text-[#111827]">Session Settings</h3>
            </div>
            <p className="text-sm text-[#4B5563] mt-1">Manage session timeout and preferences</p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-[#4B5563] mb-1 block">Session Timeout</label>
              <select defaultValue="1 hour" className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0076BC] focus:ring-opacity-35">
                <option>30 minutes</option>
                <option>1 hour</option>
                <option>2 hours</option>
                <option>4 hours</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[#4B5563] mb-1 block">Timezone</label>
              <select defaultValue="Pacific Time (PT)" className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0076BC] focus:ring-opacity-35">
                <option>Eastern Time (ET)</option>
                <option>Central Time (CT)</option>
                <option>Pacific Time (PT)</option>
                <option>Mountain Time (MT)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-xl border border-[#E5E7EB]">
          <div className="p-6 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#0076BC]" />
              <h3 className="text-lg font-semibold text-[#111827]">Security Settings</h3>
            </div>
            <p className="text-sm text-[#4B5563] mt-1">Password and authentication preferences</p>
          </div>
          <div className="p-6 space-y-4">
            <button className="w-full flex items-center justify-between p-3 bg-[#F7F8FA] rounded-lg hover:bg-[#F3F4F6] transition-colors">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-[#4B5563]" />
                <div className="text-left">
                  <div className="text-sm font-medium text-[#111827]">Change Password</div>
                  <div className="text-xs text-[#4B5563] mt-1">Last changed 47 days ago</div>
                </div>
              </div>
              <span className="text-sm text-[#0076BC]">Update</span>
            </button>

            <button className="w-full flex items-center justify-between p-3 bg-[#F7F8FA] rounded-lg hover:bg-[#F3F4F6] transition-colors">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-[#4B5563]" />
                <div className="text-left">
                  <div className="text-sm font-medium text-[#111827]">Two-Factor Authentication</div>
                  <div className="text-xs text-green-600 mt-1">Enabled via SMS</div>
                </div>
              </div>
              <span className="text-sm text-[#0076BC]">Manage</span>
            </button>

            <button className="w-full flex items-center justify-between p-3 bg-[#F7F8FA] rounded-lg hover:bg-[#F3F4F6] transition-colors">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-[#4B5563]" />
                <div className="text-left">
                  <div className="text-sm font-medium text-[#111827]">Active Sessions</div>
                  <div className="text-xs text-[#4B5563] mt-1">2 active sessions</div>
                </div>
              </div>
              <span className="text-sm text-[#0076BC]">View</span>
            </button>
          </div>
        </div>

        {/* Help & Support */}
        <div className="bg-white rounded-xl border border-[#E5E7EB]">
          <div className="p-6 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#0076BC]" />
              <h3 className="text-lg font-semibold text-[#111827]">Help & Support</h3>
            </div>
            <p className="text-sm text-[#4B5563] mt-1">Resources and assistance</p>
          </div>
          <div className="p-6 space-y-3">
            <button className="w-full flex items-center justify-between p-3 bg-[#F7F8FA] rounded-lg hover:bg-[#F3F4F6] transition-colors">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-[#4B5563]" />
                <div className="text-sm font-medium text-[#111827]">User Guide</div>
              </div>
              <span className="text-sm text-[#0076BC]">Open</span>
            </button>

            <button className="w-full flex items-center justify-between p-3 bg-[#F7F8FA] rounded-lg hover:bg-[#F3F4F6] transition-colors">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#4B5563]" />
                <div className="text-sm font-medium text-[#111827]">Contact Support</div>
              </div>
              <span className="text-sm text-[#0076BC]">Send</span>
            </button>

            <button className="w-full flex items-center justify-between p-3 bg-[#F7F8FA] rounded-lg hover:bg-[#F3F4F6] transition-colors">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-[#4B5563]" />
                <div className="text-sm font-medium text-[#111827]">About Workbench</div>
              </div>
              <span className="text-sm text-[#4B5563]">v2.4.1</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



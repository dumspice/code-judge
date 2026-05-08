'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import {
  Camera,
  Zap,
  Code2,
  Target,
  Settings,
  Edit2,
  LogOut,
  Github,
  Linkedin,
  Globe,
  MailCheck,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { usersApi } from '@/services/user.apis';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  bio: string;
  location: string;
  joinDate: string;
  avatar: string;
  level: number;
  totalProblemsolved: number;
  currentStreak: number;
  bestRank: number;
  languages: string[];
  achievements: Achievement[];
  socialLinks: SocialLink[];
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string;
}

interface SocialLink {
  platform: string;
  url: string;
}

const mockProfile: UserProfile = {
  id: '1',
  name: 'Nguyễn Văn A',
  email: 'nguyenvana@example.com',
  bio: 'Passionate about competitive programming and algorithms. Always learning, always coding.',
  location: 'Hà Nội, Việt Nam',
  joinDate: '2023-01-15',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NguyenVanA',
  level: 15,
  totalProblemsolved: 124,
  currentStreak: 12,
  bestRank: 42,
  languages: ['C++', 'Python', 'Java', 'JavaScript'],
  achievements: [
    {
      id: '1',
      name: 'First Problem Solved',
      description: 'Solved your first problem',
      icon: '🎯',
      unlockedAt: '2023-02-10',
    },
    {
      id: '2',
      name: '50 Problems Solved',
      description: 'Solved 50 problems',
      icon: '⭐',
      unlockedAt: '2023-05-20',
    },
    {
      id: '3',
      name: 'Streak Master',
      description: 'Maintained 10+ day streak',
      icon: '🔥',
      unlockedAt: '2023-08-15',
    },
    {
      id: '4',
      name: '100 Problems Solved',
      description: 'Solved 100 problems',
      icon: '💯',
      unlockedAt: '2023-11-01',
    },
  ],
  socialLinks: [
    { platform: 'GitHub', url: 'https://github.com' },
    { platform: 'LinkedIn', url: 'https://linkedin.com' },
  ],
};

export default function ProfilePage() {
  const { user, logout, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'achievements' | 'settings'>(
    'overview',
  );
  const [profile] = useState<UserProfile>(mockProfile);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [profileName, setProfileName] = useState(user?.name ?? '');
  const [profileEmail, setProfileEmail] = useState(user?.email ?? '');
  const [isUploading, setIsUploading] = useState(false);
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfileEmail(user.email);
    }
  }, [user]);

  const getAchievementIcon = (icon: string) => {
    return <span className="text-3xl">{icon}</span>;
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsUploading(true);
    try {
      const extension = file.name.split('.').pop() ?? 'bin';
      const uploadData = await usersApi.getAvatarUploadUrl(extension);
      const uploadResponse = await fetch(uploadData.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error('Không thể tải ảnh lên MinIO');
      }

      const updatedUser = await usersApi.confirmAvatar(uploadData.objectKey);
      setAvatarLoadError(false);
      setUser(updatedUser);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Lỗi tải avatar');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleSaveProfile = async () => {
    setSaveError(null);
    setSaveStatus('saving');
    try {
      if (!user) throw new Error('User không khả dụng');
      const updatedUser = await usersApi.updateMe({
        name: profileName,
        email: profileEmail,
      });
      setUser(updatedUser);
      setSaveStatus('success');
    } catch (error) {
      setSaveStatus('error');
      setSaveError(error instanceof Error ? error.message : 'Không thể lưu thông tin');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header/Cover Section */}
      <div className="h-32 md:h-48 relative"></div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Card */}
        <div className="bg-card border border-border rounded-lg p-6 md:p-8 -mt-50 relative z-10 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left: Avatar and Basic Info */}
            <div className="flex flex-col items-center md:items-start md:col-span-1">
              <div className="relative mb-4">
                <div className="relative h-32 w-32 rounded-full bg-gradient-to-br from-primary/40 via-primary/10 to-transparent p-[3px] shadow-lg shadow-primary/20">
                  <div className="relative h-full w-full overflow-hidden rounded-full border border-border/60 bg-secondary">
                    {!avatarLoadError && user?.image ? (
                      <img
                        src={user.image}
                        alt={user?.name ?? 'User avatar'}
                        className="h-full w-full object-cover"
                        onError={() => setAvatarLoadError(true)}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted text-3xl font-semibold text-foreground/80">
                        {(user?.name?.charAt(0) ?? 'U').toUpperCase()}
                      </div>
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-xs font-medium text-white">
                        Uploading...
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  className="absolute bottom-1 right-0 cursor-pointer rounded-full border border-border/50 bg-card p-2 text-primary shadow-md transition-all hover:scale-105 hover:bg-accent"
                  disabled={isUploading}
                >
                  <Camera className="w-5 h-5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarInputChange}
                />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-center md:text-left">
                {user?.name}
              </h1>
              <p className="text-muted-foreground flex items-center gap-1 mt-2">
                <MailCheck className="w-4 h-4" />
                {user?.email}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Joined {user?.createdAt ? new Date(user?.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>

            {/* Middle: Bio and Stats */}
            <div className="md:col-span-2">
              <p className="text-foreground mb-6 leading-relaxed">{profile.bio}</p>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-secondary rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold">{profile.level}</div>
                  <div className="text-xs text-muted-foreground mt-1">Level</div>
                </div>
                <div className="bg-secondary rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold">{profile.totalProblemsolved}</div>
                  <div className="text-xs text-muted-foreground mt-1">Problems Solved</div>
                </div>
                <div className="bg-secondary rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold">{profile.currentStreak}</div>
                  <div className="text-xs text-muted-foreground mt-1">Day Streak</div>
                </div>
                <div className="bg-secondary rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold">#{profile.bestRank}</div>
                  <div className="text-xs text-muted-foreground mt-1">Best Rank</div>
                </div>
              </div>
            </div>
          </div>

          {/* Programming Languages */}
          <div className="mt-8 pt-8 border-t border-border">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Code2 className="w-5 h-5" />
              Programming Languages
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.languages.map((lang) => (
                <span
                  key={lang}
                  className="bg-secondary text-foreground px-4 py-2 rounded-full text-sm font-medium hover:bg-accent transition-colors cursor-default"
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border mb-8">
          <div className="flex gap-8 overflow-x-auto">
            {(['overview', 'stats', 'achievements', 'settings'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 font-medium cursor-pointer text-sm capitalize border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Social Links */}
            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-bold text-lg mb-4">Connect</h3>
                <div className="space-y-3">
                  {profile.socialLinks.map((link) => (
                    <a
                      key={link.platform}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg bg-secondary hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      {link.platform === 'GitHub' && <Github className="w-5 h-5" />}
                      {link.platform === 'LinkedIn' && <Linkedin className="w-5 h-5" />}
                      {link.platform === 'Website' && <Globe className="w-5 h-5" />}
                      <span>{link.platform}</span>
                    </a>
                  ))}
                  <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-secondary hover:bg-accent hover:text-accent-foreground transition-colors text-left">
                    <Globe className="w-5 h-5" />
                    <span>Add Social Link</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="lg:col-span-2">
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-bold text-lg mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {[
                    {
                      title: 'Solved "Binary Tree Traversal"',
                      time: '2 hours ago',
                      status: 'Accepted',
                    },
                    {
                      title: 'Completed "Arrays & Strings" contest',
                      time: '1 day ago',
                      status: 'Finished',
                    },
                    {
                      title: 'Joined class "DSA Advanced"',
                      time: '3 days ago',
                      status: 'Joined',
                    },
                    {
                      title: 'Achieved 10-day streak',
                      time: '1 week ago',
                      status: 'Achievement',
                    },
                  ].map((activity, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-4 pb-4 border-b border-border last:border-0 last:pb-0"
                    >
                      <div className="w-3 h-3 rounded-full bg-primary mt-2 shrink-0"></div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{activity.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">{activity.time}</p>
                      </div>
                      <span className="text-xs bg-secondary text-foreground px-2 py-1 rounded whitespace-nowrap">
                        {activity.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Problem Statistics
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Easy</span>
                    <span className="text-sm text-muted-foreground">45/50</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '90%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Medium</span>
                    <span className="text-sm text-muted-foreground">55/80</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '69%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Hard</span>
                    <span className="text-sm text-muted-foreground">24/90</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-red-600 h-2 rounded-full" style={{ width: '27%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Performance Metrics
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                  <span className="text-sm font-medium">Average Accuracy</span>
                  <span className="text-lg font-bold">78%</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                  <span className="text-sm font-medium">Success Rate</span>
                  <span className="text-lg font-bold">65%</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                  <span className="text-sm font-medium">Avg. Time Limit</span>
                  <span className="text-lg font-bold">2.3s</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profile.achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="bg-card border border-border rounded-lg p-6 text-center hover:border-primary transition-colors group"
              >
                <div className="flex justify-center mb-3">
                  {getAchievementIcon(achievement.icon)}
                </div>
                <h4 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                  {achievement.name}
                </h4>
                <p className="text-sm text-muted-foreground mb-3">{achievement.description}</p>
                <p className="text-xs text-muted-foreground">
                  Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                </p>
              </div>
            ))}

            {/* Locked Achievements */}
            {[
              { name: 'Problem Master', description: 'Solve 250 problems', icon: '👑' },
              { name: 'Contest Champion', description: 'Win a contest', icon: '🏆' },
              { name: 'Perfect Score', description: 'Get 100% on a contest', icon: '⚡' },
            ].map((achievement, idx) => (
              <div
                key={idx}
                className="bg-card border border-border rounded-lg p-6 text-center opacity-50"
              >
                <div className="flex justify-center mb-3 grayscale">{achievement.icon}</div>
                <h4 className="font-bold text-lg mb-2">{achievement.name}</h4>
                <p className="text-sm text-muted-foreground">{achievement.description}</p>
                <p className="text-xs text-muted-foreground mt-3">🔒 Locked</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-card border border-border rounded-lg p-6 space-y-6">
              <div>
                <h3 className="font-bold text-lg mb-4">Profile Information</h3>
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-medium">Name</span>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(event) => setProfileName(event.target.value)}
                      className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium">Email</span>
                    <input
                      type="email"
                      value={profileEmail}
                      onChange={(event) => setProfileEmail(event.target.value)}
                      className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                    />
                  </label>
                </div>
                <div className="mt-4 flex flex-col sm:flex-row items-start gap-3">
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={!user || saveStatus === 'saving'}
                    className="px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-60"
                  >
                    {saveStatus === 'saving' ? 'Saving...' : 'Save Profile'}
                  </button>
                  {saveStatus === 'success' && (
                    <span className="text-sm text-foreground">Update profile successfully.</span>
                  )}
                  {saveStatus === 'error' && saveError && (
                    <span className="text-sm text-destructive">{saveError}</span>
                  )}
                </div>
              </div>

              {uploadError && (
                <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
                  {uploadError}
                </div>
              )}

              <div className="border-t border-border pt-6">
                <h3 className="font-bold text-lg mb-4">Email & Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                    <span className="text-sm font-medium">Problem Solutions</span>
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                    <span className="text-sm font-medium">Contest Updates</span>
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                    <span className="text-sm font-medium">Class Announcements</span>
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="font-bold text-lg mb-4">Privacy</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                    <span className="text-sm font-medium">Public Profile</span>
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                    <span className="text-sm font-medium">Show Statistics</span>
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="font-bold text-lg mb-4">Account</h3>
                <div className="space-y-3">
                  <button className="w-full px-4 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-accent transition-colors">
                    Change Password
                  </button>
                  <button className="w-full px-4 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-accent transition-colors">
                    Download My Data
                  </button>
                  <button className="w-full px-4 py-3 bg-destructive text-destructive-foreground rounded-lg font-medium hover:opacity-90 transition-opacity">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

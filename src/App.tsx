import { useState, useEffect } from 'react';

// Tabs components
import { Dashboard } from './components/Dashboard';
import { JobSources } from './components/JobSources';
import { FilterConfiguration } from './components/FilterConfiguration';
import { CVUpload } from './components/CVUpload';
import { JobList } from './components/JobList';
import { JobDetail } from './components/JobDetail';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { SettingsPage } from './components/Settings';
import { ThemeSwitcher, ThemeColor } from './components/ThemeSwitcher';
import { useTheme } from "./components/UseTheme";

// UI components
import { Button } from './components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Toaster } from './components/ui/sonner';
import { Briefcase, Settings, FileText, Database, List, LogOut } from 'lucide-react';

// Types
import { FilterCriteria, JobOffer, JobSource } from './types';

const API_BASE = 'https://testfastapi-flax.vercel.app';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const { theme, setTheme } = useTheme("default");
  const handleThemeChange = (t: ThemeColor) => setTheme(t);

  const [activeTab, setActiveTab] = useState('dashboard');
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [activeTab]);

  const [jobs, setJobs] = useState<JobOffer[]>([]);
  const [sources, setSources] = useState<JobSource[]>([]);
  const [filters, setFilters] = useState<FilterCriteria>({
    stack: ['React', 'TypeScript', 'Node.js'],
    experience: ['Mid-level', 'Senior'],
    keywords: ['remote'],
    location: ['Remote', 'San Francisco'],
    jobType: ['Internship', 'Full-time', 'Contract'],
    excludeKeywords: [],
  });
  const [selectedJob, setSelectedJob] = useState<JobOffer | null>(null);
  const [isJobDetailOpen, setIsJobDetailOpen] = useState(false);

  // track logged-in user email (id = email in the API)
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Import job offers, job sources, and filters from backend API when authenticated
  useEffect(() => {
    if (!isAuthenticated || !userEmail) return;

    const fetchData = async () => {
      try {
        // 1) Fetch jobs
        const jobsRes = await fetch(`${API_BASE}/api/job-offers`);
        if (!jobsRes.ok) throw new Error('Failed to fetch jobs');
        const jobsData: JobOffer[] = await jobsRes.json();
        setJobs(jobsData);

        // 2) Fetch job sources
        const sourcesRes = await fetch(`${API_BASE}/api/job-sources`);
        if (!sourcesRes.ok) throw new Error('Failed to fetch job sources');
        const sourcesData: JobSource[] = await sourcesRes.json();
        setSources(sourcesData);

        // 3) Fetch filters for this user
        const filtersRes = await fetch(
          `${API_BASE}/api/users/${encodeURIComponent(userEmail)}/filters`
        );
        if (!filtersRes.ok) {
          // If you don't have a GET endpoint yet, this will fail until you add it.
          throw new Error('Failed to fetch filters');
        }
        const filtersData: { filters: FilterCriteria } = await filtersRes.json();
        if (filtersData && filtersData.filters) {
          setFilters(filtersData.filters);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        // Optional: keep previous state or set some fallback
      }
    };

    fetchData();
  }, [isAuthenticated, userEmail]);

  const handleLogin = (email: string, password: string) => {
    setIsAuthenticated(true);
    setShowRegister(false);
    setUserEmail(email); // <- used to fetch user-specific filters
  };

  const handleRegister = (name: string, email: string, password: string) => {
    setIsAuthenticated(true);
    setShowRegister(false);
    setUserEmail(email);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setShowRegister(false);
    setActiveTab('dashboard');
    setUserEmail(null);
    setJobs([]);
    setSources([]);
    // optional: reset filters to defaults or leave them
  };

  const handleAddSource = (newSource: Omit<JobSource, 'id'>) => {
    const source: JobSource = {
      ...newSource,
      id: Date.now().toString(),
      lastSync: undefined,
    };
    setSources([...sources, source]);
  };

  const handleToggleSource = (id: string) => {
    setSources(sources.map(s =>
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ));
  };

  const handleDeleteSource = (id: string) => {
    setSources(sources.filter(s => s.id !== id));
  };

  const handleSyncSource = (id: string) => {
    setSources(sources.map(s =>
      s.id === id ? { ...s, lastSync: new Date().toISOString() } : s
    ));
  };

  const handleUpdateFilters = (newFilters: FilterCriteria) => {
    setFilters(newFilters);
    setIsFiltersDirty(true);
  };

  const handleSaveFilters = async () => {
    if (!userEmail) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/users/${encodeURIComponent(userEmail)}/filters`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ filters }), // send current filters state
        }
      );

      if (!res.ok) {
        console.error("Failed to save filters");
        return;
      }

      console.log("Filters saved successfully");
      setIsFiltersDirty(false);
    } catch (err) {
      console.error("Error saving filters:", err);
    }
  };

  const [isFiltersDirty, setIsFiltersDirty] = useState(false);

  const handleExtractFilters = (extractedFilters: Partial<FilterCriteria>) => {
    setFilters({
      ...filters,
      ...extractedFilters,
    });
    setActiveTab('filters');
  };

  const handleSelectJob = (job: JobOffer) => {
    setSelectedJob(job);
    setIsJobDetailOpen(true);
  };

  const matchedJobs = jobs.filter(j => j.isMatch);
  const totalJobs = jobs.length;
  const appliedJobs = 12; // Mock data
  const responseRate = 35; // Mock data

  // Show register or login page if not authenticated
  if (!isAuthenticated) {
    if (showRegister) {
      return (
        <Register
          onRegister={handleRegister}
          onSwitchToLogin={(status) => {
            if (status === 'account_created') {
              setRegisterSuccess(true);
            }
            setShowRegister(false);
          }}
        />
      );
    }
    return (
      <Login
        onLogin={handleLogin}
        onSwitchToRegister={() => {
          setRegisterSuccess(false);
          setShowRegister(true);
        }}
        successMessage={registerSuccess ? 'account_created' : null}
      />
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-6 w-6" />
                  <h1 className="text-lg text-xl font-bold">Evidi</h1>
                </div>

                <TabsList className="flex items-center space-x-2">
                  <TabsTrigger value="dashboard" className="gap-2">
                    <Briefcase className="h-4 w-4" />
                    <span>Dashboard</span>
                  </TabsTrigger>

                  <TabsTrigger value="jobs" className="gap-2">
                    <List className="h-4 w-4" />
                    <span>Jobs</span>
                  </TabsTrigger>

                  <TabsTrigger value="sources" className="gap-2">
                    <Database className="h-4 w-4" />
                    <span>Sources</span>
                  </TabsTrigger>

                  <TabsTrigger value="filters" className="gap-2">
                    <Settings className="h-4 w-4" />
                    <span>Filters</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('cv')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  My Resume
                </Button>
                <ThemeSwitcher
                  currentTheme={theme as ThemeColor}
                  onThemeChange={handleThemeChange}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('settings')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <TabsContent value="dashboard">
            <Dashboard
              totalJobs={totalJobs}
              matchedJobs={matchedJobs.length}
              appliedJobs={appliedJobs}
              responseRate={responseRate}
            />
          </TabsContent>

          <TabsContent value="jobs">
            <JobList
              jobs={jobs}
              onSelectJob={handleSelectJob}
            />
          </TabsContent>

          <TabsContent value="sources">
            <JobSources
              sources={sources}
              onAddSource={handleAddSource}
              onToggleSource={handleToggleSource}
              onDeleteSource={handleDeleteSource}
              onSyncSource={handleSyncSource}
            />
          </TabsContent>

          <TabsContent value="filters">
            <FilterConfiguration
              filters={filters}
              onUpdateFilters={handleUpdateFilters}
              onSaveFilters={handleSaveFilters}
              isDirty={isFiltersDirty}
            />
          </TabsContent>

          <TabsContent value="cv">
            <CVUpload onExtractFilters={handleExtractFilters} />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsPage userEmail={userEmail} />
          </TabsContent>
        </main>

        <JobDetail
          job={selectedJob}
          isOpen={isJobDetailOpen}
          onClose={() => setIsJobDetailOpen(false)}
        />

        <Toaster />
      </div>
    </Tabs>
  );
}
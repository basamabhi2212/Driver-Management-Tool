
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, Trip, UserRole, TripStatus, Notification, TripLog } from './types';
import { Icons } from './constants';

// --- Helper Components ---

const Button: React.FC<{
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  children: React.ReactNode;
  className?: string;
  type?: "button" | "submit" | "reset";
}> = ({ onClick, variant = 'primary', children, className = '', type = "button" }) => {
  const base = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-purple-600 hover:bg-purple-700 text-white purple-glow",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    ghost: "bg-transparent hover:bg-white/10 text-slate-300"
  };
  return (
    <button type={type} onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const Card: React.FC<{ children: React.ReactNode; className?: string; title?: string }> = ({ children, className = '', title }) => (
  <div className={`glass-card rounded-xl p-6 ${className}`}>
    {title && <h3 className="text-xl font-semibold mb-4 text-purple-400 border-b border-purple-900/50 pb-2">{title}</h3>}
    {children}
  </div>
);

// --- Main App Component ---

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [loading, setLoading] = useState(true);

  // Auth States
  const [loginForm, setLoginForm] = useState({ username: '', password: '', role: UserRole.DRIVER });
  const [customerLoginForm, setCustomerLoginForm] = useState({ mobile: '', otp: '' });
  const [isCustomerLogin, setIsCustomerLogin] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  // UI Modals
  const [modalType, setModalType] = useState<'create_trip' | 'assign_driver' | 'cancel_trip' | 'edit_user' | 'track_trip' | 'selfie' | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // --- Initial Data Load ---
  useEffect(() => {
    const savedUsers = localStorage.getItem('dt_users');
    const savedTrips = localStorage.getItem('dt_trips');
    const savedNotifications = localStorage.getItem('dt_notifications');
    const savedUser = localStorage.getItem('dt_current_user');

    if (savedUsers) setUsers(JSON.parse(savedUsers));
    else {
      const initialAdmin: User = { id: 'admin1', username: 'admin', password: 'password', role: UserRole.ADMIN, name: 'Super Admin' };
      setUsers([initialAdmin]);
      localStorage.setItem('dt_users', JSON.stringify([initialAdmin]));
    }

    if (savedTrips) setTrips(JSON.parse(savedTrips));
    if (savedNotifications) setNotifications(JSON.parse(savedNotifications));
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
    
    setLoading(false);
  }, []);

  // Sync state to local storage
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('dt_users', JSON.stringify(users));
      localStorage.setItem('dt_trips', JSON.stringify(trips));
      localStorage.setItem('dt_notifications', JSON.stringify(notifications));
      if (currentUser) localStorage.setItem('dt_current_user', JSON.stringify(currentUser));
      else localStorage.removeItem('dt_current_user');
    }
  }, [users, trips, notifications, currentUser, loading]);

  // --- Utility Functions ---
  const addLog = (tripId: string, action: string, details: string) => {
    if (!currentUser) return;
    const newLog: TripLog = {
      id: Math.random().toString(36).substr(2, 9),
      action,
      userId: currentUser.id,
      userName: currentUser.name,
      timestamp: new Date().toLocaleString(),
      details
    };
    setTrips(prev => prev.map(t => t.id === tripId ? { ...t, logs: [newLog, ...t.logs] } : t));
  };

  const notify = (userId: string, title: string, message: string) => {
    const newNotif: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      title,
      message,
      timestamp: new Date().toLocaleString(),
      isRead: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // --- Auth Handlers ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.username === loginForm.username && u.password === loginForm.password);
    if (user) {
      setCurrentUser(user);
    } else {
      alert("Invalid credentials!");
    }
  };

  const handleCustomerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpSent) {
      setOtpSent(true);
      alert("Simulated OTP sent: 123456");
      return;
    }
    if (customerLoginForm.otp === '123456') {
      let customer = users.find(u => u.mobile === customerLoginForm.mobile);
      if (!customer) {
        customer = {
          id: 'cust_' + Math.random().toString(36).substr(2, 5),
          username: customerLoginForm.mobile,
          name: 'Customer ' + customerLoginForm.mobile.slice(-4),
          role: UserRole.CUSTOMER,
          mobile: customerLoginForm.mobile
        };
        setUsers(prev => [...prev, customer!]);
      }
      setCurrentUser(customer);
    } else {
      alert("Invalid OTP!");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setOtpSent(false);
  };

  // --- Trip Actions ---
  const createTrip = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const customer = users.find(u => u.id === formData.get('customerId'));
    
    const newTrip: Trip = {
      id: 'TRIP-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
      customerId: (formData.get('customerId') as string) || 'unregistered',
      customerName: customer?.name || 'Walk-in',
      pickupLocation: formData.get('pickup') as string,
      dropLocation: formData.get('drop') as string,
      status: TripStatus.UNASSIGNED,
      scheduledTime: formData.get('time') as string,
      logs: [{
        id: 'log1',
        action: 'Created',
        userId: currentUser?.id || 'sys',
        userName: currentUser?.name || 'System',
        timestamp: new Date().toLocaleString(),
        details: 'Trip created'
      }]
    };
    setTrips(prev => [newTrip, ...prev]);
    setModalType(null);
    
    // Notification for nearby staff
    notify('admin1', 'New Trip Request', `A trip from ${newTrip.pickupLocation} needs assignment.`);
  };

  const assignDriver = (tripId: string, driverId: string) => {
    const driver = users.find(u => u.id === driverId);
    if (!driver) return;

    setTrips(prev => prev.map(t => {
      if (t.id === tripId) {
        return {
          ...t,
          driverId,
          driverName: driver.name,
          status: TripStatus.ASSIGNED
        };
      }
      return t;
    }));
    addLog(tripId, 'Assigned', `Driver ${driver.name} assigned to trip.`);
    notify(driverId, 'New Assignment', `You have been assigned a trip from ${trips.find(t => t.id === tripId)?.pickupLocation}.`);
    setModalType(null);
  };

  const updateTripStatus = (tripId: string, status: TripStatus, extra = {}) => {
    setTrips(prev => prev.map(t => t.id === tripId ? { ...t, status, ...extra } : t));
    addLog(tripId, 'Status Changed', `Trip marked as ${status}`);
    
    const trip = trips.find(t => t.id === tripId);
    if (trip && status === TripStatus.STARTED) {
      notify(trip.customerId, 'Trip Started', 'Your driver has started the trip.');
    }
  };

  // --- Sub-views ---

  const Dashboard = () => {
    const stats = {
      total: trips.length,
      active: trips.filter(t => t.status === TripStatus.STARTED).length,
      unassigned: trips.filter(t => t.status === TripStatus.UNASSIGNED).length,
      completed: trips.filter(t => t.status === TripStatus.COMPLETED).length,
      drivers: users.filter(u => u.role === UserRole.DRIVER).length
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="flex flex-col items-center">
            <span className="text-slate-400 text-sm">Total Trips</span>
            <span className="text-4xl font-bold text-white mt-1">{stats.total}</span>
          </Card>
          <Card className="flex flex-col items-center">
            <span className="text-slate-400 text-sm">Active Trips</span>
            <span className="text-4xl font-bold text-purple-500 mt-1">{stats.active}</span>
          </Card>
          <Card className="flex flex-col items-center">
            <span className="text-slate-400 text-sm">Pending Assignments</span>
            <span className="text-4xl font-bold text-yellow-500 mt-1">{stats.unassigned}</span>
          </Card>
          <Card className="flex flex-col items-center">
            <span className="text-slate-400 text-sm">Total Drivers</span>
            <span className="text-4xl font-bold text-blue-500 mt-1">{stats.drivers}</span>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="Live Tracking Overview" className="lg:col-span-2 min-h-[400px]">
             <div id="map-dashboard" className="w-full h-[350px] bg-slate-900 rounded-lg flex items-center justify-center text-slate-500 border border-slate-800">
               {/* Leaflet instance would be initialized here */}
               <div className="text-center">
                  <Icons.Drivers />
                  <p className="mt-2">Map view loading...</p>
               </div>
             </div>
          </Card>
          <Card title="Recent Activity" className="max-h-[400px] overflow-y-auto">
             <div className="space-y-4">
               {trips.slice(0, 10).map(t => (
                 <div key={t.id} className="border-l-2 border-purple-500 pl-4 py-1">
                   <p className="text-sm font-medium">{t.id} - {t.status}</p>
                   <p className="text-xs text-slate-400">{t.logs[0]?.timestamp}</p>
                 </div>
               ))}
             </div>
          </Card>
        </div>
      </div>
    );
  };

  const TripManagement = () => {
    const isRestricted = currentUser?.role === UserRole.DRIVER || currentUser?.role === UserRole.CUSTOMER;
    const filteredTrips = currentUser?.role === UserRole.DRIVER 
      ? trips.filter(t => t.driverId === currentUser.id)
      : currentUser?.role === UserRole.CUSTOMER 
      ? trips.filter(t => t.customerId === currentUser.id)
      : trips;

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Trips List</h2>
          {!isRestricted && (
            <Button onClick={() => setModalType('create_trip')}>
              Create New Trip
            </Button>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 uppercase text-xs tracking-wider">
                <th className="px-4 py-3">Trip ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Driver</th>
                <th className="px-4 py-3">Pickup/Drop</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredTrips.map(t => (
                <tr key={t.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-4 font-mono font-bold text-purple-400">{t.id}</td>
                  <td className="px-4 py-4">{t.customerName}</td>
                  <td className="px-4 py-4">{t.driverName || 'Unassigned'}</td>
                  <td className="px-4 py-4">
                    <p className="truncate w-32" title={t.pickupLocation}>{t.pickupLocation}</p>
                    <p className="text-xs text-slate-400 truncate w-32" title={t.dropLocation}>➔ {t.dropLocation}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      t.status === TripStatus.STARTED ? 'bg-green-500/20 text-green-500' :
                      t.status === TripStatus.ASSIGNED ? 'bg-blue-500/20 text-blue-500' :
                      t.status === TripStatus.UNASSIGNED ? 'bg-yellow-500/20 text-yellow-500' :
                      t.status === TripStatus.COMPLETED ? 'bg-slate-500/20 text-slate-400' :
                      'bg-red-500/20 text-red-500'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right flex justify-end gap-2">
                    <Button variant="ghost" className="p-2" onClick={() => { setSelectedTrip(t); setModalType('track_trip'); }}>
                      View
                    </Button>
                    {t.status === TripStatus.UNASSIGNED && !isRestricted && (
                      <Button variant="primary" className="p-2 text-xs" onClick={() => { setSelectedTrip(t); setModalType('assign_driver'); }}>
                        Assign
                      </Button>
                    )}
                    {t.status === TripStatus.ASSIGNED && currentUser?.role === UserRole.DRIVER && (
                      <Button variant="primary" className="p-2 text-xs" onClick={() => { setSelectedTrip(t); setModalType('selfie'); }}>
                        Start Trip
                      </Button>
                    )}
                    {t.status === TripStatus.STARTED && currentUser?.role === UserRole.DRIVER && (
                      <Button variant="danger" className="p-2 text-xs" onClick={() => {
                        window.open('https://basamabhi2212.github.io/trip-estimator/', '_blank');
                        setSelectedTrip(t);
                        setModalType('selfie');
                      }}>
                        End Trip
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTrips.length === 0 && (
            <div className="text-center py-20 text-slate-500 italic">No trips found.</div>
          )}
        </div>
      </div>
    );
  };

  const UserManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Users & Roles</h2>
        <Button onClick={() => setModalType('edit_user')}>Add New User</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(u => (
          <Card key={u.id} className="flex justify-between items-center">
            <div>
              <p className="font-bold">{u.name}</p>
              <p className="text-xs text-purple-400">{u.role}</p>
              <p className="text-sm text-slate-400">@{u.username}</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="ghost" className="text-xs p-1" onClick={() => { setSelectedUser(u); setModalType('edit_user'); }}>Edit</Button>
              <Button variant="danger" className="text-xs p-1" onClick={() => setUsers(prev => prev.filter(x => x.id !== u.id))}>Delete</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  // --- Modals ---

  const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-card w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl purple-glow">
        <div className="p-4 border-b border-purple-900/50 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><Icons.Close /></button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );

  const SelfieModal = ({ trip }: { trip: Trip }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [captured, setCaptured] = useState<string | null>(null);

    useEffect(() => {
      if (!captured) {
        navigator.mediaDevices.getUserMedia({ video: true })
          .then(stream => { if (videoRef.current) videoRef.current.srcObject = stream; })
          .catch(err => alert("Camera access denied: " + err));
      }
    }, [captured]);

    const takeSelfie = () => {
      if (videoRef.current && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        ctx?.drawImage(videoRef.current, 0, 0);
        
        // Add watermarks
        if (ctx) {
          ctx.font = "20px monospace";
          ctx.fillStyle = "white";
          ctx.fillText(new Date().toLocaleString(), 20, canvasRef.current.height - 50);
          ctx.fillText("LOC: 19.0760° N, 72.8777° E", 20, canvasRef.current.height - 20);
        }

        const data = canvasRef.current.toDataURL('image/jpeg');
        setCaptured(data);
        
        // Stop stream
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };

    const confirmAction = () => {
      if (!captured) return;
      if (trip.status === TripStatus.ASSIGNED) {
        updateTripStatus(trip.id, TripStatus.STARTED, { startSelfie: captured, startTime: new Date().toLocaleString() });
      } else {
        updateTripStatus(trip.id, TripStatus.COMPLETED, { endSelfie: captured, endTime: new Date().toLocaleString() });
      }
      setModalType(null);
    };

    return (
      <div className="space-y-4">
        {!captured ? (
          <>
            <video ref={videoRef} autoPlay className="w-full h-64 bg-black rounded-lg object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            <Button onClick={takeSelfie} className="w-full">Capture Selfie</Button>
          </>
        ) : (
          <>
            <img src={captured} className="w-full h-64 rounded-lg object-cover border-2 border-purple-500" />
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => setCaptured(null)}>Retake</Button>
              <Button onClick={confirmAction}>Submit & {trip.status === TripStatus.ASSIGNED ? 'Start' : 'End'}</Button>
            </div>
          </>
        )}
      </div>
    );
  };

  // --- Render ---

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-950 to-slate-950">
        <Card className="w-full max-w-md p-8 purple-glow">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-white italic tracking-tighter">DRIVER<span className="text-purple-500">PRO</span></h1>
            <p className="text-slate-400 mt-2">Premium Management System</p>
          </div>

          <div className="flex gap-4 mb-6">
            <button 
              onClick={() => setIsCustomerLogin(false)} 
              className={`flex-1 pb-2 border-b-2 transition-all ${!isCustomerLogin ? 'border-purple-500 text-white' : 'border-transparent text-slate-500'}`}
            >
              Staff / Driver
            </button>
            <button 
              onClick={() => setIsCustomerLogin(true)} 
              className={`flex-1 pb-2 border-b-2 transition-all ${isCustomerLogin ? 'border-purple-500 text-white' : 'border-transparent text-slate-500'}`}
            >
              Customer
            </button>
          </div>

          {isCustomerLogin ? (
            <form onSubmit={handleCustomerLogin} className="space-y-4">
              <input 
                type="tel" 
                placeholder="Mobile Number" 
                required 
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500"
                value={customerLoginForm.mobile}
                onChange={e => setCustomerLoginForm({...customerLoginForm, mobile: e.target.value})}
              />
              {otpSent && (
                <input 
                  type="text" 
                  placeholder="Enter OTP (123456)" 
                  required 
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500"
                  value={customerLoginForm.otp}
                  onChange={e => setCustomerLoginForm({...customerLoginForm, otp: e.target.value})}
                />
              )}
              <Button type="submit" className="w-full">
                {otpSent ? 'Verify & Login' : 'Send OTP'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <input 
                type="text" 
                placeholder="Username" 
                required 
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500"
                value={loginForm.username}
                onChange={e => setLoginForm({...loginForm, username: e.target.value})}
              />
              <input 
                type="password" 
                placeholder="Password" 
                required 
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500"
                value={loginForm.password}
                onChange={e => setLoginForm({...loginForm, password: e.target.value})}
              />
              <Button type="submit" className="w-full">Sign In</Button>
            </form>
          )}

          <div className="mt-8 text-center text-xs text-slate-600">
            &copy; 2024 Driver Management Tool. All rights reserved.
          </div>
        </Card>
      </div>
    );
  }

  const menuItems = [
    { label: 'Dashboard', icon: Icons.Dashboard },
    { label: 'Trips', icon: Icons.Trips },
    { label: 'Drivers', icon: Icons.Drivers },
    { label: 'Customers', icon: Icons.Customers },
    { label: 'Users', icon: Icons.Users, roles: [UserRole.ADMIN] },
    { label: 'Finance', icon: Icons.Finance, roles: [UserRole.ADMIN, UserRole.FINANCE] },
    { label: 'Reports', icon: Icons.Reports, roles: [UserRole.ADMIN, UserRole.MANAGER] },
  ];

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-200">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-slate-950/50 backdrop-blur-md hidden md:flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-black text-white italic tracking-tighter">DRIVER<span className="text-purple-500">PRO</span></h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {menuItems.filter(item => !item.roles || item.roles.includes(currentUser.role)).map(item => (
            <button
              key={item.label}
              onClick={() => setActiveTab(item.label)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === item.label ? 'bg-purple-600/10 text-purple-400' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-bold text-white uppercase">
              {currentUser.name.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold truncate">{currentUser.name}</p>
              <p className="text-xs text-slate-500">{currentUser.role}</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full text-xs" onClick={handleLogout}>Logout</Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-white/5 px-6 flex items-center justify-between bg-slate-950/30 backdrop-blur-sm z-10">
          <h2 className="text-lg font-bold text-white">{activeTab}</h2>
          <div className="flex items-center gap-4">
             <div className="relative">
                <button 
                  className="p-2 text-slate-400 hover:text-white relative"
                  onClick={() => setShowNotificationPanel(!showNotificationPanel)}
                >
                  <Icons.Bell />
                  {notifications.some(n => !n.isRead) && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full"></span>
                  )}
                </button>

                {showNotificationPanel && (
                  <div className="absolute right-0 mt-2 w-80 glass-card rounded-xl shadow-2xl z-50 p-4 max-h-[400px] overflow-y-auto">
                    <h4 className="font-bold border-b border-purple-900/50 pb-2 mb-2">Notifications</h4>
                    <div className="space-y-3">
                      {notifications.length > 0 ? notifications.map(n => (
                        <div key={n.id} className="text-sm p-2 rounded hover:bg-white/5 cursor-pointer">
                          <p className="font-bold">{n.title}</p>
                          <p className="text-slate-400 text-xs">{n.message}</p>
                          <p className="text-[10px] text-slate-600 mt-1">{n.timestamp}</p>
                        </div>
                      )) : <p className="text-center py-10 text-slate-600 italic">No new notifications</p>}
                    </div>
                  </div>
                )}
             </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'Dashboard' && <Dashboard />}
          {activeTab === 'Trips' && <TripManagement />}
          {activeTab === 'Users' && <UserManagement />}
          {activeTab === 'Drivers' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {users.filter(u => u.role === UserRole.DRIVER).map(d => (
                 <Card key={d.id} title={d.name}>
                   <div className="flex justify-between items-center text-sm mb-4">
                     <span className="text-slate-400">Total Rides:</span>
                     <span>{trips.filter(t => t.driverId === d.id).length}</span>
                   </div>
                   <div className="flex justify-between items-center text-sm mb-4">
                     <span className="text-slate-400">Status:</span>
                     <span className="text-green-500">Available</span>
                   </div>
                   <Button variant="ghost" className="w-full text-xs">View Performance</Button>
                 </Card>
               ))}
            </div>
          )}
          {activeTab === 'Customers' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {users.filter(u => u.role === UserRole.CUSTOMER).map(c => (
                 <Card key={c.id} title={c.name}>
                   <p className="text-sm text-slate-400 mb-4">{c.mobile || 'No mobile'}</p>
                   <Button variant="ghost" className="w-full text-xs">View History</Button>
                 </Card>
               ))}
            </div>
          )}
          {(activeTab === 'Finance' || activeTab === 'Reports') && (
            <Card title="Monthly Insights">
               <div className="space-y-4">
                 <div className="h-40 bg-slate-900 rounded-lg flex items-center justify-center text-slate-500 border border-slate-800">
                    Graphical charts will appear here (D3/Recharts)
                 </div>
                 <div className="grid grid-cols-3 gap-4">
                   <div className="p-4 bg-white/5 rounded-lg text-center">
                     <p className="text-xs text-slate-500">Revenue</p>
                     <p className="text-lg font-bold">₹0</p>
                   </div>
                   <div className="p-4 bg-white/5 rounded-lg text-center">
                     <p className="text-xs text-slate-500">Expenses</p>
                     <p className="text-lg font-bold">₹0</p>
                   </div>
                   <div className="p-4 bg-white/5 rounded-lg text-center">
                     <p className="text-xs text-slate-500">Profit</p>
                     <p className="text-lg font-bold">₹0</p>
                   </div>
                 </div>
               </div>
            </Card>
          )}
        </div>
      </main>

      {/* Shared Modals */}
      {modalType === 'create_trip' && (
        <Modal title="Create New Trip" onClose={() => setModalType(null)}>
          <form onSubmit={createTrip} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-xs text-slate-500 block mb-1">Customer</label>
                  <select name="customerId" className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white">
                    <option value="">Guest/Walk-in</option>
                    {users.filter(u => u.role === UserRole.CUSTOMER).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
               </div>
               <div>
                  <label className="text-xs text-slate-500 block mb-1">Time</label>
                  <input name="time" type="datetime-local" className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white" />
               </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Pickup Location</label>
              <input name="pickup" type="text" placeholder="Start Address" required className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Drop Location</label>
              <input name="drop" type="text" placeholder="Destination Address" required className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white" />
            </div>
            <Button type="submit" className="w-full">Book Trip</Button>
          </form>
        </Modal>
      )}

      {modalType === 'assign_driver' && selectedTrip && (
        <Modal title="Assign Driver" onClose={() => setModalType(null)}>
          <div className="space-y-4">
            <p className="text-sm text-slate-400">Select an available driver for trip <span className="text-purple-400">{selectedTrip.id}</span></p>
            <div className="grid grid-cols-1 gap-2">
              {users.filter(u => u.role === UserRole.DRIVER).map(d => (
                <button 
                  key={d.id} 
                  className="p-4 bg-slate-900 hover:bg-purple-600/20 border border-slate-800 rounded-lg text-left flex justify-between items-center transition-all"
                  onClick={() => assignDriver(selectedTrip.id, d.id)}
                >
                  <div>
                    <p className="font-bold">{d.name}</p>
                    <p className="text-xs text-slate-500">Online since 8 AM</p>
                  </div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </button>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {modalType === 'track_trip' && selectedTrip && (
        <Modal title={`Trip Details: ${selectedTrip.id}`} onClose={() => setModalType(null)}>
           <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                 <div className="bg-white/5 p-3 rounded-lg">
                    <p className="text-slate-500 text-xs">Customer</p>
                    <p>{selectedTrip.customerName}</p>
                 </div>
                 <div className="bg-white/5 p-3 rounded-lg">
                    <p className="text-slate-500 text-xs">Driver</p>
                    <p>{selectedTrip.driverName || 'Not assigned'}</p>
                 </div>
              </div>
              <div className="p-3 bg-purple-600/10 border border-purple-500/20 rounded-lg">
                 <p className="text-xs text-purple-400 uppercase font-bold mb-1">Route</p>
                 <p className="text-sm">{selectedTrip.pickupLocation} ➔ {selectedTrip.dropLocation}</p>
              </div>
              
              <div className="h-40 bg-slate-900 rounded-lg overflow-hidden">
                 <div id="trip-mini-map" className="w-full h-full flex items-center justify-center text-slate-600">
                    Map Tracking Active
                 </div>
              </div>

              <div>
                 <p className="text-sm font-bold mb-2">Logs</p>
                 <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                   {selectedTrip.logs.map(log => (
                     <div key={log.id} className="text-xs bg-white/5 p-2 rounded">
                       <span className="text-purple-400">[{log.timestamp}]</span> <span className="font-bold">{log.action}:</span> {log.details}
                     </div>
                   ))}
                 </div>
              </div>
           </div>
        </Modal>
      )}

      {modalType === 'edit_user' && (
        <Modal title={selectedUser ? "Edit User" : "Create User"} onClose={() => { setModalType(null); setSelectedUser(null); }}>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            if (selectedUser) {
              setUsers(prev => prev.map(u => u.id === selectedUser.id ? {
                ...u,
                name: formData.get('name') as string,
                role: formData.get('role') as UserRole,
                username: formData.get('username') as string,
              } : u));
            } else {
              const newUser: User = {
                id: Math.random().toString(36).substr(2, 5),
                name: formData.get('name') as string,
                role: formData.get('role') as UserRole,
                username: formData.get('username') as string,
                password: 'password123'
              };
              setUsers(prev => [...prev, newUser]);
            }
            setModalType(null);
            setSelectedUser(null);
          }} className="space-y-4">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Full Name</label>
              <input defaultValue={selectedUser?.name} name="name" type="text" required className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Role</label>
              <select defaultValue={selectedUser?.role} name="role" className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white">
                {Object.values(UserRole).filter(r => r !== UserRole.CUSTOMER).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Username</label>
              <input defaultValue={selectedUser?.username} name="username" type="text" required className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white" />
            </div>
            <Button type="submit" className="w-full">Save User</Button>
          </form>
        </Modal>
      )}

      {modalType === 'selfie' && selectedTrip && (
        <Modal title={selectedTrip.status === TripStatus.ASSIGNED ? "Trip Start Selfie" : "Trip End Selfie"} onClose={() => setModalType(null)}>
           <SelfieModal trip={selectedTrip} />
        </Modal>
      )}
    </div>
  );
}

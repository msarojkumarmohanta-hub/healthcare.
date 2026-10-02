import { useEffect, useRef, useState } from 'react'
import { Activity, AlertCircle, ArrowUpRight, Bell, CalendarDays, Check, ChevronDown, CircleHelp, CloudSun, Download, FileText, Filter, Heart, LayoutDashboard, LockKeyhole, Menu, MessageCircle, MoreHorizontal, Paperclip, Phone, Plus, Search, Send, ShieldCheck, Smartphone, Stethoscope, SunMedium, Upload, Users, Video, Watch, X, Zap } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { wearableService, type WearableSnapshot } from './services/wearableService'
import './App.css'

const chartData = {
  '24h': [{ time: '6 AM', value: 71 }, { time: '9 AM', value: 76 }, { time: '12 PM', value: 73 }, { time: '3 PM', value: 81 }, { time: '6 PM', value: 78 }, { time: 'Now', value: 74 }],
  '7d': [{ time: 'Mon', value: 72 }, { time: 'Tue', value: 75 }, { time: 'Wed', value: 71 }, { time: 'Thu', value: 78 }, { time: 'Fri', value: 80 }, { time: 'Sat', value: 76 }, { time: 'Sun', value: 74 }],
  '30d': [{ time: 'Jun 1', value: 74 }, { time: 'Jun 6', value: 79 }, { time: 'Jun 11', value: 76 }, { time: 'Jun 16', value: 82 }, { time: 'Jun 21', value: 77 }, { time: 'Jun 26', value: 74 }, { time: 'Now', value: 74 }],
}

type Range = keyof typeof chartData

type DoctorPrescription = {
  doctor: string
  date: string
  advice: string
  medicines: Array<{ name: string; dosage: string; instructions: string }>
}

type NotificationItem = {
  id: number
  title: string
  type: 'advice' | 'prescription'
  doctor: string
  summary: string
  details: string
  timestamp: string
  prescription?: DoctorPrescription
}

const initialNotifications: NotificationItem[] = [
  {
    id: 1,
    title: 'Doctor advice received',
    type: 'advice',
    doctor: 'Dr. Rohan Das',
    summary: 'Continue your blood sugar monitoring and stay hydrated.',
    details: 'Your readings are stable. Please continue with your existing medication plan, keep a note of your fasting glucose, and schedule a follow-up if you notice dizziness or fatigue.',
    timestamp: 'Today · 9:30 AM',
  },
  {
    id: 2,
    title: 'New prescription added',
    type: 'prescription',
    doctor: 'Dr. Priya Sen',
    summary: 'Updated care plan for your blood pressure and recovery.',
    details: 'The prescription below is recommended for the next 7 days. Please review the dosage and save it to your personal prescription list for pharmacy pickup.',
    timestamp: 'Today · 11:15 AM',
    prescription: {
      doctor: 'Dr. Priya Sen',
      date: '24 June 2024',
      advice: 'Keep your blood pressure stable with medication and consistent rest. Follow-up after 7 days.',
      medicines: [
        { name: 'Amlodipine', dosage: '5 mg', instructions: 'Once daily · After breakfast · 7 days' },
        { name: 'Vitamin D3', dosage: '60,000 IU', instructions: 'Once weekly · After dinner · 4 weeks' },
      ],
    },
  },
]

const initialSavedPrescriptions: DoctorPrescription[] = [
  {
    doctor: 'Dr. Rohan Das',
    date: '24 June 2024',
    advice: 'Continue with your current routine and return if you feel weak or dizzy.',
    medicines: [
      { name: 'Metformin 500 mg', dosage: '500 mg', instructions: 'Once daily · After breakfast · 30 days' },
      { name: 'Vitamin D3', dosage: '1000 IU', instructions: 'Once weekly · With food · 8 weeks' },
    ],
  },
]

function App() {
  const [range, setRange] = useState<Range>('24h')
  const [monitoring, setMonitoring] = useState(false)
  const [notifications, setNotifications] = useState(initialNotifications.length)
  const [notificationItems, setNotificationItems] = useState<NotificationItem[]>(initialNotifications)
  const [selectedNotificationId, setSelectedNotificationId] = useState<number | null>(initialNotifications[0]?.id ?? null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [savedPrescriptions, setSavedPrescriptions] = useState<DoctorPrescription[]>(initialSavedPrescriptions)
  const [synced, setSynced] = useState(false)
  const [showEmergency, setShowEmergency] = useState(false)
  const [showSupport, setShowSupport] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [activePage, setActivePage] = useState('Dashboard')
  const [heartRate, setHeartRate] = useState(74)

  useEffect(() => {
    const unsubscribe = wearableService.subscribe((snapshot) => {
      if (snapshot.heartRate) setHeartRate(snapshot.heartRate.value)
    })
    return () => { unsubscribe() }
  }, [])

  const selectedNotification = notificationItems.find((notification) => notification.id === selectedNotificationId) ?? null

  const savePrescription = (prescription?: DoctorPrescription) => {
    if (!prescription) return

    setSavedPrescriptions((current) => [prescription, ...current])
    setNotificationItems((current) => current.map((item) => item.prescription && item.prescription.doctor === prescription.doctor && item.prescription.date === prescription.date ? { ...item, type: 'prescription', summary: 'Saved to your prescription list' } : item))
    setNotifications(0)
    setActivePage('Prescriptions')
    setShowNotifications(false)
  }

  const navItems = [{ label: 'Dashboard', icon: LayoutDashboard }, { label: 'My Health', icon: Heart }, { label: 'Monitoring', icon: Activity }, { label: 'Connected Devices', icon: Watch }, { label: 'AI Insights', icon: Zap }, { label: 'Consultations', icon: Video }, { label: 'Prescriptions', icon: FileText }, { label: 'Health Reports', icon: Stethoscope }]

  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><div className="brand-mark"><Plus size={18} strokeWidth={3} /></div><span>RuralCare <b>AI</b></span></div><div className="demo-badge"><span className="pulse-dot" /> Demo mode <span className="demo-divider" /> <CircleHelp size={13} /></div><div className="sidebar-label">Workspace</div><nav>{navItems.map(({ label, icon: Icon }) => <button key={label} className={activePage === label ? 'nav-item active' : 'nav-item'} onClick={() => setActivePage(label)}><Icon size={18} /><span>{label}</span>{label === 'AI Insights' && <span className="nav-new">NEW</span>}</button>)}</nav><div className="sidebar-spacer" /><button className="support-card" onClick={() => setShowSupport(true)}><div className="support-icon"><MessageCircle size={17} /></div><div><strong>Need support?</strong><span>Talk to our care team</span></div><ArrowUpRight size={16} /></button><button className={activePage === 'Privacy & Security' ? 'nav-item settings active' : 'nav-item settings'} onClick={() => setActivePage('Privacy & Security')}><ShieldCheck size={18} /><span>Privacy & Security</span></button><div className="sidebar-profile"><div className="avatar avatar-image">AM</div><div><strong>Anita Mishra</strong><span>Patient account</span></div><MoreHorizontal size={18} /></div></aside>
    <main className="main-content"><header className="topbar"><button className="mobile-menu"><Menu size={22} /></button><div className="crumbs"><span>Workspace</span><ChevronDown size={14} /><b>{activePage}</b></div><div className="top-actions"><button className="icon-button"><MessageCircle size={19} /></button><button className="icon-button notification" onClick={() => { setShowNotifications((current) => !current); setNotifications(0) }}><Bell size={19} />{notifications > 0 && <span>{notifications}</span>}</button><button type="button" className="top-profile" onClick={() => setShowProfile(true)}><div className="avatar avatar-image">AM</div><div><strong>Anita Mishra</strong><span>Patient</span></div><ChevronDown size={15} /></button></div></header>
      {showNotifications && <div className="panel notification-panel"><div className="panel-heading"><div><p className="eyebrow">Notifications</p><h3>Care updates</h3></div><button className="text-btn" onClick={() => setShowNotifications(false)}>Close</button></div><div className="notification-list">{notificationItems.map((notification) => <button key={notification.id} className={selectedNotificationId === notification.id ? 'notification-item selected' : 'notification-item'} onClick={() => { setSelectedNotificationId(notification.id); setNotifications(0) }}><div className="notification-icon"><Bell size={15} /></div><div className="notification-copy"><strong>{notification.title}</strong><span>{notification.summary}</span><small>{notification.timestamp}</small></div></button>)}</div>{selectedNotification && <div className="notification-detail"><p className="eyebrow">{selectedNotification.type === 'advice' ? 'Doctor advice' : 'Prescription update'}</p><h4>{selectedNotification.title}</h4><p>{selectedNotification.details}</p>{selectedNotification.prescription && <div className="prescription-preview"><h5>{selectedNotification.prescription.doctor}</h5><small>{selectedNotification.prescription.date}</small><p>{selectedNotification.prescription.advice}</p>{selectedNotification.prescription.medicines.map((medicine) => <div key={`${medicine.name}-${medicine.instructions}`} className="medicine-row"><div><strong>{medicine.name}</strong><span>{medicine.dosage} · {medicine.instructions}</span></div></div>)}</div>}<div className="button-row"><button className="primary-btn" onClick={() => savePrescription(selectedNotification.prescription)}>Save prescription</button><button className="secondary-btn" onClick={() => setShowNotifications(false)}>View later</button></div></div>}</div>}
      <div className="page-content">{activePage !== 'Dashboard' ? <SectionView page={activePage} setActivePage={setActivePage} heartRate={heartRate} monitoring={monitoring} setMonitoring={setMonitoring} savedPrescriptions={savedPrescriptions} savePrescription={savePrescription} /> : <><section className="welcome-row"><div><p className="eyebrow">Monday, 24 June 2024 <span className="live-pill"><span className="pulse-dot" /> Live demo</span></p><h1>Good morning, Anita <span className="wave">✦</span></h1><p className="subtitle">Here is your health overview for today.</p></div><div className="welcome-actions"><button className="emergency-btn" onClick={() => setShowEmergency(true)}><AlertCircle size={18} /> Emergency assistance</button></div></section>
      <section className="hero-card"><div className="hero-copy"><div className="hero-chip"><SunMedium size={15} /> Tuesday wellness check-in</div><h2>Small steps today,<br /><em>stronger health tomorrow.</em></h2><p>Keep your care journey moving with a quick check on your vitals and upcoming care.</p><button className="primary-btn" onClick={() => setActivePage('My Health')}>View my health <ArrowUpRight size={16} /></button></div><div className="hero-visual"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="hero-sun"><CloudSun size={56} strokeWidth={1.3} /></div><div className="float-note note-top"><Heart size={14} fill="currentColor" /> 74 <small>BPM</small></div><div className="float-note note-bottom"><ShieldCheck size={14} /> All clear</div></div></section>
      <div className="section-heading"><div><p className="eyebrow">At a glance</p><h2 className="section-title">Your health today</h2></div><span className="demo-note"><span className="status-dot green" /> Demo / simulated data</span></div>
      <section className="vitals-grid"><VitalCard icon={<Heart size={19} />} label="Heart rate" value={`${heartRate}`} unit="BPM" trend="2.4%" trendUp status="In range" color="coral" /><VitalCard icon={<Activity size={19} />} label="Blood oxygen" value="98" unit="% SpO2" trend="0.8%" trendUp status="Optimal" color="teal" /><VitalCard icon={<Zap size={19} />} label="Blood glucose" value="92" unit="mg/dL" trend="4.1%" status="In range" color="amber" /><VitalCard icon={<Activity size={19} />} label="Blood pressure" value="118/76" unit="mmHg" trend="Stable" status="Healthy" color="blue" /></section>
      <section className="content-grid"><div className="panel chart-panel"><div className="panel-heading"><div><p className="eyebrow">Live trends</p><h3>Heart rate</h3></div><div className="range-tabs">{(['24h', '7d', '30d'] as Range[]).map((item) => <button key={item} className={range === item ? 'selected' : ''} onClick={() => setRange(item)}>{item}</button>)}</div></div><div className="chart-summary"><strong>{heartRate} <small>BPM</small></strong><span className="trend-up">↑ 2.4%</span><span>vs previous period</span></div><div className="chart-wrap"><ResponsiveContainer width="100%" height={205}><AreaChart data={chartData[range]} margin={{ top: 12, right: 8, left: -24, bottom: 0 }}><defs><linearGradient id="heartGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e67364" stopOpacity={0.24} /><stop offset="100%" stopColor="#e67364" stopOpacity={0.01} /></linearGradient></defs><XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#9b9b9a', fontSize: 11 }} /><YAxis domain={[60, 90]} axisLine={false} tickLine={false} tick={{ fill: '#9b9b9a', fontSize: 11 }} /><Tooltip contentStyle={{ border: 'none', borderRadius: 12, boxShadow: '0 8px 25px rgba(40, 42, 34, .12)' }} /><Area type="monotone" dataKey="value" stroke="#df665b" strokeWidth={2.5} fill="url(#heartGradient)" /></AreaChart></ResponsiveContainer></div></div><div className="right-stack"><div className="panel monitor-panel"><div className="panel-heading"><div><p className="eyebrow">Heart rate monitor</p><h3>{monitoring ? 'Monitoring in progress' : 'Ready to check in?'}</h3></div><div className={monitoring ? 'monitor-icon monitoring' : 'monitor-icon'}><Heart size={21} fill={monitoring ? 'currentColor' : 'none'} /></div></div><p className="panel-copy">{monitoring ? 'Your wearable is sending a live signal.' : 'Use a connected wearable to keep your care team in the loop.'}</p><button className={monitoring ? 'secondary-btn active-monitor' : 'secondary-btn'} onClick={() => setMonitoring(!monitoring)}>{monitoring ? <><span className="stop-square" /> Stop monitoring</> : <><Activity size={16} /> Start monitoring</>}</button><span className="tiny-disclaimer">Demo mode · Not a medical device</span></div><div className="panel appointment-panel"><div className="appointment-date"><span>JUN</span><strong>26</strong></div><div className="appointment-info"><p className="eyebrow">Next appointment</p><strong>Dr. Rohan Das</strong><span>General physician · 10:30 AM</span></div><button className="icon-button"><ArrowUpRight size={17} /></button></div></div></section>
      <section className="lower-grid"><div className="panel devices-panel"><div className="panel-heading"><div><p className="eyebrow">Connected devices</p><h3>Your care network</h3></div><button className="text-btn" onClick={() => setActivePage('Connected Devices')}>Manage <ArrowUpRight size={15} /></button></div><div className="device-row"><div className="device-icon"><Watch size={20} /></div><div className="device-details"><strong>RuralCare Watch</strong><span><i className="status-dot green" /> Connected · 82% battery</span></div><button className="sync-btn" onClick={() => { setSynced(true); window.setTimeout(() => setSynced(false), 2200) }}>{synced ? <><Check size={15} /> Synced</> : <><Zap size={14} /> Sync now</>}</button></div><div className="device-row"><div className="device-icon soft"><Smartphone size={20} /></div><div className="device-details"><strong>Mobile health app</strong><span><i className="status-dot green" /> Active · Last synced just now</span></div><span className="connected-label"><Check size={14} /> Active</span></div></div><div className="panel insight-panel"><div className="insight-heading"><div className="ai-spark"><Zap size={17} /></div><div><p className="eyebrow">AI health intelligence</p><h3>Your latest insight</h3></div><span className="new-label">NEW</span></div><p>Heart rate is holding steady within your usual range this week. Keep up your morning walks.</p><button className="text-btn" onClick={() => setActivePage('AI Insights')}>Explore insights <ArrowUpRight size={15} /></button><div className="insight-line"><span /><span /><span /><span /><span /><span /><span /></div></div></section><footer className="trust-footer"><ShieldCheck size={16} /><span>Your data is private and secure</span><span className="footer-divider" /><span>Informational support only. Not a replacement for professional medical care.</span></footer></>} </div></main>
    <nav className="mobile-nav">{navItems.slice(0, 5).map(({ label, icon: Icon }) => <button key={label} className={activePage === label ? 'active' : ''} onClick={() => setActivePage(label)}><Icon size={19} /><span>{label === 'Dashboard' ? 'Home' : label.split(' ')[0]}</span></button>)}</nav>
    {showEmergency && <div className="modal-backdrop" onClick={() => setShowEmergency(false)}><div className="modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setShowEmergency(false)}><X size={18} /></button><div className="modal-alert"><AlertCircle size={23} /></div><h2>Emergency assistance</h2><p>Are you sure you want to contact emergency support? This demo will not place a real call.</p><div className="modal-actions"><button className="secondary-btn" onClick={() => setShowEmergency(false)}>Cancel</button><button className="emergency-btn" onClick={() => setShowEmergency(false)}>Confirm assistance</button></div></div></div>}
    {showSupport && <div className="modal-backdrop" onClick={() => setShowSupport(false)}><div className="modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setShowSupport(false)}><X size={18} /></button><div className="modal-alert"><MessageCircle size={23} /></div><h2>Care team support</h2><p>Your support request has been queued. A rural care coordinator will review your message and contact you through the app.</p><div className="modal-actions"><button className="secondary-btn" onClick={() => setShowSupport(false)}>Close</button><button className="primary-btn" onClick={() => { setActivePage('Consultations'); setShowSupport(false) }}>Book a consultation</button></div></div></div>}
    {showProfile && <div className="modal-backdrop" onClick={() => setShowProfile(false)}><div className="modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setShowProfile(false)}><X size={18} /></button><div className="modal-alert"><ShieldCheck size={23} /></div><h2>Patient profile</h2><div className="profile-card"><div className="profile-header"><div className="avatar avatar-image">AM</div><div><strong>Anita Mishra</strong><span>Patient ID: RCL-2048</span></div></div><div className="profile-meta"><div><span>Phone</span><strong>+91 98765 43210</strong></div><div><span>Location</span><strong>Koraput, Odisha</strong></div><div><span>Care plan</span><strong>RuralCare Plus</strong></div></div></div><div className="modal-actions"><button className="secondary-btn" onClick={() => setShowProfile(false)}>Close</button><button className="primary-btn" onClick={() => { setShowProfile(false); setActivePage('Privacy & Security') }}>Manage privacy</button></div></div></div>}
  </div>
}

function SectionView({ page, setActivePage, monitoring, setMonitoring, savedPrescriptions, savePrescription }: { page: string; setActivePage: (page: string) => void; heartRate: number; monitoring: boolean; setMonitoring: (value: boolean) => void; savedPrescriptions: DoctorPrescription[]; savePrescription: (prescription?: DoctorPrescription) => void }) {
  const [query, setQuery] = useState('')
  const [wearable, setWearable] = useState<WearableSnapshot>(wearableService.currentSnapshot)
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [syncNotice, setSyncNotice] = useState('')
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const [filter, setFilter] = useState('All')
  const [selectedConsultations, setSelectedConsultations] = useState<Record<string, 'video' | 'audio' | null>>({})
  const [uploaded, setUploaded] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [pharmacyPickerOpen, setPharmacyPickerOpen] = useState(false)
  const [selectedPharmacy, setSelectedPharmacy] = useState<string | null>(null)

  const selectedConsultationEntries = Object.entries(selectedConsultations).filter(([, mode]) => mode)
  const latestBookedMode = selectedConsultationEntries[0]?.[1] ?? null
  const pharmacists = [
    { name: 'Green Valley Pharmacy', detail: 'Available today · 20 mins away' },
    { name: 'RuralCare Chemist', detail: 'Open until 9:00 PM · 12 mins away' },
    { name: 'Sunrise Health Store', detail: 'Same-day delivery available · 8 mins away' },
  ]

  useEffect(() => {
    const unsubscribe = wearableService.subscribe(setWearable)
    return () => { unsubscribe() }
  }, [])

  useEffect(() => {
    if (videoRef.current && cameraStream) videoRef.current.srcObject = cameraStream
    return () => cameraStream?.getTracks().forEach((track) => track.stop())
  }, [cameraStream])

  const toggleCamera = async () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop())
      setCameraStream(null)
      return
    }

    setCameraError('')
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is unavailable. Open this page on localhost or use a secure connection.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      setCameraStream(stream)
    } catch (error) {
      setCameraError(error instanceof DOMException && error.name === 'NotAllowedError'
        ? 'Camera permission was denied. Allow camera access in your browser settings and try again.'
        : 'Unable to start the camera. Check that a camera is connected and not being used by another app.')
    }
  }

  if (page === 'My Health') {
    const connected = wearable.status === 'connected'
    const currentReading = wearable.heartRate
    const updatedAt = currentReading ? new Date(currentReading.receivedAt).toLocaleString() : null
    const unavailableValue = connected ? 'Not available from this device' : wearable.deviceName ? 'Device disconnected' : 'Watch not connected'
    const heartValue = currentReading ? String(currentReading.value) : !connected ? unavailableValue : 'Waiting for first measurement'

    return <SectionFrame eyebrow="Personal health record" badge={connected ? 'Live device data' : 'Device mode'} title="Your health, in one clear view." subtitle="Only measurements received from your connected device are shown here.">
      <div className="panel wearable-summary">
        <div className="wearable-summary-heading"><div className="device-icon"><Watch size={21} /></div><div><p className="eyebrow">Connected health device</p><h3>{wearable.deviceName ?? 'RuralCare Watch'}</h3><span className={connected ? 'wearable-status is-connected' : 'wearable-status'}><i className="status-dot" /> {connected ? 'Connected' : 'Watch not connected'}</span></div></div>
        <div className="wearable-summary-details"><span>Battery <strong>{connected && wearable.batteryPercent !== null ? `${wearable.batteryPercent}%` : 'Not available from this device'}</strong></span><span>Last sync <strong>{updatedAt ?? 'No measurements synchronized yet'}</strong></span></div>
        <div className="button-row"><button className="secondary-btn" disabled={!connected} onClick={() => { void wearableService.sync().then(setSyncNotice) }}><Zap size={15} /> Sync Now</button><button className="secondary-btn" onClick={() => { setSyncNotice(''); setShowConnectModal(true); setActivePage('Connected Devices') }}><Watch size={15} /> Device Settings</button></div>
        {syncNotice && <p className="sync-notice" role="status">{syncNotice}</p>}
      </div>
      <div className="panel wearable-health-panel"><PanelTitle eyebrow="Live device data" title="Measurements" /><div className="wearable-vitals-grid">
        <WearableMetricCard icon={<Heart size={18} />} label="Heart rate" value={heartValue} unit={currentReading ? 'BPM' : ''} source={currentReading?.source ?? (connected ? wearable.deviceName ?? 'Selected device' : '—')} status={currentReading ? connected ? 'Latest measurement' : 'Last saved measurement' : connected ? 'Waiting for measurement' : 'Device disconnected'} updated={updatedAt ?? 'No reading received'} />
        <WearableMetricCard icon={<Activity size={18} />} label="SpO2" value={wearable.oxygenSaturation ? String(wearable.oxygenSaturation.value) : unavailableValue} unit={wearable.oxygenSaturation ? '%' : ''} source={wearable.oxygenSaturation?.source ?? (connected ? wearable.deviceName ?? 'Selected device' : '—')} status={wearable.oxygenSaturation ? connected ? 'Latest measurement' : 'Last saved measurement' : connected ? 'Not provided by this device' : 'Device disconnected'} updated={wearable.oxygenSaturation ? new Date(wearable.oxygenSaturation.receivedAt).toLocaleString() : 'No reading received'} />
        <WearableMetricCard icon={<Activity size={18} />} label="Body temperature" value={wearable.bodyTemperature ? String(wearable.bodyTemperature.value) : unavailableValue} unit={wearable.bodyTemperature ? '°C' : ''} source={wearable.bodyTemperature?.source ?? (connected ? wearable.deviceName ?? 'Selected device' : '—')} status={wearable.bodyTemperature ? connected ? 'Latest measurement' : 'Last saved measurement' : connected ? 'Not provided by this device' : 'Device disconnected'} updated={wearable.bodyTemperature ? new Date(wearable.bodyTemperature.receivedAt).toLocaleString() : 'No reading received'} />
        <WearableMetricCard icon={<Activity size={18} />} label="Steps" value={unavailableValue} source={connected ? wearable.deviceName ?? 'Selected device' : '—'} status={connected ? 'Not provided by this device' : 'Device disconnected'} updated="No reading received" />
        <WearableMetricCard icon={<Activity size={18} />} label="Sleep" value={unavailableValue} source={connected ? wearable.deviceName ?? 'Selected device' : '—'} status={connected ? 'Not provided by this device' : 'Device disconnected'} updated="No reading received" />
        <WearableMetricCard icon={<Activity size={18} />} label="Activity" value={unavailableValue} source={connected ? wearable.deviceName ?? 'Selected device' : '—'} status={connected ? 'Not provided by this device' : 'Device disconnected'} updated="No reading received" />
      </div></div>
      <div className="section-columns wearable-lower-grid">
        <div className="panel"><PanelTitle eyebrow="Device readings" title="Heart rate history" />{wearable.heartRateHistory.length ? <><div className="chart-wrap"><ResponsiveContainer width="100%" height={205}><AreaChart data={wearable.heartRateHistory.map((reading) => ({ time: new Date(reading.receivedAt).toLocaleTimeString(), value: reading.value }))} margin={{ top: 12, right: 8, left: -24, bottom: 0 }}><XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#9b9b9a', fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#9b9b9a', fontSize: 11 }} /><Tooltip contentStyle={{ border: 'none', borderRadius: 12, boxShadow: '0 8px 25px rgba(40, 42, 34, .12)' }} /><Area type="monotone" dataKey="value" stroke="#df665b" strokeWidth={2.5} fill="url(#heartGradient)" /></AreaChart></ResponsiveContainer></div>{wearable.heartRateHistory.slice().reverse().slice(0, 8).map((reading) => <DataRow key={reading.receivedAt} label={`${reading.value} BPM · ${reading.source}`} value="Received" time={new Date(reading.receivedAt).toLocaleString()} />)}</> : <p className="wearable-empty">No health measurements have been synchronized yet.</p>}<p className="wearable-footnote">History is held in this browser session. Persistent backend storage is not configured.</p></div>
        <div className="panel"><PanelTitle eyebrow="Connection status" title="Device status" /><DataRow label="Bluetooth" value={connected ? 'Connected' : wearableService.bluetoothSupported ? 'Available · not connected' : 'Unsupported'} time="Browser BLE connection" /><DataRow label="Device" value={connected ? 'Connected' : 'Disconnected'} time={wearable.deviceName ?? 'No device selected'} /><DataRow label="Device stream" value={connected ? 'Active' : 'Paused'} time="Live heart-rate notifications" /><DataRow label="Permissions" value={connected ? 'Granted to selected device' : 'Required on connection'} time="Browser device permission" /><DataRow label="Battery" value={connected && wearable.batteryPercent !== null ? `${wearable.batteryPercent}%` : 'Not available'} time="Device-reported when supported" /></div>
      </div>
    </SectionFrame>
  }

  if (page === 'Monitoring') {
    const latestHeartRate = wearable.heartRate
    const measurementHistory = [...wearable.measurementHistory].sort((a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime()).reverse()
    const monitorStatus = !latestHeartRate
      ? wearable.status === 'connected' ? 'Connected · waiting for first measurement' : 'Waiting for first measurement'
      : monitoring && wearable.status === 'connected' ? 'Live signal from wearable' : 'Last saved measurement'

    return <SectionFrame eyebrow="Continuous monitoring" title="Stay connected between visits." subtitle="A simple view of your live signals, measurement history and camera prototype readiness."><div className="monitor-hero panel"><div className="monitor-large"><div className={monitoring ? 'monitor-pulse on' : 'monitor-pulse'}><Heart size={40} fill={monitoring ? 'currentColor' : 'none'} /></div><div><p className="eyebrow">Current heart rate</p><strong>{latestHeartRate?.value ?? '--'} <small>BPM</small></strong><span>{monitorStatus}</span></div></div><button className="primary-btn" onClick={() => setMonitoring(!monitoring)}>{monitoring ? 'Stop monitoring' : 'Start monitoring'} <Activity size={16} /></button></div><div className="section-columns"><div className="panel"><PanelTitle eyebrow="Measurement history" title="Recent readings" />{measurementHistory.length ? measurementHistory.slice(0, 8).map((reading) => <DataRow key={`${reading.metric}-${reading.receivedAt}`} label={reading.metric === 'heart_rate' ? 'Heart rate' : reading.metric === 'spo2' ? 'Blood oxygen' : 'Body temperature'} value={reading.metric === 'heart_rate' ? `${reading.value} BPM` : reading.metric === 'spo2' ? `${reading.value} %` : `${reading.value} °C`} time={new Date(reading.receivedAt).toLocaleString()} />) : <p className="wearable-empty">No readings saved yet. Connect a supported Bluetooth heart-rate device.</p>}</div><div className="panel camera-panel"><PanelTitle eyebrow="Camera prototype" title="Pulse estimation" /><div className={`camera-placeholder ${cameraStream ? 'camera-active' : ''}`}>{cameraStream ? <video ref={videoRef} className="camera-video" autoPlay playsInline muted /> : <><Smartphone size={28} /><span>Camera preview appears here</span></>}</div><p>Camera preview is available; pulse estimation is not implemented in this prototype and is not a medical-grade diagnostic.</p>{cameraError && <p className="camera-error" role="alert">{cameraError}</p>}<button className="secondary-btn" onClick={() => void toggleCamera()}><Video size={15} /> {cameraStream ? 'Stop camera' : 'Start camera'}</button></div></div></SectionFrame>
  }

  if (page === 'Connected Devices') return <SectionFrame eyebrow="Device network" badge={wearable.status === 'connected' ? 'Live device data' : 'Device mode'} title="Connected devices" subtitle="Pair a compatible Bluetooth heart-rate device and review its actual connection status."><div className="panel device-list wearable-device-list"><div className="panel-heading"><PanelTitle eyebrow="Your devices" title="Wearable connection" /><button className="primary-btn" onClick={() => setShowConnectModal(true)}><Plus size={15} /> Connect Device</button></div><div className="device-row"><div className="device-icon"><Watch size={20} /></div><div className="device-details"><strong>{wearable.deviceName ?? 'RuralCare Watch'}</strong><span><i className={`status-dot ${wearable.status === 'connected' ? 'green' : ''}`} /> {wearable.status === 'connected' ? 'Connected' : wearable.status === 'error' ? 'Connection error' : 'Not connected'}{wearable.batteryPercent !== null ? ` · Battery ${wearable.batteryPercent}%` : ''}</span></div><div className="button-row">{wearable.status === 'connected' ? <><button className="secondary-btn" onClick={() => setSyncNotice('Live Bluetooth notifications are active. Waiting for the next measurement from the device.') }><Zap size={14} /> Sync Now</button><button className="secondary-btn" onClick={() => wearableService.disconnect()}>Disconnect</button></> : <button className="secondary-btn" onClick={() => setShowConnectModal(true)}>Connect</button>}</div></div>{wearable.heartRate && <DataRow label="Last heart-rate measurement" value={`${wearable.heartRate.value} BPM`} time={`Received ${new Date(wearable.heartRate.receivedAt).toLocaleString()} · ${wearable.heartRate.source}`} />}{syncNotice && <p className="sync-notice" role="status">{syncNotice}</p>}{wearable.error && <p className="camera-error" role="alert">{wearable.error}</p>}</div><div className="panel security-callout"><LockKeyhole size={19} /><div><strong>Supported connection</strong><p>Web Bluetooth can connect to devices that expose the standard heart-rate service. Many watches require their official phone app or health-data bridge; this browser cannot connect to every smartwatch.</p></div></div>{showConnectModal && <div className="modal-backdrop" onClick={() => setShowConnectModal(false)}><div className="modal wearable-modal" role="dialog" aria-modal="true" aria-labelledby="connect-device-title" onClick={(event) => event.stopPropagation()}><button className="modal-close" aria-label="Close" onClick={() => setShowConnectModal(false)}><X size={18} /></button><p className="eyebrow">Compatible wearable</p><h2 id="connect-device-title">Connect a device</h2><div className="wearable-method"><Watch size={22} /><div><strong>Smartwatch / Smart Band</strong><span>Bluetooth LE / Device Health Bridge</span></div></div><p className="wearable-permission-note">Search lists nearby Bluetooth LE devices. Heart-rate readings require the standard Heart Rate service; classic Bluetooth and manufacturer-only health data need an official phone bridge. RuralCare requests only heart-rate access.</p>{wearable.status === 'searching' && <p className="wearable-modal-state">Searching for nearby compatible devices. Keep Bluetooth enabled.</p>}{wearable.status === 'connecting' && <p className="wearable-modal-state">Connecting to {wearable.deviceName}. Requesting health-data permission.</p>}{wearable.status === 'connected' && <p className="wearable-modal-state">{wearable.deviceName} connected. Heart-rate access is ready.</p>}{wearable.status === 'error' && <p className="camera-error" role="alert">Unable to connect to this device. {wearable.error}</p>}<div className="modal-actions"><button className="secondary-btn" onClick={() => setShowConnectModal(false)}>Close</button>{wearable.status === 'connected' ? <button className="secondary-btn" onClick={() => { wearableService.disconnect(); setShowConnectModal(false) }}>Disconnect</button> : <button className="primary-btn" onClick={() => void wearableService.connect()}>{wearable.status === 'error' ? 'Try Again' : wearable.status === 'searching' || wearable.status === 'connecting' ? 'Search Again' : 'Search for Devices'}</button>}</div></div></div>}</SectionFrame>

  if (page === 'AI Insights') return <SectionFrame eyebrow="Decision support" title="AI health intelligence" subtitle="Patterns to discuss with your clinician, never a diagnosis."><div className="ai-flow panel"><FlowStep label="Health data" active /><FlowStep label="AI analysis" active /><FlowStep label="Pattern detection" active /><FlowStep label="Provider review" active={false} /><ArrowUpRight size={16} /></div><div className="risk-grid"><RiskCard label="Cardiovascular risk" status="Low indication" tone="green" detail="Recent heart rate remains close to your personal baseline." /><RiskCard label="Respiratory risk" status="Monitor" tone="amber" detail="Oxygen readings are stable. Continue regular monitoring." /><RiskCard label="Diabetes risk" status="Requires clinician review" tone="coral" detail="A trend was detected across recent glucose readings." /></div><div className="panel insight-detail"><PanelTitle eyebrow="Observed pattern" title="A change worth reviewing" /><p>Recent measurements show a small change from Anita’s historical baseline. Review recent vitals, medication adherence and patient-reported symptoms before making a care decision.</p><div className="button-row"><button className="primary-btn" onClick={() => setSettingsSaved(true)}>{settingsSaved ? 'Marked reviewed' : 'Review with doctor'} <Stethoscope size={15} /></button><button className="secondary-btn" onClick={() => setSettingsSaved(true)}>Dismiss insight</button></div></div></SectionFrame>

  if (page === 'Consultations') {
    const doctors = [
      { name: 'Dr. Rohan Das', specialty: 'General physician', detail: 'Available today · Hindi, English', price: '₹150' },
      { name: 'Dr. Priya Sen', specialty: 'Cardiology', detail: 'Tomorrow · English, Odia', price: '₹140' },
      { name: 'Dr. Amit Jena', specialty: 'Diabetology', detail: 'Thu, 27 Jun · Hindi, Odia', price: '₹130' },
    ].filter((doctor) => `${doctor.name} ${doctor.specialty}`.toLowerCase().includes(query.toLowerCase()) && (filter === 'All' || doctor.specialty === filter))
    return <SectionFrame eyebrow="Care without distance" title="Find the right care, from anywhere." subtitle="Book a teleconsultation or join an appointment when your doctor is ready."><div className="search-row"><div className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search doctors or specialties" /></div><button className="secondary-btn" onClick={() => setFilter(filter === 'All' ? 'Cardiology' : 'All')}><Filter size={15} /> {filter === 'All' ? 'All specialties' : filter}</button></div><div className="doctor-grid">{doctors.map((doctor) => { const doctorMode = selectedConsultations[doctor.name] ?? null; return <DoctorCard key={doctor.name} {...doctor} onBook={(mode) => { setSelectedConsultations((current) => ({ ...current, [doctor.name]: mode })); setSettingsSaved(mode === 'video') }} booked={!!doctorMode} bookedMode={doctorMode} /> })}</div>{selectedConsultationEntries.length > 0 && <div className="booking-confirm panel"><Check size={19} /><span><strong>Appointment request saved.</strong> Your selected {latestBookedMode === 'audio' ? 'audio' : 'video'} consultation request is ready for confirmation.</span><button className="text-btn" onClick={() => setSettingsSaved(true)}>View appointment <ArrowUpRight size={14} /></button></div>}</SectionFrame>
  }

  if (page === 'Prescriptions') {
    const displayPrescriptions = savedPrescriptions.length > 0 ? savedPrescriptions : initialSavedPrescriptions

    return <SectionFrame eyebrow="Medication plan" title="Your prescriptions" subtitle="Keep instructions clear and available wherever you are."><div className="prescription-list">{displayPrescriptions.map((prescription, index) => <div key={`${prescription.doctor}-${prescription.date}-${index}`} className="prescription-card panel"><div className="prescription-head"><div className="doctor-avatar"><Stethoscope size={19} /></div><div><p className="eyebrow">{index === 0 ? 'Active prescription' : 'Saved prescription'} · {prescription.date}</p><h3>{prescription.doctor}</h3></div><span className="status-chip green-chip">{index === 0 ? 'Active' : 'Saved'}</span></div><p className="prescription-advice">{prescription.advice}</p>{prescription.medicines.map((medicine) => <div key={`${medicine.name}-${medicine.instructions}`} className="medicine-row"><div><strong>{medicine.name}</strong><span>{medicine.dosage} · {medicine.instructions}</span></div><Check size={17} className="check-green" /></div>)}<div className="prescription-actions"><button className="secondary-btn"><Download size={15} /> Download</button><button className="primary-btn" onClick={() => setPharmacyPickerOpen((current) => !current)}>Send to pharmacy <Send size={15} /></button>{index > 0 && <button className="secondary-btn" onClick={() => savePrescription(prescription)}>Save again</button>}</div>{pharmacyPickerOpen && <div className="pharmacy-picker"><p className="eyebrow">Choose a pharmacist</p>{pharmacists.map((pharmacist) => <button key={pharmacist.name} className={selectedPharmacy === pharmacist.name ? 'pharmacy-option selected' : 'pharmacy-option'} onClick={() => { setSelectedPharmacy(pharmacist.name); setSettingsSaved(true); setPharmacyPickerOpen(false) }}><span className="pharmacy-avatar">P</span><span className="pharmacy-copy"><strong>{pharmacist.name}</strong><small>{pharmacist.detail}</small></span></button> )}</div>}</div>)}<div className="panel"><PanelTitle eyebrow="Past prescriptions" title="Your medication history" /><DataRow label="Hypertension care plan" value="Completed" time="14 May 2024" /><DataRow label="Annual wellness review" value="Completed" time="02 Jan 2024" /></div></div></SectionFrame>
  }

  if (page === 'Health Reports') return <SectionFrame eyebrow="Report center" title="Health reports" subtitle="Upload documents for informational analysis and clinician discussion."><div className="upload-panel panel"><div className="upload-icon"><Upload size={22} /></div><h3>{uploaded ? 'Report processing complete' : 'Upload a lab report or medical document'}</h3><p>{uploaded ? 'demo-blood-panel.pdf · Analysis ready for review' : 'PDF, JPG or PNG · Files stay in demo mode'}</p><button className="primary-btn" onClick={() => setUploaded(true)}>{uploaded ? <><Check size={15} /> Analysis complete</> : <><Paperclip size={15} /> Choose a file</>}</button></div><div className="section-columns"><div className="panel"><PanelTitle eyebrow="Latest analysis" title="Informational findings" /><DataRow label="Hemoglobin" value="13.2 g/dL · In range" time="Extracted" /><DataRow label="Fasting glucose" value="92 mg/dL · In range" time="Extracted" /><DataRow label="Questions to discuss" value="3 suggestions" time="AI decision support" /></div><div className="panel report-note"><ShieldCheck size={18} /><strong>Decision support only</strong><p>AI-generated summaries are informational and do not replace professional diagnosis or emergency care.</p></div></div></SectionFrame>

  if (page === 'Privacy & Security') return <SectionFrame eyebrow="Trust center" title="Privacy & security" subtitle="Choose what is shared and keep your account protected."><div className="settings-grid"><SettingRow icon={<ShieldCheck size={18} />} title="Share data with connected providers" detail="Allow your care team to view synced vitals" enabled /><SettingRow icon={<Bell size={18} />} title="Health alert notifications" detail="Receive a notification when a trend needs attention" enabled /><SettingRow icon={<LockKeyhole size={18} />} title="Login verification" detail="Require OTP on new devices" enabled /><SettingRow icon={<Phone size={18} />} title="Emergency contact sharing" detail="Keep your emergency profile available to responders" enabled={false} /></div><button className="primary-btn" onClick={() => setSettingsSaved(true)}>{settingsSaved ? 'Settings saved' : 'Save privacy choices'} <Check size={15} /></button></SectionFrame>

  return <SectionFrame eyebrow="Care workspace" title={page} subtitle="This workspace is ready for your care team workflow."><div className="empty-state panel"><Users size={30} /><h3>Coming into focus</h3><p>Use the dashboard, monitoring and consultation workflows to explore RuralCare AI demo mode.</p><button className="primary-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Explore this workspace <ArrowUpRight size={15} /></button></div></SectionFrame>
}

function SectionFrame({ eyebrow, title, subtitle, badge = 'Demo mode', children }: { eyebrow: string; title: string; subtitle: string; badge?: string; children: React.ReactNode }) { return <><section className="section-intro"><div><p className="eyebrow">{eyebrow} <span className="live-pill"><span className="pulse-dot" /> {badge}</span></p><h1>{title}</h1><p className="subtitle">{subtitle}</p></div><button className="emergency-btn"><ShieldCheck size={17} /> Secure session</button></section>{children}<footer className="trust-footer"><ShieldCheck size={16} /><span>Your data is private and secure</span><span className="footer-divider" /><span>Informational support only. Not a replacement for professional medical care.</span></footer></> }
function PanelTitle({ eyebrow, title }: { eyebrow: string; title: string }) { return <div className="panel-title"><p className="eyebrow">{eyebrow}</p><h3>{title}</h3></div> }
function DataRow({ label, value, time }: { label: string; value: string; time: string }) { return <div className="data-row"><div><strong>{label}</strong><span>{time}</span></div><b>{value}</b></div> }
function WearableMetricCard({ icon, label, value, unit, source, status, updated }: { icon: React.ReactNode; label: string; value: string; unit?: string; source: string; status: string; updated: string }) { return <div className="wearable-metric-card"><div className="wearable-metric-heading"><span className="vital-icon teal">{icon}</span><span>{label}</span></div><strong className="wearable-metric-value">{value}{unit && <small> {unit}</small>}</strong><span className="wearable-metric-status">{status}</span><span className="wearable-metric-source">Source: {source}</span><span className="wearable-metric-updated">Updated: {updated}</span></div> }
function FlowStep({ label, active }: { label: string; active: boolean }) { return <div className={active ? 'flow-step active' : 'flow-step'}><span>{active ? <Check size={13} /> : <span>4</span>}</span><strong>{label}</strong></div> }
function RiskCard({ label, status, tone, detail }: { label: string; status: string; tone: string; detail: string }) { return <div className="risk-card"><div className={`risk-mark ${tone}`}><Activity size={17} /></div><p className="eyebrow">{label}</p><strong>{status}</strong><p>{detail}</p></div> }
function DoctorCard({ name, specialty, detail, price, onBook, booked, bookedMode }: { name: string; specialty: string; detail: string; price: string; onBook: (mode: 'video' | 'audio') => void; booked: boolean; bookedMode: 'video' | 'audio' | null }) { const modeToBook = bookedMode ?? 'video'; return <div className="doctor-card panel"><div className="doctor-avatar"><Stethoscope size={22} /></div><span className="availability"><span className="status-dot green" /> Available</span><h3>{name}</h3><strong>{specialty}</strong><p>{detail}</p><div className="doctor-price"><span>Consultation</span><strong>{price}</strong></div><div className="doctor-call-actions"><button className={bookedMode === 'video' ? 'consultation-btn selected' : 'consultation-btn'} onClick={() => onBook('video')}><Video size={14} /> Video call</button><button className={bookedMode === 'audio' ? 'consultation-btn selected' : 'consultation-btn'} onClick={() => onBook('audio')}><Phone size={14} /> Audio call</button></div>{booked ? <button className="primary-btn is-selected"><Check size={15} /> {bookedMode === 'audio' ? 'Audio request sent' : 'Video request sent'}</button> : <button className="primary-btn" onClick={() => onBook(modeToBook)}><CalendarDays size={15} /> Book consultation</button>}</div> }
function SettingRow({ icon, title, detail, enabled }: { icon: React.ReactNode; title: string; detail: string; enabled: boolean }) { const [on, setOn] = useState(enabled); return <div className="setting-row"><div className="setting-icon">{icon}</div><div><strong>{title}</strong><p>{detail}</p></div><button className={on ? 'toggle on' : 'toggle'} onClick={() => setOn(!on)} aria-label={`Toggle ${title}`}><span /></button></div> }

function VitalCard({ icon, label, value, unit, trend, trendUp, status, color }: { icon: React.ReactNode; label: string; value: string; unit: string; trend: string; trendUp?: boolean; status: string; color: string }) {
  return <div className="vital-card"><div className={`vital-icon ${color}`}>{icon}</div><div className="vital-label">{label}<span className="status-dot green" /></div><div className="vital-value">{value} <small>{unit}</small></div><div className="vital-footer"><span className={trendUp ? 'trend-up' : 'trend-neutral'}>{trendUp ? '↑ ' : ''}{trend}</span><span>{status}</span></div></div>
}

export default App

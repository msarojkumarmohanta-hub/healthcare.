import { randomUUID } from 'crypto'

export const getDashboardSummary = () => ({
  greeting: 'Good morning, Anita',
  monitoring: {
    status: 'active',
    heartRate: 74,
    source: 'estimated_camera_measurement',
    estimated: true,
  },
  metrics: {
    heartRate: { value: 74, unit: 'bpm', status: 'In range' },
    oxygen: { value: 98, unit: '%', status: 'Optimal' },
    bloodPressure: { value: '118/76', unit: 'mmHg', status: 'Healthy' },
    glucose: { value: 92, unit: 'mg/dL', status: 'In range' },
  },
  insights: [
    {
      id: randomUUID(),
      title: 'Heart-rate trend',
      description: 'Recent measurements show a stable pattern compared with your recent baseline.',
      type: 'informational',
      confidence: 0.84,
      disclaimer: 'AI-generated informational insight. Not a medical diagnosis.',
    },
  ],
  notifications: [{ id: randomUUID(), type: 'Monitoring', message: 'Your last reading was synced successfully.', unread: true }],
  devices: [{ id: randomUUID(), name: 'RuralCare Watch', status: 'Connected', battery: '82%' }],
  consultationCount: 1,
  reportCount: 2,
})

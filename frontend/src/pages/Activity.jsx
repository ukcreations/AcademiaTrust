import { useMemo } from 'react'
import { getActivity } from '../utils/activity.js'

const typeTone = {
    'issue-success': 'pill-green',
    'verify-success': 'pill-green',
    'verify-failed': 'pill-orange',
    'account-created': 'pill-navy',
    signin: 'pill-gray',
    settings: 'pill-orange',
}

export default function Activity() {
    const activity = useMemo(() => getActivity(), [])

    return (
        <div className="page-content fade-in">
            <div className="page-header">
                <h2>Activity</h2>
                <p>Recent actions across issuance, verification, and account access.</p>
            </div>

            <div className="card">
                <div className="card-header">
                    <div>
                        <div className="card-title">Live Timeline</div>
                        <div className="card-subtitle">Stored locally for this browser session</div>
                    </div>
                    <span className="pill pill-navy">{activity.length} events</span>
                </div>
                <div className="card-body">
                    {activity.length === 0 && (
                        <div style={{ color: 'var(--gray-500)', fontSize: 14 }}>
                            No activity yet. Issue or verify a certificate to populate this feed.
                        </div>
                    )}

                    {activity.map((item) => (
                        <div className="timeline-item" key={item.id}>
                            <div className="timeline-dot" />
                            <div className="timeline-body">
                                <div className="timeline-head">
                                    <strong>{item.title}</strong>
                                    <span className={`pill ${typeTone[item.type] || 'pill-gray'}`}>{item.type}</span>
                                </div>
                                {item.detail && <p>{item.detail}</p>}
                                <small>{new Date(item.timestamp).toLocaleString()}</small>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

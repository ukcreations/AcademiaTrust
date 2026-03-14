import { useState } from 'react'
import { addActivity } from '../utils/activity.js'

export default function Settings({ currentUser, onUpdateUser }) {
    const [name, setName] = useState(currentUser?.name || '')
    const [network, setNetwork] = useState(localStorage.getItem('truedegree_network') || 'hardhat-local')
    const [saved, setSaved] = useState(false)

    function handleSave(e) {
        e.preventDefault()

        const nextUser = {
            ...currentUser,
            name: name.trim() || currentUser.name,
        }

        localStorage.setItem('truedegree_session', JSON.stringify(nextUser))

        try {
            const usersRaw = localStorage.getItem('truedegree_users')
            const users = usersRaw ? JSON.parse(usersRaw) : []
            const updated = users.map((u) => (u.id === currentUser.id ? { ...u, name: nextUser.name } : u))
            localStorage.setItem('truedegree_users', JSON.stringify(updated))
        } catch {
            // Skip user list update if storage is corrupted.
        }

        localStorage.setItem('truedegree_network', network)
        addActivity({
            type: 'settings',
            title: `${nextUser.name} updated settings`,
            detail: `Network preference: ${network}`,
            actorRole: currentUser.role,
        })

        onUpdateUser(nextUser)
        setSaved(true)
        setTimeout(() => setSaved(false), 2200)
    }

    return (
        <div className="page-content fade-in">
            <div className="page-header">
                <h2>Settings</h2>
                <p>Manage profile and preferred blockchain environment.</p>
            </div>

            <div className="card" style={{ maxWidth: 760 }}>
                <div className="card-header">
                    <div>
                        <div className="card-title">Profile</div>
                        <div className="card-subtitle">This information is stored in local browser storage</div>
                    </div>
                </div>

                <div className="card-body">
                    <form onSubmit={handleSave}>
                        <div className="form-group">
                            <label className="form-label">Display Name</label>
                            <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Role</label>
                            <input className="form-input" value={currentUser?.role || 'unknown'} disabled />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Preferred Network</label>
                            <select className="form-input" value={network} onChange={(e) => setNetwork(e.target.value)}>
                                <option value="hardhat-local">Hardhat Local (31337)</option>
                                <option value="sepolia">Sepolia Testnet (11155111)</option>
                            </select>
                        </div>

                        <button type="submit" className="btn btn-primary">Save Settings</button>
                        {saved && <span style={{ marginLeft: 12, color: 'var(--green-600)', fontWeight: 600 }}>Saved</span>}
                    </form>
                </div>
            </div>
        </div>
    )
}

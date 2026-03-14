const ACTIVITY_KEY = 'truedegree_activity'

export function getActivity() {
    try {
        const raw = localStorage.getItem(ACTIVITY_KEY)
        const parsed = raw ? JSON.parse(raw) : []
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
}

export function addActivity(entry) {
    const next = [
        {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            ...entry,
        },
        ...getActivity(),
    ].slice(0, 120)

    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(next))
}

export function getDashboardMetrics() {
    const activity = getActivity()
    const users = (() => {
        try {
            const raw = localStorage.getItem('truedegree_users')
            const parsed = raw ? JSON.parse(raw) : []
            return Array.isArray(parsed) ? parsed.length : 0
        } catch {
            return 0
        }
    })()

    const issued = activity.filter((item) => item.type === 'issue-success').length
    const verified = activity.filter((item) => item.type === 'verify-success').length

    return {
        issued,
        verified,
        users,
    }
}

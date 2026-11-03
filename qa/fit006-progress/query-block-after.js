async function loadTrainerClientProgress(trainerId, sessions) {
    if (typeof trainerId !== 'string' || !trainerId)
        return [];
    const clients = new Map();
    for (const session of sessions.slice(0, 5)) {
        if (typeof session.clientId !== 'string' || !session.clientId || typeof session.id !== 'string' || !session.id)
            continue;
        if (!clients.has(session.clientId)) {
            clients.set(session.clientId, {
                clientId: session.clientId,
                appointmentId: session.id,
                name: session.client?.user?.name || session.client?.user?.email || 'Client',
            });
        }
    }
    return Promise.all(Array.from(clients.values()).map(async (client) => {
        try {
            const measurement = await g.z.measurement.findFirst({
                where: {
                    clientId: client.clientId,
                    client: { appointments: { some: { trainerId } } },
                },
                orderBy: { measuredAt: 'desc' },
                select: { measuredAt: true, weightKg: true, bodyFatPct: true, waistCm: true },
            });
            return { ...client, measurement, unavailable: false };
        }
        catch {
            return { ...client, measurement: null, unavailable: true };
        }
    }));
}
function renderTrainerProgress(progress) {
    const metric = (value, unit) => typeof value === 'number' && Number.isFinite(value) ? `${value} ${unit}` : 'Not recorded';
    const recordedAt = (value) => {
        const date = value instanceof Date ? value : new Date(value);
        return Number.isNaN(date.getTime()) ? 'Date unavailable' : T(date, 'MMM d, yyyy');
    };
    return ((0, d.jsxs)("section", { className: "card", "aria-labelledby": "trainer-progress-heading", children: [(0, d.jsx)("h2", { id: "trainer-progress-heading", className: "section-title", children: "Recent client progress" }), (0, d.jsx)("p", { className: "mt-2 text-sm text-slate-600 dark:text-slate-300", children: "Read-only latest measurements for clients in your five most recent listed sessions." }), progress.length === 0 && (0, d.jsx)("p", { className: "mt-4 text-sm", children: "No clients in your recent sessions." }), (0, d.jsx)("div", { className: "mt-4 grid gap-4 sm:grid-cols-2", children: progress.map((client) => ((0, d.jsxs)("article", { className: "rounded-xl border border-brand-line p-4 dark:border-white/10", children: [(0, d.jsx)("h3", { className: "font-semibold", children: client.name }), client.unavailable ? ((0, d.jsx)("p", { className: "mt-2 text-sm", role: "status", children: "Progress is temporarily unavailable. Your session details are still available." })) : client.measurement ? ((0, d.jsxs)("dl", { className: "mt-2 grid grid-cols-2 gap-2 text-sm", children: [(0, d.jsx)("dt", { children: "Last recorded" }), (0, d.jsx)("dd", { children: recordedAt(client.measurement.measuredAt) }), (0, d.jsx)("dt", { children: "Weight" }), (0, d.jsx)("dd", { children: metric(client.measurement.weightKg, 'kg') }), (0, d.jsx)("dt", { children: "Body fat" }), (0, d.jsx)("dd", { children: metric(client.measurement.bodyFatPct, '%') }), (0, d.jsx)("dt", { children: "Waist" }), (0, d.jsx)("dd", { children: metric(client.measurement.waistCm, 'cm') })] })) : (0, d.jsx)("p", { className: "mt-2 text-sm", children: "No measurements recorded." }), (0, d.jsx)(j(), { href: `/dashboard/appointments/${encodeURIComponent(client.appointmentId)}`, className: "mt-3 inline-flex text-sm font-semibold text-flame-600 dark:text-flame-300", children: "Open session" })] }, client.clientId))) })] }));
}
async function al(a, b) { let c = {}; if (b === h.UserRole.CLIENT) {
    let b = await g.z.client.findUnique({ where: { userId: a } });
    if (!b)
        return null;
    c.clientId = b.id;
}
else if (b === h.UserRole.TRAINER) {
    let b = await g.z.trainer.findUnique({ where: { userId: a } });
    if (!b)
        return null;
    c.trainerId = b.id;
} let [d, e, f] = await Promise.all([g.z.appointment.groupBy({ by: ["status"], where: c, _count: { status: !0 } }), g.z.appointment.findMany({ where: { ...c, status: { notIn: [h.AppointmentStatus.CANCELLED, h.AppointmentStatus.NO_SHOW] } }, orderBy: { startsAt: "desc" }, take: 5, include: { client: { include: { user: { select: { name: !0, email: !0 } } } }, trainer: { include: { user: { select: { name: !0, email: !0 } } } }, gymLocation: !0 } }), g.z.appointment.findMany({ where: { ...c, status: h.AppointmentStatus.COMPLETED }, orderBy: { startsAt: "desc" }, take: 5, include: { client: { include: { user: { select: { name: !0, email: !0 } } } }, trainer: { include: { user: { select: { name: !0, email: !0 } } } }, workoutLog: !0 } })]), i = d.reduce((a, b) => a + b._count.status, 0), j = d.find(a => a.status === h.AppointmentStatus.COMPLETED)?._count.status || 0; const trainerClientProgress = b === h.UserRole.TRAINER ? await loadTrainerClientProgress(c.trainerId, e) : []; return { total: i, completed: j, cancelled: d.find(a => a.status === h.AppointmentStatus.CANCELLED)?._count.status || 0, noShow: d.find(a => a.status === h.AppointmentStatus.NO_SHOW)?._count.status || 0, completionRate: i > 0 ? Math.round(j / i * 100) : 0, dashboardAppointments: e, recent: f, trainerClientProgress }; }
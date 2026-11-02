import { useState, useEffect, useCallback } from 'react';
import { isAbortError } from '@/lib/utils';
import type { CheckoutAppointment } from '@/types/models';
import { clientError } from '@/lib/clientLogger';

export function useAppointments() {
    const [appointments, setAppointments] = useState<CheckoutAppointment[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAppointments = useCallback(async (signal?: AbortSignal) => {
        const response = await fetch('/api/appointments', { signal, credentials: 'include' });
        if (!response.ok) return null;
        const data: CheckoutAppointment[] = await response.json();
        const now = new Date();
        return data
            .filter((appointment) => (
                new Date(appointment.end ?? appointment.start ?? String(appointment.startTime ?? appointment.id)).getTime() > now.getTime()
                || appointment.status === 'CONFIRMED'
            ))
            .sort((left, right) => (
                new Date(String(left.start ?? left.startTime ?? '')).getTime()
                - new Date(String(right.start ?? right.startTime ?? '')).getTime()
            ));
    }, []);

    const load = useCallback(async (signal?: AbortSignal) => {
        setLoading(true);
        try {
            const nextAppointments = await fetchAppointments(signal);
            if (nextAppointments) setAppointments(nextAppointments);
        } catch (err: unknown) {
            if (!isAbortError(err)) clientError('Erreur chargement rendez-vous', err);
        } finally {
            setLoading(false);
        }
    }, [fetchAppointments]);

    useEffect(() => {
        const controller = new AbortController();
        let active = true;
        void (async () => {
            try {
                const nextAppointments = await fetchAppointments(controller.signal);
                if (active && nextAppointments) setAppointments(nextAppointments);
            } catch (err: unknown) {
                if (active && !isAbortError(err)) clientError('Erreur chargement rendez-vous', err);
            } finally {
                if (active) setLoading(false);
            }
        })();
        // Listen for external updates (e.g. when an appointment is created elsewhere)
        function onUpdated() {
            void load();
        }
        window.addEventListener('appointments:updated', onUpdated);

        return () => {
            active = false;
            controller.abort();
            window.removeEventListener('appointments:updated', onUpdated);
        };
    }, [fetchAppointments, load]);

    return { appointments, loading, refresh: load };
}
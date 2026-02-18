/**
 * Calendly appointments service
 * - Fetch appointments from Supabase
 * - Sync from Calendly API (catches events missed by webhook)
 * - Realtime subscription
 * - Format for display
 */

import { supabase, supabaseUrl } from '@/lib/supabase/supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type Appointment = {
  id: string;
  userId: string;
  eventUri: string;
  eventType: string;
  inviteeEmail: string | null;
  inviteeName: string | null;
  startTime: string;
  endTime: string;
  status: 'booked' | 'canceled' | 'rescheduled';
  meetingUrl?: string;
  createdAt: string;
};

function mapRow(row: Record<string, unknown>): Appointment {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    eventUri: row.event_uri as string,
    eventType: row.event_type as string,
    inviteeEmail: (row.invitee_email as string) ?? null,
    inviteeName: (row.invitee_name as string) ?? null,
    startTime: row.start_time as string,
    endTime: row.end_time as string,
    status: (row.status as Appointment['status']) ?? 'booked',
    createdAt: row.created_at as string,
  };
}

export async function syncAppointmentsFromCalendly(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return;
  await fetch(`${supabaseUrl.replace(/\/$/, '')}/functions/v1/calendly-sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
  }).catch(() => {});
}

export async function fetchAppointments(userId: string, syncFirst = false): Promise<Appointment[]> {
  if (syncFirst) {
    await syncAppointmentsFromCalendly();
  }
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', userId)
    .order('start_time', { ascending: false });

  if (error) return [];
  return (data ?? []).map(mapRow);
}

export function subscribeToRealtimeAppointments(
  userId: string,
  onUpdate: (appointments: Appointment[]) => void,
  options?: { syncOnFirstLoad?: boolean }
): () => void {
  let channel: RealtimeChannel;
  let firstLoad = true;

  const refresh = async () => {
    const syncFirst = options?.syncOnFirstLoad && firstLoad;
    if (firstLoad) firstLoad = false;
    const appointments = await fetchAppointments(userId, syncFirst);
    onUpdate(appointments);
  };

  refresh();

  channel = supabase
    .channel(`appointments:${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'appointments', filter: `user_id=eq.${userId}` },
      () => {
        refresh();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function formatAppointment(appt: Appointment): {
  dateLabel: string;
  timeRange: string;
  title: string;
  statusLabel: string;
} {
  const start = new Date(appt.startTime);
  const end = new Date(appt.endTime);
  const now = new Date();

  let dateLabel: string;
  if (start.toDateString() === now.toDateString()) {
    dateLabel = 'Today';
  } else if (start.toDateString() === new Date(now.getTime() + 86400000).toDateString()) {
    dateLabel = 'Tomorrow';
  } else {
    dateLabel = start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }

  const timeRange = `${start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} – ${end.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
  const title = appt.inviteeName || appt.inviteeEmail || 'Meeting';
  const statusLabel = appt.status === 'canceled' ? 'Canceled' : appt.status === 'rescheduled' ? 'Rescheduled' : '';

  return { dateLabel, timeRange, title, statusLabel };
}

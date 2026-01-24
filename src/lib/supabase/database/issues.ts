/**
 * Issue 관련 데이터베이스 함수
 */

import { supabase, isSupabaseConfigured } from '../client';
import { dbLogger } from '@/lib/logger';
import { IssueItem, IssueType, IssuePriority, IssueImpact, IssueStatus, Attachment } from '@/lib/types';

// ═══════════════════════════════════════════════════════════════════════════
// Issue DB 타입
// ═══════════════════════════════════════════════════════════════════════════

interface DBIssueItem {
  id: string;
  year: number;
  month: number;
  title: string;
  type: string;
  priority: string;
  impact: string;
  status: string;
  category: string;
  description: string | null;
  owner: string | null;
  due_date: string | null;
  resolution: string | null;
  attachments: Attachment[] | null;
  created_at: string;
  updated_at: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Issue 관련 함수들
// ═══════════════════════════════════════════════════════════════════════════

export async function fetchIssueItems(year?: number): Promise<IssueItem[] | null> {
  if (!isSupabaseConfigured()) return null;

  let query = supabase!
    .from('issues')
    .select('*');

  if (year) {
    query = query.eq('year', year);
  }

  const { data, error } = await query
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    dbLogger.error('Error fetching issue items:', error);
    return null;
  }

  return data?.map(mapDbIssueToIssue) || [];
}

export async function createIssueItem(
  item: Omit<IssueItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<IssueItem | null> {
  if (!isSupabaseConfigured()) return null;

  const now = new Date().toISOString();

  const { data, error } = await supabase!
    .from('issues')
    .insert({
      year: item.year,
      month: item.month,
      title: item.title,
      type: item.type,
      priority: item.priority,
      impact: item.impact,
      status: item.status,
      category: item.category,
      description: item.description || null,
      owner: item.owner || null,
      due_date: item.dueDate || null,
      resolution: item.resolution || null,
      attachments: item.attachments || null,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  if (error) {
    dbLogger.error('Error creating issue item:', error.message, error.code, error.details, error.hint);
    return null;
  }

  return mapDbIssueToIssue(data);
}

export async function updateIssueItem(
  id: string,
  updates: Partial<IssueItem>
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const dbUpdates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.year !== undefined) dbUpdates.year = updates.year;
  if (updates.month !== undefined) dbUpdates.month = updates.month;
  if (updates.type !== undefined) dbUpdates.type = updates.type;
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
  if (updates.impact !== undefined) dbUpdates.impact = updates.impact;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.description !== undefined) dbUpdates.description = updates.description || null;
  if (updates.owner !== undefined) dbUpdates.owner = updates.owner || null;
  if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate || null;
  if (updates.resolution !== undefined) dbUpdates.resolution = updates.resolution || null;
  if (updates.attachments !== undefined) dbUpdates.attachments = updates.attachments || null;

  const { error } = await supabase!
    .from('issues')
    .update(dbUpdates)
    .eq('id', id);

  if (error) {
    dbLogger.error('Error updating issue item:', error);
    return false;
  }

  return true;
}

export async function deleteIssueItem(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase!
    .from('issues')
    .delete()
    .eq('id', id);

  if (error) {
    dbLogger.error('Error deleting issue item:', error);
    return false;
  }

  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// 매핑 헬퍼
// ═══════════════════════════════════════════════════════════════════════════

function mapDbIssueToIssue(dbIssue: DBIssueItem): IssueItem {
  return {
    id: dbIssue.id,
    year: dbIssue.year,
    month: dbIssue.month,
    title: dbIssue.title,
    type: dbIssue.type as IssueType,
    priority: dbIssue.priority as IssuePriority,
    impact: dbIssue.impact as IssueImpact,
    status: dbIssue.status as IssueStatus,
    category: dbIssue.category as IssueItem['category'],
    description: dbIssue.description || undefined,
    owner: dbIssue.owner || undefined,
    dueDate: dbIssue.due_date || undefined,
    resolution: dbIssue.resolution || undefined,
    attachments: dbIssue.attachments || undefined,
    createdAt: dbIssue.created_at,
    updatedAt: dbIssue.updated_at,
  };
}

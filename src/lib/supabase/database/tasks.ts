/**
 * Task, MustDoItem, KPIItem, ContentItem 관련 데이터베이스 함수
 */

import { supabase, isSupabaseConfigured } from '../client';
import { dbLogger } from '@/lib/logger';
import { Task, MustDoItem, KPIItem, ContentItem, TaskStatus } from '@/lib/types';

// ═══════════════════════════════════════════════════════════════════════════
// Task 관련 함수들
// ═══════════════════════════════════════════════════════════════════════════

export async function fetchTasks(year?: number): Promise<Task[] | null> {
  if (!isSupabaseConfigured()) return null;

  let query = supabase!
    .from('tasks')
    .select('*');

  if (year) {
    query = query.eq('year', year);
  }

  const { data, error } = await query
    .order('year', { ascending: true })
    .order('month', { ascending: true })
    .order('week', { ascending: true })
    .order('sort_order', { ascending: true });

  if (error) {
    dbLogger.error('Error fetching tasks:', error);
    return null;
  }

  return data?.map(mapDbTaskToTask) || [];
}

export async function createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task | null> {
  if (!isSupabaseConfigured()) return null;

  const id = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  const { data, error } = await supabase!
    .from('tasks')
    .insert({
      id,
      title: task.title,
      description: task.description,
      year: task.year,
      month: task.month,
      week: task.week,
      category: task.category,
      status: task.status,
      assignee: task.assignee,
      due_date: task.dueDate,
      deliverables: task.deliverables,
      notes: task.notes,
      attachments: task.attachments,
    })
    .select()
    .single();

  if (error) {
    dbLogger.error('Error creating task:', error);
    return null;
  }

  return mapDbTaskToTask(data);
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const dbUpdates: Record<string, unknown> = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.year !== undefined) dbUpdates.year = updates.year;
  if (updates.month !== undefined) dbUpdates.month = updates.month;
  if (updates.week !== undefined) dbUpdates.week = updates.week;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.assignee !== undefined) dbUpdates.assignee = updates.assignee;
  if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
  if (updates.deliverables !== undefined) dbUpdates.deliverables = updates.deliverables;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
  if (updates.attachments !== undefined) dbUpdates.attachments = updates.attachments;

  const { error } = await supabase!
    .from('tasks')
    .update(dbUpdates)
    .eq('id', id);

  if (error) {
    dbLogger.error('Error updating task:', error);
    return false;
  }

  return true;
}

export async function deleteTask(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase!
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) {
    dbLogger.error('Error deleting task:', error);
    return false;
  }

  return true;
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<boolean> {
  return updateTask(id, { status });
}

// ═══════════════════════════════════════════════════════════════════════════
// Must-Do 관련 함수들
// ═══════════════════════════════════════════════════════════════════════════

export async function fetchMustDoItems(year?: number): Promise<MustDoItem[] | null> {
  if (!isSupabaseConfigured()) return null;

  let query = supabase!
    .from('must_do_items')
    .select('*');

  if (year) {
    query = query.eq('year', year);
  }

  const { data, error } = await query
    .order('year', { ascending: true })
    .order('month', { ascending: true })
    .order('sort_order', { ascending: true });

  if (error) {
    dbLogger.error('Error fetching must-do items:', error);
    return null;
  }

  return data?.map(mapDbMustDoToMustDo) || [];
}

export async function createMustDoItem(item: Omit<MustDoItem, 'id'>): Promise<MustDoItem | null> {
  if (!isSupabaseConfigured()) return null;

  const id = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  const { data, error } = await supabase!
    .from('must_do_items')
    .insert({
      id,
      year: item.year,
      month: item.month,
      title: item.title,
      done: item.done,
      category: item.category,
    })
    .select()
    .single();

  if (error) {
    dbLogger.error('Error creating must-do item:', error);
    return null;
  }

  return mapDbMustDoToMustDo(data);
}

export async function toggleMustDo(id: string, done: boolean): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase!
    .from('must_do_items')
    .update({ done })
    .eq('id', id);

  if (error) {
    dbLogger.error('Error toggling must-do:', error);
    return false;
  }

  return true;
}

export async function updateMustDoItem(id: string, updates: Partial<MustDoItem>): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const dbUpdates: Record<string, unknown> = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.year !== undefined) dbUpdates.year = updates.year;
  if (updates.month !== undefined) dbUpdates.month = updates.month;
  if (updates.done !== undefined) dbUpdates.done = updates.done;
  if (updates.category !== undefined) dbUpdates.category = updates.category;

  const { error } = await supabase!
    .from('must_do_items')
    .update(dbUpdates)
    .eq('id', id);

  if (error) {
    dbLogger.error('Error updating must-do item:', error);
    return false;
  }

  return true;
}

export async function deleteMustDoItem(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase!
    .from('must_do_items')
    .delete()
    .eq('id', id);

  if (error) {
    dbLogger.error('Error deleting must-do item:', error);
    return false;
  }

  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// KPI 관련 함수들
// ═══════════════════════════════════════════════════════════════════════════

export async function fetchKPIItems(year?: number): Promise<KPIItem[] | null> {
  if (!isSupabaseConfigured()) return null;

  let query = supabase!
    .from('kpi_items')
    .select('*');

  if (year) {
    query = query.eq('year', year);
  }

  const { data, error } = await query
    .order('year', { ascending: true })
    .order('month', { ascending: true });

  if (error) {
    dbLogger.error('Error fetching KPI items:', error);
    return null;
  }

  return data?.map(mapDbKPIToKPI) || [];
}

export async function updateKPI(id: string, current: number): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase!
    .from('kpi_items')
    .update({ current_value: current })
    .eq('id', id);

  if (error) {
    dbLogger.error('Error updating KPI:', error);
    return false;
  }

  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// Content 관련 함수들
// ═══════════════════════════════════════════════════════════════════════════

export async function fetchContentItems(year?: number): Promise<ContentItem[] | null> {
  if (!isSupabaseConfigured()) return null;

  let query = supabase!
    .from('content_items')
    .select('*');

  if (year) {
    query = query.eq('year', year);
  }

  const { data, error } = await query
    .order('year', { ascending: true })
    .order('scheduled_date', { ascending: true });

  if (error) {
    dbLogger.error('Error fetching content items:', error);
    return null;
  }

  return data?.map(mapDbContentToContent) || [];
}

export async function createContentItem(item: Omit<ContentItem, 'id'>): Promise<ContentItem | null> {
  if (!isSupabaseConfigured()) return null;

  const id = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  const { data, error } = await supabase!
    .from('content_items')
    .insert({
      id,
      year: item.year,
      type: item.type,
      title: item.title,
      description: item.description,
      scheduled_date: item.date,
      status: item.status,
    })
    .select()
    .single();

  if (error) {
    dbLogger.error('Error creating content item:', error);
    return null;
  }

  return mapDbContentToContent(data);
}

export async function updateContentItem(id: string, updates: Partial<ContentItem>): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const dbUpdates: Record<string, unknown> = {};
  if (updates.year !== undefined) dbUpdates.year = updates.year;
  if (updates.type !== undefined) dbUpdates.type = updates.type;
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.date !== undefined) dbUpdates.scheduled_date = updates.date;
  if (updates.status !== undefined) dbUpdates.status = updates.status;

  const { error } = await supabase!
    .from('content_items')
    .update(dbUpdates)
    .eq('id', id);

  if (error) {
    dbLogger.error('Error updating content item:', error);
    return false;
  }

  return true;
}

export async function deleteContentItem(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase!
    .from('content_items')
    .delete()
    .eq('id', id);

  if (error) {
    dbLogger.error('Error deleting content item:', error);
    return false;
  }

  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// 초기 데이터 시드
// ═══════════════════════════════════════════════════════════════════════════

export async function seedInitialData(
  tasks: Task[],
  mustDoItems: MustDoItem[],
  kpiItems: KPIItem[],
  contentItems: ContentItem[]
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    // 기존 데이터 확인
    const { count: taskCount } = await supabase!
      .from('tasks')
      .select('*', { count: 'exact', head: true });

    // 데이터가 이미 있으면 시드하지 않음
    if (taskCount && taskCount > 0) {
      dbLogger.log('Data already exists, skipping seed');
      return true;
    }

    // Tasks 시드
    const tasksToInsert = tasks.map((task, index) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      year: task.year,
      month: task.month,
      week: task.week,
      category: task.category,
      status: task.status,
      assignee: task.assignee,
      due_date: task.dueDate,
      deliverables: task.deliverables,
      notes: task.notes,
      sort_order: index,
    }));

    await supabase!.from('tasks').insert(tasksToInsert);

    // Must-Do Items 시드
    const mustDoToInsert = mustDoItems.map((item, index) => ({
      id: item.id,
      year: item.year,
      month: item.month,
      title: item.title,
      done: item.done,
      sort_order: index,
    }));

    await supabase!.from('must_do_items').insert(mustDoToInsert);

    // KPI Items 시드
    const kpiToInsert = kpiItems.map((item) => ({
      id: item.id,
      year: item.year,
      month: item.month,
      category: item.category,
      metric: item.metric,
      current_value: item.current,
      target_value: item.target,
    }));

    await supabase!.from('kpi_items').insert(kpiToInsert);

    // Content Items 시드
    const contentToInsert = contentItems.map((item, index) => ({
      id: item.id,
      year: item.year,
      type: item.type,
      title: item.title,
      description: item.description,
      scheduled_date: item.date,
      status: item.status,
      sort_order: index,
    }));

    await supabase!.from('content_items').insert(contentToInsert);

    dbLogger.log('Initial data seeded successfully');
    return true;
  } catch (error) {
    dbLogger.error('Error seeding initial data:', error);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 헬퍼 함수들 (DB 필드명 ↔ 앱 필드명 변환)
// ═══════════════════════════════════════════════════════════════════════════

export function mapDbTaskToTask(dbTask: Record<string, unknown>): Task {
  return {
    id: dbTask.id as string,
    title: dbTask.title as string,
    description: dbTask.description as string | undefined,
    year: dbTask.year as number,
    month: dbTask.month as number,
    week: dbTask.week as number,
    category: dbTask.category as Task['category'],
    status: dbTask.status as Task['status'],
    assignee: dbTask.assignee as string | undefined,
    dueDate: dbTask.due_date as string | undefined,
    deliverables: dbTask.deliverables as string[] | undefined,
    notes: dbTask.notes as string | undefined,
    attachments: dbTask.attachments as Task['attachments'],
    createdAt: dbTask.created_at as string,
    updatedAt: dbTask.updated_at as string,
  };
}

function mapDbMustDoToMustDo(dbMustDo: Record<string, unknown>): MustDoItem {
  return {
    id: dbMustDo.id as string,
    year: dbMustDo.year as number,
    month: dbMustDo.month as number,
    title: dbMustDo.title as string,
    done: dbMustDo.done as boolean,
    category: (dbMustDo.category as MustDoItem['category']) || 'operation',
  };
}

function mapDbKPIToKPI(dbKPI: Record<string, unknown>): KPIItem {
  return {
    id: dbKPI.id as string,
    year: dbKPI.year as number,
    month: dbKPI.month as number,
    category: dbKPI.category as KPIItem['category'],
    metric: dbKPI.metric as string,
    current: Number(dbKPI.current_value),
    target: Number(dbKPI.target_value),
  };
}

function mapDbContentToContent(dbContent: Record<string, unknown>): ContentItem {
  return {
    id: dbContent.id as string,
    year: dbContent.year as number,
    type: dbContent.type as ContentItem['type'],
    title: dbContent.title as string,
    description: dbContent.description as string | undefined,
    date: dbContent.scheduled_date as string,
    status: dbContent.status as ContentItem['status'],
  };
}

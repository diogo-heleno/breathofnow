'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useExpenseStore } from '@/stores/expense-store';
import { db } from '@/lib/db';
import type { ExpenseCategory } from '@/lib/db';

const COLORS = [
  '#f97316', '#ef4444', '#ec4899', '#8b5cf6',
  '#3b82f6', '#14b8a6', '#22c55e', '#eab308',
  '#6b7280', '#0ea5e9', '#f43f5e', '#a855f7',
];

export default function CategoriesPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations('expenseFlow.categories');
  const tDefaults = useTranslations('expenseFlow.categories.default');

  const { categories, setCategories } = useExpenseStore();
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<ExpenseCategory | null>(null);

  // New/Edit form state
  const [formName, setFormName] = useState('');
  const [formColor, setFormColor] = useState(COLORS[0]);

  const filteredCategories = categories.filter(
    (c) => c.type === activeTab || c.type === 'both'
  );

  const getCategoryDisplayName = (category: ExpenseCategory) => {
    if (category.nameKey && category.isDefault) {
      return tDefaults(category.nameKey);
    }
    return category.name;
  };

  const handleStartAdd = () => {
    setFormName('');
    setFormColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
    setIsAddingNew(true);
    setEditingCategory(null);
  };

  const handleStartEdit = (category: ExpenseCategory) => {
    setFormName(category.name);
    setFormColor(category.color);
    setEditingCategory(category);
    setIsAddingNew(false);
  };

  const handleCancel = () => {
    setIsAddingNew(false);
    setEditingCategory(null);
    setFormName('');
  };

  const handleSave = async () => {
    if (!formName.trim()) return;

    const now = new Date();

    if (editingCategory?.id) {
      // Update existing
      await db.expenseCategories.update(editingCategory.id, {
        name: formName,
        color: formColor,
        updatedAt: now,
      });

      setCategories(
        categories.map((c) =>
          c.id === editingCategory.id
            ? { ...c, name: formName, color: formColor, updatedAt: now }
            : c
        )
      );
    } else {
      // Add new
      const maxSortOrder = Math.max(
        0,
        ...filteredCategories.map((c) => c.sortOrder)
      );

      const newCategory: Omit<ExpenseCategory, 'id'> = {
        name: formName,
        icon: 'circle',
        color: formColor,
        type: activeTab,
        isDefault: false,
        sortOrder: maxSortOrder + 1,
        createdAt: now,
        updatedAt: now,
      };

      const id = await db.expenseCategories.add(newCategory as ExpenseCategory);
      setCategories([...categories, { ...newCategory, id } as ExpenseCategory]);
    }

    handleCancel();
  };

  const handleDelete = async (category: ExpenseCategory) => {
    if (!category.id) return;

    await db.expenseCategories.update(category.id, {
      deletedAt: new Date(),
      updatedAt: new Date(),
    });

    setCategories(categories.filter((c) => c.id !== category.id));
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          {t('title')}
        </h1>
        <Button
          size="sm"
          onClick={handleStartAdd}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          {t('add')}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-neutral-100 dark:bg-neutral-800 p-1">
        <button
          onClick={() => setActiveTab('expense')}
          className={cn(
            'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all',
            activeTab === 'expense'
              ? 'bg-white dark:bg-neutral-900 shadow-sm text-neutral-900 dark:text-neutral-100'
              : 'text-neutral-600 dark:text-neutral-400'
          )}
        >
          {t('expense')}
        </button>
        <button
          onClick={() => setActiveTab('income')}
          className={cn(
            'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all',
            activeTab === 'income'
              ? 'bg-white dark:bg-neutral-900 shadow-sm text-neutral-900 dark:text-neutral-100'
              : 'text-neutral-600 dark:text-neutral-400'
          )}
        >
          {t('income')}
        </button>
      </div>

      {/* Add/Edit Form */}
      {(isAddingNew || editingCategory) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {editingCategory ? t('edit') : t('add')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                {t('name')}
              </label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Category name"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                {t('color')}
              </label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setFormColor(color)}
                    className={cn(
                      'w-8 h-8 rounded-full transition-all',
                      formColor === color && 'ring-2 ring-offset-2 ring-primary-500'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="ghost" onClick={handleCancel} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!formName.trim()}
                className="flex-1"
              >
                Save
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories List */}
      <Card>
        <CardContent className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {filteredCategories.length === 0 ? (
            <div className="py-8 text-center text-neutral-500">
              No categories yet
            </div>
          ) : (
            filteredCategories.map((category) => (
              <div
                key={category.id}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: category.color }}
                >
                  {category.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-neutral-900 dark:text-neutral-100">
                    {getCategoryDisplayName(category)}
                  </p>
                  {category.isDefault && (
                    <span className="text-xs text-neutral-500">Default</span>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleStartEdit(category)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {!category.isDefault && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteConfirm(category)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="mx-4 max-w-sm w-full">
            <CardContent className="pt-6 text-center">
              <p className="text-neutral-900 dark:text-neutral-100 mb-6">
                Delete &quot;{deleteConfirm.name}&quot;?
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={() => handleDelete(deleteConfirm)}>
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

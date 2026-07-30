'use client';

import { useState } from 'react';
import {
  AlignLeft,
  CalendarClock,
  ChevronDown,
  Clock,
  Globe,
  Loader2,
  PanelRightClose,
  PanelRightOpen,
  Save,
  AlertCircle,
} from 'lucide-react';
import { getLocalDateTimeMin, type LocalAutosaveStatus } from '@/lib/editorUtils';

interface PostEditorHeaderHeroProps {
  mode: 'create' | 'edit';
  titleText: string;
  descriptionText: string;
  isSaving: boolean;
  autosaveStatus: LocalAutosaveStatus;
  autosaveLabel: string;
  showSidebar: boolean;
  onToggleSidebar: () => void;
  onPreview: () => void;
  onSaveDraft: () => void;
  onPublishNow: () => void;
  onSchedule: (date: string) => void;
  scheduleDate: string;
  onScheduleDateChange: (date: string) => void;
}

/**
 * Top header hero section of the post editor containing action buttons
 * (Preview, Draft, Publish, Schedule) and live autosave indicator.
 */
export function PostEditorHeaderHero({
  mode,
  titleText,
  descriptionText,
  isSaving,
  autosaveStatus,
  autosaveLabel,
  showSidebar,
  onToggleSidebar,
  onPreview,
  onSaveDraft,
  onPublishNow,
  onSchedule,
  scheduleDate,
  onScheduleDateChange,
}: PostEditorHeaderHeroProps) {
  const [showPublishMenu, setShowPublishMenu] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);

  return (
    <header className="admin-page-hero">
      <div className="admin-page-hero-bg" />
      <div className="admin-page-hero-content">
        <div className="max-w-2xl">
          <div className="admin-page-hero-icon">
            <AlignLeft className="h-5 w-5" />
          </div>
          <h1 className="admin-page-title">{titleText}</h1>
          <p className="admin-page-description">{descriptionText}</p>

          {autosaveStatus !== 'idle' && (
            <p
              className={`text-xs mt-3 flex items-center gap-1 ${
                autosaveStatus === 'saved'
                  ? 'text-emerald-500'
                  : autosaveStatus === 'error'
                    ? 'text-red-500'
                    : 'text-amber-500'
              }`}
            >
              {autosaveStatus === 'saving' && <Loader2 className="w-3 h-3 animate-spin" />}
              {autosaveStatus === 'saved' && <Save className="w-3 h-3" />}
              {autosaveStatus === 'dirty' && <Clock className="w-3 h-3" />}
              {autosaveStatus === 'error' && <AlertCircle className="w-3 h-3" />}
              {autosaveLabel}
            </p>
          )}
        </div>

        <div className="admin-hero-actions">
          {/* Focus Mode Sidebar Toggle */}
          <button
            type="button"
            onClick={onToggleSidebar}
            className="admin-hero-button border-primary-500/40 text-primary-400 hover:bg-primary-500/20"
            title={
              showSidebar
                ? 'Collapse settings panel for Focus Mode (Full Width)'
                : 'Show settings panel'
            }
          >
            {showSidebar ? (
              <PanelRightClose className="w-4 h-4" />
            ) : (
              <PanelRightOpen className="w-4 h-4 text-primary-400" />
            )}
            <span>{showSidebar ? 'Focus Mode' : 'Settings'}</span>
          </button>

          {/* Preview Button */}
          <button
            type="button"
            onClick={onPreview}
            disabled={isSaving}
            className="admin-hero-button"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
            Preview
          </button>

          {/* Save Draft Button */}
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={isSaving}
            className="admin-hero-button"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {mode === 'create' ? 'Draft' : 'Save'}
          </button>

          {/* Publish / Schedule Split Action */}
          <div className="admin-split-action">
            <div className="admin-split-action-group">
              <button
                type="button"
                onClick={onPublishNow}
                disabled={isSaving}
                className="admin-split-action-main"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                Publish
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPublishMenu(!showPublishMenu);
                  setShowScheduler(false);
                }}
                disabled={isSaving}
                className="admin-split-action-trigger"
                aria-label="Publication options"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Dropdown Menu */}
            {showPublishMenu && (
              <div className="admin-floating-panel w-64 overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    setShowPublishMenu(false);
                    setShowScheduler(true);
                  }}
                  className="admin-menu-item"
                >
                  <CalendarClock className="w-4 h-4 text-amber-500" />
                  <div>
                    <p className="font-medium">Schedule</p>
                    <p className="text-xs text-slate-500">Set a future publish date</p>
                  </div>
                </button>
              </div>
            )}

            {/* Schedule Picker Modal */}
            {showScheduler && (
              <div className="admin-floating-panel w-80 p-4 space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <CalendarClock className="w-4 h-4 text-amber-500" />
                  Schedule Publication
                </div>
                <input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => onScheduleDateChange(e.target.value)}
                  min={getLocalDateTimeMin()}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowScheduler(false)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSchedule(scheduleDate);
                      setShowScheduler(false);
                    }}
                    disabled={isSaving || !scheduleDate}
                    className="flex-1 px-3 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarClock className="w-4 h-4" />}
                    Schedule
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

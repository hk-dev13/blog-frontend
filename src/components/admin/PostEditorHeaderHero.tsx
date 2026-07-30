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
  X,
} from 'lucide-react';
import { getLocalDateTimeMin, type LocalAutosaveStatus } from '@/lib/editorUtils';

interface PostEditorHeaderHeroProps {
  mode: 'create' | 'edit';
  postStatus?: 'draft' | 'published' | 'scheduled';
  source?: string | null;
  sourceRef?: string | null;
  titleText: string;
  descriptionText: string;
  isSaving: boolean;
  autosaveStatus: LocalAutosaveStatus;
  autosaveLabel: string;
  showSidebar: boolean;
  onToggleSidebar: () => void;
  onPreview: () => void;
  onSaveDraft?: () => void;
  onUpdate?: () => void;
  onPublishNow?: () => void;
  onSchedule: (date: string) => void;
  scheduleDate: string;
  onScheduleDateChange: (date: string) => void;
}

/**
 * Top header hero section of the post editor containing action buttons
 * (Preview, Draft/Update, Publish, Schedule) and live autosave indicator.
 */
export function PostEditorHeaderHero({
  mode,
  postStatus,
  source,
  sourceRef,
  titleText,
  descriptionText,
  isSaving,
  autosaveStatus,
  autosaveLabel,
  showSidebar,
  onToggleSidebar,
  onPreview,
  onSaveDraft,
  onUpdate,
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
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="admin-page-title">{titleText}</h1>
            {source === 'eai' && (
              <span className="inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                Source: EAI
              </span>
            )}
          </div>
          <p className="admin-page-description">{descriptionText}</p>

          {sourceRef && (
            <p className="mt-2 text-xs text-slate-400">
              Source Ref: <span className="font-mono">{sourceRef}</span>
            </p>
          )}

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

          {/* Actions depending on Post Status & Mode */}
          {mode === 'edit' && postStatus === 'published' ? (
            <button
              type="button"
              onClick={onUpdate}
              disabled={isSaving}
              className="admin-hero-button-primary"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Update Changes
            </button>
          ) : (
            <>
              {/* Draft / Update Schedule Button */}
              <button
                type="button"
                onClick={mode === 'edit' ? onUpdate : onSaveDraft}
                disabled={isSaving}
                className="admin-hero-button"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {mode === 'edit'
                  ? postStatus === 'scheduled'
                    ? 'Update Schedule'
                    : 'Save'
                  : 'Draft'}
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

                {/* Desktop Dropdown Menu */}
                {showPublishMenu && (
                  <div className="hidden md:block admin-floating-panel w-64 overflow-hidden right-0">
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
                        <p className="text-xs text-slate-500 dark:text-slate-400">Set a future publish date</p>
                      </div>
                    </button>
                  </div>
                )}

                {/* Desktop Schedule Picker Modal */}
                {showScheduler && (
                  <div className="hidden md:block admin-floating-panel w-80 p-4 space-y-4 right-0">
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

                {/* Mobile Bottomsheet for Publish Options & Scheduler */}
                {(showPublishMenu || showScheduler) && (
                  <div className="md:hidden">
                    <div
                      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
                      onClick={() => {
                        setShowPublishMenu(false);
                        setShowScheduler(false);
                      }}
                    />
                    <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-300">
                      <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-1" />

                      {showPublishMenu && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">Publication Options</h3>
                            <button
                              type="button"
                              onClick={() => setShowPublishMenu(false)}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setShowPublishMenu(false);
                              setShowScheduler(true);
                            }}
                            className="flex items-center gap-3 w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                          >
                            <CalendarClock className="w-5 h-5 text-amber-500" />
                            <div>
                              <p className="font-semibold text-sm text-slate-900 dark:text-white">Schedule Publication</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">Set a future date & time for automatic publishing</p>
                            </div>
                          </button>
                        </div>
                      )}

                      {showScheduler && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <CalendarClock className="w-5 h-5 text-amber-500" />
                              Schedule Publication
                            </h3>
                            <button
                              type="button"
                              onClick={() => setShowScheduler(false)}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          <div className="space-y-2">
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              Select Date & Time
                            </label>
                            <input
                              type="datetime-local"
                              value={scheduleDate}
                              onChange={(e) => onScheduleDateChange(e.target.value)}
                              min={getLocalDateTimeMin()}
                              className="w-full px-4 py-3 text-base bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none text-slate-900 dark:text-white"
                            />
                          </div>

                          <div className="flex gap-3 pt-2">
                            <button
                              type="button"
                              onClick={() => setShowScheduler(false)}
                              className="flex-1 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
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
                              className="flex-1 py-3 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                            >
                              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarClock className="w-4 h-4" />}
                              Confirm Schedule
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

import { useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { UserX, Check, Sparkles, Link as LinkIcon, Image as ImageIcon, Upload } from 'lucide-react';
import { CARTOON_AVATAR_PRESETS, DEFAULT_STUDENT_AVATAR } from '../constants/avatars';

/**
 * Compact Cartoon Student Avatar Gallery Picker
 * - Compact square cards (8px rounded corners)
 * - 6 to 7 avatars per row on desktop
 * - Selected avatar highlighted with ECC Indigo border (#4338CA)
 * - All, Boys, Girls filter tabs
 * - "No Avatar" option as first square card
 * - External DiceBear 9.x HTTPS URLs (no local storage needed)
 * - Supports Custom Image URL and Direct Photo Upload options
 */
export default function StudentAvatarPicker({
  value = '',
  onChange,
  customAvatar = '',
  onCustomAvatarChange,
  showCustomInput = false,
  onToggleCustomInput
}) {
  const { t } = useTranslation();
  const [filterGender, setFilterGender] = useState('all'); // 'all' | 'boy' | 'girl'
  const [customMode, setCustomMode] = useState('url'); // 'url' | 'upload'
  const fileInputRef = useRef(null);

  const filteredAvatars = useMemo(() => {
    if (filterGender === 'boy') return CARTOON_AVATAR_PRESETS.filter((a) => a.gender === 'boy');
    if (filterGender === 'girl') return CARTOON_AVATAR_PRESETS.filter((a) => a.gender === 'girl');
    return CARTOON_AVATAR_PRESETS;
  }, [filterGender]);

  const isNoAvatarSelected = !showCustomInput && (!value || value === '' || value === DEFAULT_STUDENT_AVATAR);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (typeof dataUrl === 'string') {
        if (onCustomAvatarChange) onCustomAvatarChange(dataUrl);
        if (onChange) onChange(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-1.5">
      {/* Header with Title and Mode Toggles */}
      <div className="flex items-center justify-between">
        <label className="font-semibold text-slate-700 dark:text-[#CBD5E1] text-xs flex items-center gap-1.5">
          <Sparkles size={13} className="text-[#4338CA] dark:text-indigo-400" />
          <span>{t('students.avatar_photo', 'Student Avatar / Photo')}</span>
          <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
            {t('common.optional', 'Optional')}
          </span>
        </label>

        {onToggleCustomInput && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleCustomInput(!showCustomInput)}
              className="text-[#4338CA] dark:text-indigo-400 hover:text-[#4F46E5] dark:hover:text-indigo-300 hover:underline text-[11px] font-medium cursor-pointer inline-flex items-center gap-1"
            >
              {showCustomInput ? (
                <>
                  <ImageIcon size={12} />
                  <span>{t('students.pick_cartoon_avatar', 'Pick cartoon avatar')}</span>
                </>
              ) : (
                <>
                  <Upload size={12} />
                  <span>{t('common.upload_custom_photo', 'Custom photo / URL')}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {showCustomInput ? (
        /* Custom Photo Upload & URL Input Mode */
        <div className="space-y-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-[#1E293B]/70 border border-slate-200 dark:border-[#29364D]">
          <div className="flex items-center gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => setCustomMode('url')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                customMode === 'url'
                  ? 'bg-white dark:bg-slate-700 text-[#4338CA] dark:text-indigo-300 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <LinkIcon size={11} />
              <span>Image URL</span>
            </button>
            <button
              type="button"
              onClick={() => setCustomMode('upload')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                customMode === 'upload'
                  ? 'bg-white dark:bg-slate-700 text-[#4338CA] dark:text-indigo-300 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Upload size={11} />
              <span>Upload Photo</span>
            </button>
          </div>

          {customMode === 'url' ? (
            <input
              type="url"
              placeholder="https://example.com/student-photo.jpg"
              value={customAvatar}
              onChange={(e) => onCustomAvatarChange && onCustomAvatarChange(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#1E293B] text-slate-900 dark:text-[#F8FAFC] border border-slate-300 dark:border-[#29364D] text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          ) : (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 px-3 rounded-lg border border-dashed border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100/60 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Upload size={14} />
                <span>Select student photo file (JPG, PNG, WebP)</span>
              </button>
            </div>
          )}

          {customAvatar && (
            <div className="flex items-center gap-2 pt-0.5">
              <span className="text-[11px] text-slate-500">{t('students.preview', 'Preview')}:</span>
              <img
                src={customAvatar}
                alt="Custom avatar preview"
                className="w-9 h-9 rounded-lg object-cover border-2 border-[#4338CA] shadow-xs"
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_STUDENT_AVATAR;
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (onCustomAvatarChange) onCustomAvatarChange('');
                  if (onChange) onChange('');
                }}
                className="text-[10px] text-rose-500 hover:underline cursor-pointer"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Compact Cartoon Avatar Gallery Mode */
        <div className="rounded-xl bg-slate-50/90 dark:bg-[#1E293B]/60 border border-slate-200 dark:border-[#29364D] p-2 sm:p-2.5 space-y-2">
          {/* Filter Pills & Current Status */}
          <div className="flex items-center justify-between gap-1.5 flex-wrap">
            <div className="inline-flex items-center rounded-lg bg-slate-200/70 dark:bg-slate-800/80 p-0.5 text-[10px] font-medium">
              <button
                type="button"
                onClick={() => setFilterGender('all')}
                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                  filterGender === 'all'
                    ? 'bg-white dark:bg-slate-700 text-[#4338CA] dark:text-indigo-300 shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t('common.all', 'All')} (30)
              </button>
              <button
                type="button"
                onClick={() => setFilterGender('boy')}
                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                  filterGender === 'boy'
                    ? 'bg-white dark:bg-slate-700 text-[#4338CA] dark:text-indigo-300 shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                👦 {t('common.boys', 'Boys')} (15)
              </button>
              <button
                type="button"
                onClick={() => setFilterGender('girl')}
                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                  filterGender === 'girl'
                    ? 'bg-white dark:bg-slate-700 text-[#4338CA] dark:text-indigo-300 shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                👧 {t('common.girls', 'Girls')} (15)
              </button>
            </div>

            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              {isNoAvatarSelected ? (
                <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  {t('students.no_avatar_selected', 'Default Profile (No Avatar)')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[#4338CA] dark:text-indigo-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4338CA]"></span>
                  {t('students.avatar_selected', 'Avatar Selected')}
                </span>
              )}
            </span>
          </div>

          {/* Compact Avatar Flex-Grid: 7 per row on desktop, 5 on tablet, 3-4 on mobile with centered incomplete row */}
          <div className="flex flex-wrap justify-center gap-1.5 max-h-40 sm:max-h-44 overflow-y-auto scrollbar-thin scroll-smooth p-1.5">
            {/* Tile 1: Compact "No Avatar" Option Card */}
            <button
              type="button"
              onClick={() => onChange('')}
              className={`relative flex flex-col items-center justify-center p-1 rounded-lg transition-all cursor-pointer text-center group aspect-square w-[calc(25%-5px)] min-[440px]:w-[calc(25%-5px)] sm:w-[calc(20%-5px)] lg:w-[calc(14.285%-5.5px)] shrink-0 ${
                isNoAvatarSelected
                  ? 'border-2 border-[#4338CA] ring-1 ring-indigo-500/30 bg-indigo-50/80 dark:bg-indigo-950/60 shadow-xs'
                  : 'border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 bg-white/70 dark:bg-slate-800/70'
              }`}
              title={t('students.no_avatar_tooltip', 'No avatar (Use standard default profile placeholder)')}
            >
              {isNoAvatarSelected && (
                <span className="absolute top-0.5 right-0.5 z-10 w-3.5 h-3.5 rounded-full bg-[#4338CA] text-white flex items-center justify-center shadow-xs">
                  <Check size={8} strokeWidth={3} />
                </span>
              )}
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md flex items-center justify-center transition-colors ${
                  isNoAvatarSelected
                    ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300'
                    : 'bg-slate-100 dark:bg-slate-700/60 text-slate-400 group-hover:text-[#4338CA] dark:group-hover:text-indigo-400'
                }`}
              >
                <UserX size={15} />
              </div>
              <span
                className={`text-[9px] mt-0.5 font-semibold leading-tight line-clamp-1 ${
                  isNoAvatarSelected
                    ? 'text-indigo-700 dark:text-indigo-300'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {t('students.no_avatar', 'No Avatar')}
              </span>
            </button>

            {/* Cartoon Avatars: Compact square cards with 8px corners */}
            {filteredAvatars.map((preset) => {
              const isSelected = !showCustomInput && value === preset.url;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onChange(preset.url)}
                  className={`relative flex flex-col items-center justify-center p-1 rounded-lg transition-all cursor-pointer group aspect-square w-[calc(25%-5px)] min-[440px]:w-[calc(25%-5px)] sm:w-[calc(20%-5px)] lg:w-[calc(14.285%-5.5px)] shrink-0 ${
                    isSelected
                      ? 'border-2 border-[#4338CA] ring-1 ring-indigo-500/30 bg-indigo-50/80 dark:bg-indigo-950/60 shadow-xs'
                      : 'border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750'
                  }`}
                  title={`${preset.name} (${preset.gender === 'boy' ? 'Boy' : 'Girl'})`}
                >
                  {isSelected && (
                    <span className="absolute top-0.5 right-0.5 z-10 w-3.5 h-3.5 rounded-full bg-[#4338CA] text-white flex items-center justify-center shadow-xs">
                      <Check size={8} strokeWidth={3} />
                    </span>
                  )}
                  <img
                    src={preset.url}
                    alt={preset.name}
                    loading="lazy"
                    className="w-7 h-7 sm:w-8 sm:h-8 object-contain rounded-md"
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_STUDENT_AVATAR;
                    }}
                  />
                  <span
                    className={`text-[9px] mt-0.5 truncate max-w-full font-medium leading-none text-center ${
                      isSelected
                        ? 'text-indigo-700 dark:text-indigo-300 font-semibold'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {preset.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

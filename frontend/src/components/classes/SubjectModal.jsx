import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../ui/Modal';
import { BookOpen, Check, Plus, X, Lock, Sparkles } from 'lucide-react';
import { SubjectService } from '../../services/api';

const COMMON_SKILLS = [
  'Alphabet Recognition',
  'Phonemic Awareness',
  'Pronunciation',
  'Vocabulary Building',
  'Grammar & Syntax',
  'Reading Comprehension',
  'Writing & Essays',
  'Listening Comprehension',
  'Conversational Fluency',
  'Public Speaking',
  'Spelling'
];

const CATEGORIES = [
  'Foundational English',
  'Core Skills',
  'Applied Communication',
  'Exam Preparation',
  'Electives'
];

const getInitialState = (subject) => {
  if (subject) {
    return {
      name: subject.name || '',
      nameKhmer: subject.nameKhmer || '',
      code: subject.code || '',
      category: subject.category || 'Core Skills',
      description: subject.description || '',
      grades: subject.grades || 'Grade 1 - 12',
      status: subject.status || 'Active',
      skills: Array.isArray(subject.skills) ? [...subject.skills] : []
    };
  }
  return {
    name: '',
    nameKhmer: '',
    code: '',
    category: 'Core Skills',
    description: '',
    grades: 'Grade 1 - 12',
    status: 'Active',
    skills: ['Reading Comprehension', 'Vocabulary Building']
  };
};

export const SubjectModal = ({ isOpen, onClose, onSave, subject = null, subjects = [] }) => {
  const { t } = useTranslation();
  const isEditing = Boolean(subject?.id);

  const [formData, setFormData] = useState(() => getInitialState(subject));
  const [customSkill, setCustomSkill] = useState('');
  const [isLoadingCode, setIsLoadingCode] = useState(false);

  // Sync form state when modal opens or subject changes
  useEffect(() => {
    if (!isOpen) return;

    if (subject) {
      setFormData(getInitialState(subject));
    } else {
      setFormData(getInitialState(null));
      setIsLoadingCode(true);

      SubjectService.getNextCode()
        .then((res) => {
          if (res && res.code) {
            setFormData((prev) => ({ ...prev, code: res.code }));
          } else {
            setFormData((prev) => ({ ...prev, code: 'ENG-001' }));
          }
        })
        .catch(() => {
          setFormData((prev) => ({ ...prev, code: 'ENG-001' }));
        })
        .finally(() => {
          setIsLoadingCode(false);
        });
    }
  }, [isOpen, subject]);

  const toggleSkill = (skill) => {
    setFormData((prev) => {
      const exists = prev.skills.includes(skill);
      return {
        ...prev,
        skills: exists ? prev.skills.filter((s) => s !== skill) : [...prev.skills, skill]
      };
    });
  };

  const addCustomSkill = (e) => {
    e.preventDefault();
    const trimmed = customSkill.trim();
    if (trimmed && !formData.skills.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, trimmed]
      }));
      setCustomSkill('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    onSave({
      ...formData,
      code: formData.code
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? t('classes.edit_subject_title', 'Edit English Subject') : t('classes.create_subject_title', 'Create New English Subject')}
      description={t('classes.subject_modal_desc', 'Define what students learn, syllabus core focus, and skill competencies.')}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {t('classes.subject_name_en', 'Subject Name (English)')} *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. English Alphabet, Phonics, Reading"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {t('classes.subject_name_km', 'Subject Name (Khmer)')}
            </label>
            <input
              type="text"
              value={formData.nameKhmer}
              onChange={(e) => setFormData({ ...formData, nameKhmer: e.target.value })}
              placeholder="ឧ. អក្ខរក្រមអង់គ្លេស, សូរស័ព្ទ..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1]">
                {t('classes.subject_code', 'Subject Code')} *
              </label>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
                isEditing
                  ? 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                  : 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
              }`}>
                {isEditing ? (
                  <>
                    <Lock size={10} />
                    <span>Preserved</span>
                  </>
                ) : isLoadingCode ? (
                  <>
                    <Sparkles size={10} className="animate-spin" />
                    <span>Assigning...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={10} />
                    <span>Auto-Generated</span>
                  </>
                )}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                readOnly
                aria-readonly="true"
                value={formData.code || (isLoadingCode ? 'Generating...' : 'ENG-001')}
                title={isEditing ? 'Original subject code is preserved and cannot be edited.' : 'Unique official subject code automatically assigned by backend sequence.'}
                className="w-full font-mono font-bold px-3 py-2 rounded-lg bg-slate-100 dark:bg-[#111C32] text-indigo-600 dark:text-indigo-400 border border-slate-300 dark:border-[#29364D] text-xs focus:outline-hidden cursor-not-allowed select-all"
              />
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
              {isEditing
                ? 'Original code permanently preserved by system.'
                : 'Unique code automatically generated by backend.'}
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {t('classes.category', 'Category')}
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-xs font-medium"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {t('classes.status', 'Status')}
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-xs font-medium"
            >
              <option value="Active">{t('common.active', 'Active')}</option>
              <option value="Inactive">{t('common.inactive', 'Inactive')}</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            {t('classes.target_grades', 'Target Grade Levels')}
          </label>
          <input
            type="text"
            value={formData.grades}
            onChange={(e) => setFormData({ ...formData, grades: e.target.value })}
            placeholder="e.g. Grade 1 - 3, Grade 4 - 6, Grade 1 - 12"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-xs font-medium"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            {t('classes.description', 'Description & Syllabus Overview')}
          </label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Outline syllabus core aims, learning objectives, and materials..."
            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-xs leading-relaxed"
          />
        </div>

        {/* English Skills Tags */}
        <div className="pt-2 border-t border-slate-100">
          <label className="block font-semibold text-slate-700 mb-2">
            {t('classes.english_skills', 'Target English Skills')} ({formData.skills.length})
          </label>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {COMMON_SKILLS.map((skill) => {
              const selected = formData.skills.includes(skill);
              return (
                <button
                  type="button"
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer ${
                    selected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {selected && <Check size={12} />}
                  <span>{skill}</span>
                </button>
              );
            })}
          </div>

          {/* Active Skills List / Custom Skill Input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customSkill}
              onChange={(e) => setCustomSkill(e.target.value)}
              placeholder={t('classes.add_skill_placeholder', 'Add custom skill...')}
              className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-xs focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={addCustomSkill}
              className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs flex items-center gap-1 transition-colors"
            >
              <Plus size={13} />
              <span>{t('common.add', 'Add')}</span>
            </button>
          </div>

          {formData.skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2.5">
              {formData.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 text-[11px] font-medium"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="hover:text-rose-600 cursor-pointer"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {t('common.cancel', 'Cancel')}
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <BookOpen size={14} />
            <span>{isEditing ? t('common.save_changes', 'Save Changes') : t('classes.create_subject_btn', 'Create Subject')}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

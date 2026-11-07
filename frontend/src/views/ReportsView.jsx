import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Download, CheckCircle2, TrendingUp, Loader2 } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { useApp } from '../context/useApp';
import { generateReportPdf } from '../services/pdfGenerator';

export const ReportsView = () => {
  const { t } = useTranslation();
  const { addToast } = useApp();
  const [downloadingId, setDownloadingId] = useState(null);

  const reports = [
    {
      id: "REP-01",
      title: "Monthly Student Attendance Summary — All Grades",
      titleKhmer: "របាយការណ៍សង្ខេបវត្តមានសិស្សប្រចាំខែ",
      period: "October 2026",
      type: t('reports.attendance_report', 'Attendance Report'),
      fileSize: "1.2 MB",
      generatedDate: "Nov 01, 2026",
      summary: [
        { label: 'Total Enrolled', value: '142 Students' },
        { label: 'Attendance Rate', value: '96.8%' },
        { label: 'Authorized Leaves', value: '12' }
      ]
    },
    {
      id: "REP-02",
      title: "Quarterly English Examination Score Distribution",
      titleKhmer: "ការបែងចែកពិន្ទុប្រឡងភាសាអង់គ្លេសប្រចាំត្រីមាស",
      period: "Q3 2026",
      type: t('reports.evaluation_report', 'Evaluation Report'),
      fileSize: "2.4 MB",
      generatedDate: "Oct 25, 2026",
      summary: [
        { label: 'Pass Rate', value: '94.2%' },
        { label: 'Grade A Students', value: '54' },
        { label: 'Highest Score', value: '99/100' }
      ]
    },
    {
      id: "REP-03",
      title: "Tuition Fee Collection & Outstanding Receivables",
      titleKhmer: "ការប្រមូលថ្លៃសិក្សា និងសមតុល្យនៅសល់",
      period: "Term 4 (Active)",
      type: t('reports.financial_report', 'Financial Report'),
      fileSize: "840 KB",
      generatedDate: "Yesterday",
      summary: [
        { label: 'Collected', value: '$18,450.00' },
        { label: 'Pending Collection', value: '$1,200.00' },
        { label: 'Collection Rate', value: '93.9%' }
      ]
    },
    {
      id: "REP-04",
      title: "Teacher Workload & Class Enrollment Report",
      titleKhmer: "បន្ទុកការងារគ្រូបង្រៀន និងការចុះឈ្មោះសិស្ស",
      period: "Term 4",
      type: t('reports.enrollment_report', 'Enrollment Report'),
      fileSize: "650 KB",
      generatedDate: "Oct 15, 2026",
      summary: [
        { label: 'Active Teachers', value: '18' },
        { label: 'Total Classes', value: '26' },
        { label: 'Average Class Size', value: '18 Students' }
      ]
    }
  ];

  const handleDownload = async (rep) => {
    try {
      setDownloadingId(rep.id);
      addToast({
        type: 'info',
        title: 'Generating PDF',
        message: `Preparing ${rep.title} with official Siemreap font...`
      });

      await generateReportPdf({
        title: rep.title,
        titleKhmer: rep.titleKhmer,
        type: rep.type,
        period: rep.period,
        summary: rep.summary,
        filename: `ECC_${rep.id}_${rep.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`
      });

      addToast({
        type: 'success',
        title: t('reports.toast_exported', 'Report Downloaded'),
        message: `${rep.title} exported as official PDF.`
      });
    } catch (err) {
      console.error('PDF Report Generation Error:', err);
      addToast({
        type: 'error',
        title: 'Export Failed',
        message: 'Unable to export report PDF. Please try again.'
      });
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 max-w-7xl mx-auto"
    >
      <PageHeader
        title={t('reports.title')}
        subtitle={t('reports.subtitle')}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((rep) => (
          <div key={rep.id} className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-start justify-between gap-4">
            <div className="flex-1">
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                {rep.type}
              </span>
              <h3 className="font-bold text-base text-slate-900 mt-2">
                {rep.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {t('common.date')}: <strong className="text-slate-700">{rep.period}</strong> • {rep.generatedDate}
              </p>
            </div>
            <button
              onClick={() => handleDownload(rep)}
              disabled={downloadingId === rep.id}
              className="p-2.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors shrink-0 shadow-2xs disabled:opacity-50 cursor-pointer"
              title={t('reports.download_pdf')}
            >
              {downloadingId === rep.id ? (
                <Loader2 size={18} className="animate-spin text-indigo-600" />
              ) : (
                <Download size={18} />
              )}
            </button>
          </div>
        ))}
      </div>

      <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{t('reports.compliance_notice', 'MoEYS Term English curriculum compliance active.')}</span>
        </div>
        <span className="font-semibold text-indigo-600 flex items-center gap-1">
          <TrendingUp size={14} /> 100%
        </span>
      </div>
    </motion.div>
  );
};


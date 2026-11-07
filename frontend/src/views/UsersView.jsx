import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Plus } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { useApp } from '../context/useApp';

export const UsersView = () => {
  const { t } = useTranslation();
  const { addToast } = useApp();
  const [users, setUsers] = useState([
    {
      id: "USR-01",
      name: "Sophea Heng",
      username: "sophea.heng",
      role: "Academic Admin / Center Head",
      email: "sophea.heng@edumanage.kh",
      status: "Active",
      lastLogin: "Today, 08:14 AM"
    },
    {
      id: "USR-02",
      name: "Michael Davies",
      username: "m.davies",
      role: "Teacher / Grade Lead",
      email: "m.davies@edumanage.kh",
      status: "Active",
      lastLogin: "Today, 07:45 AM"
    },
    {
      id: "USR-03",
      name: "Vanna Seng",
      username: "vanna.seng",
      role: "Tuition Cashier & Reception",
      email: "vanna.seng@edumanage.kh",
      status: "Active",
      lastLogin: "Yesterday"
    },
    {
      id: "USR-04",
      name: "Dareth Meas",
      username: "dareth.meas",
      role: "IT & System Coordinator",
      email: "dareth.meas@edumanage.kh",
      status: "Active",
      lastLogin: "3 days ago"
    }
  ]);

  const [isOpen, setIsOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Teacher');

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const userObj = {
      id: `USR-0${users.length + 1}`,
      name: newName,
      username: newName.toLowerCase().replace(/\s+/g, '.'),
      role: newRole,
      email: `${newName.toLowerCase().replace(/\s+/g, '.')}@edumanage.kh`,
      status: 'Active',
      lastLogin: 'Never'
    };

    setUsers([...users, userObj]);
    setIsOpen(false);
    setNewName('');
    addToast({
      type: 'success',
      title: t('users.add_user'),
      message: `${userObj.name} created.`
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 max-w-7xl mx-auto"
    >
      <PageHeader
        title={t('users.title')}
        subtitle={t('users.subtitle')}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
        >
          <Plus size={15} />
          <span>{t('users.add_user')}</span>
        </button>
      </PageHeader>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">{t('users.name')}</th>
                <th className="py-3 px-4">{t('users.role')}</th>
                <th className="py-3 px-4">{t('users.email')}</th>
                <th className="py-3 px-4">{t('users.last_active')}</th>
                <th className="py-3 px-4">{t('common.status')}</th>
                <th className="py-3 px-4 text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {u.name}
                    <p className="text-[11px] font-normal text-slate-400">@{u.username}</p>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-indigo-700">
                    {u.role}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {u.email}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {u.lastLogin}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={u.status} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => addToast({ type: 'info', title: t('users.role'), message: `Managing permissions for ${u.name}` })}
                      className="text-xs font-semibold text-indigo-600 hover:underline"
                    >
                      {t('common.edit')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={t('users.add_user')}
        description={t('users.subtitle')}
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">{t('users.name')} *</label>
            <input
              type="text"
              required
              placeholder="e.g. Sreymom Meas"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">{t('users.role')}</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Teacher / Grade Lead">{t('users.role_teacher')}</option>
              <option value="Academic Admin">{t('users.role_admin')}</option>
              <option value="Staff">{t('users.role_staff')}</option>
            </select>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 rounded-lg text-slate-500 font-semibold">
              {t('common.cancel')}
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
              {t('common.save')}
            </button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
};

